import { DashboardLayout } from '@/components/DashboardLayout';
import { CreditCard } from 'lucide-react';

const Billing = () => {
  return (
    <DashboardLayout>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-8">Plan & Billing</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CreditCard className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <p className="font-serif text-xl text-muted-foreground">Billing Coming Soon</p>
        <p className="mt-2 text-sm text-muted-foreground/60">Manage your subscription and payment methods.</p>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
