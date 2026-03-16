
-- Domains table
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subdomain text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  is_primary boolean DEFAULT false,
  verification_status text DEFAULT 'pending',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own domains"
  ON public.domains FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read verified domains"
  ON public.domains FOR SELECT TO public
  USING (verification_status = 'verified' OR subdomain IS NOT NULL);

-- Contact submissions table
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_owner_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can view submissions"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (auth.uid() = site_owner_id);

CREATE POLICY "Public can insert submissions"
  ON public.contact_submissions FOR INSERT TO public
  WITH CHECK (true);

-- Auto-subdomain function
CREATE OR REPLACE FUNCTION public.auto_create_subdomain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_sub text;
  final_sub text;
  suffix text;
BEGIN
  base_sub := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'studio_name', NEW.email), '[^a-z0-9]+', '-', 'gi'));
  base_sub := trim(both '-' from base_sub);
  base_sub := left(base_sub, 30);
  IF base_sub = '' THEN base_sub := 'user'; END IF;

  final_sub := base_sub;
  WHILE EXISTS (SELECT 1 FROM public.domains WHERE subdomain = final_sub) LOOP
    suffix := lpad(floor(random() * 10000)::text, 4, '0');
    final_sub := base_sub || '-' || suffix;
  END LOOP;

  INSERT INTO public.domains (user_id, subdomain, is_primary, verification_status)
  VALUES (NEW.id, final_sub, true, 'verified');

  RETURN NEW;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.domains_update_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER domains_updated_at BEFORE UPDATE ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.domains_update_timestamp();
