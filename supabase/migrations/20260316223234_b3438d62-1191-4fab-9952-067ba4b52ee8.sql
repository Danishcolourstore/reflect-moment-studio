
-- Leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  source_type text NOT NULL DEFAULT 'gallery',
  source_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  source_event_name text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own leads" ON public.leads
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

CREATE POLICY "Public can insert leads" ON public.leads
  FOR INSERT TO public
  WITH CHECK (true);

-- Packages table
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  name text NOT NULL,
  tier text NOT NULL DEFAULT 'basic',
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  add_ons jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own packages" ON public.packages
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

CREATE POLICY "Public can view active packages" ON public.packages
  FOR SELECT TO public
  USING (is_active = true);

-- Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  event_type text NOT NULL DEFAULT 'Wedding',
  event_date date,
  status text NOT NULL DEFAULT 'pending',
  amount integer NOT NULL DEFAULT 0,
  advance_paid integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);
