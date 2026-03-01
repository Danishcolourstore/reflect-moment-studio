
-- Add 'client' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- Create clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Clients can view own record
CREATE POLICY "Clients can view own record" ON public.clients
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Photographers can manage their own clients
CREATE POLICY "Photographers can manage own clients" ON public.clients
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

-- Admins full access
CREATE POLICY "Admins full access clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create client_events table
CREATE TABLE public.client_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, event_id)
);

ALTER TABLE public.client_events ENABLE ROW LEVEL SECURITY;

-- Clients can view own event access
CREATE POLICY "Clients can view own event access" ON public.client_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_events.client_id AND clients.user_id = auth.uid()));

-- Photographers can manage client events for their clients
CREATE POLICY "Photographers can manage client events" ON public.client_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_events.client_id AND clients.photographer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_events.client_id AND clients.photographer_id = auth.uid()));

-- Admins full access
CREATE POLICY "Admins full access client_events" ON public.client_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create client_favorites table
CREATE TABLE public.client_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, photo_id)
);

ALTER TABLE public.client_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own favorites" ON public.client_favorites
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_favorites.client_id AND clients.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_favorites.client_id AND clients.user_id = auth.uid()));

CREATE POLICY "Photographers can view client favorites" ON public.client_favorites
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_favorites.client_id AND clients.photographer_id = auth.uid()));

CREATE POLICY "Admins full access client_favorites" ON public.client_favorites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create client_downloads table
CREATE TABLE public.client_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own downloads" ON public.client_downloads
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_downloads.client_id AND clients.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_downloads.client_id AND clients.user_id = auth.uid()));

CREATE POLICY "Photographers can view client downloads" ON public.client_downloads
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_downloads.client_id AND clients.photographer_id = auth.uid()));

CREATE POLICY "Admins full access client_downloads" ON public.client_downloads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: notify photographer when client favorites a photo
CREATE OR REPLACE FUNCTION public.notify_on_client_favorite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _photographer_id uuid;
  _client_name text;
BEGIN
  SELECT c.photographer_id, c.name INTO _photographer_id, _client_name
  FROM public.clients c WHERE c.id = NEW.client_id;
  IF _photographer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (_photographer_id, 'client_favorite', 'Client favorited a photo',
      _client_name || ' added a photo to their favorites.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_client_favorite
  AFTER INSERT ON public.client_favorites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_client_favorite();

-- Trigger: notify photographer when client downloads a photo
CREATE OR REPLACE FUNCTION public.notify_on_client_download()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _photographer_id uuid;
  _client_name text;
BEGIN
  SELECT c.photographer_id, c.name INTO _photographer_id, _client_name
  FROM public.clients c WHERE c.id = NEW.client_id;
  IF _photographer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (_photographer_id, 'client_download', 'Client downloaded a photo',
      _client_name || ' downloaded a photo.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_client_download
  AFTER INSERT ON public.client_downloads
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_client_download();
