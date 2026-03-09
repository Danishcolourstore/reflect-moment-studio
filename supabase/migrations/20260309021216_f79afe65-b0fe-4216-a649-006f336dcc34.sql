
-- Platform features table (for custom feature creation)
CREATE TABLE public.platform_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_icon TEXT DEFAULT 'Puzzle',
  feature_description TEXT,
  feature_route TEXT,
  feature_type TEXT NOT NULL DEFAULT 'page',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  allowed_roles TEXT[] DEFAULT ARRAY['photographer', 'studio_owner']::text[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform layouts for all pages
CREATE TABLE public.platform_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL,
  layout_name TEXT NOT NULL DEFAULT 'Default',
  layout_type TEXT NOT NULL DEFAULT 'grid',
  layout_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_roles TEXT[] DEFAULT ARRAY['photographer']::text[],
  responsive_config JSONB DEFAULT '{"mobile": [], "tablet": [], "desktop": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_key, layout_name)
);

-- Platform UI/UX settings
CREATE TABLE public.platform_ui_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(setting_category, setting_key)
);

-- Platform permissions (role-feature mapping)
CREATE TABLE public.platform_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  custom_permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, feature_key)
);

-- Enable RLS
ALTER TABLE public.platform_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_ui_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read for active items
CREATE POLICY "Public can view enabled features" ON public.platform_features FOR SELECT USING (is_enabled = true);
CREATE POLICY "Public can view active layouts" ON public.platform_layouts FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view ui settings" ON public.platform_ui_settings FOR SELECT USING (true);
CREATE POLICY "Public can view permissions" ON public.platform_permissions FOR SELECT USING (true);

-- Super Admin full access
CREATE POLICY "Super Admin manage features" ON public.platform_features FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage layouts" ON public.platform_layouts FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage ui settings" ON public.platform_ui_settings FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage permissions" ON public.platform_permissions FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_features;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_layouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_ui_settings;
