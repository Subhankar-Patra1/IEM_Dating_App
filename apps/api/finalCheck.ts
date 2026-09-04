import { PrismaClient } from '@prisma/client';
import https from 'https';

const prisma = new PrismaClient();

function checkUrl(url: string): Promise<{ status: number; statusText: string }> {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD' }, (res) => {
      resolve({ status: res.statusCode || 0, statusText: res.statusMessage || '' });
    }).on('error', (e) => {
      resolve({ status: 500, statusText: e.message });
    }).end();
  });
}

function transformToCdn(s3Url: string): string {
  const CDN_DOMAIN = "https://d2ag6c2fcyv4nd.cloudfront.net";
  try {
    const urlObj = new URL(s3Url);
    return `${CDN_DOMAIN}${urlObj.pathname}`;
  } catch (e) {
    return s3Url;
  }
}

async function main() {
  const users = await prisma.user.findMany({
    select: { 
      id: true, 
      name: true, 
      avatarUrl: true,
      photos: {
        select: { photoUrl: true },
        orderBy: { order: 'asc' }
      }
    },
    take: 5
  });
  
  console.log('--- FINAL CDN REACHABILITY AUDIT ---');
  for (const user of users) {
    console.log(`\nUser: ${user.name}`);
    
    if (user.avatarUrl) {
      const cdnUrl = transformToCdn(user.avatarUrl);
      const res = await checkUrl(cdnUrl);
      console.log(`  Avatar (CDN): ${cdnUrl}`);
      console.log(`  Status: ${res.status} ${res.statusText}`);
    }

    if (user.photos.length > 0) {
      const p = user.photos[0];
      const cdnUrl = transformToCdn(p.photoUrl);
      const res = await checkUrl(cdnUrl);
      console.log(`  Photo 1 (CDN): ${cdnUrl}`);
      console.log(`  Status: ${res.status} ${res.statusText}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
