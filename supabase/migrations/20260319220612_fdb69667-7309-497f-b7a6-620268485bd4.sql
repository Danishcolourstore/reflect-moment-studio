
CREATE OR REPLACE FUNCTION public.verify_gallery_pin(event_id UUID, pin_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT gallery_pin INTO stored_pin FROM events WHERE id = event_id AND is_published = true;
  IF stored_pin IS NULL OR stored_pin = '' THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'no_pin_set');
  END IF;
  IF stored_pin = pin_input THEN
    RETURN jsonb_build_object('valid', true);
  ELSE
    RETURN jsonb_build_object('valid', false);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_gallery_password(event_id UUID, password_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_password TEXT;
BEGIN
  SELECT gallery_password INTO stored_password FROM events WHERE id = event_id AND is_published = true;
  IF stored_password IS NULL OR stored_password = '' THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'no_password_set');
  END IF;
  IF stored_password = password_input THEN
    RETURN jsonb_build_object('valid', true);
  ELSE
    RETURN jsonb_build_object('valid', false);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_download_password(event_id UUID, password_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requires_password BOOLEAN;
  stored_password TEXT;
BEGIN
  SELECT download_requires_password, download_password INTO requires_password, stored_password FROM events WHERE id = event_id AND is_published = true;
  IF requires_password IS NOT TRUE OR stored_password IS NULL OR stored_password = '' THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'no_password_required');
  END IF;
  IF stored_password = password_input THEN
    RETURN jsonb_build_object('valid', true);
  ELSE
    RETURN jsonb_build_object('valid', false);
  END IF;
END;
$$;
