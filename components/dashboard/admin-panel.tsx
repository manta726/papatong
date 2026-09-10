// components/dashboard/admin-quick-actions.tsx (New component)
'use client';

import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export function AdminQuickActions() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Admin Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/register">
            <UserPlus className="w-4 h-4 mr-2" />
            Create New User
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/dashboard/users">
            <Users className="w-4 h-4 mr-2" />
            Manage Users
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
