import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, Minus, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, Info
} from 'lucide-react';
import { usePricingIntelligence, type PricingInsight } from '@/hooks/use-entiran-business';

const DEMO_INSIGHTS: PricingInsight[] = [
  {
    id: 'pi-1', category: 'Wedding', user_price_cents: 4500000, local_avg_cents: 6500000,
    local_median_cents: 5500000, percentile_rank: 32, city: 'Chennai', sample_size: 47,
    trend: 'below_average', insight: 'Your wedding package is 30% below the local average. Consider adjusting.',
    generated_at: new Date().toISOString(),
  },
  {
    id: 'pi-2', category: 'Portrait', user_price_cents: 1500000, local_avg_cents: 1200000,
    local_median_cents: 1100000, percentile_rank: 72, city: 'Chennai', sample_size: 35,
    trend: 'above_average', insight: 'Great positioning! Your portrait pricing is competitive and reflects quality.',
    generated_at: new Date().toISOString(),
  },
  {
    id: 'pi-3', category: 'Pre-Wedding', user_price_cents: 2500000, local_avg_cents: 2800000,
    local_median_cents: 2500000, percentile_rank: 48, city: 'Chennai', sample_size: 28,
    trend: 'at_average', insight: 'You\'re right at the median for pre-wedding shoots. Room to grow with a premium tier.',
    generated_at: new Date().toISOString(),
  },
];

const TREND_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  above_average: { icon: <TrendingUp className="h-3 w-3" />, label: 'Above Average', color: 'text-green-400' },
  below_average: { icon: <TrendingDown className="h-3 w-3" />, label: 'Below Average', color: 'text-orange-400' },
  at_average: { icon: <Minus className="h-3 w-3" />, label: 'At Average', color: 'text-blue-400' },
  stable: { icon: <Minus className="h-3 w-3" />, label: 'Stable', color: 'text-muted-foreground' },
};

export function PricingIntelligence() {
  const { insights: dbInsights, loading, requestAnalysis } = usePricingIntelligence();
  const insights = dbInsights.length > 0 ? dbInsights : DEMO_INSIGHTS;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Pricing Intelligence</h2>
            <p className="text-[10px] text-muted-foreground">How you compare in your market</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-primary/20 text-primary">
          <Sparkles className="h-2.5 w-2.5" /> AI Analysis
        </Badge>
      </div>

      {/* City context */}
      {insights[0]?.city && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" />
          Based on {insights[0].sample_size} photographers in {insights[0].city}
        </div>
      )}

      {/* Insight Cards */}
      <div className="space-y-3">
        {insights.map(insight => {
          const trendInfo = TREND_CONFIG[insight.trend] || TREND_CONFIG.stable;
          const diff = ((insight.user_price_cents - insight.local_avg_cents) / insight.local_avg_cents * 100).toFixed(0);
          const isBelow = insight.user_price_cents < insight.local_avg_cents;

          return (
            <Card key={insight.id} className="overflow-hidden hover:border-primary/15 transition-colors">
              <CardContent className="p-3 space-y-3">
                {/* Category + Trend */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] h-5 px-2 border-border">
                      {insight.category}
                    </Badge>
                    <span className={`flex items-center gap-1 text-[10px] font-medium ${trendInfo.color}`}>
                      {trendInfo.icon} {trendInfo.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    P{insight.percentile_rank}
                  </span>
                </div>

                {/* Price Comparison Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Your Price</span>
                    <span className="font-bold text-foreground">₹{(insight.user_price_cents / 100).toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (insight.user_price_cents / insight.local_avg_cents) * 100)}%` }}
                    />
                    {/* Average marker */}
                    <div className="absolute top-0 h-full w-0.5 bg-foreground/30" style={{ left: '100%' }}>
                      <div className="absolute -top-3.5 -translate-x-1/2 text-[7px] text-muted-foreground whitespace-nowrap">
                        Avg
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>Local Avg: ₹{(insight.local_avg_cents / 100).toLocaleString()}</span>
                    <span className={isBelow ? 'text-orange-400' : 'text-green-400'}>
                      {isBelow ? <ArrowDownRight className="h-2.5 w-2.5 inline" /> : <ArrowUpRight className="h-2.5 w-2.5 inline" />}
                      {Math.abs(Number(diff))}% {isBelow ? 'below' : 'above'}
                    </span>
                  </div>
                </div>

                {/* Insight */}
                {insight.insight && (
                  <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/30 flex items-start gap-2">
                    {isBelow ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    )}
                    <p className="text-[11px] text-foreground/70 leading-relaxed">{insight.insight}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
