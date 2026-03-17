import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, MapPin, TrendingUp, Shield, ArrowRight, Sparkles } from 'lucide-react';

const boostOptions = [
  {
    id: 'local',
    title: 'Local Boost',
    description: 'Higher visibility in your city. Appear at the top of search results for nearby clients.',
    price: '₹99/day',
    impact: '+3× visibility',
    icon: MapPin,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'trending',
    title: 'Trending Boost',
    description: 'Featured placement across the platform. Get seen by clients browsing for photographers.',
    price: '₹499/week',
    impact: '+5× enquiries',
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'premium',
    title: 'Premium Badge',
    description: 'Highlighted profile with verified badge. Builds trust and increases conversion.',
    price: '₹999/month',
    impact: '+2× bookings',
    icon: Shield,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

export function BoostPanel() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg text-foreground">Grow Faster</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Boost your profile to reach more clients. Pay only when you want extra visibility.
        </p>
      </div>

      {/* Boost Options */}
      <div className="space-y-3">
        {boostOptions.map(opt => {
          const Icon = opt.icon;
          return (
            <div key={opt.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg ${opt.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${opt.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">{opt.title}</h4>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">{opt.impact}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{opt.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{opt.price}</span>
                    <Button size="sm" variant="outline" className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/10">
                      Activate <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Suggestion */}
      <div className="border-l-2 border-l-primary bg-primary/5 rounded-lg p-3 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            Photographers with Local Boost active get <span className="font-medium text-foreground">3× more profile views</span> on average.
          </p>
        </div>
      </div>
    </div>
  );
}
