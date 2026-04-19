import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Zap, X, ArrowRight, Eye, Calendar, TrendingUp,
  Package, MessageSquare, Clock, Sparkles, DollarSign, type LucideIcon,
} from 'lucide-react';

const NUDGE_ICON_MAP: Record<string, LucideIcon> = {
  eye: Eye, calendar: Calendar, dollar: DollarSign, clock: Clock,
};
import { useSmartNudges, type SmartNudge } from '@/hooks/use-entiran-business';

const DEMO_NUDGES: SmartNudge[] = [
  {
    id: 'nudge-1',
    nudge_type: 'gallery_engagement',
    title: 'A viewer spent 4 minutes in your gallery',
    body: 'Someone browsed 23 photos in "Priya & Arjun Wedding" but didn\'t message. Send them a direct link to your contact page?',
    icon: 'eye',
    priority: 'high',
    action_type: 'route',
    action_data: { route: '/dashboard/events' },
    is_read: false,
    is_dismissed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'nudge-2',
    nudge_type: 'availability_gap',
    title: '3 empty Saturdays in July',
    body: 'You have no bookings for July 5, 12, and 19. Post a limited availability offer in Reflections to attract last-minute bookings?',
    icon: 'calendar',
    priority: 'medium',
    action_type: 'route',
    action_data: { route: '/dashboard/reflections' },
    is_read: false,
    is_dismissed: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'nudge-3',
    nudge_type: 'pricing_stale',
    title: 'Packages haven\'t been updated in 6 months',
    body: 'Local pricing has risen 15% since your last update. Review your packages to stay competitive.',
    icon: 'dollar',
    priority: 'medium',
    action_type: 'route',
    action_data: { route: '/dashboard/business' },
    is_read: true,
    is_dismissed: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'nudge-4',
    nudge_type: 'lead_followup',
    title: '2 leads haven\'t been contacted',
    body: 'Ravi and Meena sent inquiries 36 hours ago. Quick follow-ups convert 3x better within 24 hours.',
    icon: 'clock',
    priority: 'high',
    action_type: 'route',
    action_data: { route: '/dashboard/business' },
    is_read: false,
    is_dismissed: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-orange-400',
  medium: 'border-l-primary',
  low: 'border-l-muted-foreground/30',
};

const NUDGE_TYPE_ICONS: Record<string, React.ReactNode> = {
  gallery_engagement: <Eye className="h-3 w-3" />,
  availability_gap: <Calendar className="h-3 w-3" />,
  pricing_stale: <TrendingUp className="h-3 w-3" />,
  lead_followup: <Clock className="h-3 w-3" />,
  package_update: <Package className="h-3 w-3" />,
  client_message: <MessageSquare className="h-3 w-3" />,
};

export function SmartNudgesPanel() {
  const navigate = useNavigate();
  const { nudges: dbNudges, dismissNudge, markRead } = useSmartNudges();
  const nudges = dbNudges.length > 0 ? dbNudges : DEMO_NUDGES;

  const unreadCount = nudges.filter(n => !n.is_read).length;

  const handleAction = (nudge: SmartNudge) => {
    markRead(nudge.id);
    if (nudge.action_type === 'route' && nudge.action_data?.route) {
      navigate(nudge.action_data.route);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Smart Nudges</h2>
            <p className="text-[10px] text-muted-foreground">Daan sees what you might miss</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="text-[9px] h-5 px-2 bg-primary text-primary-foreground">
            {unreadCount} new
          </Badge>
        )}
      </div>

      {/* Nudge Cards */}
      <div className="space-y-2">
        {nudges.map(nudge => (
          <Card
            key={nudge.id}
            className={`overflow-hidden border-l-[3px] transition-all hover:border-primary/20 ${
              PRIORITY_STYLES[nudge.priority] || ''
            } ${!nudge.is_read ? 'bg-primary/[0.03]' : ''}`}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {(() => {
                    const NudgeIcon = NUDGE_ICON_MAP[nudge.icon as string] || Sparkles;
                    return <NudgeIcon size={16} strokeWidth={1.5} className="mt-0.5 text-muted-foreground" />;
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {NUDGE_TYPE_ICONS[nudge.nudge_type] && (
                        <span className="text-muted-foreground/50">
                          {NUDGE_TYPE_ICONS[nudge.nudge_type]}
                        </span>
                      )}
                      {!nudge.is_read && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-snug">{nudge.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{nudge.body}</p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNudge(nudge.id)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
                >
                  <X className="h-3 w-3 text-muted-foreground/30" />
                </button>
              </div>

              {nudge.action_type && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] h-7 gap-1 text-primary hover:text-primary hover:bg-primary/10 ml-7"
                  onClick={() => handleAction(nudge)}
                >
                  Take Action <ArrowRight className="h-2.5 w-2.5" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {nudges.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/15 mb-2" />
              <p className="text-xs text-muted-foreground">All caught up!</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Daan will nudge you when something needs attention</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
