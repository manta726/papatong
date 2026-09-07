'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Animated property building shapes
function AnimatedPropertyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient sky background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

      {/* Animated building clusters */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f5a962', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#d4956b', stopOpacity: 0.9 }} />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#e8956b', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#c97a5f', stopOpacity: 0.9 }} />
          </linearGradient>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f0a968', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#d98a5f', stopOpacity: 0.9 }} />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="3"
              floodOpacity="0.2"
            />
          </filter>
        </defs>

        {/* Building Group 1 - Left side (animated) */}
        <g className="animate-slide-left opacity-90">
          {/* Main building left */}
          <polygon
            points="100,250 150,180 200,180 250,250 250,500 100,500"
            fill="url(#grad1)"
            filter="url(#shadow)"
          />
          {/* Windows left building */}
          <rect x="120" y="220" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="160" y="220" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="120" y="280" width="20" height="20" fill="#ffd700" opacity="0.7" />
          <rect x="160" y="280" width="20" height="20" fill="#ffd700" opacity="0.7" />
          <rect x="120" y="340" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="160" y="340" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="120" y="400" width="20" height="20" fill="#ffd700" opacity="0.7" />
          <rect x="160" y="400" width="20" height="20" fill="#ffd700" opacity="0.7" />

          {/* Secondary building left */}
          <polygon
            points="280,300 320,230 360,230 400,300 400,500 280,500"
            fill="url(#grad2)"
            filter="url(#shadow)"
          />
          <rect x="300" y="270" width="18" height="18" fill="#fff" opacity="0.6" />
          <rect x="340" y="270" width="18" height="18" fill="#fff" opacity="0.6" />
          <rect x="300" y="340" width="18" height="18" fill="#ffd700" opacity="0.7" />
          <rect x="340" y="340" width="18" height="18" fill="#ffd700" opacity="0.7" />
        </g>

        {/* Building Group 2 - Center (static) */}
        <g className="opacity-85">
          {/* Main center building */}
          <polygon
            points="500,200 560,120 620,120 680,200 680,520 500,520"
            fill="url(#grad3)"
            filter="url(#shadow)"
          />
          {/* Windows center */}
          <rect x="520" y="170" width="25" height="25" fill="#fff" opacity="0.6" />
          <rect x="570" y="170" width="25" height="25" fill="#fff" opacity="0.6" />
          <rect x="520" y="260" width="25" height="25" fill="#ffd700" opacity="0.7" />
          <rect x="570" y="260" width="25" height="25" fill="#ffd700" opacity="0.7" />
          <rect x="520" y="350" width="25" height="25" fill="#fff" opacity="0.6" />
          <rect x="570" y="350" width="25" height="25" fill="#fff" opacity="0.6" />
          <rect x="520" y="440" width="25" height="25" fill="#ffd700" opacity="0.7" />
          <rect x="570" y="440" width="25" height="25" fill="#ffd700" opacity="0.7" />
        </g>

        {/* Building Group 3 - Right side (animated) */}
        <g className="animate-slide-right opacity-90">
          {/* Building right 1 */}
          <polygon
            points="800,280 850,210 900,210 950,280 950,500 800,500"
            fill="url(#grad1)"
            filter="url(#shadow)"
          />
          <rect x="820" y="250" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="860" y="250" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="820" y="320" width="20" height="20" fill="#ffd700" opacity="0.7" />
          <rect x="860" y="320" width="20" height="20" fill="#ffd700" opacity="0.7" />

          {/* Building right 2 */}
          <polygon
            points="1000,250 1050,180 1100,180 1150,250 1150,500 1000,500"
            fill="url(#grad2)"
            filter="url(#shadow)"
          />
          <rect x="1020" y="220" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="1060" y="220" width="20" height="20" fill="#fff" opacity="0.6" />
          <rect x="1020" y="300" width="20" height="20" fill="#ffd700" opacity="0.7" />
          <rect x="1060" y="300" width="20" height="20" fill="#ffd700" opacity="0.7" />
        </g>

        {/* Animated clouds/mist effect */}
        <g className="animate-float opacity-30" style={{ animationDuration: '20s' }}>
          <ellipse cx="200" cy="150" rx="80" ry="40" fill="#fff" />
          <ellipse cx="900" cy="100" rx="100" ry="50" fill="#fff" />
        </g>
      </svg>

      {/* Overlay gradient untuk readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent dark:from-black/60" />
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
      <AnimatedPropertyBackground />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="backdrop-blur-sm bg-white/5 dark:bg-black/10 border-b border-white/10 sticky top-0">
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

        {/* Hero section - MINIMAL */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-2xl animate-fade-in">
            {/* Only title + CTA buttons */}
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground drop-shadow-lg">
              Manage Your Property
            </h1>

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

      {/* CSS Animations */}
      <style>{`
        @keyframes slide-left {
          0% {
            transform: translateX(-50px);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(50px);
            opacity: 0;
          }
        }

        @keyframes slide-right {
          0% {
            transform: translateX(50px);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(-50px);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-slide-left {
          animation: slide-left 15s ease-in-out infinite;
        }

        .animate-slide-right {
          animation: slide-right 15s ease-in-out infinite;
        }

        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
