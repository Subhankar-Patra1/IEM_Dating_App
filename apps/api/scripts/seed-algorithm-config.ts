import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_WEIGHTS: Record<string, number> = {
  weight_department: 0.12,
  weight_interests: 0.12,
  weight_seeking: 0.10,
  weight_elo_desirability: 0.10,
  weight_year_proximity: 0.10,
  weight_campus: 0.05,
  weight_hosteller: 0.05,
  weight_personality: 0.06,
  weight_lifestyle: 0.04,
  weight_selectivity: 0.06,
  weight_right_swipe_ratio: 0.05,
  weight_activity: 0.05,
  weight_message_response: 0.05,
  weight_profile_completeness: 0.05,
};

async function seedAlgorithmConfig() {
  console.log('Seeding algorithm configuration...');

  for (const [key, value] of Object.entries(DEFAULT_WEIGHTS)) {
    await prisma.algorithmConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log(`  ${key} = ${value}`);
  }

  console.log(`\nSeeded ${Object.keys(DEFAULT_WEIGHTS).length} algorithm weights.`);
  console.log('Total weight:', Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0));
}

seedAlgorithmConfig()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
