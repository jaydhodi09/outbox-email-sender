# 📬 Outbox — Scheduled Email Delivery System

A full-stack email scheduling application built with **Express**, **BullMQ**, **Redis**, **MySQL (Prisma)**, and a **React + Vite** frontend. Compose emails, schedule them for a future time, and track delivery status in real time.

---

## 📁 Project Structure

```
project/
├── server/          # Node.js + Express + BullMQ backend
│   ├── src/
│   │   ├── server.ts      # Express REST API
│   │   ├── worker.ts      # BullMQ email worker
│   │   ├── queue.ts       # BullMQ queue + Redis connection
│   │   ├── mailer.ts      # Nodemailer / Ethereal SMTP transport
│   │   ├── recovery.ts    # Restart recovery logic
│   │   ├── bootstrap.ts   # Default user seeding
│   │   ├── config.ts      # Environment variable config
│   │   ├── auth.ts        # JWT middleware
│   │   └── db.ts          # Prisma client
│   ├── prisma/
│   │   └── schema.prisma  # MySQL schema (User, Email)
│   └── .env               # Backend environment variables
├── frontend/        # React + Vite + TailwindCSS frontend
│   └── src/
│       ├── pages/         # Login, Signup, Dashboard, Compose, Scheduled, Sent, Failed
│       ├── components/    # Reusable UI components (shadcn/ui)
│       ├── hooks/         # Custom React hooks
│       └── lib/           # API client + utilities
└── README.md
```

---

## 🚀 How to Run

### Prerequisites

- **Node.js** v18+
- **MySQL** database (local or cloud e.g. Aiven)
- **Redis** (local or cloud e.g. Upstash)

---

### 1. Backend (Express API + BullMQ Worker)

```bash
cd server
npm install
```

Copy and configure the environment file:

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)
```

Run database migrations:

```bash
npm run prisma:deploy
# or for development:
npm run prisma:migrate
```

Start the **API server** (Terminal 1):

```bash
npm run dev
# API runs on http://localhost:5000
```

Start the **BullMQ email worker** (Terminal 2):

```bash
npm run worker
# Worker picks up and delivers scheduled emails
```

> Both the API server and worker must be running for email scheduling and delivery to work.

---

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Open your browser at `http://localhost:5173`.
Default credentials (auto-seeded on first start):
- **Email:** `admin@outbox.local`
- **Password:** `outbox123`

---

## 🔧 Environment Variables

### `server/.env`

```env
# MySQL database connection string
DATABASE_URL="mysql://user:password@host:port/dbname?ssl-mode=REQUIRED"

# Redis connection (use REDIS_URL for cloud, or REDIS_HOST+REDIS_PORT for local)
REDIS_URL="rediss://default:password@host:6379"
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379

# JWT signing secret (generate with: openssl rand -hex 32)
JWT_SECRET="your-long-random-secret"

# Server port
PORT=5000

# Frontend origin for CORS
FRONTEND_URL=http://localhost:5173

# Default seeded admin user
DEFAULT_USER_EMAIL=admin@outbox.local
DEFAULT_USER_PASSWORD=outbox123

# Ethereal Email (SMTP)
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_username@ethereal.email
ETHEREAL_PASS=your_ethereal_password
EMAIL_FROM="OUTBOX <your_ethereal_username@ethereal.email>"

# Worker tuning
EMAIL_RATE_LIMIT_MAX=10
EMAIL_RATE_LIMIT_DURATION=1000
EMAIL_WORKER_CONCURRENCY=3
```

---

## 📧 How to Set Up Ethereal Email

Ethereal is a **fake SMTP service** used for testing — it captures sent emails without actually delivering them to real inboxes. It is ideal for demos and evaluation.

1. Go to **https://ethereal.email**
2. Click **"Create Ethereal Account"** (free, instant, no signup required)
3. Copy the generated credentials shown on the page
4. Paste them into `server/.env` under the `ETHEREAL_*` keys
5. After the app sends an email, go to https://ethereal.email/messages to view captured emails

