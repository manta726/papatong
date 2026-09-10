// app/dashboard/bookings/page.tsx - COLLABORATIVE FIXED
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase, Booking } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/leads/status-badge';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  CalendarCheck,
  Loader2,
  User,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type LeadOption = { id: string; name: string; created_by: string | null };
type UnitOption = { id: string; name: string; code: string };

const bookingStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

type FormData = {
  lead_id: string;
  unit_id: string;
  booking_date: string;
  status: string;
  amount: string;
  notes: string;
};

const emptyForm: FormData = {
  lead_id: '',
  unit_id: '',
  booking_date: new Date().toISOString().split('T')[0],
  status: 'pending',
  amount: '',
  notes: '',
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function BookingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // ✅ Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ Role checks
  const isAdminOrManager =
    profile?.role === 'admin' || profile?.role === 'manager';

  // ============================================
  // DATA FETCHING - COLLABORATIVE
  // ============================================

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // ✅ FIX: Hapus .eq('user_id') → ambil semua booking tim
    let query = supabase
      .from('bookings')
      .select('*, leads:lead_id(*), units:unit_id(*)')
      .is('deleted_at', null)           // ✅ filter soft delete
      .order('booking_date', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Failed to load bookings',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setBookings(data ?? []);
    }
    setLoading(false);
  }, [statusFilter, toast, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchBookings();

    // ✅ FIX: Load semua leads & units (bukan hanya milik sendiri)
    supabase
      .from('active_leads')       // pakai view, auto filter deleted
      .select('id, name, created_by')
      .order('name')
      .then(({ data }) => setLeads(data ?? []));

    supabase
      .from('units')
      .select('id, name, code')
      .is('deleted_at', null)
      .order('name')
      .then(({ data }) => setUnits(data ?? []));

  }, [fetchBookings, authLoading, user]);

  // ============================================
  // FILTER
  // ============================================

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const lead = b.leads as { name?: string } | null;
    const unit = b.units as { name?: string; code?: string } | null;
    return (
      lead?.name?.toLowerCase().includes(q) ||
      unit?.name?.toLowerCase().includes(q) ||
      unit?.code?.toLowerCase().includes(q) ||
      b.creator_name?.toLowerCase().includes(q)
    );
  });

  // ============================================
  // PERMISSION CHECKS
  // ============================================

  const canEditBooking = (b: Booking) =>
    b.created_by === user?.id ||
    b.user_id === user?.id ||
    isAdminOrManager;

  const canDeleteBooking = (b: Booking) =>
    b.created_by === user?.id ||
    b.user_id === user?.id ||
    profile?.role === 'admin';

  // ============================================
  // HANDLERS: ADD / EDIT
  // ============================================

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (b: Booking) => {
    setForm({
      lead_id: b.lead_id ?? '',
      unit_id: b.unit_id ?? '',
      booking_date: b.booking_date,
      status: b.status,
      amount: String(b.amount),
      notes: b.notes ?? '',
    });
    setEditingId(b.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,              // kolom lama, tetap diisi
      lead_id: form.lead_id || null,
      unit_id: form.unit_id || null,
      booking_date: form.booking_date,
      status: form.status,
      amount: Number(form.amount) || 0,
      notes: form.notes || null,
    };

    try {
      if (editingId) {
        // ✅ FIX: Hapus .eq('user_id') → update bisa dilakukan oleh
        // siapa saja yang punya akses (dicek via RLS policy bookings_update)
        const { error } = await supabase
          .from('bookings')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: '✅ Booking updated' });
      } else {
        const { error } = await supabase
          .from('bookings')
          .insert(payload);

        if (error) throw error;
        toast({ title: '✅ Booking created' });
      }

      setDialogOpen(false);
      fetchBookings();
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

  const openDeleteConfirm = (b: Booking) => setDeleteTarget(b);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      // ✅ FIX: Soft delete via RPC (bukan hard delete)
      const { data, error } = await supabase.rpc('soft_delete', {
        p_table: 'bookings',
        p_id: deleteTarget.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Delete gagal');

      toast({
        title: '🗑️ Booking deleted',
        description: 'Dipindahkan ke recycle bin',
      });
      setDeleteTarget(null);
      fetchBookings();
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
          <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage reservations and confirmed bookings ({bookings.length} total)
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Booking
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by lead, unit, or creator..."
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
            {bookingStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No bookings found. Add one to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead className="hidden md:table-cell">Unit</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    {/* ✅ Kolom Created By */}
                    <TableHead className="hidden lg:table-cell">Created By</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => {
                    const lead = b.leads as { name?: string } | null;
                    const unit = b.units as { name?: string; code?: string } | null;

                    return (
                      <TableRow key={b.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {lead?.name ?? '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {unit
                            ? `${unit.name} (${unit.code})`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(b.booking_date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(b.amount)}
                        </TableCell>
                        {/* ✅ Creator info */}
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-sm">
                              {b.creator_name || 'Unknown'}
                            </span>
                            {b.created_by === user?.id && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditBooking(b) && (
                                <DropdownMenuItem onClick={() => openEdit(b)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteBooking(b) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDeleteConfirm(b)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Booking' : 'Add New Booking'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Lead Select */}
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select
                value={form.lead_id || 'none'}
                onValueChange={(v) =>
                  setForm({ ...form, lead_id: v === 'none' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No lead</span>
                  </SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Select */}
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={form.unit_id || 'none'}
                onValueChange={(v) =>
                  setForm({ ...form, unit_id: v === 'none' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No unit</span>
                  </SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Booking Date *</Label>
                <Input
                  type="date"
                  value={form.booking_date}
                  onChange={(e) =>
                    setForm({ ...form, booking_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (Rp)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
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
                  {bookingStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Optional notes..."
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

      {/* ✅ Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Booking untuk lead{' '}
              <strong>
                {(deleteTarget?.leads as { name?: string } | null)?.name ??
                  '—'}
              </strong>{' '}
              akan dipindahkan ke recycle bin. Admin/manager dapat
              merestore data ini.
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
