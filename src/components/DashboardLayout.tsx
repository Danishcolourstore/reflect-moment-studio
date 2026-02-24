import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-[220px] pb-20 lg:pb-0">
        <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
