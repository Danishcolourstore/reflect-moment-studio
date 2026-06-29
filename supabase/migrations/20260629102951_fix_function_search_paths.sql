-- Supabase security hardening — Migration 3: fix mutable function search_path
--
-- Pins an explicit search_path on SECURITY DEFINER / trigger functions so they
-- cannot be hijacked via a mutable search_path (advisor: function_search_path_mutable).
-- Clears all 8 outstanding function_search_path_mutable warnings.

ALTER FUNCTION public.verify_gallery_pin(uuid, text)
SET search_path = public, extensions;

ALTER FUNCTION public.verify_gallery_pin(uuid, text, text)
SET search_path = public, extensions;

ALTER FUNCTION public.verify_gallery_password(uuid, text)
SET search_path = public, extensions;

ALTER FUNCTION public.verify_gallery_password(uuid, text, text)
SET search_path = public, extensions;

ALTER FUNCTION public.notify_new_studio()
SET search_path = public, extensions;

ALTER FUNCTION public.update_chapter_photo_count()
SET search_path = public, extensions;

ALTER FUNCTION public.is_chapter_visible_to_guest(text, timestamptz)
SET search_path = public, extensions;

ALTER FUNCTION public.phash_hamming(bigint, bigint)
SET search_path = public, extensions;
