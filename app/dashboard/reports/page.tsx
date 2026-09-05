'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase, Lead, Booking, Unit, Task, Expense } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Users, CalendarCheck, Building2, Wallet, TrendingUp, Target, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

type ReportData = {
  leads: Lead[];
  bookings: Booking[];
  units: Unit[];
  tasks: Task[];
  expenses: Expense[];
};

const pieColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData>({
    leads: [],
    bookings: [],
    units: [],
    tasks: [],
    expenses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (!user) return;

      const [leads, bookings, units, tasks, expenses] = await Promise.all([
        supabase.from('leads').select('*').eq('user_id', user.id),
        supabase.from('bookings').select('*').eq('user_id', user.id),
        supabase.from('units').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
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
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = data.bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + Number(b.amount), 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const conversionRate =
    data.leads.length > 0
      ? ((data.leads.filter((l) => l.status === 'converted').length / data.leads.length) * 100).toFixed(1)
      : '0';
  const avgBookingValue =
    data.bookings.length > 0
      ? totalRevenue / data.bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length
      : 0;

  // Conversion funnel
  const funnelData = [
    { stage: 'New', count: data.leads.filter((l) => l.status === 'new').length },
    { stage: 'Contacted', count: data.leads.filter((l) => l.status === 'contacted').length },
    { stage: 'Qualified', count: data.leads.filter((l) => l.status === 'qualified').length },
    { stage: 'Converted', count: data.leads.filter((l) => l.status === 'converted').length },
  ];

  // Expense by category
  const categoryCounts = data.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // Unit status distribution
  const unitStatusData = data.units.reduce((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const unitStatusChart = Object.entries(unitStatusData).map(([name, value]) => ({ name, value }));

  // Monthly trend (12 months)
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      label: d.toLocaleString('default', { month: 'short' }),
      month: d.getMonth(),
      year: d.getFullYear(),
    };
  });
  const monthlyData = months.map((m) => {
    const leads = data.leads.filter((l) => {
      const d = new Date(l.created_at);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    }).length;
    const bookings = data.bookings.filter((b) => {
      const d = new Date(b.booking_date);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    }).length;
    return { month: m.label, leads, bookings };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Comprehensive view of your marketing performance
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Revenue"
          value={totalRevenue}
          icon={TrendingUp}
          accent="success"
          isCurrency={true}
        />
        <StatsCard
          label="Total Expenses"
          value={totalExpenses}
          icon={Wallet}
          accent="destructive"
          isCurrency={true}
        />
        <StatsCard
          label="Net Profit"
          value={netProfit}
          icon={Target}
          accent={netProfit >= 0 ? 'success' : 'destructive'}
          isCurrency={true}
        />
        <StatsCard label="Conversion Rate" value={`${conversionRate}%`} icon={Users} accent="primary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Leads" value={data.leads.length} icon={Users} accent="primary" />
        <StatsCard
          label="Total Bookings"
          value={data.bookings.length}
          icon={CalendarCheck}
          accent="success"
        />
        <StatsCard label="Total Units" value={data.units.length} icon={Building2} accent="warning" />
        <StatsCard
          label="Avg Booking Value"
          value={avgBookingValue}
          icon={TrendingUp}
          accent="primary"
          isCurrency={true}
        />
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <CardTitle>Leads & Bookings Trend</CardTitle>
          <CardDescription>Monthly comparison over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="bookings" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conversion funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion Funnel</CardTitle>
            <CardDescription>Pipeline stages breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.every((d) => d.count === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-12">No lead data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <YAxis
                    dataKey="stage"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Marketing budget allocation</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No expense data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                  >
                    {categoryData.map((_, i) => (
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
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unit status */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Inventory Status</CardTitle>
          <CardDescription>Current distribution of unit statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {unitStatusChart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No unit data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={unitStatusChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  className="capitalize"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} name="Units" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
