import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const generateFileName = (req: any, file: Express.Multer.File): string => {
  const ext = path.extname(file.originalname);
  const type = file.mimetype.startsWith('video') ? 'videos' : 'photos';
  return `${type}/${uuidv4()}${ext}`;
};

export const uploadMedia = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME || '',
    key: function (req, file, cb) {
      cb(null, generateFileName(req, file));
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image or video
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type, only images and video are allowed!'));
    }
  },
});
