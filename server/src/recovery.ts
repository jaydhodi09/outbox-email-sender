import { EmailStatus } from '@prisma/client';
import { prisma } from './db.js';
import { emailQueue, enqueueEmail } from './queue.js';

export async function recoverPendingEmails(): Promise<number> {
  await prisma.email.updateMany({
    where: { status: EmailStatus.PROCESSING },
    data: { status: EmailStatus.SCHEDULED },
  });

  const emails = await prisma.email.findMany({
    where: { status: EmailStatus.SCHEDULED },
    select: { id: true, scheduledAt: true },
  });

  let recovered = 0;
  for (const email of emails) {
    const job = await emailQueue.getJob(email.id);
    const state = job ? await job.getState() : undefined;
    if (!job || state === 'completed' || state === 'failed') {
      await enqueueEmail(email.id, email.scheduledAt);
      recovered += 1;
    }
  }
  return recovered;
}
