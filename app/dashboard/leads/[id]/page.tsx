'use client';

import { useEffect, useState } from 'react';
import { supabase, Lead, Booking, Task } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Mail, Phone, Globe, Wallet, Calendar, Pencil, Save, X,
  Plus, CheckSquare, Building2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', due_date: '' });

  useEffect(() => {
    async function fetchData() {
      const [{ data: leadData, error: leadError }, { data: bookingData }, { data: taskData }] = await Promise.all([
        supabase.from('leads').select('*').eq('id', params.id).maybeSingle(),
        supabase.from('bookings').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('related_lead_id', params.id).order('created_at', { ascending: false }),
      ]);
      if (leadError || !leadData) {
        toast({ title: 'Lead not found', variant: 'destructive' });
        router.push('/dashboard/leads');
        return;
      }
      setLead(leadData);
      setForm(leadData);
      setBookings(bookingData ?? []);
      setTasks(taskData ?? []);
      setLoading(false);
    }
    fetchData();
  }, [params.id, router, toast]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('leads').update(form).eq('id', params.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Lead updated successfully' });
      setLead({ ...lead!, ...form } as Lead);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('tasks').insert({
      title: taskForm.title,
      priority: taskForm.priority,
      due_date: taskForm.due_date || null,
      related_lead_id: params.id,
    }).select().single();
    if (error) {
      toast({ title: 'Failed to add task', description: error.message, variant: 'destructive' });
    } else {
      setTasks([data, ...tasks]);
      setTaskForm({ title: '', priority: 'medium', due_date: '' });
      setShowTaskForm(false);
      toast({ title: 'Task added' });
    }
  };

  const toggleTaskDone = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (error) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } else {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">Loading...</div>;
  }

  if (!lead) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/leads"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{lead.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={lead.status} />
            <span className="text-sm text-muted-foreground">• {lead.source}</span>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); setForm(lead); }}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status ?? 'new'} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {leadStatuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input value={form.source ?? ''} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget</Label>
                    <Input value={form.budget ?? ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Unit Interest</Label>
                  <Input value={form.unit_interest ?? ''} onChange={(e) => setForm({ ...form, unit_interest: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Mail} label="Email" value={lead.email || '—'} />
                  <InfoRow icon={Phone} label="Phone" value={lead.phone || '—'} />
                  <InfoRow icon={Globe} label="Source" value={lead.source} />
                  <InfoRow icon={Wallet} label="Budget" value={lead.budget || '—'} />
                  <InfoRow icon={Calendar} label="Created" value={new Date(lead.created_at).toLocaleDateString()} />
                  <InfoRow icon={Building2} label="Unit Interest" value={lead.unit_interest || '—'} />
                </div>
                {lead.notes && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tasks</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showTaskForm && (
              <form onSubmit={handleAddTask} className="space-y-3 pb-3 border-b border-border">
                <Input
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
                <Button type="submit" size="sm" className="w-full">Add Task</Button>
              </form>
            )}
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks for this lead</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 group">
                  <button
                    onClick={() => toggleTaskDone(task)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                      task.status === 'done' ? 'bg-success border-success text-success-foreground' : 'border-border hover:border-primary'
                    }`}
                  >
                    {task.status === 'done' && <CheckSquare className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{task.priority} priority</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Related Bookings</CardTitle>
          <CardDescription>Bookings associated with this lead</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No bookings for this lead</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{new Date(booking.booking_date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{booking.status}</p>
                  </div>
                  <span className="text-sm font-semibold">${Number(booking.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}


