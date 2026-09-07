'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

function NavItem({
  item,
  isActive,
  collapsed,
  onItemClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      prefetch={true}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        collapsed && 'justify-center px-2',
        isActive
          ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
          : [
              'text-sidebar-text hover:text-sidebar-text-active',
              'hover:bg-sidebar-hover',
              'dark:text-slate-300 dark:hover:bg-slate-800',
            ]
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function NavItems({
  collapsed,
  pathname,
  onItemClick,
}: {
  collapsed?: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const mainItems = navItems.slice(0, -1); // All except settings
  const settingsItem = navItems.slice(-1); // Only settings

  return (
    <>
      {/* Main Section */}
      <div className="space-y-1">
        {mainItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        ))}
      </div>

      {/* Settings Section */}
      <div className="space-y-1 pt-2 border-t border-sidebar-border">
        {!collapsed && (
          <p className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin
          </p>
        )}
        {settingsItem.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col',
          'border-r border-sidebar-border',
          'bg-card shadow-sidebar',
          'shrink-0 transition-all duration-300',
          'h-screen relative z-10',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'h-16 border-b border-sidebar-border',
          'px-4 flex items-center justify-between shrink-0',
          'bg-gradient-to-r from-card to-card/50',
          'transition-all duration-300'
        )}>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2.5 hover:opacity-80',
              'transition-all duration-200',
              'min-w-0 group rounded-lg hover:bg-accent/50 px-2 py-1'
            )}
          >
            <div className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              'bg-gradient-to-br from-primary to-primary/80',
              'text-primary-foreground shrink-0',
              'group-hover:shadow-md transition-shadow'
            )}>
              <Building className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                Papatong
              </span>
            )}
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 hover:bg-accent transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <NavItems collapsed={collapsed} pathname={pathname} />
        </nav>

        {/* Footer */}
        <div className={cn(
          'border-t border-sidebar-border p-3',
          'bg-gradient-to-t from-card/50 to-transparent',
          'text-xs text-muted-foreground text-center shrink-0',
          'transition-all duration-300'
        )}>
          {collapsed ? (
            <span className="opacity-60">v1</span>
          ) : (
            <div className="space-y-0.5">
              <p className="font-medium">Papatong</p>
              <p className="text-muted-foreground/60">v1.0.0</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50 shrink-0 bg-card border border-border shadow-sm hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0">
          {/* Mobile Header */}
          <div className={cn(
            'flex items-center gap-2.5 px-5 h-16',
            'border-b border-sidebar-border'
          )}>
            <div className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              'bg-gradient-to-br from-primary to-primary/80',
              'text-primary-foreground'
            )}>
              <Building className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Papatong</span>
          </div>

          {/* Mobile Navigation */}
          <nav className="p-3 space-y-1">
            <NavItems pathname={pathname} onItemClick={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
