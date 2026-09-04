'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';  // ✅ ADD
import { supabase, Task } from '@/lib/supabase/client';

type LeadOption = { id: string; name: string };
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckSquare, Loader2, Calendar, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const taskStatuses = ['todo', 'in_progress', 'done'];
const priorities = ['low', 'medium', 'high'];

type FormData = {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  related_lead_id: string;
};

const emptyForm: FormData = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', related_lead_id: '' };

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();  // ✅ ADD
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;  // ✅ ADD

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*, leads(*)')
      .eq('user_id', user.id)  // ✅ ADD
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Failed to load tasks', description: error.message, variant: 'destructive' });
    else setTasks(data ?? []);
    setLoading(false);
  }, [toast, user]);  // ✅ ADD user

  useEffect(() => {
    if (!authLoading && !user) return;  // ✅ ADD

    fetchTasks();
    if (user) {
      supabase
        .from('leads')
        .select('id, name')
        .eq('user_id', user.id)  // ✅ ADD
        .then(({ data }) => setLeads(data ?? []));
    }
  }, [fetchTasks, authLoading, user]);  // ✅ UPDATE

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      due_date: t.due_date ?? '',
      related_lead_id: t.related_lead_id ?? '',
    });
    setEditingId(t.id); setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;  // ✅ ADD

    setSaving(true);
    const payload = {
      user_id: user.id,  // ✅ ADD
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      related_lead_id: form.related_lead_id || null,
    };
    if (editingId) {
      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user.id);  // ✅ ADD for security
      if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Task updated' }); setDialogOpen(false); fetchTasks(); }
    } else {
      const { error } = await supabase.from('tasks').insert(payload);
      if (error) toast({ title: 'Create failed', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Task created' }); setDialogOpen(false); fetchTasks(); }
    }
    setSaving(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!user) return;  // ✅ ADD

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
      .eq('user_id', user.id);  // ✅ ADD for security
    if (error) toast({ title: 'Update failed', variant: 'destructive' });
    else fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;  // ✅ ADD

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);  // ✅ ADD for security
    if (error) toast({ title: 'Delete failed', variant: 'destructive' });
    else { toast({ title: 'Task deleted' }); fetchTasks(); }
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-destructive',
    medium: 'bg-warning',
    low: 'bg-success',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your operational tasks</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No tasks yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <Card key={col.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{col.title}</CardTitle>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                  ) : (
                    colTasks.map((task) => (
                      <div key={task.id} className="group bg-muted/50 hover:bg-muted rounded-lg p-3 transition-colors cursor-default">
                        <div className="flex items-start gap-2">
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', priorityColors[task.priority])} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {task.leads && (
                                <span className="text-xs text-primary truncate">{task.leads.name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                                <SelectTrigger className="h-7 text-xs w-auto gap-1 px-2"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {taskStatuses.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s.replace('_', ' ')}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(task.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Task' : 'Add New Task'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{taskStatuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Related Lead</Label>
                <Select value={form.related_lead_id} onValueChange={(v) => setForm({ ...form, related_lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
