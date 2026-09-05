'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase, Expense } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, MoreHorizontal, Pencil, Trash2,
  Wallet, Loader2, TrendingDown, PiggyBank,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const categories = ['advertising', 'events', 'materials', 'digital', 'salaries', 'other'];

type FormData = {
  title: string;
  description: string;
  category: string;
  amount: string;
  date: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  category: 'other',
  amount: '',
  date: new Date().toISOString().split('T')[0],
};

const categoryColors: Record<string, string> = {
  advertising: 'hsl(var(--chart-1))',
  events: 'hsl(var(--chart-2))',
  materials: 'hsl(var(--chart-3))',
  digital: 'hsl(var(--chart-4))',
  salaries: 'hsl(var(--chart-5))',
  other: 'hsl(var(--muted-foreground))',
};

// YAxis formatter singkat agar tidak terlalu panjang
const yAxisFormatter = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchExpenses = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);

    const { data, error } = await query;

    if (error) {
      toast({ title: 'Failed to load expenses', description: error.message, variant: 'destructive' });
    } else {
      setExpenses(data ?? []);
    }
    setLoading(false);
  }, [categoryFilter, toast, user]);

  useEffect(() => {
    if (!authLoading && !user) return;
    fetchExpenses();
  }, [fetchExpenses, authLoading, user]);

  // Metrics
  const totalSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const thisMonth = new Date();
  const monthSpend = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return (
        d.getMonth() === thisMonth.getMonth() &&
        d.getFullYear() === thisMonth.getFullYear()
      );
    })
    .reduce((s, e) => s + Number(e.amount), 0);

  const avgSpend = expenses.length > 0 ? totalSpend / expenses.length : 0;

  const categoryTotals = categories
    .map((cat) => ({
      name: cat,
      amount: expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + Number(e.amount), 0),
    }))
    .filter((c) => c.amount > 0);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setForm({
      title: e.title,
      description: e.description ?? '',
      category: e.category,
      amount: String(e.amount),
      date: e.date,
    });
    setEditingId(e.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const payload = {
      ...form,
      user_id: user.id,
      amount: Number(form.amount) || 0,
      date: form.date,
    };

    if (editingId) {
      const { error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user.id);

      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Expense updated' });
        setDialogOpen(false);
        fetchExpenses();
      }
    } else {
      const { error } = await supabase.from('expenses').insert(payload);

      if (error) {
        toast({ title: 'Create failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Expense added' });
        setDialogOpen(false);
        fetchExpenses();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } else {
      toast({ title: 'Expense deleted' });
      fetchExpenses();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budget & Expenses</h2>
          <p className="text-muted-foreground text-sm mt-1">Track your marketing spend</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Spend"
          value={totalSpend}
          icon={Wallet}
          accent="destructive"
          isCurrency
        />
        <StatsCard
          label="This Month"
          value={monthSpend}
          icon={TrendingDown}
          accent="warning"
          isCurrency
        />
        <StatsCard
          label="Avg per Entry"
          value={avgSpend}
          icon={PiggyBank}
          accent="primary"
          isCurrency
        />
      </div>

      {/* Chart */}
      {categoryTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
            <CardDescription>Breakdown of expenses per category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  className="capitalize"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={yAxisFormatter}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Jumlah']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {categoryTotals.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={categoryColors[entry.name] ?? 'hsl(var(--muted-foreground))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No expenses found. Add one to start tracking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/50">
                      <TableCell>
                        <p className="font-medium">{e.title}</p>
                        {e.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {e.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">{e.category}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(e.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(e.amount))}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(e)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(e.id)}
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

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (Rp) *</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
