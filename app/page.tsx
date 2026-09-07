'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Animated floating property cluster component
function FloatingCluster() {
  const clusters = [
    {
      id: 1,
      label: 'Houses',
      icon: '🏠',
      delay: '0s',
      duration: '20s',
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: 2,
      label: 'Apartments',
      icon: '🏢',
      delay: '2s',
      duration: '25s',
      color: 'from-cyan-400 to-blue-500',
    },
    {
      id: 3,
      label: 'Commercial',
      icon: '🏬',
      delay: '4s',
      duration: '22s',
      color: 'from-indigo-400 to-purple-600',
    },
    {
      id: 4,
      label: 'Land',
      icon: '📍',
      delay: '1s',
      duration: '24s',
      color: 'from-violet-400 to-purple-600',
    },
    {
      id: 5,
      label: 'Townhouse',
      icon: '🏘️',
      delay: '3s',
      duration: '26s',
      color: 'from-sky-400 to-cyan-500',
    },
    {
      id: 6,
      label: 'Property',
      icon: '🏗️',
      delay: '5s',
      duration: '23s',
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background clouds effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

      {/* Animated clusters */}
      {clusters.map((cluster, index) => (
        <div
          key={cluster.id}
          className="absolute"
          style={{
            animation: `float ${cluster.duration} ease-in-out infinite`,
            animationDelay: cluster.delay,
            left: `${15 + (index % 3) * 30}%`,
            top: `${10 + Math.floor(index / 3) * 40}%`,
          }}
        >
          <div
            className={`
              bg-gradient-to-br ${cluster.color}
              rounded-full shadow-lg
              flex flex-col items-center justify-center
              text-white font-semibold
              hover:scale-110 transition-transform duration-300
              backdrop-blur-sm
            `}
            style={{
              width: '120px',
              height: '120px',
            }}
          >
            <div className="text-4xl mb-2">{cluster.icon}</div>
            <div className="text-xs text-center px-2">{cluster.label}</div>
          </div>
        </div>
      ))}

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm"
          style={{
            width: Math.random() * 40 + 20 + 'px',
            height: Math.random() * 40 + 20 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: Math.random() * 5 + 's',
            opacity: 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user && mounted) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router, mounted]);

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <FloatingCluster />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="backdrop-blur-md bg-white/10 dark:bg-black/10 border-b border-white/20 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="text-xl font-bold text-foreground">Papatong</div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-foreground hover:bg-white/20"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push('/register')}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero section */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-2xl animate-fade-in">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide backdrop-blur-md bg-white/10 dark:bg-white/5 px-4 py-2 rounded-full inline-block">
                Welcome to Papatong CRM
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground drop-shadow-lg">
                Manage Your Property Marketing
              </h1>
              <p className="text-lg text-muted-foreground drop-shadow backdrop-blur-sm">
                Simple, fast, and powerful CRM for property teams
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
                onClick={() => router.push('/register')}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 backdrop-blur-md bg-white/20 dark:bg-white/10 border-white/30 hover:bg-white/30"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}
