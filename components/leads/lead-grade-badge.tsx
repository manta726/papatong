import { Badge } from '@/components/ui/badge';

type LeadGrade = 'HOT' | 'WARM' | 'COLD';

interface LeadGradeBadgeProps {
  grade: LeadGrade;
}

export function LeadGradeBadge({ grade }: LeadGradeBadgeProps) {
  const styles = {
    HOT: 'bg-red-100 text-red-800 border border-red-300',
    WARM: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    COLD: 'bg-blue-100 text-blue-800 border border-blue-300',
  };

  const icons = {
    HOT: '🔥',
    WARM: '⚡',
    COLD: '❄️',
  };

  return (
    <Badge variant="outline" className={styles[grade]}>
      {icons[grade]} {grade}
    </Badge>
  );
}
