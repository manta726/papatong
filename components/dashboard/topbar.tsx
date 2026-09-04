'use client';

import { useAuth } from '@/lib/supabase/auth-context';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { LogOut, User, Settings, Mail, Search, Bell, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function Topbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } finally {
      setSigningOut(false);
    }
  };

  const initials = user?.email
    ? user.email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : '??';

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 bg-muted/50 border-0 placeholder:text-muted-foreground focus-visible:bg-background focus-visible:shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 sm:px-4 hover:bg-accent transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-xs">
                <span className="font-semibold text-foreground">
                  {user?.email?.split('@')[0] ?? 'User'}
                </span>
                <span className="text-muted-foreground">Account</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate text-sm font-normal">{user?.email}</span>
              </div>
              <span className="text-xs text-muted-foreground">Active Account</span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
