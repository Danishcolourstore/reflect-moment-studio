import { BusinessInsights, Lead } from '@/hooks/use-business-suite';
import { Button } from '@/components/ui/button';
import { MessageCircle, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

interface BusinessSuggestionsProps {
  insights: BusinessInsights;
  leads: Lead[];
}

export function BusinessSuggestions({ insights, leads }: BusinessSuggestionsProps) {
  const suggestions: { icon: React.ReactNode; title: string; body: string; action?: string; actionFn?: () => void }[] = [];

  // New leads suggestion
  if (insights.recentLeads > 0) {
    suggestions.push({
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: `${insights.recentLeads} new lead${insights.recentLeads > 1 ? 's' : ''} this week`,
      body: 'Follow up quickly to convert these leads into bookings.',
    });
  }

  // Hot leads
  const newLeads = leads.filter(l => l.status === 'new');
  if (newLeads.length > 3) {
    suggestions.push({
      icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
      title: `${newLeads.length} leads waiting for response`,
      body: 'Contact these leads before they go cold.',
    });
  }

  // Low conversion
  if (insights.totalLeads > 5 && insights.conversionRate < 10) {
    suggestions.push({
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      title: 'Low conversion rate',
      body: 'Consider creating packages and following up faster. Response time matters!',
    });
  }

  // No bookings
  if (insights.totalBookings === 0 && insights.totalLeads > 0) {
    suggestions.push({
      icon: <MessageCircle className="h-5 w-5 text-green-600" />,
      title: 'No bookings yet',
      body: 'Reach out to your leads on WhatsApp. Personal messages convert better!',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: 'All caught up!',
      body: 'Your business is running smoothly. Share more galleries to capture leads.',
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Entiran Business Brain</p>
      {suggestions.map((s, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="mt-0.5">{s.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.body}</p>
          </div>
          {s.actionFn && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={s.actionFn}>{s.action}</Button>
          )}
        </div>
      ))}
    </div>
  );
}
