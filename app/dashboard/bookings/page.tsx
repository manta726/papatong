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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, CalendarCheck, Loader2 } from 'lucide-react';

type LeadOption = { id: string; name: string };
type UnitOption = { id: string; name: string; code: string };

const bookingStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

type FormData = {
  lead_id: string;
  unit_id: string;
  booking_date: string;
  status: string;
  amount: string;
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ lead_id: '', unit_id: '', booking_date: '', status: 'pending', amount: '' });
  const [saving, setSaving] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('*, leads(*), units(*)')
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error } = await query;

    if (error) {
      toast({ title: 'Failed to load bookings', description: error.message, variant: 'destructive' });
    } else {
      setBookings(data ?? []);
    }
    setLoading(false);
  }, [statusFilter, toast, user]);

  useEffect(() => {
    if (!authLoading && !user) return;

    fetchBookings();

    if (user) {
      supabase
        .from('leads')
        .select('id, name')
        .eq('user_id', user.id)
        .then(({ data }) => setLeads(data ?? []));

      supabase
        .from('units')
        .select('id, name, code')
        .eq('user_id', user.id)
        .then(({ data }) => setUnits(data ?? []));
    }
  }, [fetchBookings, authLoading, user]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.leads?.name?.toLowerCase().includes(q) ||
      b.units?.name?.toLowerCase().includes(q) ||
      b.units?.code?.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setForm({ lead_id: '', unit_id: '', booking_date: new Date().toISOString().split('T')[0], status: 'pending', amount: '' });
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
    });
    setEditingId(b.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const payload = {
      user_id: user.id,
      lead_id: form.lead_id || null,
      unit_id: form.unit_id || null,
      booking_date: form.booking_date,
      status: form.status,
      amount: Number(form.amount) || 0,
    };

    if (editingId) {
      const { error } = await supabase
        .from('bookings')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user.id);

      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Booking updated' });
        setDialogOpen(false);
        fetchBookings();
      }
    } else {
      const { error } = await supabase.from('bookings').insert(payload);

      if (error) {
        toast({ title: 'Create failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Booking created' });
        setDialogOpen(false);
        fetchBookings();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } else {
      toast({ title: 'Booking deleted' });
      fetchBookings();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage reservations and confirmed bookings</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Booking</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by lead or unit..."
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

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No bookings found. Add one to get started.</p>
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
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{b.leads?.name ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {b.units ? `${b.units.name} (${b.units.code})` : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(b.booking_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(b.amount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(b)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(b.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Booking' : 'Add New Booking'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
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
                  onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
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
    </div>
  );
}
