import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PenSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onNavigate?: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/compose', label: 'Compose', icon: PenSquare },
  { to: '/scheduled', label: 'Scheduled', icon: Clock },
  { to: '/sent', label: 'Sent', icon: CheckCircle2 },
  { to: '/failed', label: 'Failed', icon: AlertTriangle },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">OUTBOX</span>
        </div>
        {onNavigate && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onNavigate}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-3 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Menu
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-foreground">All systems operational</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Scheduler running normally</p>
        </div>
      </div>
    </div>
  );
}
