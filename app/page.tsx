'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Building2, BarChart3, Users, CheckCircle } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, don't render anything (redirect happens above)
  if (user) {
    return null;
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg">Papatong CRM</span>
          </div>
          <Button onClick={() => router.push('/login')} variant="default" size="sm">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <span className="text-sm font-medium">Modern CRM Solution</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Real Estate Marketing
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Management Made Simple
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamline your real estate operations. Manage leads, bookings, units, and tasks all in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              onClick={() => router.push('/login')} 
              size="lg"
              className="gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => router.push('/login')} 
              variant="outline" 
              size="lg"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: Users,
              title: "Lead Management",
              description: "Track and manage all your leads in one centralized location with status tracking."
            },
            {
              icon: Building2,
              title: "Unit Management",
              description: "Keep detailed records of all your properties and their availability status."
            },
            {
              icon: BarChart3,
              title: "Analytics & Reports",
              description: "Get insights into your sales pipeline with comprehensive analytics and reports."
            },
            {
              icon: CheckCircle,
              title: "Task Management",
              description: "Stay organized with task tracking and priority management features."
            },
            {
              icon: BarChart3,
              title: "Booking System",
              description: "Manage bookings and monitor revenue from one intuitive dashboard."
            },
            {
              icon: BarChart3,
              title: "Expense Tracking",
              description: "Track all expenses and monitor your operational costs effectively."
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-lg border border-border/50 bg-card hover:border-primary/20 transition-colors">
              <feature.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to transform your operations?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of real estate professionals using Papatong CRM to streamline their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              onClick={() => router.push('/login')} 
              size="lg"
              className="gap-2"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 Papatong CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
