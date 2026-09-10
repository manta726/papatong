// app/register/page.tsx - COMPLETE FIXED VERSION WITH BETTER PROTECTION
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Shield, UserPlus, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCreateUserPage() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'sales' as const,
    position: '',
    department: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && mounted && !accessChecked) {
      console.log('🔍 Access Check:', { user: !!user, profile, isAdmin, authLoading });
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login first to access admin panel',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }
      
      // Wait a moment for profile to load if user exists but profile is still loading
      if (user && !profile && !authLoading) {
        console.log('⏳ Waiting for profile to load...');
        setTimeout(() => {
          if (!profile) {
            console.log('❌ Profile failed to load, treating as non-admin');
            toast({
              title: 'Access Denied',
              description: 'Unable to verify admin privileges. Please contact system administrator.',
              variant: 'destructive',
            });
            router.push('/dashboard');
          }
        }, 3000); // Wait 3 seconds for profile to load
        return;
      }
      
      // Check admin access
      if (user && profile && !isAdmin) {
        console.log('❌ User is not admin:', { role: profile.role, isActive: profile.is_active });
        toast({
          title: 'Access Denied',
          description: 'Only administrators can access this page',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      if (user && profile && isAdmin) {
        console.log('✅ Admin access granted');
        setAccessChecked(true);
      }
    }
  }, [user, profile, isAdmin, authLoading, mounted, router, toast, accessChecked]);

  // Show loading screen while checking access
  if (!mounted || authLoading || !accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <Shield className="w-6 h-6 text-blue-600 absolute inset-0 m-auto" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Verifying Access</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {!mounted ? 'Loading application...' :
               authLoading ? 'Checking authentication...' :
               !user ? 'Redirecting to login...' :
               !profile ? 'Loading profile...' :
               'Verifying admin privileges...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not admin (should be redirected by useEffect)
  if (!user || !profile || !isAdmin) {
    return null;
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
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

    if (!form.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter the user name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Creating user with email:', form.email);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', form.email)
        .single();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true,
      });

      if (authError) {
        console.error('❌ Auth creation error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: form.email,
          name: form.name,
          phone: form.phone || null,
          role: form.role,
          position: form.position || null,
          department: form.department || null,
          created_by: user.id,
          is_active: true,
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        
        // Rollback: delete auth user if profile creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('🔄 Rolled back auth user creation');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }
        
        throw profileError;
      }

      console.log('✅ User profile created successfully');

      toast({
        title: '🎉 User created successfully',
        description: `${form.name} has been added to the system and can now sign in`,
      });

      // Reset form
      setForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'sales',
        position: '',
        department: '',
      });

    } catch (error: any) {
      console.error('❌ User creation failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error.message?.includes('already exists')) {
        errorMessage = 'A user with this email already exists';
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'Please provide a valid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Failed to create user',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Create New User
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new team member to the system
            </p>
          </div>
        </div>

        {/* Admin Status */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-blue-800 dark:text-blue-200">Admin Panel</strong>
                <span className="text-blue-700 dark:text-blue-300 ml-2">
                  • Logged in as {profile.name} • Administrator
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Create User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-6">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="user@company.com"
                      required
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone number"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Role & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={form.role} 
                    onValueChange={(v) => setForm({ ...form, role: v as any })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">👑 Admin</SelectItem>
                      <SelectItem value="manager">🎯 Manager</SelectItem>
                      <SelectItem value="sales">💼 Sales</SelectItem>
                      <SelectItem value="support">🎧 Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    placeholder="e.g. Senior Sales Executive"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Sales, Marketing, Operations"
                  disabled={loading}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Creating User...' : 'Create User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> The new user will be able to sign in immediately with the email and password you provide. 
            They can change their password after first login.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
