import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error('Missing required environment variable: ' + name);
  return value;
}

function optionalString(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

function positiveNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  // If the env var is not set at all, use fallback silently
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
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
  // Railway injects PORT dynamically at runtime
  port: positiveNumber('PORT', 4000),
  frontendUrl: process.env.FRONTEND_URL ?? '*',
  defaultUserEmail: process.env.DEFAULT_USER_EMAIL ?? 'admin@outbox.local',
  defaultUserPassword: process.env.DEFAULT_USER_PASSWORD ?? 'outbox123',
  etherealHost: process.env.ETHEREAL_HOST ?? 'smtp.ethereal.email',
  etherealPort: positiveNumber('ETHEREAL_PORT', 587),
  etherealUser: optionalString('ETHEREAL_USER'),
  etherealPass: optionalString('ETHEREAL_PASS'),
  emailFrom: process.env.EMAIL_FROM ?? 'OUTBOX <no-reply@outbox.local>',
  rateLimitMax: positiveNumber('EMAIL_RATE_LIMIT_MAX', 120),
  rateLimitDuration: positiveNumber('EMAIL_RATE_LIMIT_DURATION', 60_000),
  workerConcurrency: positiveNumber('EMAIL_WORKER_CONCURRENCY', 3),
};
