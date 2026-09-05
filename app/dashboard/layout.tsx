'use client';

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
        {/* ❌ JANGAN render <Sidebar /> di sini!
            Sidebar sudah di-render oleh Topbar (komponen Sidebar handle sendiri 
            kapan tampil sebagai aside desktop / hamburger mobile via CSS breakpoints) */}

        <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
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
