'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Unit } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Loader2, MapPin, DollarSign } from 'lucide-react';

const unitTypes = ['studio', '1br', '2br', '3br', 'penthouse', 'commercial', 'other'];
const unitStatuses = ['available', 'reserved', 'sold', 'maintenance'];

type FormData = {
  name: string;
  code: string;
  type: string;
  status: string;
  price: string;
  location: string;
  description: string;
};

const emptyForm: FormData = { name: '', code: '', type: 'studio', status: 'available', price: '', location: '', description: '' };

export default function UnitsPage() {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('units').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error } = await query;
    if (error) toast({ title: 'Failed to load units', description: error.message, variant: 'destructive' });
    else setUnits(data ?? []);
    setLoading(false);
  }, [statusFilter, toast]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const filtered = units.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q) || u.location?.toLowerCase().includes(q) || u.type.toLowerCase().includes(q);
  });

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (u: Unit) => {
    setForm({ name: u.name, code: u.code, type: u.type, status: u.status, price: String(u.price), location: u.location ?? '', description: u.description ?? '' });
    setEditingId(u.id); setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price) || 0 };
    if (editingId) {
      const { error } = await supabase.from('units').update(payload).eq('id', editingId);
      if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Unit updated' }); setDialogOpen(false); fetchUnits(); }
    } else {
      const { error } = await supabase.from('units').insert(payload);
      if (error) toast({ title: 'Create failed', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Unit created' }); setDialogOpen(false); fetchUnits(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', variant: 'destructive' });
    else { toast({ title: 'Unit deleted' }); fetchUnits(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Units</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your property inventory</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Unit</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, code, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {unitStatuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No units found. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((unit) => (
            <Card key={unit.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{unit.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{unit.code}</p>
                  </div>
                  <StatusBadge status={unit.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="capitalize">{unit.type}</span>
                  </div>
                  {unit.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" /> {unit.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-semibold text-base pt-1">
                    <DollarSign className="w-4 h-4 text-success" /> {Number(unit.price).toLocaleString()}
                  </div>
                  {unit.description && (
                    <p className="text-muted-foreground text-xs line-clamp-2 pt-1">{unit.description}</p>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(unit)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(unit.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Unit' : 'Add New Unit'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="e.g. A-101" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{unitTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{unitStatuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Downtown" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
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
