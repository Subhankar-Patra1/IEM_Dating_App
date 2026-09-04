import 'dotenv/config';
import { transformToCdnUrl } from './src/middlewares/upload.middleware';

const rawUrl = 'https://iem-connect-media.s3.us-east-1.amazonaws.com/videos/test.mp4';
console.log('Original:', rawUrl);
console.log('Transformed:', transformToCdnUrl(rawUrl));
console.log('CDN_URL from env:', process.env.CDN_URL);
