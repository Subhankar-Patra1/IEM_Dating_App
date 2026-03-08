import { Router } from 'express';
import { uploadMedia } from '../middlewares/upload.middleware';
import { UploadController } from '../controllers/upload.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Protect all upload routes
router.use(protect);

// Endpoint for uploading multiple photos
router.post('/photos', uploadMedia.array('photos', 6), UploadController.uploadFiles);

// Endpoint for requesting direct AWS S3 presigned upload URLs (Client-side Bypass)
router.post('/presigned-urls', UploadController.getPresignedUrls);

// Endpoint for the single vibe-check video
router.post('/video', uploadMedia.single('video'), UploadController.uploadFiles);

// Endpoint for hybrid upload (1 video, multiple photos) if preferred
router.post('/media', uploadMedia.fields([
  { name: 'video', maxCount: 1 },
  { name: 'photos', maxCount: 6 }
]), UploadController.uploadFiles);

// Endpoint for generating video preview clip (async, fire-and-forget)
router.post('/generate-preview', UploadController.generatePreview);

export default router;
