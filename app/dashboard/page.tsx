'use client';

import { useEffect, useState } from 'react';
import { supabase, Lead, Booking, Unit, Task, Expense } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, CalendarCheck, Building2, CheckSquare, Wallet, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

type DashboardData = {
  leads: Lead[];
  bookings: Booking[];
  units: Unit[];
  tasks: Task[];
  expenses: Expense[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ leads: [], bookings: [], units: [], tasks: [], expenses: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [leads, bookings, units, tasks, expenses] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('units').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('expenses').select('*').order('date', { ascending: false }).limit(50),
      ]);
      setData({
        leads: leads.data ?? [],
        bookings: bookings.data ?? [],
        units: units.data ?? [],
        tasks: tasks.data ?? [],
        expenses: expenses.data ?? [],
      });
      setLoading(false);
    }
    fetchAll();
  }, []);

  const totalRevenue = data.bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
  const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Lead status distribution
  const statusCounts = data.leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Revenue vs expenses trend (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), monthIdx: d.getMonth() };
  });
  const trendData = months.map((m) => {
    const monthRevenue = data.bookings
      .filter((b) => {
        const bd = new Date(b.booking_date);
        return bd.getMonth() === m.monthIdx && bd.getFullYear() === m.year && (b.status === 'confirmed' || b.status === 'completed');
      })
      .reduce((sum, b) => sum + Number(b.amount), 0);
    const monthExpenses = data.expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() === m.monthIdx && ed.getFullYear() === m.year;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { month: m.month, revenue: monthRevenue, expenses: monthExpenses };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-[110px]" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Monitor your marketing operations at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Leads" value={data.leads.length} icon={Users} accent="primary" trend={`${newLeads} new, ${qualifiedLeads} qualified`} trendUp />
        <StatsCard label="Bookings" value={data.bookings.length} icon={CalendarCheck} accent="success" trend={`${data.bookings.filter(b => b.status === 'pending').length} pending`} />
        <StatsCard label="Available Units" value={availableUnits} icon={Building2} accent="warning" trend={`${data.units.length} total units`} />
        <StatsCard label="Pending Tasks" value={pendingTasks} icon={CheckSquare} accent="destructive" trend={`${data.tasks.filter(t => t.status === 'done').length} completed`} />
      </div>

      {/* Revenue & Expenses cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={TrendingUp} accent="success" />
        <StatsCard label="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} icon={Wallet} accent="destructive" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue vs Expenses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
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
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#colorExpenses)" name="Expenses" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where your leads come from</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No leads yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
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

        {/* Lead Status */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Breakdown</CardTitle>
            <CardDescription>Pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No leads yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No leads yet</p>
            ) : (
              data.leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.source} • {lead.status}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.tasks.filter(t => t.status !== 'done').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending tasks</p>
            ) : (
              data.tasks.filter(t => t.status !== 'done').slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{task.priority} priority • {task.status.replace('_', ' ')}</p>
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
