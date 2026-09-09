import type { Email, User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const TOKEN_KEY = 'outbox_token';

type ApiEmail = Omit<Email, 'toName' | 'priority' | 'timezone' | 'retries'>;

export interface DashboardStats {
  scheduled: number;
  sent: number;
  failed: number;
  total: number;
  scheduledEmails: ApiEmail[];
  sentEmails: ApiEmail[];
}

function toEmail(email: ApiEmail): Email {
  return {
    ...email,
    toName: email.to,
    priority: 'normal',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    retries: 0,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the API. Start the backend service and check VITE_API_URL.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem(TOKEN_KEY);
    throw new Error(data.message ?? 'Request failed');
  }
  return data as T;
}

export const api = {
  auth: {
    isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY)),
    login: async (email: string, password: string): Promise<User> => {
      const data = await request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.user;
    },
    signup: async (name: string, email: string, password: string): Promise<User> => {
      const data = await request<{ token: string; user: User }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.user;
    },
    me: async (): Promise<User> => {
      const data = await request<{ user: User }>('/auth/me');
      return data.user;
    },
    logout: async (): Promise<void> => {
      localStorage.removeItem(TOKEN_KEY);
    },
  },
  emails: {
    create: async (data: Pick<Email, 'to' | 'subject' | 'body' | 'scheduledAt'>): Promise<Email> => {
      const response = await request<{ email: ApiEmail }>('/emails', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return toEmail(response.email);
    },
    scheduled: async (): Promise<Email[]> => {
      const response = await request<{ emails: ApiEmail[] }>('/emails/scheduled');
      return response.emails.map(toEmail);
    },
    sent: async (): Promise<Email[]> => {
      const response = await request<{ emails: ApiEmail[] }>('/emails/sent');
      return response.emails.map(toEmail);
    },
    failed: async (): Promise<Email[]> => {
      const response = await request<{ emails: ApiEmail[] }>('/emails/failed');
      return response.emails.map(toEmail);
    },
    get: async (id: string): Promise<Email> => {
      const response = await request<{ email: ApiEmail }>('/emails/' + id);
      return toEmail(response.email);
    },
    cancel: async (id: string): Promise<Email> => {
      const response = await request<{ email: ApiEmail }>('/emails/' + id + '/cancel', { method: 'POST' });
      return toEmail(response.email);
    },
  },
  dashboard: {
    stats: async (): Promise<DashboardStats & { scheduledEmails: Email[]; sentEmails: Email[] }> => {
      const response = await request<DashboardStats>('/dashboard/stats');
      return {
        ...response,
        scheduledEmails: response.scheduledEmails.map(toEmail),
        sentEmails: response.sentEmails.map(toEmail),
      };
    },
  },
};
