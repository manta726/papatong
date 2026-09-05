'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard, Users, CalendarCheck, Building2,
  CheckSquare, BarChart3, Wallet, Settings, Building,
  Menu, ChevronLeft, ChevronRight,
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

// Hook untuk detect desktop (≥1024px)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isDesktop;
}

// Komponen nav items (dipakai desktop & mobile)
function NavItems({
  collapsed,
  onItemClick,
}: {
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <button
            key={item.href}
            type="button"
            onClick={() => {
              router.push(item.href);
              onItemClick?.();
            }}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-2',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isDesktop = useIsDesktop();

  return (
    <>
      {/* Desktop Sidebar — SELALU render, tapi hidden di mobile */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card shrink-0 transition-all duration-300 h-screen',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-border px-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {/* navigasi via NavItems */}}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shrink-0">
              <Building className="w-5 h-5" />
            </div>
            {!collapsed && <span className="font-bold text-lg truncate">Papatong</span>}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavItems collapsed={collapsed} />
        </nav>

        <div className="border-t border-border p-3 text-center text-xs text-muted-foreground shrink-0">
          {collapsed ? 'v1' : 'v1.0.0'}
        </div>
      </aside>

      {/* Mobile Trigger — HANYA render jika BUKAN desktop (prevent Radix portal di desktop) */}
      {!isDesktop && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden fixed top-3 left-3 z-50 shrink-0 bg-card border border-border shadow-sm"
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-64 p-0">
            <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
                <Building className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">Papatong</span>
            </div>

            <nav className="p-3 space-y-1">
              <NavItems onItemClick={() => setOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
