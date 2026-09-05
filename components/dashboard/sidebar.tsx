'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Building2,
  CheckSquare,
  BarChart3,
  Wallet,
  Settings,
  Building,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/dashboard/units', label: 'Units', icon: Building2 },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/budget', label: 'Budget', icon: Wallet },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

// ✅ PASTIKAN ADA export DISINI
export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm shrink-0 transition-all duration-300 relative',
          collapsed ? 'w-[80px]' : 'w-64'
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all">
              <Building className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Papatong
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 shrink-0', collapsed && 'ml-auto')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className={cn('flex flex-col gap-2', collapsed ? 'px-2 py-4' : 'px-3 py-4')}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-3 text-xs text-muted-foreground text-center">
          {!collapsed ? <p>v1.0.0</p> : <p className="text-[10px]">v1</p>}
        </div>
      </aside>

      {/* Mobile Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r border-border">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Papatong</span>
          </div>
          <ScrollArea className="h-[calc(100vh-64px)]">
            <nav className="flex flex-col gap-2 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
