import { cva, type VariantProps } from 'class-variance-authority';
import type { EmailStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border',
  {
    variants: {
      status: {
        SCHEDULED:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900',
        PROCESSING:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900',
        SENT:
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900',
        FAILED:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900',
        CANCELLED:
          'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      },
    },
    defaultVariants: {
      status: 'SCHEDULED',
    },
  }
);

const statusDotVariants: Record<EmailStatus, string> = {
  SCHEDULED: 'bg-blue-500',
  PROCESSING: 'bg-orange-500 animate-pulse',
  SENT: 'bg-green-500',
  FAILED: 'bg-red-500',
  CANCELLED: 'bg-gray-400',
};

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: EmailStatus;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', statusDotVariants[status])} />
      )}
      <span>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
    </span>
  );
}
