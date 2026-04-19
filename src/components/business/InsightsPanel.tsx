import { BusinessInsights } from '@/hooks/use-business-suite';
import { Users, Calendar, IndianRupee, TrendingUp, UserPlus, Target, Lightbulb } from 'lucide-react';

interface InsightsPanelProps {
  insights: BusinessInsights;
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const stats = [
    { label: 'Total Leads', value: insights.totalLeads, icon: <Users className="h-5 w-5" /> },
    { label: 'This Week', value: insights.recentLeads, icon: <UserPlus className="h-5 w-5" /> },
    { label: 'Total Bookings', value: insights.totalBookings, icon: <Calendar className="h-5 w-5" /> },
    { label: 'Confirmed', value: insights.confirmedBookings, icon: <Target className="h-5 w-5" /> },
    { label: 'Revenue', value: `₹${insights.totalRevenue.toLocaleString()}`, icon: <IndianRupee className="h-5 w-5" /> },
    { label: 'Conversion', value: `${insights.conversionRate}%`, icon: <TrendingUp className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted-foreground/20">{s.icon}</span>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-[28px] leading-none font-serif text-foreground" style={{ fontWeight: 300 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-serif text-lg text-foreground mb-2">Business Health</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Lead → Booking Conversion</span>
              <span className="text-foreground font-medium">{insights.conversionRate}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(insights.conversionRate, 100)}%` }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
            {insights.conversionRate >= 30 ? <Target size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" /> :
             insights.conversionRate >= 10 ? <TrendingUp size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" /> :
             <Lightbulb size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" />}
            <span>
              {insights.conversionRate >= 30
                ? 'Great conversion rate. Keep it up.'
                : insights.conversionRate >= 10
                ? 'Good progress. Follow up with leads faster.'
                : 'Tip: Follow up within 24 hours for better conversions.'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
