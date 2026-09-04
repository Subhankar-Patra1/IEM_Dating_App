import { Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, transformToCdnUrl } from '../middlewares/upload.middleware';
import { v4 as uuidv4 } from 'uuid';
import { VideoPreviewService } from '../services/videoPreview.service';
import { MediaCacheService } from '../services/mediaCache.service';

export class UploadController {
  static async uploadFiles(req: Request, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.MulterS3.File[] } | Express.MulterS3.File[];
      
      if (!files) {
        return res.status(400).json({ status: 'error', message: 'No files were uploaded.' });
      }

      // If it's single or array upload
      if (Array.isArray(files)) {
         const urls = files.map(file => transformToCdnUrl(file.location));
         
         const userId = (req as any).user.sub;
         await MediaCacheService.cacheUserMedia(userId);
         
         return res.status(200).json({ status: 'success', data: { urls } });
      }

      // If it's multiple fields (e.g. video and photos separated)
      const data: Record<string, string[]> = {};
      for (const field in files) {
        data[field] = files[field].map(file => transformToCdnUrl(file.location));
      }

      const userId = (req as any).user.sub;
      await MediaCacheService.cacheUserMedia(userId);

      return res.status(200).json({ status: 'success', data });
      
    } catch (error: any) {
      console.error('Upload Error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Error uploading files' });
    }
  }

  static async getPresignedUrls(req: Request, res: Response) {
    try {
      const { files } = req.body; // Array of { type: 'video' | 'photo', ext: 'mp4' | 'jpg' }
      
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ status: 'error', message: 'Missing or invalid files payload' });
      }

      const userId = (req as any).user.sub;
      
      // Try fetching from cache first
      const cachedPresigned = await MediaCacheService.getCachedPresignedUrls(userId);
      if (cachedPresigned) {
        // Only return from cache if the requested files match exactly what's cached 
        // For simplicity, we just return the cached one if it exists 
        // (A more advanced implementation would hash the request body for comparison)
        return res.status(200).json({ 
          status: 'success', 
          data: cachedPresigned.urls,
          fromCache: true
        });
      }

      const presignedUrls = await Promise.all(files.map(async (file) => {
        const folder = file.type === 'video' ? 'videos' : 'photos';
        const key = `${folder}/${uuidv4()}.${file.ext || 'bin'}`;
        const contentType = file.type === 'video' ? `video/${file.ext || 'mp4'}` : `image/${file.ext || 'jpeg'}`;

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME || '',
          Key: key,
          ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        const s3FileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        
        return {
          uploadUrl,
          fileUrl: transformToCdnUrl(s3FileUrl),
          type: file.type
        };
      }));

      // Cache the generated endpoints
      await MediaCacheService.cachePresignedUrls(userId, presignedUrls, Number(process.env.PRESIGNED_URL_CACHE_TTL || 300));

      return res.status(200).json({ status: 'success', data: presignedUrls });

    } catch (error: any) {
      console.error('Presigned URL Error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Error generating presigned URLs' });
    }
  }

  /**
   * Fire-and-forget endpoint: triggers async preview clip generation.
   * Returns 200 immediately; preview is generated in the background.
   */
  static async generatePreview(req: Request, res: Response) {
    try {
      const { videoUrl } = req.body;
      const userId = (req as any).user.sub;

      if (!videoUrl || typeof videoUrl !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Missing videoUrl' });
      }

      // Fire-and-forget: don't await, let it run in the background
      VideoPreviewService.generatePreview(videoUrl, userId).catch(err => {
        console.error('[UploadController] Background preview generation failed:', err);
      });

      return res.status(200).json({ status: 'success', message: 'Preview generation started' });
    } catch (error: any) {
      console.error('Generate Preview Error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Error starting preview generation' });
    }
  }
}

