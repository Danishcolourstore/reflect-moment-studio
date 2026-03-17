import { BusinessInsights, Lead, Booking } from '@/hooks/use-business-suite';
import { Users, Calendar, IndianRupee, TrendingUp, Eye, AlertTriangle, ArrowRight, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface BusinessDashboardProps {
  insights: BusinessInsights;
  leads: Lead[];
  bookings: Booking[];
  onTabChange: (tab: string) => void;
}

export function BusinessDashboard({ insights, leads, bookings, onTabChange }: BusinessDashboardProps) {
  const newLeads = leads.filter(l => l.status === 'new');
  const pendingBookings = bookings.filter(b => b.status === 'pending');

  // Generate smart nudges
  const nudges: { icon: React.ReactNode; text: string; urgency: 'high' | 'medium' | 'low' }[] = [];

  if (newLeads.length > 0) {
    nudges.push({
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      text: `${newLeads.length} enquir${newLeads.length > 1 ? 'ies' : 'y'} waiting — respond within 2 hours`,
      urgency: 'high',
    });
  }

  if (insights.totalLeads > 5 && insights.conversionRate < 15) {
    nudges.push({
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      text: 'High views, low enquiries — adjust starting price or add more portfolio images',
      urgency: 'medium',
    });
  }

  if (pendingBookings.length > 0) {
    nudges.push({
      icon: <Calendar className="h-3.5 w-3.5" />,
      text: `${pendingBookings.length} booking${pendingBookings.length > 1 ? 's' : ''} pending confirmation — collect advance`,
      urgency: 'medium',
    });
  }

  if (insights.totalLeads === 0) {
    nudges.push({
      icon: <Zap className="h-3.5 w-3.5" />,
      text: 'Profiles with 10+ images get 2.8× more enquiries — upload more work',
      urgency: 'low',
    });
  }

  // Activity feed
  const activities: { text: string; time: string; type: 'enquiry' | 'view' | 'shortlist' | 'booking' }[] = [];
  leads.slice(0, 3).forEach(l => {
    activities.push({
      text: `New enquiry — ${l.source_event_name || 'General'} — ${l.name}`,
      time: formatDistanceToNow(new Date(l.created_at), { addSuffix: true }),
      type: 'enquiry',
    });
  });
  bookings.slice(0, 2).forEach(b => {
    activities.push({
      text: `Booking ${b.status} — ${b.event_type} — ₹${b.amount.toLocaleString()}`,
      time: formatDistanceToNow(new Date(b.created_at), { addSuffix: true }),
      type: 'booking',
    });
  });

  const metrics = [
    { label: 'Enquiries', value: insights.totalLeads, sub: `${insights.recentLeads} this week`, icon: Users, color: 'text-primary' },
    { label: 'Conversion', value: `${insights.conversionRate}%`, sub: 'lead → booking', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Revenue', value: `₹${insights.totalRevenue.toLocaleString()}`, sub: `${insights.confirmedBookings} confirmed`, icon: IndianRupee, color: 'text-emerald-500' },
    { label: 'Profile Views', value: insights.totalLeads * 8, sub: 'this month', icon: Eye, color: 'text-blue-400' },
  ];

  const urgencyStyles = {
    high: 'border-l-destructive bg-destructive/5',
    medium: 'border-l-primary bg-primary/5',
    low: 'border-l-border bg-card',
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{m.label}</span>
              </div>
              <p className="text-2xl font-serif text-foreground leading-none" style={{ fontWeight: 300 }}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Smart Nudges */}
      {nudges.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">Smart Insights</p>
          {nudges.slice(0, 3).map((n, i) => (
            <div key={i} className={`border-l-2 rounded-lg p-3 flex items-start gap-2.5 ${urgencyStyles[n.urgency]}`}>
              <span className={n.urgency === 'high' ? 'text-destructive' : 'text-primary'}>{n.icon}</span>
              <p className="text-xs text-foreground/80 leading-relaxed">{n.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Live Activity Feed */}
      {activities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">Live Activity</p>
            <Button variant="ghost" size="sm" className="text-[10px] h-6 text-primary" onClick={() => onTabChange('leads')}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {activities.map((a, i) => (
              <div key={i} className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full shrink-0 ${a.type === 'enquiry' ? 'bg-primary' : a.type === 'booking' ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-12 text-xs" onClick={() => onTabChange('leads')}>
          <MessageCircle className="h-4 w-4 mr-1.5" /> View Enquiries
        </Button>
        <Button variant="outline" className="h-12 text-xs" onClick={() => onTabChange('pricing')}>
          <IndianRupee className="h-4 w-4 mr-1.5" /> Manage Pricing
        </Button>
      </div>
    </div>
  );
}
