import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/lib/auth';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {/* Mobile top bar with logout */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-5 py-3 lg:hidden">
        <h1 className="font-serif text-lg font-semibold text-primary tracking-tight">MirrorAI</h1>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[11px]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      <main className="lg:ml-[220px] pb-20 lg:pb-0">
        <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
