import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, Pencil } from 'lucide-react';
import type { Email } from '@/types';
import { formatDateTime, getInitials, getAvatarColor, cn } from '@/lib/utils';

interface EmailDetailDialogProps {
  email: Email | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (email: Email) => void;
  onCancel?: (email: Email) => void;
  onEdit?: (email: Email) => void;
}

export function EmailDetailDialog({
  email,
  open,
  onOpenChange,
  onRetry,
  onCancel,
  onEdit,
}: EmailDetailDialogProps) {
  if (!email) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg">{email.subject}</DialogTitle>
            <StatusBadge status={email.status} />
          </div>
          <DialogDescription>Email details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
                getAvatarColor(email.to)
              )}
            >
              {getInitials(email.toName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{email.toName}</p>
              <p className="text-xs text-muted-foreground truncate">{email.to}</p>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Scheduled for</p>
              <p className="mt-1 text-sm">{formatDateTime(email.scheduledAt)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Timezone</p>
              <p className="mt-1 text-sm">{email.timezone}</p>
            </div>
            {email.sentAt && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Sent at</p>
                <p className="mt-1 text-sm">{formatDateTime(email.sentAt)}</p>
              </div>
            )}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Priority</p>
              <p className="mt-1 text-sm capitalize">{email.priority}</p>
            </div>
          </div>

          {/* Failure reason */}
          {email.failureReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Failure reason</p>
              <p className="mt-1 text-sm text-red-900 dark:text-red-300">{email.failureReason}</p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-500">Retries: {email.retries}</p>
            </div>
          )}

          {/* Body */}
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Message</p>
            <p className="text-sm whitespace-pre-wrap text-foreground">{email.body}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {email.status === 'SCHEDULED' && onEdit && (
              <Button variant="outline" size="sm" onClick={() => { onEdit(email); onOpenChange(false); }}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {email.status === 'SCHEDULED' && onCancel && (
              <Button variant="outline" size="sm" onClick={() => { onCancel(email); onOpenChange(false); }}>
                <X className="h-3.5 w-3.5" /> Cancel email
              </Button>
            )}
            {email.status === 'FAILED' && onRetry && (
              <Button size="sm" onClick={() => { onRetry(email); onOpenChange(false); }}>
                <RotateCcw className="h-3.5 w-3.5" /> Retry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
