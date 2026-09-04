'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type StatsCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: 'primary' | 'success' | 'warning' | 'destructive';
};

const accentClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function StatsCard({ label, value, icon: Icon, trend, trendUp, accent = 'primary' }: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{value}</p>
            {trend && (
              <p className={cn('text-xs font-medium mt-2', trendUp ? 'text-success' : 'text-destructive')}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn('flex items-center justify-center w-11 h-11 rounded-xl', accentClasses[accent])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
