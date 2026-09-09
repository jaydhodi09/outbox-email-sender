import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
  loading?: boolean;
}

const toneStyles = {
  default: {
    icon: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    ring: '',
  },
  success: {
    icon: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    ring: '',
  },
  warning: {
    icon: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    ring: '',
  },
  destructive: {
    icon: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    ring: '',
  },
} as const;

export function StatsCard({ label, value, icon, tone = 'default', loading }: StatsCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            styles.icon
          )}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
