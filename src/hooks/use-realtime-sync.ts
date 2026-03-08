import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { clearTemplateCache } from '@/lib/website-templates';
import { TEMPLATES_QUERY_KEY } from '@/hooks/use-website-templates';
import { PLATFORM_SETTINGS_KEY } from '@/hooks/use-platform-settings';

/**
 * Global realtime sync — subscribes to all admin-managed tables
 * and invalidates relevant React Query caches so every part of the
 * app stays in sync without manual refresh.
 */
export function useRealtimeSync(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('platform-live-sync')
      // ── Existing tables ──
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      // ── Admin-managed tables ──
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_templates' }, () => {
        clearTemplateCache();
        queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_inquiries' }, () => {
        queryClient.invalidateQueries({ queryKey: ['contact_inquiries'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cheetah_sessions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cheetah_sessions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cheetah_photos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cheetah_photos'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
