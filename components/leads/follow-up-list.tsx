'use client';

import { FollowUpLog } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Mail, MapPin } from 'lucide-react';

interface FollowUpListProps {
  logs: FollowUpLog[];
}

export function FollowUpList({ logs }: FollowUpListProps) {
  const methodIcons = {
    call: <Phone className="w-4 h-4" />,
    whatsapp: <MessageSquare className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    visit: <MapPin className="w-4 h-4" />,
  };

  const outcomeColors: Record<string, string> = {
    interested: 'bg-green-100 text-green-800',
    not_interested: 'bg-red-100 text-red-800',
    need_info: 'bg-blue-100 text-blue-800',
    agreed_survey: 'bg-purple-100 text-purple-800',
    survey_done: 'bg-indigo-100 text-indigo-800',
    agreed_booking: 'bg-emerald-100 text-emerald-800',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No follow-ups yet. Log the first one!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {methodIcons[log.contact_method as keyof typeof methodIcons]}
                    <span className="text-sm capitalize">{log.contact_method}</span>
                  </div>
                  <Badge className={outcomeColors[log.outcome] || 'bg-gray-100'}>
                    {log.outcome.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {log.notes && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {log.notes}
                  </p>
                )}

                {log.next_action && (
                  <p className="text-xs text-muted-foreground">
                    Next: <strong>{log.next_action.replace(/_/g, ' ')}</strong>
                    {log.next_follow_up_date && (
                      <> on {new Date(log.next_follow_up_date).toLocaleDateString()}</>
                    )}
                  </p>
                )}
              </div>

              <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                {formatDate(log.contact_date)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
