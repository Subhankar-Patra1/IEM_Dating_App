import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    console.log('🗑️  Starting deletion of all users and associated data...\n');

    // Count users before deletion
    const userCount = await prisma.user.count();
    console.log(`📊 Total users found: ${userCount}`);

    if (userCount === 0) {
      console.log('✅ No users to delete. Database is already clean.');
      return;
    }

    // Delete in order respecting foreign key constraints
    // Prisma's relationMode = "prisma" handles cascading, but we'll be explicit
    
    console.log('\n📝 Deleting dependent data first...');
    
    // Delete analytics events
    const analyticsDeleted = await prisma.analyticsEvent.deleteMany({});
    console.log(`   - Deleted ${analyticsDeleted.count} analytics events`);

    // Delete device tokens
    const deviceTokensDeleted = await prisma.deviceToken.deleteMany({});
    console.log(`   - Deleted ${deviceTokensDeleted.count} device tokens`);

    // Delete notifications
    const notificationsDeleted = await prisma.notification.deleteMany({});
    console.log(`   - Deleted ${notificationsDeleted.count} notifications`);

    // Delete user blocks
    const userBlocksDeleted = await prisma.userBlock.deleteMany({});
    console.log(`   - Deleted ${userBlocksDeleted.count} user blocks`);

    // Delete user score history
    const scoreHistoryDeleted = await prisma.userScoreHistory.deleteMany({});
    console.log(`   - Deleted ${scoreHistoryDeleted.count} user score history records`);

    // Delete user scores
    const userScoresDeleted = await prisma.userScore.deleteMany({});
    console.log(`   - Deleted ${userScoresDeleted.count} user scores`);

    // Delete user sessions
    const userSessionsDeleted = await prisma.userSession.deleteMany({});
    console.log(`   - Deleted ${userSessionsDeleted.count} user sessions`);

    // Delete swipes (both given and received)
    const swipesDeleted = await prisma.swipe.deleteMany({});
    console.log(`   - Deleted ${swipesDeleted.count} swipes`);

    // Delete safety reports
    const safetyReportsDeleted = await prisma.safetyReport.deleteMany({});
    console.log(`   - Deleted ${safetyReportsDeleted.count} safety reports`);

    // Delete chat sessions
    const chatSessionsDeleted = await prisma.chatSession.deleteMany({});
    console.log(`   - Deleted ${chatSessionsDeleted.count} chat sessions`);

    // Delete messages
    const messagesDeleted = await prisma.message.deleteMany({});
    console.log(`   - Deleted ${messagesDeleted.count} messages`);

    // Delete match preferences
    const matchPrefsDeleted = await prisma.matchPreference.deleteMany({});
    console.log(`   - Deleted ${matchPrefsDeleted.count} match preferences`);

    // Delete matches
    const matchesDeleted = await prisma.match.deleteMany({});
    console.log(`   - Deleted ${matchesDeleted.count} matches`);

    // Delete profile photos
    const photosDeleted = await prisma.profilePhoto.deleteMany({});
    console.log(`   - Deleted ${photosDeleted.count} profile photos`);

    // Finally, delete all users
    console.log('\n🗑️  Deleting all users...');
    const usersDeleted = await prisma.user.deleteMany({});
    console.log(`   - Deleted ${usersDeleted.count} users`);

    // Verify deletion
    const remainingUsers = await prisma.user.count();
    const remainingMatches = await prisma.match.count();
    const remainingMessages = await prisma.message.count();
    const remainingSwipes = await prisma.swipe.count();

    console.log('\n✅ Deletion complete!');
    console.log('\n📊 Final database state:');
    console.log(`   - Users: ${remainingUsers}`);
    console.log(`   - Matches: ${remainingMatches}`);
    console.log(`   - Messages: ${remainingMessages}`);
    console.log(`   - Swipes: ${remainingSwipes}`);

    if (remainingUsers === 0 && remainingMatches === 0 && remainingMessages === 0 && remainingSwipes === 0) {
      console.log('\n🎉 All user data successfully deleted!');
    } else {
      console.log('\n⚠️  Warning: Some data may still remain. Please verify manually.');
    }

  } catch (error) {
    console.error('❌ Error deleting users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteAllUsers()
  .then(() => {
    console.log('\n✨ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
