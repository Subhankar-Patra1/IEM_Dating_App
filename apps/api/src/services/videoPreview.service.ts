import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../middlewares/upload.middleware';
import { prisma } from '../utils/prisma';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';

// Set ffmpeg binary path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const BUCKET = process.env.AWS_S3_BUCKET_NAME || '';
const REGION = process.env.AWS_REGION || 'us-east-1';

export class VideoPreviewService {
  /**
   * Generate a ~3 second low-quality preview clip from a full video.
   * This runs asynchronously (fire-and-forget) so it doesn't block the user.
   */
  static async generatePreview(videoUrl: string, userId: string): Promise<void> {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${uuidv4()}.mp4`);
    const outputPath = path.join(tempDir, `preview_${uuidv4()}.mp4`);

    try {
      console.log(`[VideoPreview] Starting preview generation for user: ${userId}`);

      // 1. Download the video from S3
      const videoKey = this.extractS3Key(videoUrl);
      if (!videoKey) {
        console.error('[VideoPreview] Could not extract S3 key from URL:', videoUrl);
        return;
      }

      const getCommand = new GetObjectCommand({
        Bucket: BUCKET,
        Key: videoKey,
      });

      const response = await s3Client.send(getCommand);
      
      if (!response.Body) {
        console.error('[VideoPreview] Empty response body from S3');
        return;
      }

      // Write the S3 stream to a temp file
      const writeStream = fs.createWriteStream(inputPath);
      const bodyStream = response.Body as Readable;
      await new Promise<void>((resolve, reject) => {
        bodyStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      console.log(`[VideoPreview] Downloaded video to: ${inputPath}`);

      // 2. Generate preview clip with ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(0)
          .setDuration(3) // 3 seconds
          .videoCodec('libx264')
          .size('360x?') // 360p width, maintain aspect ratio
          .videoBitrate('300k')
          .audioCodec('aac')
          .audioBitrate('64k')
          .outputOptions([
            '-preset ultrafast', // Fast encoding
            '-movflags +faststart', // Enable progressive loading
            '-pix_fmt yuv420p', // Maximum compatibility
          ])
          .output(outputPath)
          .on('end', () => {
            console.log('[VideoPreview] ffmpeg processing complete');
            resolve();
          })
          .on('error', (err) => {
            console.error('[VideoPreview] ffmpeg error:', err.message);
            reject(err);
          })
          .run();
      });

      // 3. Upload preview clip to S3
      const previewKey = `previews/${uuidv4()}.mp4`;
      const previewBuffer = fs.readFileSync(outputPath);
      
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET,
        Key: previewKey,
        Body: previewBuffer,
        ContentType: 'video/mp4',
      });

      await s3Client.send(putCommand);

      const previewUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${previewKey}`;
      console.log(`[VideoPreview] Preview uploaded to: ${previewUrl}`);

      // 4. Update user's videoPreviewUrl in database
      await prisma.user.update({
        where: { id: userId },
        data: { videoPreviewUrl: previewUrl },
      });

      console.log(`[VideoPreview] Preview generation complete for user: ${userId}`);
    } catch (error) {
      console.error('[VideoPreview] Error generating preview:', error);
    } finally {
      // Cleanup temp files
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
    }
  }

  /**
   * Extract the S3 object key from a full S3 URL.
   * e.g. https://bucket.s3.region.amazonaws.com/videos/abc.mp4 → videos/abc.mp4
   */
  private static extractS3Key(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}
