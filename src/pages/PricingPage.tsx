import { useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Star } from 'lucide-react';

const PricingPage = () => {
  const { toast } = useToast();

  useEffect(() => { document.title = 'MirrorAI — Pricing'; }, []);

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: ['10 events', '500 photos per event', '5GB storage', 'Basic analytics', 'Watermark branding'],
      popular: false,
    },
    {
      name: 'Pro',
      price: '₹999',
      period: '/month',
      annual: '₹8,999/year',
      features: ['Unlimited events', 'Unlimited photos', '50GB storage', 'Advanced analytics', 'Custom branding', 'Priority support', 'No MirrorAI watermark'],
      popular: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="page-fade-in max-w-3xl mx-auto text-center">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Choose Your Plan</h1>
        <p className="text-[12px] text-muted-foreground/60 mb-10">Scale your photography business with MirrorAI</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map(plan => (
            <div key={plan.name} className={`relative bg-card border rounded-lg p-6 text-left ${plan.popular ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider px-3">
                  <Star className="h-3 w-3 mr-1" /> Most Popular
                </Badge>
              )}
              <h3 className="font-serif text-xl font-semibold text-foreground mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="font-serif text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-[12px] text-muted-foreground/60 ml-1">{plan.period}</span>
              </div>
              {plan.annual && (
                <p className="text-[11px] text-primary font-medium mb-4">or {plan.annual} (save 25%)</p>
              )}
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[12px] text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => toast({ title: 'Payment integration coming soon' })}
                className={`w-full h-10 text-[11px] uppercase tracking-wider font-medium ${plan.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-secondary/20 hover:bg-secondary/30 text-foreground'}`}
              >
                {plan.popular ? 'Upgrade to Pro' : 'Current Plan'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PricingPage;
