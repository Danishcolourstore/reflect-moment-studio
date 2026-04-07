import { DashboardLayout } from '@/components/DashboardLayout';
import { CreditCard } from 'lucide-react';

const Billing = () => {
  return (
    <DashboardLayout>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "hsl(48, 7%, 10%)", marginBottom: 40, letterSpacing: "0.02em" }}>Billing</h1>
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <CreditCard style={{ width: 40, height: 40, color: "hsl(37, 10%, 90%)", margin: "0 auto 16px" }} strokeWidth={1} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "hsl(35, 4%, 56%)", fontWeight: 300 }}>Coming soon</p>
      </div>
    </DashboardLayout>
  );
};

export default Billing;