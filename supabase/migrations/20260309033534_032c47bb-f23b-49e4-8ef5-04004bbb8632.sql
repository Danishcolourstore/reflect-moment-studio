
-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON public.events(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON public.favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_guest_session ON public.favorites(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_favorites_photo_id ON public.favorites(photo_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_event_views_event_id ON public.event_views(event_id);

CREATE INDEX IF NOT EXISTS idx_clients_photographer_id ON public.clients(photographer_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_client_events_client_id ON public.client_events(client_id);
CREATE INDEX IF NOT EXISTS idx_client_events_event_id ON public.client_events(event_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_chapters_event_id ON public.gallery_chapters(event_id);
CREATE INDEX IF NOT EXISTS idx_gallery_text_blocks_event_id ON public.gallery_text_blocks(event_id);

CREATE INDEX IF NOT EXISTS idx_guest_selections_event_id ON public.guest_selections(event_id);
CREATE INDEX IF NOT EXISTS idx_album_selections_event_id ON public.album_selections(event_id);

CREATE INDEX IF NOT EXISTS idx_cheetah_photos_session_id ON public.cheetah_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_cheetah_photos_user_id ON public.cheetah_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_cheetah_sessions_user_id ON public.cheetah_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_developer_prompts_user_id ON public.ai_developer_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_developer_prompts_created_at ON public.ai_developer_prompts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grid_templates_is_active ON public.grid_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_grid_templates_category ON public.grid_templates(category);
