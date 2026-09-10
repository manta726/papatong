// app/dashboard/units/page.tsx - COLLABORATIVE FIXED
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase, Unit } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Loader2,
  MapPin,
  DollarSign,
  User,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

const unitTypes = [
  'studio', '1br', '2br', '3br', 'penthouse', 'commercial', 'other',
];
const unitStatuses = ['available', 'reserved', 'sold', 'maintenance'];

type FormData = {
  name:        string;
  code:        string;
  type:        string;
  status:      string;
  price:       string;
  location:    string;
  description: string;
};

const emptyForm: FormData = {
  name: '', code: '', type: 'studio', status: 'available',
  price: '', location: '', description: '',
};

export default function UnitsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [units, setUnits]     = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]   = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // ✅ Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ✅ Role checks
  // Units: hanya admin/manager yang bisa create/edit/delete (sesuai RLS)
  const isAdminOrManager =
    profile?.role === 'admin' || profile?.role === 'manager';

  // ============================================
  // DATA FETCHING - COLLABORATIVE
  // ============================================

  const fetchUnits = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // ✅ FIX: Hapus .eq('user_id') → semua unit tim
    let query = supabase
      .from('units')
      .select('*')
      .is('deleted_at', null)           // ✅ filter soft delete
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({
        title: 'Failed to load units',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setUnits(data ?? []);
    }
    setLoading(false);
  }, [statusFilter, toast, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchUnits();
  }, [fetchUnits, authLoading, user]);

  // ============================================
  // FILTER
  // ============================================

  const filtered = units.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.code.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q) ||
      u.type.toLowerCase().includes(q)
    );
  });

  // ============================================
  // HANDLERS: ADD / EDIT
  // ============================================

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (u: Unit) => {
    setForm({
      name:        u.name,
      code:        u.code,
      type:        u.type,
      status:      u.status,
      price:       String(u.price),
      location:    u.location    ?? '',
      description: u.description ?? '',
    });
    setEditingId(u.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      ...form,
      user_id: user.id,             // kolom lama, tetap diisi
      price:   Number(form.price) || 0,
    };

    try {
      if (editingId) {
        // ✅ FIX: Hapus .eq('user_id') → RLS handle permission
        const { error } = await supabase
          .from('units')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: '✅ Unit updated' });
      } else {
        const { error } = await supabase
          .from('units')
          .insert(payload);

        if (error) throw error;
        toast({ title: '✅ Unit created' });
      }

      setDialogOpen(false);
      fetchUnits();
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

  // ============================================
  // HANDLERS: DELETE (soft delete + konfirmasi)
  // ============================================

  const openDeleteConfirm = (u: Unit) => setDeleteTarget(u);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      // ✅ FIX: Soft delete via RPC
      const { data, error } = await supabase.rpc('soft_delete', {
        p_table: 'units',
        p_id:    deleteTarget.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Delete gagal');

      toast({ title: '🗑️ Unit deleted' });
      setDeleteTarget(null);
      fetchUnits();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Units</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage property inventory ({units.length} total)
          </p>
        </div>
        {/* ✅ Tombol Add hanya untuk admin/manager */}
        {isAdminOrManager && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Unit
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {unitStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No units found.
              {isAdminOrManager
                ? ' Add one to get started.'
                : ' Contact admin to add units.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((unit) => (
            <Card
              key={unit.id}
              className="hover:shadow-md transition-shadow group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">
                      {unit.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {unit.code}
                    </p>
                  </div>
                  <StatusBadge status={unit.status} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground capitalize">
                    {unit.type}
                  </div>

                  {unit.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {unit.location}
                    </div>
                  )}

                  <div className="flex items-center gap-2 font-semibold text-base pt-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    {formatCurrency(Number(unit.price))}
                  </div>

                  {unit.description && (
                    <p className="text-muted-foreground text-xs line-clamp-2 pt-1">
                      {unit.description}
                    </p>
                  )}

                  {/* ✅ Creator info */}
                  {unit.creator_name && (
                    <div className="flex items-center gap-1 pt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {unit.creator_name}
                      </span>
                      {unit.created_by === user?.id && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions — hanya untuk admin/manager */}
                {isAdminOrManager && (
                  <div className="flex justify-end mt-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(unit)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteConfirm(unit)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Unit' : 'Add New Unit'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                  required
                  placeholder="e.g. A-101"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    {unitStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (Rp)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Downtown"
                />
              </div>
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
            <AlertDialogTitle>Hapus Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Unit <strong>{deleteTarget?.name}</strong> (
              {deleteTarget?.code}) akan dipindahkan ke recycle bin.
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
