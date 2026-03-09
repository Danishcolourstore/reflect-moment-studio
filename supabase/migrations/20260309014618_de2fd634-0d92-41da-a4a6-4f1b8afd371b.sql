-- Enable realtime for the new templates table (super-admin template builder)
-- and confirm platform_settings is already in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;

-- Guard: also ensure platform_settings is tracked (may already be there)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
  EXCEPTION WHEN duplicate_object THEN
    -- Already in publication, skip
  END;
END $$;