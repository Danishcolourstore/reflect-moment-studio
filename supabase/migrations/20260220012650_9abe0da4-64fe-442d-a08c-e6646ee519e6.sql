
-- Drop restrictive SELECT policies on events
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Public can view published events" ON public.events;

-- Recreate as PERMISSIVE (OR logic: owner sees all, public sees published)
CREATE POLICY "Users can view own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  USING (is_published = true);
