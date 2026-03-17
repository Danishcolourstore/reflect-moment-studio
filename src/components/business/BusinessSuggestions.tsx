import { BusinessInsights, Lead } from '@/hooks/use-business-suite';
import { Button } from '@/components/ui/button';
import { MessageCircle, TrendingUp, AlertCircle, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BusinessSuggestionsProps {
  insights: BusinessInsights;
  leads: Lead[];
}

export function BusinessSuggestions({ insights, leads }: BusinessSuggestionsProps) {
  const navigate = useNavigate();
  const suggestions: { icon: React.ReactNode; title: string; body: string; action?: string; actionFn?: () => void }[] = [];

  // New leads this week
  if (insights.recentLeads > 0) {
    suggestions.push({
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: `${insights.recentLeads} new lead${insights.recentLeads > 1 ? 's' : ''} this week`,
      body: 'Follow up quickly to convert these leads into bookings.',
      action: 'View Leads',
    });
  }

  // Hot leads needing response
  const newLeads = leads.filter(l => l.status === 'new');
  if (newLeads.length > 0) {
    suggestions.push({
      icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
      title: `${newLeads.length} lead${newLeads.length > 1 ? 's' : ''} waiting for response`,
      body: `Contact ${newLeads[0].name}${newLeads.length > 1 ? ` and ${newLeads.length - 1} more` : ''} before they go cold.`,
    });
  }

  // Pending bookings
  const pendingCount = insights.totalBookings - insights.confirmedBookings;
  if (pendingCount > 0) {
    suggestions.push({
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      title: `${pendingCount} pending booking${pendingCount > 1 ? 's' : ''}`,
      body: 'Confirm bookings to lock in revenue. Collect advance payments.',
    });
  }

  // Low conversion warning
  if (insights.totalLeads > 5 && insights.conversionRate < 15) {
    suggestions.push({
      icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
      title: 'Low conversion rate',
      body: 'Try following up within 2 hours. Create attractive packages with clear deliverables.',
    });
  }

  // No bookings but have leads
  if (insights.totalBookings === 0 && insights.totalLeads > 0) {
    suggestions.push({
      icon: <MessageCircle className="h-5 w-5 text-green-600" />,
      title: 'Convert leads to bookings',
      body: 'Send a WhatsApp message to your top leads with your package details.',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: 'All caught up!',
      body: 'Your business is running smoothly. Share galleries to capture more leads.',
    });
  }

  // Show max 3
  const visible = suggestions.slice(0, 3);

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2">
        🧠 Daan Business Brain
      </p>
      {visible.map((s, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3 hover:border-primary/15 transition-colors">
          <div className="mt-0.5 shrink-0">{s.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.body}</p>
          </div>
          {s.action && (
            <Button size="sm" variant="ghost" className="text-[10px] h-7 px-2 text-primary shrink-0">
              {s.action} <ArrowRight className="h-3 w-3 ml-0.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
