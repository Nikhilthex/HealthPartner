import { PrismaClient } from '@prisma/client';
import { initializeDatabase } from './init';
import { seedDefaultData } from './seed-data';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await initializeDatabase(prisma);
  await seedDefaultData(prisma);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
