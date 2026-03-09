
-- Drop and recreate policies for tables that already exist
DO $$ BEGIN
  -- platform_features
  DROP POLICY IF EXISTS "Public can view enabled features" ON public.platform_features;
  DROP POLICY IF EXISTS "Super Admin manage features" ON public.platform_features;
  -- platform_layouts
  DROP POLICY IF EXISTS "Public can view active layouts" ON public.platform_layouts;
  DROP POLICY IF EXISTS "Super Admin manage layouts" ON public.platform_layouts;
  -- platform_ui_settings
  DROP POLICY IF EXISTS "Public can view ui settings" ON public.platform_ui_settings;
  DROP POLICY IF EXISTS "Super Admin manage ui settings" ON public.platform_ui_settings;
  -- platform_permissions
  DROP POLICY IF EXISTS "Public can view permissions" ON public.platform_permissions;
  DROP POLICY IF EXISTS "Super Admin manage permissions" ON public.platform_permissions;
END $$;

CREATE POLICY "Public can view enabled features" ON public.platform_features FOR SELECT USING (is_enabled = true);
CREATE POLICY "Super Admin manage features" ON public.platform_features FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Public can view active layouts plat" ON public.platform_layouts FOR SELECT USING (is_active = true);
CREATE POLICY "Super Admin manage layouts plat" ON public.platform_layouts FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Public can view ui settings" ON public.platform_ui_settings FOR SELECT USING (true);
CREATE POLICY "Super Admin manage ui settings" ON public.platform_ui_settings FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Public can view permissions" ON public.platform_permissions FOR SELECT USING (true);
CREATE POLICY "Super Admin manage permissions" ON public.platform_permissions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
