
-- Add blog support columns to feed_posts
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'post';

-- Index for filtering by content type
CREATE INDEX IF NOT EXISTS idx_feed_posts_content_type ON public.feed_posts (content_type);
