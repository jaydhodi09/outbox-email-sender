import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sidebar } from '@/components/Sidebar';
import { getInitials } from '@/lib/utils';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your email activity' },
  '/compose': { title: 'Compose Email', subtitle: 'Write and schedule a new email' },
  '/scheduled': { title: 'Scheduled Emails', subtitle: 'Manage your upcoming emails' },
  '/sent': { title: 'Sent Emails', subtitle: 'Review your delivered emails' },
  '/failed': { title: 'Failed Emails', subtitle: 'Retry or review failed deliveries' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account and preferences' },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = pageTitles[location.pathname] ?? {
    title: 'OUTBOX',
    subtitle: 'Email Scheduling Platform',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div>
          <h1 className="text-base font-semibold tracking-tight md:text-lg">{meta.title}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden lg:flex items-center gap-2"
          onClick={() => navigate('/scheduled')}
        >
          <Search className="h-4 w-4" />
          <span className="text-muted-foreground">Search emails...</span>
          <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigate('/compose')}
        >
          <PenSquare className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {getInitials('User')}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
