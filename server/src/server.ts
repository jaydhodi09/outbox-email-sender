import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { EmailStatus } from '@prisma/client';
import { z } from 'zod';
import { config } from './config.js';
import { prisma } from './db.js';
import { requireAuth, signToken, type AuthRequest } from './auth.js';
import { emailQueue, enqueueEmail } from './queue.js';
import { ensureDefaultUser } from './bootstrap.js';
import { recoverPendingEmails } from './recovery.js';

const app = express();
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const createEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
  scheduledAt: z.string().datetime(),
});

function publicUser(user: { id: string; name: string; email: string }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: null,
    role: 'User',
  };
}

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Email and password are required' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  return res.json({ token: signToken(user.id), user: publicUser(user) });
});

app.post('/api/auth/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Enter a name, valid email, and password of at least 8 characters' });
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
  });
  return res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ message: 'User not found' });
  return res.json({ user: publicUser(user) });
});

app.post('/api/emails', requireAuth, async (req: AuthRequest, res) => {
  const parsed = createEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid email payload' });
  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (scheduledAt.getTime() < Date.now() - 1000) {
    return res.status(400).json({ message: 'Scheduled time cannot be in the past' });
  }

  const email = await prisma.email.create({
    data: { ...parsed.data, scheduledAt, userId: req.userId! },
  });
  await enqueueEmail(email.id, email.scheduledAt);
  return res.status(201).json({ email });
});

function listByStatus(status: EmailStatus[]) {
  return async (req: AuthRequest, res: express.Response) => {
    const emails = await prisma.email.findMany({
      where: { userId: req.userId!, status: { in: status } },
      orderBy: { scheduledAt: 'asc' },
    });
    return res.json({ emails });
  };
}

app.get('/api/emails/scheduled', requireAuth, listByStatus([EmailStatus.SCHEDULED, EmailStatus.PROCESSING]));
app.get('/api/emails/sent', requireAuth, listByStatus([EmailStatus.SENT]));
app.get('/api/emails/failed', requireAuth, listByStatus([EmailStatus.FAILED]));

app.get('/api/emails/:id', requireAuth, async (req: AuthRequest, res) => {
  const email = await prisma.email.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!email) return res.status(404).json({ message: 'Email not found' });
  return res.json({ email });
});

app.post('/api/emails/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  const email = await prisma.email.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!email) return res.status(404).json({ message: 'Email not found' });
  if (email.status !== EmailStatus.SCHEDULED) {
    return res.status(409).json({ message: 'Only scheduled emails can be cancelled' });
  }
  const updated = await prisma.email.update({
    where: { id: email.id },
    data: { status: EmailStatus.CANCELLED },
  });
  const job = await emailQueue.getJob(email.id);
  if (job) await job.remove();
  return res.json({ email: updated });
});

app.get('/api/dashboard/stats', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const [scheduled, sent, failed, total, scheduledEmails, sentEmails] = await Promise.all([
    prisma.email.count({ where: { userId, status: EmailStatus.SCHEDULED } }),
    prisma.email.count({ where: { userId, status: EmailStatus.SENT } }),
    prisma.email.count({ where: { userId, status: EmailStatus.FAILED } }),
    prisma.email.count({ where: { userId } }),
    prisma.email.findMany({ where: { userId, status: EmailStatus.SCHEDULED }, orderBy: { scheduledAt: 'asc' }, take: 4 }),
    prisma.email.findMany({ where: { userId, status: EmailStatus.SENT }, orderBy: { sentAt: 'desc' }, take: 4 }),
  ]);
  return res.json({ scheduled, sent, failed, total, scheduledEmails, sentEmails });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

async function main() {
  await ensureDefaultUser();
  await recoverPendingEmails();
  app.listen(config.port, () => console.log('API listening on http://localhost:' + config.port));
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
