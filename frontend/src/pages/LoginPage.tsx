import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.login(email, password);
      toast.success('Welcome back!', { description: 'You have been signed in.' });
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-zinc-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Send className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">OUTBOX</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Schedule emails with<br />precision and control.
          </h1>
          <p className="max-w-md text-lg text-zinc-400">
            Plan, track, and manage your email delivery pipeline with full visibility into every message.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div>
              <p className="text-3xl font-bold">99.9%</p>
              <p className="text-sm text-zinc-500">Delivery rate</p>
            </div>
            <div className="h-10 w-px bg-zinc-800" />
            <div>
              <p className="text-3xl font-bold">2.4M+</p>
              <p className="text-sm text-zinc-500">Emails sent</p>
            </div>
            <div className="h-10 w-px bg-zinc-800" />
            <div>
              <p className="text-3xl font-bold">150+</p>
              <p className="text-sm text-zinc-500">Timezones</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-600">© 2026 OUTBOX Inc. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Send className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">OUTBOX</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <button type="button" className="font-medium text-foreground hover:underline" onClick={() => navigate('/signup')}>
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
