// app/login/page.tsx - COMPLETE WITH ERROR HANDLING
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, profile, loading: authLoading, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);

  // Get error parameters from URL
  const sessionExpired = searchParams.get('session_expired') === 'true';
  const accountInactive = searchParams.get('error') === 'account_inactive';
  const authError = searchParams.get('error');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show error messages from URL parameters
  useEffect(() => {
    if (!mounted) return;

    if (sessionExpired) {
      toast({
        title: 'Session Expired',
        description: 'Your session has expired due to inactivity. Please sign in again.',
        variant: 'destructive',
        duration: 5000,
      });
    }

    if (accountInactive) {
      toast({
        title: 'Account Inactive',
        description: 'Your account has been deactivated. Please contact your administrator.',
        variant: 'destructive',
        duration: 6000,
      });
    }

    // Clear URL parameters after showing message
    if (sessionExpired || authError) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [mounted, sessionExpired, accountInactive, authError, toast]);

  // SMART REDIRECT based on user role
  useEffect(() => {
    if (!authLoading && user && profile && mounted) {
      const welcomeMessage = profile.role === 'admin' 
        ? 'Welcome Administrator!' 
        : `Welcome back, ${profile.name}!`;

      toast({
        title: welcomeMessage,
        description: 'Redirecting to dashboard...',
      });

      router.push('/dashboard');
    }
  }, [user, profile, authLoading, router, mounted, toast]);

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

  if (user) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: 'Password required',
        description: 'Please enter your password',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        // Handle specific error messages
        let errorTitle = 'Sign in failed';
        let errorDescription = error;

        if (error.includes('Invalid login credentials')) {
          errorTitle = 'Invalid credentials';
          errorDescription = 'The email or password you entered is incorrect. Please try again.';
        } else if (error.includes('Email not confirmed')) {
          errorTitle = 'Email not confirmed';
          errorDescription = 'Please check your email and confirm your account.';
        } else if (error.includes('User not found')) {
          errorTitle = 'Account not found';
          errorDescription = 'No account found with this email. Please contact your administrator.';
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: 'destructive',
        });

        setLoading(false);
      }
      // If success, don't set loading to false - let redirect handle it
    } catch (err) {
      console.error('Sign in error:', err);
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-4">
        
        {/* ========== ERROR ALERTS ========== */}
        {sessionExpired && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong className="block mb-1">Session Expired</strong>
              <p className="text-sm">
                Your session has expired due to inactivity. Please sign in again to continue.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {accountInactive && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong className="block mb-1">Account Inactive</strong>
              <p className="text-sm">
                Your account has been deactivated. Please contact your administrator for assistance.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* ========== LOGIN CARD ========== */}
        <Card className="shadow-2xl border border-border">
          <CardHeader className="text-center space-y-6 pb-8">
            
            {/* Logo */}
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="Papatong CRM"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            
            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Welcome to Papatong CRM
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to your account to continue
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* ========== LOGIN FORM ========== */}
            <form onSubmit={handleSignIn} className="space-y-4">
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                    autoComplete="email"
                    autoFocus={!sessionExpired && !accountInactive}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-6 bg-primary hover:bg-primary/90 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* ========== HELP TEXT ========== */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Need an account?{' '}
                <span className="font-medium text-foreground">
                  Contact your administrator
                </span>
              </p>
            </div>
            
            {/* ========== FOOTER ========== */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Papatong CRM © {new Date().getFullYear()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
