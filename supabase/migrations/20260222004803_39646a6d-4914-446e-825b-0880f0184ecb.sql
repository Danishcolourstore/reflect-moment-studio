
-- Add storage_limit_mb column to profiles (NULL = unlimited, default 5120 = 5GB)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS storage_limit_mb bigint DEFAULT 5120;

-- Add platform_settings table for global admin config
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write platform_settings
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('default_storage_limit_mb', '5120'),
  ('maintenance_mode', 'false'),
  ('platform_name', 'MirrorAI')
ON CONFLICT (key) DO NOTHING;
