import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Filter, PenSquare } from 'lucide-react';
import { EmailTable } from '@/components/EmailTable';
import { EmailDetailDialog } from '@/components/EmailDetailDialog';
import { EmptyState } from '@/components/EmptyState';
import { TableLoading } from '@/components/LoadingState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Email } from '@/types';

export function ScheduledPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'SCHEDULED' | 'PROCESSING'>('all');
  const [viewEmail, setViewEmail] = useState<Email | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [cancelEmail, setCancelEmail] = useState<Email | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    void api.emails.scheduled()
      .then(setEmails)
      .catch((error) => toast.error('Could not load scheduled emails', { description: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return emails
      .filter((e) => (filter === 'all' ? true : e.status === filter))
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          e.to.toLowerCase().includes(q) ||
          e.toName.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [emails, search, filter]);

  const handleView = (email: Email) => {
    setViewEmail(email);
    setViewOpen(true);
  };

  const handleCancelRequest = (email: Email) => {
    setCancelEmail(email);
    setCancelOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelEmail) return;
    try {
      await api.emails.cancel(cancelEmail.id);
      setEmails((prev) => prev.filter((email) => email.id !== cancelEmail.id));
      toast.success('Email cancelled', { description: `Scheduled email to ${cancelEmail.toName} has been cancelled.` });
      setCancelOpen(false);
      setCancelEmail(null);
    } catch (error) {
      toast.error('Could not cancel email', { description: error instanceof Error ? error.message : 'Please try again.' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Scheduled Emails</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} email{filtered.length !== 1 ? 's' : ''} in queue</p>
        </div>
        <Button onClick={() => navigate('/compose')}>
          <PenSquare className="h-4 w-4" /> Compose
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by recipient, name, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="sm:w-44">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <TableLoading />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            title={search ? 'No results found' : 'No scheduled emails'}
            description={search ? 'Try adjusting your search or filters.' : 'Schedule an email to see it appear here.'}
            action={
              !search && (
                <Button onClick={() => navigate('/compose')}>
                  <PenSquare className="h-4 w-4" /> Compose Email
                </Button>
              )
            }
          />
        </div>
      ) : (
        <EmailTable
          emails={filtered}
          onView={handleView}
          onCancel={handleCancelRequest}
        />
      )}

      {/* Dialogs */}
      <EmailDetailDialog
        email={viewEmail}
        open={viewOpen}
        onOpenChange={setViewOpen}
        onCancel={handleCancelRequest}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel scheduled email?"
        description={`This will cancel the email to ${cancelEmail?.toName}. This action cannot be undone.`}
        confirmLabel="Yes, cancel email"
        destructive
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
