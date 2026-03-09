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

DROP POLICY IF EXISTS "Super admins can view templates" ON public.templates;
CREATE POLICY "Super admins can view templates"
ON public.templates
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can create templates" ON public.templates;
CREATE POLICY "Super admins can create templates"
ON public.templates
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Super admins can update templates" ON public.templates;
CREATE POLICY "Super admins can update templates"
ON public.templates
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can delete templates" ON public.templates;
CREATE POLICY "Super admins can delete templates"
ON public.templates
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_published ON public.templates(published);