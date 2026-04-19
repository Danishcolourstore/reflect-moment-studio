import { BusinessInsights } from '@/hooks/use-business-suite';
import { Users, Calendar, IndianRupee, TrendingUp, Eye, Target, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

interface EnhancedInsightsPanelProps {
  insights: BusinessInsights;
}

export function EnhancedInsightsPanel({ insights }: EnhancedInsightsPanelProps) {
  // Funnel data
  const views = insights.totalLeads * 8; // estimated
  const enquiries = insights.totalLeads;
  const bookings = insights.totalBookings;
  const avgBookingValue = insights.confirmedBookings > 0
    ? Math.round(insights.totalRevenue / insights.confirmedBookings)
    : 0;

  const funnelSteps = [
    { label: 'Profile Views', value: views, pct: 100 },
    { label: 'Enquiries', value: enquiries, pct: views > 0 ? Math.round((enquiries / views) * 100) : 0 },
    { label: 'Bookings', value: bookings, pct: enquiries > 0 ? Math.round((bookings / enquiries) * 100) : 0 },
  ];

  const keyInsights = [
    insights.recentLeads > 3 ? 'Enquiry volume is strong this week.' : null,
    insights.conversionRate > 25 ? 'Excellent conversion rate — above average.' : null,
    insights.conversionRate < 10 && insights.totalLeads > 5 ? 'Conversion rate is low. Follow up faster or review pricing.' : null,
    avgBookingValue > 50000 ? `Average booking value is ₹${avgBookingValue.toLocaleString()} — premium segment.` : null,
    insights.totalLeads === 0 ? 'No enquiries. Upload more portfolio images to attract clients.' : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Enquiries', value: insights.totalLeads, icon: Users },
          { label: 'This Week', value: insights.recentLeads, icon: ArrowUpRight },
          { label: 'Total Bookings', value: insights.totalBookings, icon: Calendar },
          { label: 'Confirmed', value: insights.confirmedBookings, icon: Target },
          { label: 'Revenue', value: `₹${insights.totalRevenue.toLocaleString()}`, icon: IndianRupee },
          { label: 'Avg Booking', value: avgBookingValue > 0 ? `₹${avgBookingValue.toLocaleString()}` : '—', icon: TrendingUp },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-serif text-foreground leading-none" style={{ fontWeight: 300 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => (
            <div key={step.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{step.label}</span>
                <span className="text-foreground font-medium">{step.value}</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(step.pct, 2)}%`,
                    background: i === 0 ? 'hsl(var(--muted-foreground) / 0.3)' : i === 1 ? 'hsl(var(--primary))' : 'hsl(142 76% 36%)',
                  }}
                />
              </div>
              {i < funnelSteps.length - 1 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {funnelSteps[i + 1].pct}% conversion to {funnelSteps[i + 1].label.toLowerCase()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Business Health */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-3">Conversion Rate</h3>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-serif text-foreground leading-none" style={{ fontWeight: 300 }}>
            {insights.conversionRate}%
          </p>
          <span className={`text-xs flex items-center gap-0.5 mb-1 ${insights.conversionRate >= 20 ? 'text-emerald-500' : 'text-yellow-500'}`}>
            {insights.conversionRate >= 20 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {insights.conversionRate >= 20 ? 'Above average' : 'Below average'}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mt-3">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(insights.conversionRate, 100)}%` }} />
        </div>
      </div>

      {/* Key Insights */}
      {keyInsights.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">Key Insights</p>
          {keyInsights.map((insight, i) => (
            <div key={i} className="border-l-2 border-l-primary bg-primary/5 rounded-lg p-3 flex items-start gap-2.5">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
