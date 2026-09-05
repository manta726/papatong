'use client';

import { Topbar } from '@/components/dashboard/topbar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background relative">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0 relative z-0">
          <Topbar />
          <main className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