> **Note:** Emails sent via Ethereal are only visible at https://ethereal.email/messages — they are **not** delivered to real inboxes. This is intentional for safe demo use. To send real emails, replace the SMTP settings with a real provider (Gmail App Password, SendGrid, Amazon SES, etc.).

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         React Frontend                            │
│  Login → Dashboard → Compose → Scheduled / Sent / Failed tables  │
└─────────────────────────┬────────────────────────────────────────┘
                          │ REST API (JWT auth)
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Express API Server                            │
│  POST /api/emails → saves to MySQL → enqueues job in Redis       │
│  GET  /api/emails/* → reads status from MySQL                    │
└────────────┬─────────────────────────────────┬───────────────────┘
             │ writes job                      │ reads/writes
             ▼                                 ▼
┌─────────────────────────┐     ┌──────────────────────────────────┐
│    Redis (BullMQ)       │     │       MySQL (Prisma ORM)         │
│  Delayed job queue      │     │  Users + Emails tables           │
│  job fires at           │     │  Durable source of truth for     │
│  scheduledAt time       │     │  all email status data           │
└─────────────┬───────────┘     └──────────────────────────────────┘
              │ job fires
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       BullMQ Worker                               │
│  Claims email (SCHEDULED→PROCESSING) → Nodemailer SMTP send      │
│  → Updates status to SENT or FAILED in MySQL                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ How Scheduling Works

1. User composes an email with a future `scheduledAt` date/time.
2. The API saves the email to MySQL with status `SCHEDULED`.
3. The API enqueues a **BullMQ delayed job** in Redis:
   ```
   delay = scheduledAt - now  (in milliseconds)
   ```
   The job ID equals the email database ID to prevent duplicates.
4. Redis holds the job until the delay expires, then delivers it to the worker.
5. The worker atomically claims the job (SCHEDULED → PROCESSING), calls SMTP, then sets SENT or FAILED.

---

## 🔁 How Persistence on Restart is Handled

Two-layer persistence ensures zero email loss:

| Layer | Role |
|-------|------|
| **MySQL** | Durable source of truth — every email status is persisted |
| **Redis** | BullMQ job store — holds delayed/pending jobs |

**Recovery on every startup** (`recoverPendingEmails()`):
1. Reset any `PROCESSING` emails → `SCHEDULED` (interrupted mid-flight)
2. Query all `SCHEDULED` emails from MySQL
3. For each, check if a Redis job already exists and is active/delayed → skip
4. Otherwise, re-enqueue with the correct remaining delay (or immediately if past due)

This means future emails survive restarts, and past-due emails are sent immediately after recovery.

---

## 🚦 How Rate Limiting & Concurrency are Implemented

Configured on the BullMQ Worker:

```ts
const worker = new Worker('outbox-email', handler, {
  concurrency: config.workerConcurrency,   // parallel job slots
  limiter: {
    max: config.rateLimitMax,              // max emails per window
    duration: config.rateLimitDuration,   // window in ms
  },
});
```

| Setting | Env Variable | Default | Effect |
|---------|-------------|---------|--------|
| `concurrency` | `EMAIL_WORKER_CONCURRENCY` | 3 | Max simultaneous SMTP sends |
| `limiter.max` | `EMAIL_RATE_LIMIT_MAX` | 10 | Max emails per rate window |
| `limiter.duration` | `EMAIL_RATE_LIMIT_DURATION` | 1000 ms | Rate window size |

BullMQ uses Redis-backed atomic counters for rate limiting — when the window is saturated, job pickup is paused and resumes automatically. No emails are dropped.

---

## ✅ Features Implemented

### Backend

| Feature | Implementation |
|---------|---------------|
| Email Scheduling | BullMQ delayed jobs with exact `scheduledAt` delay |
| Persistence on Restart | `recoverPendingEmails()` re-enqueues all SCHEDULED emails on boot |
| Rate Limiting | BullMQ `limiter: { max, duration }` on worker |
| Concurrency Control | BullMQ `concurrency` option on worker |
| Atomic Job Claiming | `updateMany` WHERE status=SCHEDULED prevents double-processing |
| Failure Handling | Failed emails captured with reason, status set to FAILED |
| Email Cancellation | Removes BullMQ job + sets CANCELLED status |
| JWT Authentication | jsonwebtoken + middleware guard on all email routes |
| User Signup/Login | bcrypt password hashing, JWT token response |
| Default Admin User | Auto-seeded on startup via `ensureDefaultUser()` |
| SMTP Integration | Nodemailer with configurable SMTP (Ethereal by default) |
| Input Validation | Zod schemas on all API endpoints |

### Frontend

| Feature | Implementation |
|---------|---------------|
| Login Page | Email + password form with JWT token storage |
| Signup Page | Registration with name, email, password validation |
| Dashboard | Stats cards (Scheduled, Sent, Failed, Total) + recent email lists |
| Compose Page | Form with To, Subject, Body, and date/time picker for scheduledAt |
| Scheduled Table | Lists all SCHEDULED/PROCESSING emails |
| Sent Table | Lists all delivered emails with sent timestamp |
| Failed Table | Lists failed emails with failure reason |
| Cancel Email | Cancel button on scheduled emails |
| Protected Routes | Route guards redirect unauthenticated users to login |
| Responsive UI | Tailwind CSS + shadcn/ui component library |
| Toast Notifications | Sonner toast for success/error feedback |

---

## 📌 Assumptions, Shortcuts & Trade-offs

### Assumptions
- **Ethereal Email** is used for SMTP — emails are captured at https://ethereal.email/messages and **not** delivered to real inboxes. This is intentional for safe demo use.
- Redis is assumed to have persistence enabled in production (`appendonly yes`). MySQL recovery handles the case where Redis state is lost.
- Single-user or small team use — multi-tenancy is handled by per-user email filtering via JWT identity.

### Shortcuts
- **No email retry with backoff** — failed emails are marked FAILED permanently. Production would use exponential backoff retries.
- **No HTML email support** — only plaintext body. HTML templates would be a natural next step.
- **No pagination** — tables load all records. Large volumes would need cursor-based pagination.
- **No email attachments** — out of scope.

### Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| BullMQ over cron | Precise per-email scheduling with delay | More complex infrastructure (requires Redis) |
| MySQL over PostgreSQL | Aiven free tier | PostgreSQL preferred in production |
| JWT (stateless) | Simple, no session store needed | No token revocation on logout |
| Ethereal SMTP | Zero-config safe testing | Not for real email delivery |
| Monorepo | Easier setup, shared tooling | Less separation of concerns at scale |

---

## 📹 Demo Video

See `demo.mp4` in the repository root for a walkthrough covering:
1. Creating scheduled emails from the frontend
2. Dashboard showing Scheduled and Sent email counts
3. Restart scenario: stopping and restarting the server — future emails still send
4. Rate limiting behavior under load

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express 4, TypeScript |
| Queue | BullMQ 5, Redis (ioredis) |
| Database | MySQL, Prisma ORM |
| Email | Nodemailer + Ethereal SMTP |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | Zod |
