import { DashboardLayout } from '@/components/DashboardLayout';
import { Check } from 'lucide-react';

const FEATURES = [
  'Unlimited storage',
  'Unlimited events & galleries',
  'Unlimited client downloads',
  'AI culling with Cheetah',
  'Album & Grid Builder',
  'Website Builder with custom domain',
  'Client portal & favorites',
  'Smart QR & face search',
  'Priority support',
];

const Billing = () => {
  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'hsl(35, 4%, 56%)', marginBottom: 12 }}>
            Membership
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: 'hsl(48, 7%, 10%)', letterSpacing: '0.01em', lineHeight: 1.1 }}>
            One plan. Everything included.
          </h1>
        </div>

        {/* Pricing Card */}
        <div
          style={{
            border: '1px solid hsl(37, 10%, 90%)',
            padding: '48px 40px',
            backgroundColor: 'hsl(40, 20%, 99%)',
          }}
        >
          {/* Plan name */}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'hsl(35, 12%, 40%)', marginBottom: 16 }}>
            Studio Membership
          </p>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 300, color: 'hsl(48, 7%, 10%)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              ₹12,500
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'hsl(35, 4%, 56%)', fontWeight: 400 }}>
              / year
            </span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'hsl(35, 4%, 56%)', marginBottom: 40 }}>
            Approximately ₹1,042 per month, billed annually
          </p>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'hsl(37, 10%, 90%)', margin: '0 0 32px' }} />

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map((feature) => (
              <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Check style={{ width: 14, height: 14, color: 'hsl(35, 12%, 40%)', flexShrink: 0 }} strokeWidth={1.5} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'hsl(48, 7%, 15%)', fontWeight: 400 }}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: 'hsl(48, 7%, 10%)',
              color: 'hsl(40, 20%, 99%)',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Coming Soon
          </button>

          {/* Footnote */}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'hsl(35, 4%, 56%)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
            Cancel anytime. No hidden fees.
          </p>
        </div>

        {/* Help text */}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: 'italic', color: 'hsl(35, 4%, 56%)', textAlign: 'center', marginTop: 40, fontWeight: 300 }}>
          Questions about membership? Reach our concierge team.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
