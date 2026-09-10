// app/dashboard/tasks/page.tsx - COLLABORATIVE FIXED
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase, Task } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  CheckSquare,
  Loader2,
  Calendar,
  Trash2,
  Pencil,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type LeadOption = { id: string; name: string };

const taskStatuses = ['todo', 'in_progress', 'done'];
const priorities   = ['low', 'medium', 'high'];

type FormData = {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  related_lead_id: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  related_lead_id: '',
};

const priorityColors: Record<string, string> = {
  high:   'bg-destructive',
  medium: 'bg-yellow-400',
  low:    'bg-green-500',
};

export default function TasksPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks]   = useState<Task[]>([]);
  const [leads, setLeads]   = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]     = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // ✅ Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ✅ Role checks
  const isAdminOrManager =
    profile?.role === 'admin' || profile?.role === 'manager';

  const canEditTask = (t: Task) =>
    t.created_by === user?.id ||
    t.user_id    === user?.id ||
    isAdminOrManager;

  const canDeleteTask = (t: Task) =>
    t.created_by === user?.id ||
    t.user_id    === user?.id ||
    profile?.role === 'admin';

  // ============================================
  // DATA FETCHING - COLLABORATIVE
  // ============================================

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // ✅ FIX: Hapus .eq('user_id') → semua task tim
    const { data, error } = await supabase
      .from('tasks')
      .select('*, leads:related_lead_id(*)')
      .is('deleted_at', null)           // ✅ filter soft delete
      .order('created_at', { ascending: false });

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
  }, [toast, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchTasks();

    // ✅ FIX: Load semua leads (bukan hanya milik sendiri)
    supabase
      .from('active_leads')
      .select('id, name')
      .order('name')
      .then(({ data }) => setLeads(data ?? []));

  }, [fetchTasks, authLoading, user]);

  // ============================================
  // HANDLERS: ADD / EDIT
  // ============================================

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (t: Task) => {
    setForm({
      title:           t.title,
      description:     t.description ?? '',
      status:          t.status,
      priority:        t.priority,
      due_date:        t.due_date ?? '',
      related_lead_id: t.related_lead_id ?? '',
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id:         user.id,         // kolom lama, tetap diisi
      title:           form.title,
      description:     form.description || null,
      status:          form.status,
      priority:        form.priority,
      due_date:        form.due_date || null,
      related_lead_id: form.related_lead_id || null,
    };

    try {
      if (editingId) {
        // ✅ FIX: Hapus .eq('user_id') → RLS handle permission
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
        toast({ title: '✅ Task created' });
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

  // ✅ FIX: Hapus .eq('user_id') dari status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } else {
      fetchTasks();
    }
  };

  // ============================================
  // HANDLERS: DELETE (soft delete + konfirmasi)
  // ============================================

  const openDeleteConfirm = (t: Task) => setDeleteTarget(t);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      // ✅ FIX: Soft delete via RPC
      const { data, error } = await supabase.rpc('soft_delete', {
        p_table: 'tasks',
        p_id:    deleteTarget.id,
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
    { id: 'todo',        title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done',        title: 'Done' },
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
                    <CardTitle className="text-sm font-semibold">
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
                      const relatedLead = task.leads as
                        | { name?: string }
                        | null;
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
                              <p className="text-sm font-medium leading-snug">
                                {task.title}
                              </p>

                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

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

                              {/* ✅ Creator info */}
                              {task.creator_name && (
                                <div className="flex items-center gap-1 mt-1">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {task.creator_name}
                                  </span>
                                  {task.created_by === user?.id && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-1 py-0 h-4"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Actions — hanya tampil jika punya akses */}
                              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Status change — semua user bisa */}
                                <Select
                                  value={task.status}
                                  onValueChange={(v) =>
                                    handleStatusChange(task.id, v)
                                  }
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

                                {/* Edit — hanya jika canEditTask */}
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

                                {/* Delete — hanya jika canDeleteTask */}
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
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm({ ...form, due_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Related Lead</Label>
                <Select
                  value={form.related_lead_id || 'none'}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      related_lead_id: v === 'none' ? '' : v,
                    })
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ Delete Confirmation */}
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
              Task <strong>{deleteTarget?.title}</strong> akan
              dipindahkan ke recycle bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
