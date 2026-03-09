import { useEffect } from 'react';
// Dashboard Editor tables added for realtime sync
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { clearTemplateCache } from '@/lib/website-templates';
import { TEMPLATES_QUERY_KEY } from '@/hooks/use-website-templates';
import { PLATFORM_SETTINGS_KEY } from '@/hooks/use-platform-settings';
import { setRealtimeStatus } from '@/lib/realtime-status';

/**
 * Core tables: always subscribed (high-traffic, user-facing).
 * Admin tables: only subscribed when on admin routes.
 */
const CORE_TABLE_KEYS: Record<string, readonly (readonly unknown[])[]> = {
  events:              [['events'], ['event'], ['storage-usage']],
  photos:              [['photos'], ['portfolio-photos'], ['storage-usage']],
  profiles:            [['profiles'], ['profile'], ['storage-usage']],
  notifications:       [['notifications']],
  favorites:           [['favorites']],
  website_templates:   [TEMPLATES_QUERY_KEY],
  platform_settings:   [PLATFORM_SETTINGS_KEY, ['gallery-admin-settings']],
};

const ADMIN_TABLE_KEYS: Record<string, readonly (readonly unknown[])[]> = {
  user_roles:          [['profiles'], ['profile']],
  templates:           [['templates']],
  grid_templates:      [['grid_templates']],
  gallery_chapters:    [['gallery_chapters']],
  gallery_text_blocks: [['gallery_text_blocks']],
  studio_profiles:     [['studio_profiles'], ['studio-profile']],
  portfolio_albums:    [['portfolio_albums']],
  contact_inquiries:   [['contact_inquiries']],
  blog_posts:          [['blog_posts']],
  cheetah_sessions:    [['cheetah_sessions']],
  cheetah_photos:      [['cheetah_photos']],
  clients:             [['clients']],
  client_events:       [['client_events']],
  client_favorites:    [['client_favorites']],
  client_downloads:    [['client_downloads']],
  event_analytics:     [['event_analytics']],
  dashboard_layouts:   [['dashboard-layouts']],
  dashboard_widgets:   [['dashboard-widgets']],
  dashboard_modules:   [['dashboard-modules']],
  dashboard_settings:  [['dashboard-settings']],
  dashboard_navigation: [['dashboard-navigation']],
  dashboard_quick_actions: [['dashboard-quick-actions']],
  platform_features:   [['platform-features']],
  platform_layouts:    [['platform-layouts']],
  platform_ui_settings: [['platform-ui-settings']],
  platform_permissions: [['platform-permissions']],
  ai_developer_prompts: [['ai-developer-history']],
};

/**
 * Global realtime sync:
 * - Subscribes to all admin-managed tables.
 * - Invalidates React Query caches on every change.
 * - Tracks channel status and broadcasts via `mirrorai:realtime-status` events.
 * - Falls back to polling every 30 s when the socket is not connected.
 */
export function useRealtimeSync(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let channel = supabase.channel('platform-live-sync');

    // Attach postgres_changes listeners for every tracked table
    Object.keys(TABLE_QUERY_KEYS).forEach((table) => {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          // Extra: bust template image cache on website_templates changes
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
        }
      );
    });

    // Subscribe and track connection status
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('connected');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setRealtimeStatus('offline');
      } else {
        // JOINING, TIMED_OUT, etc.
        setRealtimeStatus('reconnecting');
      }
    });

    // ── Fallback polling: re-fetch lightweight tables every 30 s when offline ──
    const POLL_TABLES = ['website_templates', 'platform_settings', 'templates'] as const;

    const fallbackInterval = setInterval(() => {
      // Only poll when the realtime socket isn't reliably connected
      // We import getRealtimeStatus lazily to avoid a circular dep
      import('@/lib/realtime-status').then(({ getRealtimeStatus }) => {
        if (getRealtimeStatus() !== 'connected') {
          for (const table of POLL_TABLES) {
            for (const key of TABLE_QUERY_KEYS[table]) {
              queryClient.invalidateQueries({ queryKey: [...key] });
            }
          }
        }
      });
    }, 30_000);

    return () => {
      clearInterval(fallbackInterval);
      supabase.removeChannel(channel);
      setRealtimeStatus('offline');
    };
  }, [enabled, queryClient]);
}
