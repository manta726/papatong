'use client';

import { useAuth } from '@/lib/supabase/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, Shield, Building, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : '??';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const createdDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.email?.split('@')[0] ?? 'User'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-2">Active</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">{createdDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-sm font-mono text-muted-foreground truncate max-w-xs">{user?.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Workspace details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input defaultValue="Papatong CRM" readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input defaultValue="Real Estate / Property" readOnly className="bg-muted/50" />
          </div>
          <p className="text-xs text-muted-foreground">Organization settings are managed at the workspace level.</p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Session</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
