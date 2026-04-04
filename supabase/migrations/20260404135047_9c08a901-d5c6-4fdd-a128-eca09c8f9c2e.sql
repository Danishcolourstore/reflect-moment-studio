-- Enable RLS on cheetah_activities
ALTER TABLE public.cheetah_activities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cheetah activities
CREATE POLICY "Authenticated users can read cheetah activities"
ON public.cheetah_activities
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert cheetah activities
CREATE POLICY "Authenticated users can insert cheetah activities"
ON public.cheetah_activities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable RLS on connection_test
ALTER TABLE public.connection_test ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read connection_test (it's a connectivity check table)
CREATE POLICY "Anyone can read connection test"
ON public.connection_test
FOR SELECT
USING (true);