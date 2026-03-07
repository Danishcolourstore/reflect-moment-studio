
DROP POLICY IF EXISTS "Owners can manage own profile" ON public.studio_profiles;

CREATE POLICY "Owners can manage own profile"
ON public.studio_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
