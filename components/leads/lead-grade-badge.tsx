// components/leads/lead-grade-badge.tsx - FIXED
import { Badge } from '@/components/ui/badge';
import { Flame, ThermometerSun, Snowflake } from 'lucide-react';

type LeadGrade = 'HOT' | 'WARM' | 'COLD';

interface LeadGradeBadgeProps {
  grade: LeadGrade;
}

export function LeadGradeBadge({ grade }: LeadGradeBadgeProps) {
  const styles = {
    HOT: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
    WARM: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800',
    COLD: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
  };

  const icons = {
    HOT: <Flame className="w-3 h-3 mr-1" />,
    WARM: <ThermometerSun className="w-3 h-3 mr-1" />,
    COLD: <Snowflake className="w-3 h-3 mr-1" />,
  };

  const labels = {
    HOT: 'HOT',
    WARM: 'WARM',
    COLD: 'COLD',
  };

  return (
    <Badge variant="outline" className={`${styles[grade]} flex items-center`}>
      {icons[grade]}
      <span>{grade}</span>
    </Badge>
  );
}
