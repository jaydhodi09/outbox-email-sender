import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error('Missing required environment variable: ' + name);
  return value;
}

function positiveNumber(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(name + ' must be a positive number');
  }
  return value;
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL,
  redisHost: process.env.REDIS_HOST ?? '127.0.0.1',
  redisPort: positiveNumber('REDIS_PORT', 6379),
  jwtSecret: required('JWT_SECRET'),
  port: positiveNumber('PORT', 4000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  defaultUserEmail: process.env.DEFAULT_USER_EMAIL ?? 'admin@outbox.local',
  defaultUserPassword: process.env.DEFAULT_USER_PASSWORD ?? 'outbox123',
  etherealHost: process.env.ETHEREAL_HOST ?? 'smtp.ethereal.email',
  etherealPort: positiveNumber('ETHEREAL_PORT', 587),
  etherealUser: required('ETHEREAL_USER'),
  etherealPass: required('ETHEREAL_PASS'),
  emailFrom: process.env.EMAIL_FROM ?? 'OUTBOX <no-reply@outbox.local>',
  rateLimitMax: positiveNumber('EMAIL_RATE_LIMIT_MAX', 120),
  rateLimitDuration: positiveNumber('EMAIL_RATE_LIMIT_DURATION', 60_000),
  workerConcurrency: positiveNumber('EMAIL_WORKER_CONCURRENCY', 3),
};
