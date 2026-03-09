
-- Dashboard layouts table for role-based layouts
CREATE TABLE public.dashboard_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'photographer',
  layout_name TEXT NOT NULL DEFAULT 'Default',
  layout_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, layout_name)
);

-- Dashboard widgets library
CREATE TABLE public.dashboard_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_key TEXT NOT NULL UNIQUE,
  widget_name TEXT NOT NULL,
  widget_description TEXT,
  widget_icon TEXT DEFAULT 'LayoutGrid',
  default_width INTEGER NOT NULL DEFAULT 1,
  default_height INTEGER NOT NULL DEFAULT 1,
  min_width INTEGER DEFAULT 1,
  min_height INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dashboard modules (features that can be enabled/disabled)
CREATE TABLE public.dashboard_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  module_description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  roles TEXT[] DEFAULT ARRAY['photographer']::text[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dashboard settings (UI/UX configuration)
CREATE TABLE public.dashboard_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Navigation items configuration
CREATE TABLE public.dashboard_navigation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nav_key TEXT NOT NULL UNIQUE,
  nav_label TEXT NOT NULL,
  nav_icon TEXT NOT NULL DEFAULT 'Home',
  nav_route TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  roles TEXT[] DEFAULT ARRAY['photographer']::text[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.dashboard_navigation(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quick actions configuration
CREATE TABLE public.dashboard_quick_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_key TEXT NOT NULL UNIQUE,
  action_label TEXT NOT NULL,
  action_icon TEXT NOT NULL DEFAULT 'Plus',
  action_route TEXT,
  action_type TEXT NOT NULL DEFAULT 'navigate',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  roles TEXT[] DEFAULT ARRAY['photographer']::text[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_quick_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read for active items
CREATE POLICY "Public can view active layouts" ON public.dashboard_layouts FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active widgets" ON public.dashboard_widgets FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view enabled modules" ON public.dashboard_modules FOR SELECT USING (is_enabled = true);
CREATE POLICY "Public can view settings" ON public.dashboard_settings FOR SELECT USING (true);
CREATE POLICY "Public can view visible navigation" ON public.dashboard_navigation FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view visible actions" ON public.dashboard_quick_actions FOR SELECT USING (is_visible = true);

-- Super Admin full access
CREATE POLICY "Super Admin manage layouts" ON public.dashboard_layouts FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage widgets" ON public.dashboard_widgets FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage modules" ON public.dashboard_modules FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage settings" ON public.dashboard_settings FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage navigation" ON public.dashboard_navigation FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin manage actions" ON public.dashboard_quick_actions FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Enable realtime for dashboard tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_layouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_settings;
