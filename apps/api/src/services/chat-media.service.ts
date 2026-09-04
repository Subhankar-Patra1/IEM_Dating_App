import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../middlewares/upload.middleware';
import { v4 as uuidv4 } from 'uuid';

export class ChatMediaService {
  // Use a separate env var for the private bucket, fallback to the public bucket if not set
  private static get bucketName(): string {
    return process.env.AWS_PRIVATE_MEDIA_BUCKET || process.env.AWS_S3_BUCKET_NAME || '';
  }

  /**
   * Generates a pre-signed PUT URL for uploading a photo to a private bucket.
   * Valid for 5 minutes (300 seconds).
   */
  static async generateUploadUrl(userId: string, matchId: string, ext: string = 'jpeg') {
    // Organize by matchId to easily track/delete all media for a specific match
    const key = `chat-media/${matchId}/${uuidv4()}.${ext}`;
    
    // Do NOT include ACL: 'public-read'. This file must remain strictly private.
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: `image/${ext}`,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return {
      uploadUrl,
      mediaKey: key,
    };
  }

  /**
   * Generates a pre-signed GET URL for securely reading a private photo.
   * Valid for 15 minutes (900 seconds).
   */
  static async generateReadUrl(mediaKey: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: mediaKey,
    });

    const readUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return readUrl;
  }
}
