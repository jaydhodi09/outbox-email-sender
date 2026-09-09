import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      await api.auth.signup(name.trim(), email, password);
      toast.success('Account created', { description: 'You are signed in and ready to schedule emails.' });
      navigate('/dashboard');
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-zinc-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"><Send className="h-5 w-5" /></div>
          <span className="text-xl font-bold tracking-tight">OUTBOX</span>
        </div>
        <div className="space-y-5">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Schedule emails with<br />precision and control.</h1>
          <p className="max-w-md text-lg text-zinc-400">Create your account and manage every scheduled delivery in one place.</p>
        </div>
        <p className="text-xs text-zinc-600">© 2026 OUTBOX Inc. All rights reserved.</p>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Send className="h-5 w-5" /></div>
            <span className="text-xl font-bold tracking-tight">OUTBOX</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Start scheduling email delivery securely.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'} {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <button type="button" className="font-medium text-foreground hover:underline" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
