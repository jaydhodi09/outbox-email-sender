import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, LogOut, Menu, PenSquare, Search, TriangleAlert, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { getInitials, timeAgo } from '@/lib/utils';
import type { Email, User } from '@/types';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your email activity' },
  '/compose': { title: 'Compose Email', subtitle: 'Write and schedule a new email' },
  '/scheduled': { title: 'Scheduled Emails', subtitle: 'Manage your upcoming emails' },
  '/sent': { title: 'Sent Emails', subtitle: 'Review your delivered emails' },
  '/failed': { title: 'Failed Emails', subtitle: 'Review failed deliveries' },
};

function emailRoute(email: Email) {
  return email.status === 'SENT' ? '/sent' : email.status === 'FAILED' ? '/failed' : '/scheduled';
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    void Promise.all([api.auth.me(), api.emails.scheduled(), api.emails.sent(), api.emails.failed()])
      .then(([currentUser, scheduled, sent, failed]) => {
        setUser(currentUser);
        setEmails([...scheduled, ...sent, ...failed]);
        setFailedCount(failed.length);
      })
      .catch(() => undefined);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return emails.filter((email) => [email.to, email.toName, email.subject, email.status].some((item) => item.toLowerCase().includes(value))).slice(0, 6);
  }, [emails, query]);
  const notifications = useMemo(() => [...emails].sort((a, b) => new Date(b.sentAt ?? b.scheduledAt).getTime() - new Date(a.sentAt ?? a.scheduledAt).getTime()).slice(0, 4), [emails]);
  const meta = pageTitles[location.pathname] ?? { title: 'OUTBOX', subtitle: 'Email Scheduling Platform' };
  const signOut = async () => { await api.auth.logout(); navigate('/login', { replace: true }); };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" title="Open menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="w-64 p-0"><Sidebar onNavigate={() => setMobileOpen(false)} /></SheetContent>
        </Sheet>
        <div><h1 className="text-base font-semibold tracking-tight md:text-lg">{meta.title}</h1><p className="hidden text-xs text-muted-foreground sm:block">{meta.subtitle}</p></div>
      </div>
      <div className="flex items-center gap-2">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild><Button variant="outline" size="sm" className="hidden items-center gap-2 lg:flex" title="Search emails"><Search className="h-4 w-4" /><span className="text-muted-foreground">Search emails...</span><kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Ctrl K</kbd></Button></PopoverTrigger>
          <PopoverContent align="end" className="w-[min(26rem,calc(100vw-2rem))] p-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recipient, subject, or status..." className="pl-9" /></div>
            <div className="mt-2 max-h-72 overflow-y-auto">
              {!query.trim() ? <p className="px-2 py-4 text-center text-sm text-muted-foreground">Search your scheduled, sent, and failed emails.</p> : searchResults.length === 0 ? <p className="px-2 py-4 text-center text-sm text-muted-foreground">No emails match your search.</p> : searchResults.map((email) => <button key={email.id} type="button" className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-accent" onClick={() => { navigate(emailRoute(email)); setSearchOpen(false); setQuery(''); }}><span className="min-w-0"><span className="block truncate text-sm font-medium">{email.to}</span><span className="block truncate text-xs text-muted-foreground">{email.subject}</span></span><span className="shrink-0 text-xs text-muted-foreground">{email.status}</span></button>)}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/compose')} title="Compose email"><PenSquare className="h-4 w-4" /></Button>
        <Popover>
          <PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative h-9 w-9" title="Notifications"><Bell className="h-4 w-4" />{notifications.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}</Button></PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <div className="flex items-center justify-between px-2 py-1.5"><span className="text-sm font-semibold">Notifications</span>{failedCount > 0 && <span className="text-xs text-destructive">{failedCount} failed</span>}</div>
            {notifications.length === 0 ? <p className="px-2 py-4 text-center text-sm text-muted-foreground">No email activity yet.</p> : notifications.map((email) => <button key={email.id} type="button" className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-accent" onClick={() => navigate(emailRoute(email))}>{email.status === 'SENT' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : email.status === 'FAILED' ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}<span className="min-w-0"><span className="block truncate text-sm font-medium">{email.subject}</span><span className="block truncate text-xs text-muted-foreground">{email.status} - {email.to} - {timeAgo(email.sentAt ?? email.scheduledAt)}</span></span></button>)}
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" title="Account menu"><Avatar className="h-9 w-9 border border-border"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{getInitials(user?.name ?? 'User')}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel><span className="block truncate">{user?.name ?? 'Account'}</span><span className="block truncate text-xs font-normal text-muted-foreground">{user?.email ?? 'Loading account...'}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => navigate('/dashboard')}><UserRound className="mr-2 h-4 w-4" />Account overview</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
