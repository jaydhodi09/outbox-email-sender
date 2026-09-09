import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Mail, PenSquare, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatTime, getAvatarColor, getInitials, cn } from '@/lib/utils';
import type { Email } from '@/types';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [counts, setCounts] = useState({ scheduled: 0, sent: 0, failed: 0, total: 0 });

  useEffect(() => {
    void api.dashboard.stats()
      .then((stats) => {
        setEmails(stats.scheduledEmails);
        setCounts({ scheduled: stats.scheduled, sent: stats.sent, failed: stats.failed, total: stats.total });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Scheduled" value={counts.scheduled} icon={<Clock className="h-5 w-5" />} tone="default" loading={loading} />
        <StatsCard label="Sent" value={counts.sent} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" loading={loading} />
        <StatsCard label="Failed" value={counts.failed} icon={<AlertTriangle className="h-5 w-5" />} tone="destructive" loading={loading} />
        <StatsCard label="Total" value={counts.total} icon={<Mail className="h-5 w-5" />} loading={loading} />
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Upcoming Scheduled Emails</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Next emails in your queue</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/scheduled')}>
            View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6 pt-0">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No upcoming emails</p>
              <Button className="mt-4" size="sm" onClick={() => navigate('/compose')}><PenSquare className="h-4 w-4" /> Compose Email</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {emails.map((email) => (
                <button key={email.id} type="button" onClick={() => navigate('/scheduled')} className="flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-muted/30">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white', getAvatarColor(email.to))}>{getInitials(email.toName)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{email.toName}</p>
                    <p className="truncate text-xs text-muted-foreground">{email.subject}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium">{formatDate(email.scheduledAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(email.scheduledAt)}</p>
                  </div>
                  <StatusBadge status={email.status} />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
