// app/dashboard/leads/page.tsx - FIXED
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  Lead,
  getAllLeads,
  createLead,
  updateLead,
  deleteLead,
} from '@/lib/supabase/client';
import { formatRupiah, formatRupiahInput, parseBudget } from '@/lib/format';
import { StatusBadge } from '@/components/leads/status-badge';
import { LeadGradeBadge } from '@/components/leads/lead-grade-badge';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Users,
  Loader2,
  User,
} from 'lucide-react';
import Link from 'next/link';

const leadSources = [
  'website',
  'referral',
  'social',
  'walk-in',
  'advertisement',
  'other',
];
const leadStatuses = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  unit_interest: string;
  budget: string;
  notes: string;
};

const emptyForm: FormData = {
  name: '',
  email: '',
  phone: '',
  source: 'website',
  status: 'new',
  unit_interest: '',
  budget: '',
  notes: '',
};

export const dynamic = 'force-dynamic';

export default function LeadsPage() {
  const { user, profile } = useAuth(); // ✅ ambil profile untuk role check
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // ✅ Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ Role checks
  const isAdminOrManager =
    profile?.role === 'admin' || profile?.role === 'manager';

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const filters =
        statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await getAllLeads(filters);
      setLeads(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load leads';
      toast({
        title: 'Failed to load leads',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // ============================================
  // FILTER
  // ============================================

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.phone?.toLowerCase().includes(q) ||
      lead.source.toLowerCase().includes(q) ||
      lead.creator_name?.toLowerCase().includes(q)
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

  const openEdit = (lead: Lead) => {
    setForm({
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      source: lead.source,
      status: lead.status,
      unit_interest: lead.unit_interest ?? '',
      budget: lead.budget ? lead.budget.toString() : '',
      notes: lead.notes ?? '',
    });
    setEditingId(lead.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      ...form,
      budget: parseBudget(form.budget),
    };

    try {
      if (editingId) {
        await updateLead(editingId, payload);
        toast({ title: '✅ Lead updated successfully' });
      } else {
        await createLead(payload);
        toast({ title: '✅ Lead created successfully' });
      }
      setDialogOpen(false);
      fetchLeads();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Operation failed';
      toast({
        title: editingId ? 'Update failed' : 'Create failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // HANDLERS: DELETE (dengan konfirmasi)
  // ============================================

  // Step 1: buka dialog konfirmasi
  const openDeleteConfirm = (lead: Lead) => {
    setDeleteTarget(lead);
  };

  // Step 2: eksekusi delete setelah konfirmasi
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      // ✅ FIX: deleteLead sekarang return SoftDeleteResult
      await deleteLead(deleteTarget.id);
      toast({
        title: '🗑️ Lead deleted',
        description: `"${deleteTarget.name}" dipindahkan ke recycle bin`,
      });
      setDeleteTarget(null);
      fetchLeads();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Delete failed';
      toast({
        title: 'Delete failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Cek apakah user boleh edit lead tertentu
  const canEditLead = (lead: Lead) =>
    lead.created_by === user?.id ||
    lead.user_id === user?.id ||
    lead.assigned_to === user?.id ||
    isAdminOrManager;

  // ✅ Cek apakah user boleh delete lead tertentu
  const canDeleteLead = (lead: Lead) =>
    lead.created_by === user?.id ||
    lead.user_id === user?.id ||
    profile?.role === 'admin';

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all leads collaboratively ({leads.length} total)
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, creator..."
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
            {leadStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No leads found. Add your first lead to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Contact
                    </TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Grade
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Created By
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Budget
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {lead.name}
                        </Link>
                        {lead.unit_interest && (
                          <p className="text-xs text-muted-foreground">
                            {lead.unit_interest}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {lead.email && <p>{lead.email}</p>}
                          {lead.phone && (
                            <p className="text-muted-foreground">
                              {lead.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="capitalize text-sm">
                        {lead.source}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <LeadGradeBadge grade={lead.lead_grade} />
                      </TableCell>

                      {/* Created By */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-sm">
                            {lead.creator_name || 'Unknown'}
                          </span>
                          {lead.created_by === user?.id && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-sm font-medium">
                        {formatRupiah(lead.budget)}
                      </TableCell>

                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString(
                          'id-ID'
                        )}
                      </TableCell>

                      {/* Actions Dropdown */}
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
                            {/* View — semua user */}
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/leads/${lead.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>

                            {/* Edit — hanya jika canEditLead */}
                            {canEditLead(lead) && (
                              <DropdownMenuItem
                                onClick={() => openEdit(lead)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}

                            {/* Delete — hanya jika canDeleteLead */}
                            {canDeleteLead(lead) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    openDeleteConfirm(lead)
                                  }
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Lead' : 'Add New Lead'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) =>
                    setForm({ ...form, source: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatuses.map((s) => (
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
                <Label htmlFor="unit_interest">Unit Interest</Label>
                <Input
                  id="unit_interest"
                  value={form.unit_interest}
                  onChange={(e) =>
                    setForm({ ...form, unit_interest: e.target.value })
                  }
                  placeholder="e.g. 2BR unit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  value={formatRupiahInput(form.budget)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setForm({ ...form, budget: raw });
                  }}
                  placeholder="Rp 0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
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

      {/* ✅ Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Lead <strong>{deleteTarget?.name}</strong> akan
              dipindahkan ke recycle bin. Admin/manager dapat
              merestore data ini jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Batal
            </AlertDialogCancel>
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
