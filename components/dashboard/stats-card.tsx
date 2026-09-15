// components/dashboard/stats-card.tsx - COMPACT VERSION
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'primary' | 'success' | 'warning' | 'destructive' | 'info';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: AccentColor;
  trend?: string;
  trendUp?: boolean;
  isCurrency?: boolean;
  className?: string;
}

const accentClasses: Record<AccentColor, { bg: string; text: string; iconBg: string }> = {
  primary: {
    bg: 'bg-primary/5',
    text: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  destructive: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  trend,
  trendUp,
  isCurrency,
  className,
}: StatsCardProps) {
  const accent_ = accentClasses[accent];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4"> {/* ⬅️ Reduced from p-5 to p-4 */}
        <div className="flex items-start justify-between gap-3">
          {/* Label & Value */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1 truncate"> {/* ⬅️ Reduced from text-3xl */}
              {isCurrency && typeof value === 'number'
                ? formatCompactCurrency(value)
                : value}
            </p>
            {trend && (
              <p className={cn(
                'text-xs mt-1 flex items-center gap-1',
                trendUp ? 'text-green-600' : 'text-muted-foreground'
              )}>
                {trendUp && <span>↑</span>}
                {trend}
              </p>
            )}
          </div>

          {/* Icon */}
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0', // ⬅️ Reduced from w-10 h-10
            accent_.iconBg
          )}>
            <Icon className={cn('w-4 h-4', accent_.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper untuk compact currency
function formatCompactCurrency(value: number): string {
  if (value === 0) return 'Rp 0';
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
}
