'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <Topbar />

          {/* Page Content */}
          <main className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <div className="animate-fade-in">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
