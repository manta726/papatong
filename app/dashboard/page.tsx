// app/dashboard/page.tsx - REVISED WITH ADMIN CREATE USER
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { useToast } from '@/hooks/use-toast';
import { supabase, Lead, Booking, Unit, Task, Expense } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/currency';
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Users, CalendarCheck, Building2, CheckSquare,
  Wallet, TrendingUp, Loader2, AlertCircle,
  UserPlus, Users2, ArrowRight, Shield,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

// ============================================
// TYPES
// ============================================

type DashboardData = {
  leads:    Lead[];
  bookings: Booking[];
  units:    Unit[];
  tasks:    Task[];
  expenses: Expense[];
};

// ============================================
// ADMIN BAR - Clean & Minimal
// ============================================

function AdminBar() {
  const { profile, isAdmin } = useAuth();
  if (!isAdmin || !profile) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-blue-900 dark:text-blue-100">
          {profile.name}
        </span>
        <Badge
          variant="outline"
          className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30"
        >
          Administrator
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50"
        >
          <Link href="/dashboard/users" className="flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5" />
            Manage Users
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <Button
          asChild
          size="sm"
          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/admin/create-user" className="flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Create User
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

export default function DashboardPage() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<DashboardData>({
    leads: [], bookings: [], units: [], tasks: [], expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // ── Fetch data ──
  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        setError(null);
        setLoading(true);

        const [leadsRes, bookingsRes, unitsRes, tasksRes, expensesRes] =
          await Promise.all([
            supabase
              .from('active_leads')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100),
            supabase
              .from('bookings')
              .select('*')
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(100),
            supabase
              .from('units')
              .select('*')
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(100),
            supabase
              .from('tasks')
              .select('*')
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(100),
            supabase
              .from('expenses')
              .select('*')
              .order('date', { ascending: false })
              .limit(100),
          ]);

        if (leadsRes.error)    throw new Error(`Leads: ${leadsRes.error.message}`);
        if (bookingsRes.error) throw new Error(`Bookings: ${bookingsRes.error.message}`);
        if (unitsRes.error)    throw new Error(`Units: ${unitsRes.error.message}`);
        if (tasksRes.error)    throw new Error(`Tasks: ${tasksRes.error.message}`);
        if (expensesRes.error) throw new Error(`Expenses: ${expensesRes.error.message}`);

        setData({
          leads:    leadsRes.data    ?? [],
          bookings: bookingsRes.data ?? [],
          units:    unitsRes.data    ?? [],
          tasks:    tasksRes.data    ?? [],
          expenses: expensesRes.data ?? [],
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, toast]);

  // ── Loading state ──
  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Metrics ──
  const totalRevenue = data.bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + Number(b.amount || 0), 0);

  const totalExpenses = data.expenses
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const newLeads       = data.leads.filter((l) => l.status === 'new').length;
  const qualifiedLeads = data.leads.filter(
    (l) => l.status === 'qualified' || l.status === 'converted'
  ).length;
  const pendingTasks   = data.tasks.filter((t) => t.status !== 'done').length;
  const availableUnits = data.units.filter((u) => u.status === 'available').length;

  // ── Chart data ──
  const sourceCounts = data.leads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sourceData = Object.entries(sourceCounts).map(
    ([name, value]) => ({ name, value })
  );

  const statusCounts = data.leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusData = Object.entries(statusCounts).map(
    ([name, value]) => ({ name, value })
  );

  const now    = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month:    d.toLocaleString('default', { month: 'short' }),
      year:     d.getFullYear(),
      monthIdx: d.getMonth(),
    };
  });

  const trendData = months.map((m) => {
    const revenue = data.bookings
      .filter((b) => {
        const d = new Date(b.booking_date);
        return (
          d.getMonth()    === m.monthIdx &&
          d.getFullYear() === m.year &&
          (b.status === 'confirmed' || b.status === 'completed')
        );
      })
      .reduce((s, b) => s + Number(b.amount || 0), 0);

    const expenses = data.expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === m.monthIdx && d.getFullYear() === m.year;
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    return { month: m.month, revenue, expenses };
  });

  const pieColors = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))',
    'hsl(var(--chart-3))', 'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const yAxisFormatter = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(0)}M`;
    if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}jt`;
    if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}rb`;
    return String(v);
  };

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '13px',
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back,{' '}
            <span className="font-medium text-foreground">
              {profile?.name ?? user.email}
            </span>
          </p>
        </div>

        {/* ✅ Admin bar - clean & minimal */}
        <AdminBar />
      </div>

      {/* ── Error Alert ── */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 h-[100px]">
                  <div className="animate-pulse bg-muted h-full rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Stats Grid ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Total Leads"
              value={data.leads.length}
              icon={Users}
              accent="primary"
              trend={`${newLeads} new · ${qualifiedLeads} qualified`}
              trendUp
            />
            <StatsCard
              label="Bookings"
              value={data.bookings.length}
              icon={CalendarCheck}
              accent="success"
              trend={`${data.bookings.filter((b) => b.status === 'pending').length} pending`}
            />
            <StatsCard
              label="Available Units"
              value={availableUnits}
              icon={Building2}
              accent="warning"
              trend={`${data.units.length} total`}
            />
            <StatsCard
              label="Pending Tasks"
              value={pendingTasks}
              icon={CheckSquare}
              accent="destructive"
              trend={`${data.tasks.filter((t) => t.status === 'done').length} done`}
            />
          </div>

          {/* ── Revenue & Expenses ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard
              label="Total Revenue"
              value={totalRevenue}
              icon={TrendingUp}
              accent="success"
              isCurrency
            />
            <StatsCard
              label="Total Expenses"
              value={totalExpenses}
              icon={Wallet}
              accent="destructive"
              isCurrency
            />
          </div>

          {/* ── Charts ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Revenue vs Expenses */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
                <CardDescription className="text-xs">
                  Last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.every((d) => d.revenue === 0 && d.expenses === 0) ? (
                  <div className="flex items-center justify-center h-[280px]">
                    <p className="text-sm text-muted-foreground">
                      No data available
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={yAxisFormatter} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), '']} />
                      <Area type="monotone" dataKey="revenue"  stroke="hsl(var(--chart-1))"    strokeWidth={2} fill="url(#gRevenue)"  name="Revenue" />
                      <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#gExpenses)" name="Expenses" />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lead Sources</CardTitle>
                <CardDescription className="text-xs">
                  Where leads come from
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sourceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[230px]">
                    <p className="text-sm text-muted-foreground">No leads yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={75} innerRadius={38}
                      >
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Lead Status */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pipeline Status</CardTitle>
                <CardDescription className="text-xs">
                  Lead status distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length === 0 ? (
                  <div className="flex items-center justify-center h-[230px]">
                    <p className="text-sm text-muted-foreground">No leads yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Recent Activity ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent Leads */}
            <Card className="border-border/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Leads</CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                >
                  <Link href="/dashboard/leads" className="flex items-center gap-1">
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {data.leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No leads yet
                  </p>
                ) : (
                  data.leads.slice(0, 5).map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/dashboard/leads/${lead.id}`}
                      className={cn(
                        'flex items-center justify-between px-5 py-3',
                        'border-b border-border/60 last:border-0',
                        'hover:bg-accent/50 transition-colors group'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {lead.source} · {lead.status}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">
                        {new Date(lead.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="border-border/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Upcoming Tasks</CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                >
                  <Link href="/dashboard/tasks" className="flex items-center gap-1">
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {data.tasks.filter((t) => t.status !== 'done').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No pending tasks
                  </p>
                ) : (
                  data.tasks
                    .filter((t) => t.status !== 'done')
                    .slice(0, 5)
                    .map((task) => (
                      <Link
                        key={task.id}
                        href="/dashboard/tasks"
                        className={cn(
                          'flex items-center justify-between px-5 py-3',
                          'border-b border-border/60 last:border-0',
                          'hover:bg-accent/50 transition-colors group'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {task.priority} · {task.status.replace('_', ' ')}
                          </p>
                        </div>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground ml-4 shrink-0">
                            {new Date(task.due_date).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </Link>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
