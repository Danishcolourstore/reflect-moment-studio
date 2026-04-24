-- 1. Functions search_path
CREATE OR REPLACE FUNCTION public.validate_indexing_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN
  IF NEW.status NOT IN ('pending', 'processing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_processing_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN
  IF NEW.processing_status NOT IN ('pending', 'processing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid processing_status: %', NEW.processing_status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.domains_update_timestamp()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

-- 2. Admin-only policies
DROP POLICY IF EXISTS "Public can manage activity log" ON public.admin_activity_log;
CREATE POLICY "Super admins manage activity log"
ON public.admin_activity_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Public can manage bulk emails" ON public.bulk_emails;
CREATE POLICY "Super admins manage bulk emails"
ON public.bulk_emails FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- retouch_styles.user_id is TEXT — cast auth.uid() to text
DROP POLICY IF EXISTS "Users manage own styles" ON public.retouch_styles;
CREATE POLICY "Users manage own retouch styles"
ON public.retouch_styles FOR ALL TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert cheetah activities" ON public.cheetah_activities;
CREATE POLICY "Authenticated users insert cheetah activities"
ON public.cheetah_activities FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Guest abuse vectors
DROP POLICY IF EXISTS "Anyone can delete favorites" ON public.favorites;
CREATE POLICY "Owners delete favorites for own events"
ON public.favorites FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = public.favorites.event_id AND e.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can update guest sessions" ON public.guest_sessions;
DROP POLICY IF EXISTS "Public update selfies" ON public.guest_selfies;
DROP POLICY IF EXISTS "Anyone can update guest registrations" ON public.guest_registrations;
DROP POLICY IF EXISTS "Anyone can update analytics public" ON public.event_analytics;
