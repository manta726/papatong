'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addFollowUpLog, FollowUpLog } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FollowUpFormProps {
  leadId: string;
  userId: string;
  onSuccess: (log: FollowUpLog) => void;
}

export function FollowUpForm({ leadId, userId, onSuccess }: FollowUpFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contact_method: 'whatsapp' as const,
    outcome: 'interested' as const,
    notes: '',
    next_action: 'call' as const,
    next_follow_up_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const log = await addFollowUpLog(
        {
          lead_id: leadId,
          user_id: userId,
          contact_date: new Date().toISOString(),
          contact_method: form.contact_method,
          outcome: form.outcome,
          notes: form.notes || null,
          next_action: form.next_action,
          next_follow_up_date: form.next_follow_up_date ? new Date(form.next_follow_up_date).toISOString() : null,
        },
        userId
      );

      toast({ title: 'Follow-up logged successfully' });
      onSuccess(log);

      // Reset form
      setForm({
        contact_method: 'whatsapp',
        outcome: 'interested',
        notes: '',
        next_action: 'call',
        next_follow_up_date: '',
      });
    } catch (error) {
      toast({
        title: 'Error logging follow-up',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <h3 className="font-semibold">Log Follow-up</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_method">Contact Method</Label>
          <Select value={form.contact_method} onValueChange={(v: any) => setForm({ ...form, contact_method: v })}>
            <SelectTrigger id="contact_method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="visit">Visit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outcome">Outcome</Label>
          <Select value={form.outcome} onValueChange={(v: any) => setForm({ ...form, outcome: v })}>
            <SelectTrigger id="outcome">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
              <SelectItem value="need_info">Need Info</SelectItem>
              <SelectItem value="agreed_survey">Agreed Survey</SelectItem>
              <SelectItem value="survey_done">Survey Done</SelectItem>
              <SelectItem value="agreed_booking">Agreed Booking</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="What did you discuss..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="next_action">Next Action</Label>
          <Select value={form.next_action} onValueChange={(v: any) => setForm({ ...form, next_action: v })}>
            <SelectTrigger id="next_action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call Again</SelectItem>
              <SelectItem value="send_info">Send Info</SelectItem>
              <SelectItem value="schedule_survey">Schedule Survey</SelectItem>
              <SelectItem value="send_proposal">Send Proposal</SelectItem>
              <SelectItem value="close">Close</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="next_follow_up_date">Next Follow-up Date</Label>
          <Input
            id="next_follow_up_date"
            type="date"
            value={form.next_follow_up_date}
            onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Log Follow-up
      </Button>
    </form>
  );
}
