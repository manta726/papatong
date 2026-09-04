'use client';

import { useAuth } from '@/lib/supabase/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Calendar,
  Shield,
  Building,
  User as UserIcon,
  LogOut,
  Lock,
  Bell,
  Palette,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const initials = user?.email ? user.email.split('@')[0].slice(0, 2).toUpperCase() : '??';

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{user?.email?.split('@')[0] ?? 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    Active
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Account Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Account Details</h3>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium">{createdDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="text-sm font-mono text-muted-foreground truncate max-w-xs">
                      {user?.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Account Status</p>
                    <p className="text-sm font-medium">Active & Verified</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Workspace details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value="Papatong CRM"
                    readOnly
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value="Real Estate / Property Management"
                    readOnly
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value="https://papatong.com"
                    readOnly
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plan</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value="Professional"
                      readOnly
                      className="bg-muted/50"
                    />
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Organization settings are managed at the workspace level. Contact support to make changes to your organization details.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-muted-foreground">active member</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="text-2xl font-bold">250 MB</p>
                  <p className="text-xs text-muted-foreground">of 1 GB used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Lead Updates</p>
                      <p className="text-xs text-muted-foreground">
                        Get notified when new leads are added
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Booking Confirmations</p>
                      <p className="text-xs text-muted-foreground">
                        Receive updates on booking status changes
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Task Reminders</p>
                      <p className="text-xs text-muted-foreground">
                        Get reminded about upcoming tasks
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Weekly Report</p>
                      <p className="text-xs text-muted-foreground">
                        Receive a summary of your weekly activity
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Email Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  You can manage your email notification preferences here. Changes are saved automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Security */}
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Password</p>
                    <p className="text-xs text-muted-foreground">
                      Last changed {createdDate}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Two-Factor Authentication</h3>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Not Enabled
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                      Enhance your account security by enabling two-factor authentication.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Enable 2FA (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Current Session</p>
                  <p className="text-xs text-muted-foreground">
                    Browser • {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Download Your Data
                </Button>
                <p className="text-xs text-muted-foreground px-2">
                  Get a copy of all your data in a portable format
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground px-2">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sign Out Button */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Session</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Version 1.0.0 • Last updated {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
