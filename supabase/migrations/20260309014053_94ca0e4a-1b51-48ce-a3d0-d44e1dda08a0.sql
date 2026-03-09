-- Create reusable templates table for super admin website/studio template builder
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Super admins can fully manage templates
DROP POLICY IF EXISTS "Super admins can manage templates" ON public.templates;
CREATE POLICY "Super admins can manage templates"
ON public.templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Authenticated users can read published templates (for Branding/Studio selection flow)
DROP POLICY IF EXISTS "Authenticated can view published templates" ON public.templates;
CREATE POLICY "Authenticated can view published templates"
ON public.templates
FOR SELECT
TO authenticated
USING (
  published = true
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE INDEX IF NOT EXISTS idx_templates_published ON public.templates(published);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);