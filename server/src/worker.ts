import { EmailStatus } from '@prisma/client';
import { Worker } from 'bullmq';
import { config } from './config.js';
import { prisma } from './db.js';
import { connection } from './queue.js';
import { sendEmail } from './mailer.js';
import { ensureDefaultUser } from './bootstrap.js';
import { recoverPendingEmails } from './recovery.js';

const worker = new Worker(
  'outbox-email',
  async (job) => {
    const emailId = job.data.emailId as string;
    const claim = await prisma.email.updateMany({
      where: { id: emailId, status: EmailStatus.SCHEDULED },
      data: { status: EmailStatus.PROCESSING, failureReason: null },
    });
    if (claim.count === 0) return;

    const email = await prisma.email.findUnique({ where: { id: emailId } });
    if (!email) return;
    try {
      await sendEmail(email.to, email.subject, email.body);
      await prisma.email.update({
        where: { id: email.id },
        data: { status: EmailStatus.SENT, sentAt: new Date(), failureReason: null },
      });
    } catch (error) {
      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: EmailStatus.FAILED,
          failureReason: error instanceof Error ? error.message : 'Email delivery failed',
        },
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: config.workerConcurrency,
    limiter: { max: config.rateLimitMax, duration: config.rateLimitDuration },
  },
);

worker.on('failed', (job, error) => console.error('Email job ' + job?.id + ' failed:', error.message));

async function main() {
  await ensureDefaultUser();
  const recovered = await recoverPendingEmails();
  console.log('Worker running with concurrency ' + config.workerConcurrency + '; recovered ' + recovered + ' emails.');
}

main().catch(async (error) => {
  console.error(error);
  await worker.close();
  await prisma.$disconnect();
  process.exit(1);
});

async function shutdown() {
  await worker.close();
  await prisma.$disconnect();
  await connection.quit();
}

process.on('SIGINT', () => void shutdown().then(() => process.exit(0)));
process.on('SIGTERM', () => void shutdown().then(() => process.exit(0)));
