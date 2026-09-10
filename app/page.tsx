// app/dashboard/page.tsx - COMPLETE VERSION WITH ADMIN PANEL
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { useToast } from '@/hooks/use-toast';
import { supabase, Lead, Booking, Unit, Task, Expense } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Users, CalendarCheck, Building2, CheckSquare, Wallet, TrendingUp, Loader2, AlertCircle,
  Crown, UserPlus, Shield, Settings
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

type DashboardData = {
  leads: Lead[];
  bookings: Booking[];
  units: Unit[];
  tasks: Task[];
  expenses: Expense[];
};

// Debug Auth Component (TEMPORARY - Remove after testing)
function DebugAuth() {
  const { user, profile, isAdmin, loading } = useAuth();

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-yellow-800 dark:text-yellow-200">
          🐛 Auth Debug Info (Remove after testing)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <p><strong>Loading:</strong> {loading ? 'YES' : 'NO'}</p>
        <p><strong>User ID:</strong> {user?.id || 'NULL'}</p>
        <p><strong>User Email:</strong> {user?.email || 'NULL'}</p>
        <p><strong>Profile:</strong> {profile ? 'LOADED' : 'NULL'}</p>
        <p><strong>Profile Name:</strong> {profile?.name || 'NULL'}</p>
        <p><strong>Profile Role:</strong> {profile?.role || 'NULL'}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? 'YES' : 'NO'}</p>
        <p><strong>Profile Active:</strong> {profile?.is_active ? 'YES' : 'NO'}</p>
      </CardContent>
    </Card>
  );
}

