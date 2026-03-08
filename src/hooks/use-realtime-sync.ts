import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { clearTemplateCache } from '@/lib/website-templates';
import { TEMPLATES_QUERY_KEY } from '@/hooks/use-website-templates';
import { PLATFORM_SETTINGS_KEY } from '@/hooks/use-platform-settings';

const TABLE_QUERY_KEYS: Record<string, readonly (readonly unknown[])[]> = {
  website_templates: [TEMPLATES_QUERY_KEY],
  platform_settings: [PLATFORM_SETTINGS_KEY],
  profiles: [['profiles'], ['profile'], ['storage-usage']],
  user_roles: [['profiles'], ['profile']],
  events: [['events'], ['event'], ['storage-usage']],
  photos: [['photos'], ['portfolio-photos'], ['storage-usage']],
  gallery_chapters: [['gallery_chapters']],
  gallery_text_blocks: [['gallery_text_blocks']],
  studio_profiles: [['studio_profiles'], ['studio-profile']],
  portfolio_albums: [['portfolio_albums']],
  contact_inquiries: [['contact_inquiries']],
  blog_posts: [['blog_posts']],
  notifications: [['notifications']],
  cheetah_sessions: [['cheetah_sessions']],
  cheetah_photos: [['cheetah_photos']],
  clients: [['clients']],
  client_events: [['client_events']],
  client_favorites: [['client_favorites']],
  client_downloads: [['client_downloads']],
  event_analytics: [['event_analytics']],
};

/**
 * Global realtime sync — subscribes to admin-managed tables,
 * invalidates React Query caches, and emits a window event for
 * non-query pages that need instant refresh.
 */
export function useRealtimeSync(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let channel = supabase.channel('platform-live-sync');

    Object.keys(TABLE_QUERY_KEYS).forEach((table) => {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (table === 'website_templates') clearTemplateCache();

        for (const key of TABLE_QUERY_KEYS[table]) {
          queryClient.invalidateQueries({ queryKey: [...key] });
        }

        window.dispatchEvent(
          new CustomEvent('mirrorai:realtime-change', {
            detail: {
              table,
              event: payload.eventType,
              new: payload.new,
              old: payload.old,
            },
          })
        );
      });
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}

