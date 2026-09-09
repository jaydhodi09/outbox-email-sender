import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, X, RotateCcw, MoreHorizontal } from 'lucide-react';
import type { Email } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatTime, getInitials, getAvatarColor, cn } from '@/lib/utils';

interface EmailTableProps {
  emails: Email[];
  onView?: (email: Email) => void;
  onEdit?: (email: Email) => void;
  onCancel?: (email: Email) => void;
  onRetry?: (email: Email) => void;
}

export function EmailTable({ emails, onView, onEdit, onCancel, onRetry }: EmailTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30%] pl-4">Recipient</TableHead>
              <TableHead className="w-[30%]">Subject</TableHead>
              <TableHead className="w-[15%]">
                {emails.some((e) => e.sentAt) ? 'Sent Time' : 'Scheduled Time'}
              </TableHead>
              <TableHead className="w-[12%]">Status</TableHead>
              <TableHead className="w-[13%] text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow
                key={email.id}
                className="cursor-pointer transition-colors"
                onClick={() => (onView ? onView(email) : navigate(`/scheduled`))}
              >
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                        getAvatarColor(email.to)
                      )}
                    >
                      {getInitials(email.toName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {email.toName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{email.to}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="truncate text-sm text-foreground">{email.subject}</p>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="text-foreground">{formatDate(email.sentAt ?? email.scheduledAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(email.sentAt ?? email.scheduledAt)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={email.status} />
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex items-center justify-end gap-1">
                    {email.status === 'SCHEDULED' && (
                      <>
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(email);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onCancel && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancel(email);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                    {email.status === 'FAILED' && onRetry && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(email);
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => (onView ? onView(email) : null)}>
                          <Eye className="mr-2 h-3.5 w-3.5" /> View details
                        </DropdownMenuItem>
                        {email.status === 'SCHEDULED' && onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(email)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        )}
                        {email.status === 'SCHEDULED' && onCancel && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onCancel(email)}
                          >
                            <X className="mr-2 h-3.5 w-3.5" /> Cancel email
                          </DropdownMenuItem>
                        )}
                        {email.status === 'FAILED' && onRetry && (
                          <DropdownMenuItem onClick={() => onRetry(email)}>
                            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Retry
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {emails.map((email) => (
          <div
            key={email.id}
            className="rounded-lg border border-border p-4 active:bg-muted/50 transition-colors"
            onClick={() => (onView ? onView(email) : null)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                    getAvatarColor(email.to)
                  )}
                >
                  {getInitials(email.toName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{email.toName}</p>
                  <p className="truncate text-xs text-muted-foreground">{email.to}</p>
                </div>
              </div>
              <StatusBadge status={email.status} />
            </div>
            <p className="mt-3 text-sm text-foreground line-clamp-1">{email.subject}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {formatDate(email.sentAt ?? email.scheduledAt)} · {formatTime(email.sentAt ?? email.scheduledAt)}
              </p>
              <div className="flex items-center gap-1">
                {email.status === 'SCHEDULED' && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(email);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {email.status === 'SCHEDULED' && onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(email);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {email.status === 'FAILED' && onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(email);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
