// app/page.tsx - SIMPLE VERSION WITH BACKGROUND IMAGE
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/home-background.jpg"
          alt="Property background"
          fill
          className="object-cover"
          priority
          quality={75}
        />
        {/* Overlay untuk readability */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar - SIMPLIFIED (Logo only) */}
        <nav className="backdrop-blur-sm bg-white/5 dark:bg-black/10 border-b border-white/10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-start">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Papatong Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white">Papatong Land</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-8 max-w-3xl animate-fade-in">
            {/* Main Tagline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg leading-tight">
                Wujudkan Hunian Impian Mereka
              </h1>
              <p className="text-lg sm:text-xl text-white/90 drop-shadow max-w-2xl mx-auto">
                Buktikan Eksklusif Mewah Hunian Kita
              </p>
            </div>

            {/* CTA Buttons - Centered */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => router.push('/login')}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 backdrop-blur-md bg-white/20 dark:bg-white/10 border-white/40 hover:bg-white/30 text-white hover:text-white shadow-lg"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
