'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

type StatsCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: 'primary' | 'success' | 'warning' | 'destructive';
  isCurrency?: boolean;
};

const accentClasses = {
  primary: 'from-primary/10 to-primary/5 text-primary border-primary/20',
  success: 'from-success/10 to-success/5 text-success border-success/20',
  warning: 'from-warning/10 to-warning/5 text-warning border-warning/20',
  destructive: 'from-destructive/10 to-destructive/5 text-destructive border-destructive/20',
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  accent = 'primary',
  isCurrency = false,
}: StatsCardProps) {
  return (
    <Card className="relative group hover:shadow-lg hover:border-primary/20 transition-all duration-300 border bg-gradient-to-br overflow-hidden">
      {/* ✅ Tambah pointer-events-none supaya overlay tidak nangkep klik */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <CardContent className="p-5 sm:p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</h3>

            {trend && (
              <div className="flex items-center gap-1 pt-1">
                {trendUp ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <p
                  className={cn(
                    'text-xs font-semibold',
                    trendUp ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend}
                </p>
              </div>
            )}
          </div>

          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl font-semibold shadow-md group-hover:shadow-lg transition-all group-hover:scale-110 bg-gradient-to-br',
              accentClasses[accent]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
