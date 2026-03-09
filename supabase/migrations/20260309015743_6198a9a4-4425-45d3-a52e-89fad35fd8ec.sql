-- Enable realtime for grid_templates table
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.grid_templates;
  EXCEPTION WHEN duplicate_object THEN
    -- Already in publication
  END;
END $$;