import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, PenSquare } from 'lucide-react';
import { EmailTable } from '@/components/EmailTable';
import { EmailDetailDialog } from '@/components/EmailDetailDialog';
import { EmptyState } from '@/components/EmptyState';
import { TableLoading } from '@/components/LoadingState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Email } from '@/types';

export function FailedPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [search, setSearch] = useState('');
  const [viewEmail, setViewEmail] = useState<Email | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  useEffect(() => {
    void api.emails.failed()
      .then(setEmails)
      .catch((error) => toast.error('Could not load failed emails', { description: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return emails;
    const q = search.toLowerCase();
    return emails.filter(
      (e) =>
        e.to.toLowerCase().includes(q) ||
        e.toName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        (e.failureReason ?? '').toLowerCase().includes(q)
    );
  }, [emails, search]);

  const handleView = (email: Email) => {
    setViewEmail(email);
    setViewOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Failed Emails</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} email{filtered.length !== 1 ? 's' : ''} failed delivery</p>
        </div>
        <Button onClick={() => navigate('/compose')}>
          <PenSquare className="h-4 w-4" /> Compose
        </Button>
      </div>

      {/* Summary banner */}
      {!loading && emails.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-medium">{emails.length}</span> email{emails.length !== 1 ? 's' : ''} failed delivery.
            Review the failure reasons below.
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by recipient, subject, or failure reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <TableLoading />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" />}
            title={search ? 'No results found' : 'No failed emails'}
            description={search ? 'Try adjusting your search.' : 'All your emails have been delivered successfully.'}
            action={
              !search && (
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              )
            }
          />
        </div>
      ) : (
        <EmailTable
          emails={filtered}
          onView={handleView}
        />
      )}

      <EmailDetailDialog
        email={viewEmail}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
    </div>
  );
}
