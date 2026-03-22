
CREATE POLICY "Public can view published feed posts"
  ON public.feed_posts FOR SELECT
  TO anon
  USING (is_published = true);
