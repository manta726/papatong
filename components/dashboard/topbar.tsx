'use client';

import { useAuth } from '@/lib/supabase/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
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
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : '??';

  return (
    <header className={cn(
      'h-16 px-4 sm:px-6 lg:px-8',
      'border-b border-border',
      'bg-card/80 backdrop-blur-md',
      'sticky top-0 z-40',
      'flex items-center justify-between gap-4 shrink-0',
      'shadow-sm',
      'transition-all duration-300'
    )}>
      {/* Search Bar - Hidden on Mobile */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search leads, bookings..."
          className={cn(
            'h-9 px-3 rounded-lg',
            'bg-muted/50 border-0',
            'placeholder:text-muted-foreground',
            'focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary',
            'transition-all duration-200',
            'text-sm'
          )}
        />
      </div>

      {/* Spacer for Mobile */}
      <div className="md:hidden flex-1" aria-hidden="true" />

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative shrink-0',
            'hover:bg-accent transition-colors duration-200',
            'group'
          )}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
          <span className={cn(
            'absolute top-1.5 right-1.5 w-2 h-2',
            'bg-destructive rounded-full',
            'animate-pulse'
          )} />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'flex items-center gap-2 px-2 sm:px-4',
                'hover:bg-accent transition-all duration-200',
                'shrink-0 group',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
            >
              <Avatar className="w-8 h-8 shrink-0 group-hover:ring-2 group-hover:ring-primary transition-all">
                <AvatarFallback className={cn(
                  'bg-gradient-to-br from-primary to-primary/70',
                  'text-primary-foreground text-xs font-bold'
                )}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-xs">
                <span className="font-semibold text-foreground truncate max-w-[100px]">
                  {user?.email?.split('@')[0] ?? 'User'}
                </span>
                <span className="text-muted-foreground">Account</span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className={cn(
              'w-56',
              'bg-card border border-border rounded-lg',
              'shadow-lg',
              'animate-slide-up'
            )}
          >
            <DropdownMenuLabel className="flex flex-col gap-1 px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate text-sm font-normal">{user?.email}</span>
              </div>
              <span className="text-xs text-muted-foreground ml-5">Active Account</span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signingOut}
              className={cn(
                'cursor-pointer',
                'text-destructive',
                'focus:text-destructive focus:bg-destructive/10'
              )}
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
