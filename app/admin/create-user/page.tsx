'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Shield, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
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
    role: 'sales' as 'admin' | 'manager' | 'sales' | 'support',
    position: '',
    department: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && mounted && !accessChecked) {
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login first',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }
      
      if (user && !profile && !authLoading) {
        setTimeout(() => {
          if (!profile) {
            toast({
              title: 'Access Denied',
              description: 'Unable to verify admin privileges',
              variant: 'destructive',
            });
            router.push('/dashboard');
          }
        }, 3000);
        return;
      }
      
      if (user && profile && !isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'Only administrators can create users',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      if (user && profile && isAdmin) {
        setAccessChecked(true);
      }
    }
  }, [user, profile, isAdmin, authLoading, mounted, router, toast, accessChecked]);

  if (!mounted || authLoading || !accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <Shield className="w-6 h-6 text-primary absolute inset-0 m-auto" />
          </div>
          <div>
            <p className="font-medium text-foreground">Verifying Access</p>
            <p className="text-sm text-muted-foreground mt-1">
              {!mounted ? 'Loading...' :
               authLoading ? 'Checking authentication...' :
               !user ? 'Redirecting...' :
               !profile ? 'Loading profile...' :
               'Verifying admin privileges...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile || !isAdmin) {
    return null;
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
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
      console.log('🔄 Creating user via API:', form.email);

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          role: form.role,
          position: form.position,
          department: form.department,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      console.log('✅ User created successfully:', result.user);

      toast({
        title: 'User Created Successfully',
        description: result.message || `${form.name} can now login with their credentials`,
        duration: 5000,
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

      toast({
        title: 'Failed to Create User',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, password });
    toast({
      title: 'Password Generated',
      description: 'A secure password has been generated',
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        
        {/* ========== HEADER ========== */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              Create New User
            </h1>
            <p className="text-muted-foreground mt-1">
              Add a new team member to the system
            </p>
          </div>
        </div>

        {/* ========== ADMIN STATUS ========== */}
        <Alert className="border-primary/30 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <strong>Admin Panel</strong>
            <span className="text-muted-foreground ml-2">
              • Logged in as {profile.name} • Administrator
            </span>
          </AlertDescription>
        </Alert>

        {/* ========== CREATE USER FORM ========== */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-primary" />
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
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="text"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      disabled={loading}
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

              {/* ========== SUBMIT BUTTONS ========== */}
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
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Creating User...' : 'Create User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ========== HELP TEXT ========== */}
        <Alert className="border-border bg-muted/50">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-muted-foreground">
            <strong className="text-foreground">Note:</strong> The new user will receive login credentials via email and can change their password after first login.
          </AlertDescription>
        </Alert>
        
      </div>
    </div>
  );
}
