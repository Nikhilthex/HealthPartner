import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

export async function seedDefaultData(prisma: PrismaClient): Promise<void> {
  const passwordHash = await bcrypt.hash('demo123', 12);

  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {
      passwordHash
    },
    create: {
      username: 'demo',
      passwordHash
    }
  });

  await prisma.userAlertSettings.upsert({
    where: { userId: user.id },
    update: {
      morningTime: '08:00',
      noonTime: '13:00',
      eveningTime: '20:00',
      preAlertMinutes: 15,
      onTimeEnabled: true,
      timezone: 'Asia/Kolkata'
    },
    create: {
      userId: user.id,
      morningTime: '08:00',
      noonTime: '13:00',
      eveningTime: '20:00',
      preAlertMinutes: 15,
      onTimeEnabled: true,
      timezone: 'Asia/Kolkata'
    }
  });
}
