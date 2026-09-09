import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from './config.js';

export const connection = config.redisUrl
  ? new Redis(config.redisUrl, { maxRetriesPerRequest: null })
  : new Redis({
      host: config.redisHost,
      port: config.redisPort,
      maxRetriesPerRequest: null,
    });

export const emailQueue = new Queue('outbox-email', {
  connection,
});

export async function enqueueEmail(emailId: string, scheduledAt: Date): Promise<void> {
  await emailQueue.add(
    'send-email',
    { emailId },
    {
      jobId: emailId,
      delay: Math.max(0, scheduledAt.getTime() - Date.now()),
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}
