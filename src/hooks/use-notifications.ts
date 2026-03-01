import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  event_id: string | null;
  photo_id: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase
        .from('notifications' as any)
        .select('*') as any)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as Notification[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback(async (id: string) => {
    await (supabase.from('notifications' as any).update({ is_read: true } as any) as any).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  }, [user?.id, queryClient]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await (supabase.from('notifications' as any).update({ is_read: true } as any) as any)
      .eq('user_id', user.id)
      .eq('is_read', false);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  }, [user, queryClient]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        const n = payload.new as Notification;
        toast(n.title, { description: n.message });
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}
