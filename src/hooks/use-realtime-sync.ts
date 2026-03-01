import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Subscribes to realtime changes on key tables and invalidates
 * relevant React Query caches so the UI stays fresh.
 */
export function useRealtimeSync(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['photos'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_selections' }, () => {
        queryClient.invalidateQueries({ queryKey: ['guest_selections'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, () => {
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
