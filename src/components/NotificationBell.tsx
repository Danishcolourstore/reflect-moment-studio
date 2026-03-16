import { useNavigate } from 'react-router-dom';
import { Bell, Eye, MessageCircle, CheckSquare, AlertTriangle, Mail, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const ICON_MAP: Record<string, any> = {
  gallery_view: Eye,
  new_comment: MessageCircle,
  new_selection: CheckSquare,
  storage_warning: AlertTriangle,
  contact_form: Mail,
  client_favorite: Eye,
  client_download: Eye,
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    setOpen(false);
    if (n.type === 'contact_form') navigate('/dashboard/notifications');
    else if (n.type === 'storage_warning') navigate('/dashboard/profile');
    else if (n.event_id) navigate(`/dashboard/events/${n.event_id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-medium flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 shadow-lg rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-serif text-lg text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[480px]">
          {notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground/50">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.slice(0, 10).map(n => {
                const Icon = ICON_MAP[n.type] || Bell;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-200 hover:bg-secondary/30"
                    style={{
                      borderLeft: !n.is_read ? '3px solid #C9A96E' : '3px solid transparent',
                      backgroundColor: n.is_read ? undefined : 'hsl(var(--card))',
                    }}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${n.is_read ? 'text-muted-foreground/40' : 'text-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border px-4 py-2.5">
          <button
            onClick={() => { setOpen(false); navigate('/dashboard/notifications'); }}
            className="text-xs text-primary hover:text-primary/80 w-full text-center transition-colors"
          >
            View All
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
