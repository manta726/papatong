'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
            <div className="animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
