'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { useToast } from '@/hooks/use-toast';
import { supabase, Lead, Unit, Booking, Expense } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ArrowUp, TrendingUp, Users, Building2, Wallet,
  LogOut, Loader2, AlertCircle, ArrowRight,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type DashboardStats = {
  leads: Lead[];
  units: Unit[];
  bookings: Booking[];
  expenses: Expense[];
};

export default function HomePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    leads: [],
    units: [],
    bookings: [],
    expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      // Jika sudah login, redirect ke dashboard
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Load stats untuk unauthenticated users (demo data)
  useEffect(() => {
    if (user) return; // Skip jika sudah login

    const fetchStats = async () => {
      try {
        setError(null);
        setLoading(true);

        // Demo data untuk public homepage
        // Bisa diambil dari public schema atau hardcoded
        setStats({
          leads: [],
          units: [],
          bookings: [],
          expenses: [],
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Jika user sudah authenticated, loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Jika user sudah authenticated, redirect ke dashboard
  if (user) {
    return null; // Router akan handle redirect
  }

  // PUBLIC PAGE - Untuk unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="font-bold text-lg hidden sm:inline">Papatong CRM</span>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Kelola <span className="text-primary">Marketing</span> dengan Lebih Efisien
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Platform CRM modern untuk mengelola leads, bookings, dan operasional marketing properti Anda dengan mudah.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Mulai Gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Login Sekarang</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Fitur Unggulan</h2>
          <p className="text-muted-foreground">Semua yang Anda butuhkan untuk mengelola marketing properti</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-border/50">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>Kelola prospek dengan sistem scoring otomatis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Lead scoring HOT/WARM/COLD</p>
              <p>✓ Tracking follow-up otomatis</p>
              <p>✓ Multi-channel integration</p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-border/50">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Unit Management</CardTitle>
              <CardDescription>Kelola inventori properti secara real-time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Tracking unit tersedia</p>
              <p>✓ Status update instant</p>
              <p>✓ Detailed information</p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="hover:shadow-md transition-shadow duration-200 border-border/50">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>Dapatkan insights dengan dashboard analytics lengkap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Real-time dashboard</p>
              <p>✓ Performance metrics</p>
              <p>✓ Custom reports</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">1000+</p>
                <p className="text-sm text-muted-foreground mt-2">Leads Dikelola</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground mt-2">Unit Terjual</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground mt-2">Team Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">99%</p>
                <p className="text-sm text-muted-foreground mt-2">Uptime</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className={cn(
          'border-border/50',
          'bg-gradient-to-r from-primary/5 via-primary/2 to-primary/5'
        )}>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Siap Mulai?</h2>
                <p className="text-muted-foreground">Daftar sekarang dan dapatkan akses gratis selama 14 hari</p>
              </div>
              <Button asChild size="lg">
                <Link href="/register">
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Papatong CRM. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
