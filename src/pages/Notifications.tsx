import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Eye, MessageCircle, CheckSquare, AlertTriangle, Trash2 } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

const ICON_MAP: Record<string, any> = {
  gallery_view: Eye,
  new_comment: MessageCircle,
  new_selection: CheckSquare,
  storage_warning: AlertTriangle,
};

type FilterTab = 'all' | 'unread' | 'gallery_view' | 'new_comment' | 'new_selection' | 'storage_warning';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'gallery_view', label: 'Views' },
  { key: 'new_comment', label: 'Comments' },
  { key: 'new_selection', label: 'Selections' },
  { key: 'storage_warning', label: 'Storage' },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState<FilterTab>('all');

  const filtered = notifications.filter(n => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !n.is_read;
    return n.type === tab;
  });

  const deleteAllRead = async () => {
    if (!user) return;
    await (supabase.from('notifications' as any).delete() as any)
      .eq('user_id', user.id).eq('is_read', true);
    queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    toast.success('Read notifications deleted');
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.type === 'storage_warning') navigate('/dashboard/profile');
    else if (n.event_id) navigate(`/dashboard/events/${n.event_id}`);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Notifications</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[10px] h-7 uppercase tracking-wider" onClick={markAllAsRead}>Mark all read</Button>
          <Button variant="ghost" size="sm" className="text-[10px] h-7 uppercase tracking-wider text-destructive" onClick={deleteAllRead}>Delete read</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] tracking-wider transition-all border ${
              tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
            }`}>{t.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border/60 py-24 text-center rounded-xl">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No notifications</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(n => {
            const Icon = ICON_MAP[n.type] || Bell;
            return (
              <div key={n.id} onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                  n.is_read ? 'bg-background hover:bg-secondary/30' : 'bg-card hover:bg-card/80'
                }`}>
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${n.is_read ? 'text-muted-foreground/40' : 'text-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Notifications;
