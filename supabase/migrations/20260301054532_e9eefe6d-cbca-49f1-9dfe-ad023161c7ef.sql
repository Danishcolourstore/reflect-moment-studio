
-- Feature 1: Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Feature 8: Add is_archived to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Feature 10: Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Trigger: Notify on event_views insert
CREATE OR REPLACE FUNCTION public.notify_on_event_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id uuid;
  _event_name text;
BEGIN
  SELECT user_id, name INTO _owner_id, _event_name FROM public.events WHERE id = NEW.event_id;
  IF _owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id)
    VALUES (_owner_id, 'gallery_view', 'Someone viewed your gallery',
      'Your gallery "' || _event_name || '" was just viewed by a guest.', NEW.event_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_event_view
  AFTER INSERT ON public.event_views
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_view();

-- Trigger: Notify on photo_comments insert
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id uuid;
  _event_name text;
BEGIN
  SELECT user_id, name INTO _owner_id, _event_name FROM public.events WHERE id = NEW.event_id;
  IF _owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, photo_id)
    VALUES (_owner_id, 'new_comment', 'New comment on your photo',
      COALESCE(NEW.guest_name, 'A guest') || ' commented on a photo in "' || _event_name || '".', NEW.event_id, NEW.photo_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON public.photo_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Trigger: Notify on guest_selections insert
CREATE OR REPLACE FUNCTION public.notify_on_selection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id uuid;
  _event_name text;
BEGIN
  SELECT user_id, name INTO _owner_id, _event_name FROM public.events WHERE id = NEW.event_id;
  IF _owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id)
    VALUES (_owner_id, 'new_selection', 'New selection submitted',
      NEW.guest_name || ' submitted their photo selection for "' || _event_name || '".', NEW.event_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_selection
  AFTER INSERT ON public.guest_selections
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_selection();
