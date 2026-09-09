import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, PenSquare } from 'lucide-react';
import { EmailTable } from '@/components/EmailTable';
import { EmailDetailDialog } from '@/components/EmailDetailDialog';
import { EmptyState } from '@/components/EmptyState';
import { TableLoading } from '@/components/LoadingState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Email } from '@/types';

export function SentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [search, setSearch] = useState('');
  const [viewEmail, setViewEmail] = useState<Email | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    void api.emails.sent()
      .then(setEmails)
      .catch((error) => toast.error('Could not load sent emails', { description: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return emails;
    const q = search.toLowerCase();
    return emails.filter(
      (e) =>
        e.to.toLowerCase().includes(q) ||
        e.toName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q)
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
          <h2 className="text-xl font-semibold tracking-tight">Sent Emails</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} email{filtered.length !== 1 ? 's' : ''} delivered</p>
        </div>
        <Button onClick={() => navigate('/compose')}>
          <PenSquare className="h-4 w-4" /> Compose
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by recipient, name, or subject..."
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
            icon={<CheckCircle2 className="h-6 w-6" />}
            title={search ? 'No results found' : 'No sent emails yet'}
            description={search ? 'Try adjusting your search.' : 'Once you send emails, they will appear here.'}
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
        <EmailTable emails={filtered} onView={handleView} />
      )}

      <EmailDetailDialog
        email={viewEmail}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
    </div>
  );
}
