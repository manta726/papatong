// app/dashboard/tasks/page.tsx - COLLABORATIVE WITH ASSIGNMENT & RECURRING
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase, Task } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  CheckSquare,
  Loader2,
  Calendar,
  Trash2,
  Pencil,
  User,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

type LeadOption = { id: string; name: string };
type AssigneeOption = { id: string; name: string; role: string };

const taskStatuses = ['todo', 'in_progress', 'done'];
const priorities = ['low', 'medium', 'high'];
const recurrencePatterns = [
  { value: 'daily', label: 'Every Day' },
  { value: 'weekly', label: 'Every Week' },
  { value: 'monthly', label: 'Every Month' },
  { value: 'yearly', label: 'Every Year' },
];

type FormData = {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  related_lead_id: string;
  assigned_to: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  recurrence_end_date: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  related_lead_id: '',
  assigned_to: '',
  is_recurring: false,
  recurrence_pattern: '',
  recurrence_end_date: '',
};

const priorityColors: Record<string, string> = {
  high: 'bg-destructive',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function TasksPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Role checks
  const isAdminOrManager =
    profile?.role === 'admin' || profile?.role === 'manager';

  const canEditTask = (t: Task) =>
    t.created_by === user?.id ||
    t.user_id === user?.id ||
    t.assigned_to === user?.id ||
    isAdminOrManager;

  const canDeleteTask = (t: Task) =>
    t.created_by === user?.id ||
    t.user_id === user?.id ||
    profile?.role === 'admin';

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('tasks')
      .select(`
        *,
        leads:related_lead_id(*)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', filterAssignee);
      }
    }

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Failed to load tasks',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setTasks(data ?? []);
    }
    setLoading(false);
  }, [filterAssignee, filterStatus, toast, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchTasks();

    // Load leads
    supabase
      .from('active_leads')
      .select('id, name')
      .order('name')
      .then(({ data }) => setLeads((data as LeadOption[]) ?? []));

    // Load team members (for assignment)
    supabase
      .from('user_profiles')
      .select('id, name, role')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setTeamMembers((data as AssigneeOption[]) ?? []);
      });

  }, [fetchTasks, authLoading, user]);

  // ============================================
  // HANDLERS: ADD / EDIT
  // ============================================

  const openAdd = () => {
    setForm({
      ...emptyForm,
      assigned_to: user?.id ?? '',
    });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      due_date: t.due_date ?? '',
      related_lead_id: t.related_lead_id ?? '',
      assigned_to: t.assigned_to ?? '',
      is_recurring: t.is_recurring ?? false,
      recurrence_pattern: t.recurrence_pattern ?? '',
      recurrence_end_date: t.recurrence_end_date ?? '',
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    if (form.is_recurring && !form.recurrence_pattern) {
      toast({
        title: 'Recurrence pattern required',
        description: 'Please select how often this task repeats',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      related_lead_id: form.related_lead_id || null,
      assigned_to: form.assigned_to || null,
      is_recurring: form.is_recurring,
      recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
      recurrence_end_date:
        form.is_recurring && form.recurrence_end_date
          ? form.recurrence_end_date
          : null,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: '✅ Task updated' });
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(payload);

        if (error) throw error;
        toast({
          title: form.is_recurring ? '🔄 Recurring task created' : '✅ Task created',
          description: form.is_recurring
            ? `Will repeat ${form.recurrence_pattern}`
            : undefined,
        });
      }

      setDialogOpen(false);
      fetchTasks();
    } catch (error) {
      toast({
        title: editingId ? 'Update failed' : 'Create failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // ============================================
  // HANDLERS: DELETE
  // ============================================

  const openDeleteConfirm = (t: Task) => setDeleteTarget(t);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const { data, error } = await supabase.rpc('soft_delete', {
        p_table: 'tasks',
        p_id: deleteTarget.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Delete gagal');

      toast({ title: '🗑️ Task deleted' });
      setDeleteTarget(null);
      fetchTasks();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-amber-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track and manage team operational tasks ({tasks.length} total)
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {taskStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No tasks yet. Add one to get started.
            </p>
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
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', col.color)} />
                      {col.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No tasks
                    </p>
                  ) : (
                    colTasks.map((task) => {
                      const relatedLead = task.leads as { name?: string } | null;
                      return (
                        <div
                          key={task.id}
                          className="group bg-muted/50 hover:bg-muted rounded-lg p-3 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                                priorityColors[task.priority]
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              {/* Title + Recurring indicator */}
                              <div className="flex items-start gap-2">
                                <p className="text-sm font-medium leading-snug flex-1">
                                  {task.title}
                                </p>
                                {task.is_recurring && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs shrink-0 flex items-center gap-1"
                                  >
                                    <Repeat className="w-3 h-3" />
                                    {task.recurrence_pattern}
                                  </Badge>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Meta info */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-xs text-muted-foreground capitalize">
                                  {task.priority}
                                </span>
                                {task.due_date && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.due_date).toLocaleDateString('id-ID')}
                                  </span>
                                )}
                                {relatedLead?.name && (
                                  <span className="text-xs text-primary truncate">
                                    {relatedLead.name}
                                  </span>
                                )}
                              </div>

                              {/* Assignee info */}
                              {task.assigned_to_name && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-foreground font-medium">
                                    {task.assigned_to_name}
                                  </span>
                                  {task.assigned_to === user?.id && (
                                    <Badge variant="secondary" className="text-xs">
                                      You
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Creator info */}
                              {task.creator_name && task.created_by !== task.assigned_to && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Created by {task.creator_name}
                                  </span>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Select
                                  value={task.status}
                                  onValueChange={(v) => handleStatusChange(task.id, v)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-auto gap-1 px-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {taskStatuses.map((s) => (
                                      <SelectItem
                                        key={s}
                                        value={s}
                                        className="text-xs capitalize"
                                      >
                                        {s.replace('_', ' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {canEditTask(task) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEdit(task)}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                )}

                                {canDeleteTask(task) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => openDeleteConfirm(task)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Task' : 'Add New Task'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assigned_to">
                <User className="w-3 h-3 inline mr-1" />
                Assign To
              </Label>
              <Select
                value={form.assigned_to || 'unassigned'}
                onValueChange={(v) =>
                  setForm({ ...form, assigned_to: v === 'unassigned' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-muted-foreground">Unassigned</span>
                  </SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date & Related Lead */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Related Lead</Label>
                <Select
                  value={form.related_lead_id || 'none'}
                  onValueChange={(v) =>
                    setForm({ ...form, related_lead_id: v === 'none' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recurring Task */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="is_recurring" className="cursor-pointer">
                    Recurring Task
                  </Label>
                </div>
                <Switch
                  id="is_recurring"
                  checked={form.is_recurring}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      is_recurring: checked,
                      recurrence_pattern: checked ? form.recurrence_pattern : '',
                    })
                  }
                />
              </div>

              {form.is_recurring && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Repeat</Label>
                      <Select
                        value={form.recurrence_pattern}
                        onValueChange={(v) =>
                          setForm({ ...form, recurrence_pattern: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {recurrencePatterns.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={form.recurrence_end_date}
                        onChange={(e) =>
                          setForm({ ...form, recurrence_end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 A new instance will be created automatically. Run{' '}
                    <code className="bg-background px-1 rounded">
                      SELECT generate_recurring_tasks()
                    </code>{' '}
                    in SQL to generate manually.
                  </p>
                </>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Task <strong>{deleteTarget?.title}</strong> akan dipindahkan ke
              recycle bin.
              {deleteTarget?.is_recurring && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ Ini task berulang. Hanya instance ini yang dihapus.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
