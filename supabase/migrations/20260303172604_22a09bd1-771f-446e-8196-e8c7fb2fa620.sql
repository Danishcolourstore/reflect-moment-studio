
-- Step 1: Add super_admin to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Add force_logout_requested to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_logout_requested boolean NOT NULL DEFAULT false;
