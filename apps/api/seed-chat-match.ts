import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const appUserId = 'ac690288-8854-42f9-9a6a-7bcf81af40b4'; // Actual app user
  const fakeUserId = '2fb45585-ddf0-42c9-bf16-621e89ee8cb5'; // Priya Sharma

  // Create mutual swipes
  await prisma.swipe.upsert({
    where: { swiperId_targetId: { swiperId: appUserId, targetId: fakeUserId } },
    update: { action: 'like' },
    create: { swiperId: appUserId, targetId: fakeUserId, action: 'like' },
  });
  await prisma.swipe.upsert({
    where: { swiperId_targetId: { swiperId: fakeUserId, targetId: appUserId } },
    update: { action: 'like' },
    create: { swiperId: fakeUserId, targetId: appUserId, action: 'like' },
  });
  console.log('Mutual likes created');

  let match = await prisma.match.findFirst({
    where: {
      OR: [
        { user1Id: appUserId, user2Id: fakeUserId },
        { user1Id: fakeUserId, user2Id: appUserId },
      ],
    },
  });

  if (!match) {
    match = await prisma.match.create({
      data: { user1Id: appUserId, user2Id: fakeUserId, status: 'active' },
    });
    console.log('Match created:', match.id);
  } else {
    console.log('Match exists:', match.id);
  }

  const existingMsg = await prisma.message.findFirst({ where: { matchId: match.id } });
  if (!existingMsg) {
    await prisma.message.create({
      data: { matchId: match.id, senderId: fakeUserId, content: 'Hey! We matched! How are you? 😊' },
    });
    console.log('Welcome message seeded');
  }

  console.log('Done! Pull-to-refresh on Chats tab.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
