import bcrypt from 'bcryptjs';
import { prisma } from './db.js';
import { config } from './config.js';

export async function ensureDefaultUser(): Promise<void> {
  await prisma.user.upsert({
    where: { email: config.defaultUserEmail },
    update: {},
    create: {
      name: config.defaultUserEmail.split('@')[0],
      email: config.defaultUserEmail,
      passwordHash: await bcrypt.hash(config.defaultUserPassword, 12),
    },
  });
}
