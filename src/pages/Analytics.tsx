import { DashboardLayout } from '@/components/DashboardLayout';
import { BarChart3 } from 'lucide-react';

const Analytics = () => {
  return (
    <DashboardLayout>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-8">Analytics</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <p className="font-serif text-xl text-muted-foreground">Analytics Coming Soon</p>
        <p className="mt-2 text-sm text-muted-foreground/60">Track gallery views, downloads, and engagement.</p>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
