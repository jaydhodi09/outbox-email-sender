export type EmailStatus =
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

export type EmailPriority = 'high' | 'normal' | 'low';

export interface Email {
  id: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  failureReason: string | null;
  priority: EmailPriority;
  timezone: string;
  retries: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

export interface ActivityItem {
  id: string;
  type: 'sent' | 'scheduled' | 'failed' | 'cancelled' | 'retried';
  emailId: string;
  recipient: string;
  subject: string;
  timestamp: string;
}

export interface SystemStatus {
  label: string;
  status: 'operational' | 'degraded' | 'down';
  detail: string;
}
