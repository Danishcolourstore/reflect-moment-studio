-- Harden role helper to support role-based security policies safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add a private table for server-side access code verification
CREATE TABLE IF NOT EXISTS public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage access codes" ON public.access_codes;
CREATE POLICY "Super admins can manage access codes"
ON public.access_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed current access codes as SHA-256 hashes so plaintext codes are no longer in the client bundle.
INSERT INTO public.access_codes (code_hash, label, is_active)
VALUES
  (encode(digest('291219', 'sha256'), 'hex'), 'legacy_access_1', true),
  (encode(digest('010126', 'sha256'), 'hex'), 'legacy_access_2', true),
  (encode(digest('141220', 'sha256'), 'hex'), 'legacy_access_3', true),
  (encode(digest('141120', 'sha256'), 'hex'), 'legacy_user_code_1', true),
  (encode(digest('150847', 'sha256'), 'hex'), 'legacy_user_code_2', true)
ON CONFLICT (code_hash) DO NOTHING;

-- Store public access verification attempts server-side.
CREATE TABLE IF NOT EXISTS public.access_code_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_code_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage access code attempts" ON public.access_code_attempts;
CREATE POLICY "Super admins can manage access code attempts"
ON public.access_code_attempts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE UNIQUE INDEX IF NOT EXISTS access_code_attempts_subject_idx
ON public.access_code_attempts (subject);

-- Server-side access-code verification with lockout.
CREATE OR REPLACE FUNCTION public.verify_access_code(code_input text, subject_input text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_code text;
  subject_key text;
  attempt_row public.access_code_attempts%ROWTYPE;
  is_valid boolean;
  next_attempt_count integer;
BEGIN
  normalized_code := regexp_replace(coalesce(code_input, ''), '\D', '', 'g');
  subject_key := left(coalesce(nullif(subject_input, ''), 'anonymous'), 160);

  IF length(normalized_code) <> 6 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_format');
  END IF;

  SELECT * INTO attempt_row
  FROM public.access_code_attempts
  WHERE subject = subject_key;

  IF FOUND AND attempt_row.locked_until IS NOT NULL AND attempt_row.locked_until > now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'locked', true,
      'retry_after', greatest(1, ceil(extract(epoch from (attempt_row.locked_until - now()))::numeric)::int)
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.access_codes
    WHERE is_active = true
      AND code_hash = encode(digest(normalized_code, 'sha256'), 'hex')
  ) INTO is_valid;

  IF is_valid THEN
    DELETE FROM public.access_code_attempts WHERE subject = subject_key;
    RETURN jsonb_build_object('valid', true);
  END IF;

  next_attempt_count := coalesce(attempt_row.attempt_count, 0) + 1;

  INSERT INTO public.access_code_attempts (subject, attempt_count, locked_until, updated_at)
  VALUES (
    subject_key,
    next_attempt_count,
    CASE WHEN next_attempt_count >= 3 THEN now() + interval '60 seconds' ELSE NULL END,
    now()
  )
  ON CONFLICT (subject) DO UPDATE
  SET attempt_count = EXCLUDED.attempt_count,
      locked_until = EXCLUDED.locked_until,
      updated_at = now();

  RETURN jsonb_build_object(
    'valid', false,
    'locked', next_attempt_count >= 3,
    'attempts', next_attempt_count,
    'remaining', greatest(0, 3 - next_attempt_count),
    'retry_after', CASE WHEN next_attempt_count >= 3 THEN 60 ELSE NULL END
  );
END;
$$;

