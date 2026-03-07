
CREATE POLICY "Allow anon storybook access" ON public.storybooks
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
