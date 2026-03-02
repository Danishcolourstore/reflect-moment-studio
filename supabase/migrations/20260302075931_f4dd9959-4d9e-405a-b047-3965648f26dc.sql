-- Add unique constraint on platform_settings.key if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_key_unique') THEN
    ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_key_unique UNIQUE (key);
  END IF;
END $$;

-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin_pin_attempts table to track failed attempts
CREATE TABLE IF NOT EXISTS public.admin_pin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hint text,
  attempt_count integer NOT NULL DEFAULT 0,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_pin_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public manage pin attempts" ON public.admin_pin_attempts FOR ALL USING (true) WITH CHECK (true);

-- Function to verify admin PIN
CREATE OR REPLACE FUNCTION public.verify_admin_pin(pin_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
  input_hash text;
BEGIN
  SELECT value INTO stored_hash FROM platform_settings WHERE key = 'admin_pin_hash';
  IF stored_hash IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'No PIN configured');
  END IF;
  
  input_hash := encode(digest(pin_input, 'sha256'), 'hex');
  
  IF input_hash = stored_hash THEN
    RETURN jsonb_build_object('valid', true);
  ELSE
    RETURN jsonb_build_object('valid', false);
  END IF;
END;
$$;

-- Function to update admin PIN (via reset token)
CREATE OR REPLACE FUNCTION public.update_admin_pin(new_pin text, reset_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_token text;
BEGIN
  SELECT value INTO stored_token FROM platform_settings WHERE key = 'admin_reset_token';
  
  IF stored_token IS NULL OR stored_token <> reset_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid reset token');
  END IF;
  
  UPDATE platform_settings SET value = encode(digest(new_pin, 'sha256'), 'hex'), updated_at = now() WHERE key = 'admin_pin_hash';
  DELETE FROM platform_settings WHERE key = 'admin_reset_token';
  
  RETURN jsonb_build_object('success', true);
END;
$$;