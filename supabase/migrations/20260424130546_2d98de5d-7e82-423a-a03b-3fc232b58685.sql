DROP INDEX IF EXISTS public.admin_pin_attempts_ip_hint_idx;
CREATE UNIQUE INDEX IF NOT EXISTS admin_pin_attempts_ip_hint_idx
ON public.admin_pin_attempts (ip_hint);