/**
 * Client Relationship Intelligence Panel
 * Shows reminders, timeline, quick actions, and AI suggestions.
 */
import { useState } from 'react';
import { Bell, MessageCircle, Calendar, Heart, Sparkles, Check, X, Clock, Gift, RefreshCw, ChevronRight, Phone, Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientIntelligence, type ClientReminder } from '@/hooks/use-client-intelligence';
import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns';

const REMINDER_ICONS: Record<string, React.ReactNode> = {
  anniversary: <Heart className="h-4 w-4 text-rose-500" />,
  birthday: <Gift className="h-4 w-4 text-amber-500" />,
  baby_milestone: <Sparkles className="h-4 w-4 text-blue-500" />,
  gallery_reminder: <Bell className="h-4 w-4 text-primary" />,
  reactivation: <RefreshCw className="h-4 w-4 text-violet-500" />,
  album_upsell: <Calendar className="h-4 w-4 text-emerald-500" />,
  selection_reminder: <Check className="h-4 w-4 text-orange-500" />,
};

const REMINDER_COLORS: Record<string, string> = {
  anniversary: 'border-l-rose-500',
  birthday: 'border-l-amber-500',
  baby_milestone: 'border-l-blue-500',
  gallery_reminder: 'border-l-primary',
  reactivation: 'border-l-violet-500',
  album_upsell: 'border-l-emerald-500',
  selection_reminder: 'border-l-orange-500',
};

function getDueDateLabel(date: string): { label: string; urgent: boolean } {
  const d = new Date(date);
  if (isToday(d)) return { label: 'Today', urgent: true };
  if (isTomorrow(d)) return { label: 'Tomorrow', urgent: true };
  if (isPast(d)) return { label: `${formatDistanceToNow(d)} overdue`, urgent: true };
  return { label: format(d, 'MMM d'), urgent: false };
}

export function ClientRelationshipPanel() {
  const {
    reminders, templates, loading,
    completeReminder, dismissReminder, generateReminders,
    getWhatsAppLink, fillTemplate,
  } = useClientIntelligence();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await generateReminders();
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-serif font-semibold text-foreground">Relationship Intelligence</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating…' : 'Refresh'}
        </Button>
      </div>

      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="reminders" className="gap-1.5 text-xs">
            <Bell className="h-3.5 w-3.5" />
            Reminders
            {reminders.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 min-w-[16px] px-1 text-[9px]">{reminders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs">
            <MessageCircle className="h-3.5 w-3.5" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="mt-4 space-y-3">
          {reminders.length === 0 ? (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No pending reminders</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add milestones to clients to get automatic reminders</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleGenerate}>
                  Generate Reminders
                </Button>
              </CardContent>
            </Card>
          ) : (
            reminders.map(r => <ReminderCard key={r.id} reminder={r} onComplete={completeReminder} onDismiss={dismissReminder} getWhatsAppLink={getWhatsAppLink} />)
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4 space-y-3">
          <AISuggestions reminders={reminders} getWhatsAppLink={getWhatsAppLink} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-3">
          {templates.map(t => (
            <Card key={t.id} className="bg-card hover:bg-accent/5 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 text-[9px]">{t.template_type.replace(/_/g, ' ')}</Badge>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.message_body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReminderCard({
  reminder: r, onComplete, onDismiss, getWhatsAppLink,
}: {
  reminder: ClientReminder;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  getWhatsAppLink: (phone: string | null | undefined, msg: string) => string | null;
}) {
  const { label: dueLabel, urgent } = getDueDateLabel(r.due_date);
  const whatsappLink = getWhatsAppLink(r.client_phone, r.message || r.title);

  return (
    <Card className={`bg-card border-l-[3px] ${REMINDER_COLORS[r.reminder_type] || 'border-l-primary'} hover:shadow-md transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {REMINDER_ICONS[r.reminder_type] || <Bell className="h-4 w-4 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
              <Badge variant={urgent ? 'destructive' : 'outline'} className="shrink-0 text-[9px]">
                <Clock className="h-2.5 w-2.5 mr-0.5" /> {dueLabel}
              </Badge>
            </div>
            {r.client_name && (
              <p className="text-xs text-muted-foreground mb-1">{r.client_name}</p>
            )}
            {r.message && (
              <p className="text-xs text-muted-foreground/80 line-clamp-2">{r.message}</p>
            )}

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#25D366' }}
                  onClick={() => onComplete(r.id)}
                >
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              )}
              {r.client_email && (
                <a
                  href={`mailto:${r.client_email}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  <Mail className="h-3 w-3" /> Email
                </a>
              )}
              <button
                onClick={() => onComplete(r.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Check className="h-3 w-3" /> Done
              </button>
              <button
                onClick={() => onDismiss(r.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" /> Dismiss
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AISuggestions({
  reminders, getWhatsAppLink,
}: {
  reminders: ClientReminder[];
  getWhatsAppLink: (phone: string | null | undefined, msg: string) => string | null;
}) {
  const suggestions = [
    ...reminders
      .filter(r => r.reminder_type === 'anniversary')
      .slice(0, 2)
      .map(r => ({
        icon: <Heart className="h-4 w-4 text-rose-500" />,
        title: `Anniversary coming up`,
        body: `${r.client_name}'s anniversary is ${getDueDateLabel(r.due_date).label} — send a message and offer a couple shoot?`,
        link: getWhatsAppLink(r.client_phone, `Happy Anniversary ${r.client_name}! ❤️ Your wedding memories are still special to us.`),
      })),
    ...reminders
      .filter(r => r.reminder_type === 'reactivation')
      .slice(0, 1)
      .map(r => ({
        icon: <RefreshCw className="h-4 w-4 text-violet-500" />,
        title: `Reconnect opportunity`,
        body: `${r.client_name} has been inactive — a quick message could lead to repeat business.`,
        link: getWhatsAppLink(r.client_phone, `Hi ${r.client_name}! We'd love to work together again. Any upcoming events?`),
      })),
    ...reminders
      .filter(r => r.reminder_type === 'gallery_reminder')
      .slice(0, 1)
      .map(r => ({
        icon: <Bell className="h-4 w-4 text-primary" />,
        title: `Gallery not opened`,
        body: `${r.client_name} hasn't viewed their gallery yet — a gentle reminder might help.`,
        link: getWhatsAppLink(r.client_phone, r.message || ''),
      })),
  ];

  if (suggestions.length === 0) {
    return (
      <Card className="bg-card/50 border-dashed">
        <CardContent className="py-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No AI suggestions right now</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add client milestones and the AI will suggest actions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {suggestions.map((s, i) => (
        <Card key={i} className="bg-card border-l-[3px] border-l-primary/40">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{s.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.body}</p>
                {s.link && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="h-3 w-3" /> Send WhatsApp
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default ClientRelationshipPanel;
