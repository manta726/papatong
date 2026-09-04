'use client';

import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const initials = user?.email
    ? user.email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : '??';

  return (
    <header className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-base lg:text-lg font-semibold tracking-tight">
          Operational Marketing CRM
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.email?.split('@')[0] ?? 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
