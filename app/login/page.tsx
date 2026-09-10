// app/login/page.tsx - MODERN TAB SYSTEM
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  
  // Separate form states for each tab
  const [userForm, setUserForm] = useState({ email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user && mounted) {
      // Different redirects based on which tab was used
      if (activeTab === 'admin') {
        router.push('/register'); // Admin goes to user management
      } else {
        router.push('/dashboard'); // User goes to dashboard
      }
    }
  }, [user, authLoading, router, mounted, activeTab]);

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

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent, type: 'user' | 'admin') => {
    e.preventDefault();
    
    const form = type === 'admin' ? adminForm : userForm;
    
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setActiveTab(type); // Remember which tab was used
    setLoading(true);
    
    const { error } = await signIn(form.email, form.password);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      const welcomeMessage = type === 'admin' 
        ? 'Welcome Admin! Redirecting to user management...'
        : 'Welcome back! Redirecting to dashboard...';
        
      toast({
        title: 'Success!',
        description: welcomeMessage,
      });
      // Don't set loading to false here, let useEffect handle redirect
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
          <CardHeader className="text-center pb-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Papatong CRM"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Choose your login type to continue
            </p>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="user" className="space-y-4">
              {/* Tab Navigation */}
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User Login
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admin Login
                </TabsTrigger>
              </TabsList>

              {/* User Login Tab */}
              <TabsContent value="user" className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access your dashboard and manage leads
                  </p>
                </div>
                
                <form onSubmit={(e) => handleSubmit(e, 'user')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="Enter your email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        required
                        className="pl-10 h-11"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="user-password"
                        type="password"
                        placeholder="Enter your password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        required
                        className="pl-10 h-11"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-6"
                  >
                    {loading && activeTab === 'user' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In as User
                  </Button>
                </form>
              </TabsContent>

              {/* Admin Login Tab */}
              <TabsContent value="admin" className="space-y-4">
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    Administrator Access
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Manage users and system settings
                  </p>
                </div>
                
                <form onSubmit={(e) => handleSubmit(e, 'admin')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="Enter admin email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        required
                        className="pl-10 h-11"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Admin Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter admin password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        required
                        className="pl-10 h-11"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-6 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading && activeTab === 'admin' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In as Admin
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Papatong CRM © 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