// Admin Panel Component
function AdminPanel() {
  const { profile, isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Crown className="w-5 h-5" />
          Admin Panel
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-300">
          Welcome back, {profile?.name} • Administrator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button asChild variant="outline" className="justify-start h-10 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950">
            <Link href="/register">
              <UserPlus className="w-4 h-4 mr-2" />
              Create New User
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-10 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950">
            <Link href="/dashboard/users">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-10 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950">
            <Link href="/dashboard/settings">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<DashboardData>({
    leads: [],
    bookings: [],
    units: [],
    tasks: [],
    expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        setError(null);
        setLoading(true);

        const userId = user.id;

        const [leadsRes, bookingsRes, unitsRes, tasksRes, expensesRes] = await Promise.all([
          supabase.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
          supabase.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
          supabase.from('units').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
          supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
          supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(100),
        ]);

        if (leadsRes.error) throw new Error(`Leads: ${leadsRes.error.message}`);
        if (bookingsRes.error) throw new Error(`Bookings: ${bookingsRes.error.message}`);
        if (unitsRes.error) throw new Error(`Units: ${unitsRes.error.message}`);
        if (tasksRes.error) throw new Error(`Tasks: ${tasksRes.error.message}`);
        if (expensesRes.error) throw new Error(`Expenses: ${expensesRes.error.message}`);

        setData({
          leads: leadsRes.data ?? [],
          bookings: bookingsRes.data ?? [],
          units: unitsRes.data ?? [],
          tasks: tasksRes.data ?? [],
          expenses: expensesRes.data ?? [],
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(message);
        toast({ title: 'Error loading data', description: message, variant: 'destructive' });
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, toast]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Metrics
  const totalRevenue = data.bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const totalExpenses = data.expenses
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const newLeads = data.leads.filter((l) => l.status === 'new').length;
  const qualifiedLeads = data.leads.filter((l) => l.status === 'qualified' || l.status === 'converted').length;
  const pendingTasks = data.tasks.filter((t) => t.status !== 'done').length;
  const availableUnits = data.units.filter((u) => u.status === 'available').length;

  // Lead source distribution
  const sourceCounts = data.leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

  const pieColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  // Lead status distribution
  const statusCounts = data.leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Revenue vs Expenses trend (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      monthIdx: d.getMonth(),
    };
  });

  const trendData = months.map((m) => {
    const monthRevenue = data.bookings
      .filter((b) => {
        const bd = new Date(b.booking_date);
        return (
          bd.getMonth() === m.monthIdx &&
          bd.getFullYear() === m.year &&
          (b.status === 'confirmed' || b.status === 'completed')
        );
      })
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const monthExpenses = data.expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() === m.monthIdx && ed.getFullYear() === m.year;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return { month: m.month, revenue: monthRevenue, expenses: monthExpenses };
  });

  // YAxis formatter
  const yAxisFormatter = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor your marketing operations at a glance
        </p>
      </div>

      {/* DEBUG COMPONENT - Remove after testing */}
      <DebugAuth />

      {/* ADMIN PANEL - Shows only for admins */}
      <AdminPanel />

      {/* Error Alert */}
      {error && (
        <Card className={cn(
          'border-destructive bg-destructive/5',
          'animate-slide-up'
        )}>
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error loading data</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 h-[110px] bg-muted/30 rounded-lg" />
              </Card>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 h-[110px] bg-muted/30 rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className={cn(
            'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
            'animate-fade-in'
          )}>
            <StatsCard
              label="Total Leads"
              value={data.leads.length}
              icon={Users}
              accent="primary"
              trend={`${newLeads} new, ${qualifiedLeads} qualified`}
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
              trend={`${data.units.length} total units`}
            />
            <StatsCard
              label="Pending Tasks"
              value={pendingTasks}
              icon={CheckSquare}
              accent="destructive"
              trend={`${data.tasks.filter((t) => t.status === 'done').length} completed`}
            />
          </div>

          {/* Revenue & Expenses */}
          <div className={cn(
            'grid gap-4 sm:grid-cols-2',
            'animate-fade-in'
          )}>
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

          {/* Charts */}
          <div className={cn(
            'grid gap-4 lg:grid-cols-2',
            'animate-fade-in'
          )}>
            {/* Revenue vs Expenses Area Chart */}
            <Card className="lg:col-span-2 hover:shadow-md transition-shadow duration-200 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Tren 6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.every((d) => d.revenue === 0 && d.expenses === 0) ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
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
                        formatter={(value: number) => [formatCurrency(value), '']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        fill="url(#colorExpenses)"
                        name="Expenses"
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Lead Sources Pie Chart */}
            <Card className="hover:shadow-md transition-shadow duration-200 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle>Lead Sources</CardTitle>
                <CardDescription>Where your leads come from</CardDescription>
              </CardHeader>
              <CardContent>
                {sourceData.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <p className="text-sm text-muted-foreground">No leads yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {sourceData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Lead Status Bar Chart */}
            <Card className="hover:shadow-md transition-shadow duration-200 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle>Lead Status Breakdown</CardTitle>
                <CardDescription>Pipeline distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <p className="text-sm text-muted-foreground">No leads yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--chart-1))"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className={cn(
            'grid gap-4 lg:grid-cols-2',
            'animate-fade-in'
          )}>
            <Card className="hover:shadow-md transition-shadow duration-200 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle>Recent Leads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 p-0">
                {data.leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No leads yet</p>
                ) : (
                  data.leads.slice(0, 5).map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/dashboard/leads/${lead.id}`}
                      className={cn(
                        'flex items-center justify-between px-6 py-3',
                        'border-b border-border last:border-0',
                        'hover:bg-accent transition-colors cursor-pointer group'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.source} • {lead.status}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                        {new Date(lead.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-200 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle>Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 p-0">
                {data.tasks.filter((t) => t.status !== 'done').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No pending tasks</p>
                ) : (
                  data.tasks
                    .filter((t) => t.status !== 'done')
                    .slice(0, 5)
                    .map((task) => (
                      <Link
                        key={task.id}
                        href={`/dashboard/tasks/${task.id}`}
                        className={cn(
                          'flex items-center justify-between px-6 py-3',
                          'border-b border-border last:border-0',
                          'hover:bg-accent transition-colors cursor-pointer group'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {task.priority} priority • {task.status.replace('_', ' ')}
                          </p>
                        </div>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
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
