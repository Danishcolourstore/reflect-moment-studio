
-- Insert super_admin role for Danishsubair@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'super_admin'::app_role
FROM public.profiles p
WHERE p.email = 'Danishsubair@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Allow admins/super_admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
);

-- Allow super_admin to insert roles
CREATE POLICY "Super admin can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
);

-- Allow super_admin to delete roles (except super_admin role)
CREATE POLICY "Super admin can delete roles"
ON public.user_roles FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin')
  AND role != 'super_admin'
);
