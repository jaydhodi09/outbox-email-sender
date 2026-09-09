# OUTBOX Email Scheduler

## Project Structure

```text
outbox-email-scheduler/
  frontend/                 React, TypeScript, Vite, Tailwind UI
    src/
      components/           Shared UI and application layout
      pages/                Login, dashboard, compose, scheduled, sent, failed
      lib/                  API client, utilities, timezone constants
  server/                   Express API, Prisma, BullMQ worker
    prisma/                 MySQL schema and initial migration
    src/
      auth.ts               JWT middleware
      server.ts             HTTP API
      worker.ts             Email delivery worker
      queue.ts              BullMQ queue connection
      recovery.ts           Restart recovery
  package.json              Workspace commands
```

## Setup

1. Copy `server/.env.example` to `server/.env`.
2. Set valid MySQL, Redis, JWT, and Ethereal SMTP values in `server/.env`.
3. Create the MySQL database named in `DATABASE_URL`.
4. Start Redis.
5. Install dependencies:

```bash
npm install
```

6. Apply the database migration:

```bash
npm run db:generate
npm run db:migrate
```

## Run

Use three terminals from the repository root:

```bash
npm run frontend
```

```bash
npm run backend
```

```bash
npm run worker
```

The frontend is served at `http://localhost:5173`; the API is served at `http://localhost:5000`.

The seeded assignment login is controlled by `DEFAULT_USER_EMAIL` and `DEFAULT_USER_PASSWORD` in `server/.env`. The default example values are `admin@outbox.local` and `outbox123`.

## Delivery Flow

The API saves an email to MySQL before enqueueing the BullMQ delayed job. The worker loads it from MySQL, sends it with Ethereal/Nodemailer, and records either `SENT` with `sentAt` or `FAILED` with `failureReason`.

On startup, the API and worker recover scheduled records whose queue job is missing. Redis rate limiting uses `EMAIL_RATE_LIMIT_MAX`, and worker parallelism uses `EMAIL_WORKER_CONCURRENCY`.

## Implemented Features

Backend:

- JWT authentication with registration, login, and authenticated profile lookup
- Prisma MySQL users and emails tables
- BullMQ delayed email scheduling backed by Redis
- Separate worker using Ethereal SMTP through Nodemailer
- MySQL restart recovery for scheduled and interrupted processing records
- Configurable worker concurrency and rate limiting

Frontend:

- Sign in and account creation screens
- Protected dashboard, compose, scheduled, sent, and failed routes
- Compose form that creates scheduled jobs through the API
- Scheduled-email cancellation
- Live dashboard totals and scheduled-email list

## Assumptions and Trade-offs

- Registration is included because the UI now provides account creation; password reset is intentionally omitted because no reset/email-verification API is part of this assignment.
- Email delivery uses Ethereal's test SMTP service, so messages are visible in its test mailbox rather than delivered to real inboxes.
- The API and worker require a TCP Redis connection. Upstash REST credentials cannot run BullMQ.

## Submission Checklist

- Create a private GitHub repository and grant access to `Mitrajit`.
- Record a demo video of five minutes or less showing schedule creation, dashboard status, and a restart recovery flow.
- Submit the repository and demo using the assignment form supplied in the guidelines PDF.

## Deployment

Deploy `frontend/` to Vercel and set its `VITE_API_URL` environment variable to the public API URL followed by `/api`.

The Express API and BullMQ worker are persistent processes, so deploy `server/` to a long-running Node host such as Railway, Render, or Fly.io. Set the same server environment variables there, including `DATABASE_URL`, `REDIS_URL`, Ethereal SMTP credentials, and `FRONTEND_URL` set to the deployed Vercel domain.

Vercel is appropriate for the React frontend. It is not suitable for the continuously running BullMQ worker required by this assignment.

## Upstash Queue Connection

BullMQ needs the **Upstash TCP connection string**, not the Upstash REST URL or REST token. Set it in `server/.env`:

```env
REDIS_URL="rediss://default:YOUR_UPSTASH_TCP_PASSWORD@YOUR_REDIS_ENDPOINT:6379"
```

Use the TCP tab in the Upstash console to copy this full value. The `rediss://` protocol keeps the Redis connection encrypted.

For Aiven, copy the Service URI from the **MySQL** tab, not the **MySQLx** tab. Prisma uses the standard MySQL protocol and cannot connect to the MySQL X Protocol port.