-- Harden admin PIN attempt policies: no public delete/update/select bypass.
DROP POLICY IF EXISTS "Public manage pin attempts" ON public.admin_pin_attempts;
DROP POLICY IF EXISTS "Admin can manage pin attempts" ON public.admin_pin_attempts;
CREATE POLICY "Admin can manage pin attempts"
ON public.admin_pin_attempts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Server-side admin PIN verification with lockout; no client-side lockout trust.
CREATE OR REPLACE FUNCTION public.verify_admin_pin(pin_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
  input_hash text;
  attempt_row public.admin_pin_attempts%ROWTYPE;
  next_attempt_count integer;
BEGIN
  SELECT * INTO attempt_row
  FROM public.admin_pin_attempts
  WHERE ip_hint = 'global_admin_pin';

  IF FOUND AND attempt_row.locked_at IS NOT NULL AND attempt_row.locked_at > now() - interval '15 minutes' THEN
    RETURN jsonb_build_object('valid', false, 'locked', true, 'error', 'too_many_attempts');
  END IF;

  SELECT value INTO stored_hash FROM public.platform_settings WHERE key = 'admin_pin_hash';
  IF stored_hash IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'not_configured');
  END IF;

  input_hash := encode(digest(coalesce(pin_input, ''), 'sha256'), 'hex');

  IF input_hash = stored_hash THEN
    DELETE FROM public.admin_pin_attempts WHERE ip_hint = 'global_admin_pin';
    RETURN jsonb_build_object('valid', true);
  END IF;

  next_attempt_count := coalesce(attempt_row.attempt_count, 0) + 1;

  INSERT INTO public.admin_pin_attempts (ip_hint, attempt_count, locked_at, updated_at)
  VALUES (
    'global_admin_pin',
    next_attempt_count,
    CASE WHEN next_attempt_count >= 3 THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (ip_hint) DO UPDATE
  SET attempt_count = EXCLUDED.attempt_count,
      locked_at = EXCLUDED.locked_at,
      updated_at = now();

  RETURN jsonb_build_object(
    'valid', false,
    'locked', next_attempt_count >= 3,
    'remaining', greatest(0, 3 - next_attempt_count)
  );
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS admin_pin_attempts_ip_hint_idx
ON public.admin_pin_attempts (ip_hint)
WHERE ip_hint IS NOT NULL;

-- Remove overly broad public profile access and expose only safe public fields via a view.
DROP POLICY IF EXISTS "Public can read profiles for watermark" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profile_watermarks AS
SELECT
  user_id,
  studio_name,
  avatar_url,
  studio_logo_url,
  studio_accent_color,
  watermark_text,
  watermark_opacity,
  watermark_position
FROM public.profiles;

ALTER VIEW public.public_profile_watermarks SET (security_invoker = true);

DROP POLICY IF EXISTS "Public can read watermark profile fields" ON public.profiles;
CREATE POLICY "Public can read watermark profile fields"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (false);

-- Remove public access to sensitive live-session credentials and expose safe public fields by code.
DROP POLICY IF EXISTS "Public can read live sessions by code" ON public.cheetah_sessions;

CREATE OR REPLACE FUNCTION public.get_public_cheetah_session(p_code text)
RETURNS TABLE (
  id uuid,
  session_code text,
  title text,
  event_id uuid,
  is_live boolean,
  status text,
  public_view_count integer,
  total_photos integer,
  created_at timestamptz,
  updated_at timestamptz,
  last_upload_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.session_code,
    s.title,
    s.event_id,
    s.is_live,
    s.status,
    s.public_view_count,
    s.total_photos,
    s.created_at,
    s.updated_at,
    s.last_upload_at,
    s.expires_at
  FROM public.cheetah_sessions s
  WHERE s.session_code = p_code
    AND s.is_live = true
    AND (s.expires_at IS NULL OR s.expires_at > now())
  LIMIT 1;
$$;

-- Remove anonymous full storybook control.
DROP POLICY IF EXISTS "Allow anon storybook access" ON public.storybooks;

-- Ensure storybook content blocks cannot be anonymously modified either.
DROP POLICY IF EXISTS "Allow anon storybook blocks access" ON public.storybook_blocks;
DROP POLICY IF EXISTS "Anon can manage storybook blocks" ON public.storybook_blocks;
