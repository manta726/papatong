'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
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

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
            <Building className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Papatong</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">{navContent}</div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Papatong</span>
          </div>
          {navContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
