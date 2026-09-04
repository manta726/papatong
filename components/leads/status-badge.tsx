'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { className: string; label?: string }> = {
  // Lead statuses
  new: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  contacted: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  qualified: { className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
  converted: { className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  lost: { className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },

  // Booking statuses
  pending: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  confirmed: { className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  cancelled: { className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  completed: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },

  // Unit statuses
  available: { className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  reserved: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  sold: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  maintenance: { className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },

  // Task statuses
  todo: { className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  done: { className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { className: '' };
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  return (
    <Badge variant="secondary" className={cn('font-medium border-0', config.className)}>
      {label}
    </Badge>
  );
}
