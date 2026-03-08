DO $$
DECLARE
  t text;
  realtime_tables text[] := ARRAY[
    'website_templates',
    'platform_settings',
    'profiles',
    'user_roles',
    'events',
    'photos',
    'gallery_chapters',
    'gallery_text_blocks',
    'studio_profiles',
    'portfolio_albums',
    'contact_inquiries',
    'blog_posts',
    'notifications',
    'cheetah_sessions',
    'cheetah_photos',
    'clients',
    'client_events',
    'client_favorites',
    'client_downloads',
    'event_analytics'
  ];
BEGIN
  FOREACH t IN ARRAY realtime_tables LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relkind = 'r'
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END IF;
  END LOOP;
END $$;