-- Supabase security hardening — Migration 4: add missing RLS policies
--
-- These tables had RLS enabled but no policies (advisor: rls_enabled_no_policy),
-- which silently denied all access. Scope each to the owning studio so studio
-- owners can manage their own job/embedding rows. Clears all 3 outstanding
-- rls_enabled_no_policy warnings.

CREATE POLICY "face_index_jobs: studio owner full access"
ON public.face_index_jobs
FOR ALL
TO authenticated
USING (
    studio_id IN (
        SELECT id
        FROM public.studios
        WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    studio_id IN (
        SELECT id
        FROM public.studios
        WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "photo_ai_jobs: studio owner full access"
ON public.photo_ai_jobs
FOR ALL
TO authenticated
USING (
    studio_id IN (
        SELECT id
        FROM public.studios
        WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    studio_id IN (
        SELECT id
        FROM public.studios
        WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "photo_embeddings: studio owner read"
ON public.photo_embeddings
FOR SELECT
TO authenticated
USING (
    event_id IN (
        SELECT e.id
        FROM public.events e
        JOIN public.studios s
            ON s.id = e.studio_id
        WHERE s.owner_id = auth.uid()
    )
);
