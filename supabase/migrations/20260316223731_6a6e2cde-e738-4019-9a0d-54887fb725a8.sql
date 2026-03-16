
-- Instagram performance snapshots
CREATE TABLE public.instagram_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  period text NOT NULL DEFAULT 'weekly',
  followers integer NOT NULL DEFAULT 0,
  followers_gained integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  profile_visits integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  link_clicks integer NOT NULL DEFAULT 0,
  reels_count integer NOT NULL DEFAULT 0,
  posts_count integer NOT NULL DEFAULT 0,
  stories_count integer NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own snapshots" ON public.instagram_snapshots
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

-- Competitors tracking
CREATE TABLE public.instagram_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  username text NOT NULL,
  display_name text,
  followers integer NOT NULL DEFAULT 0,
  avg_likes integer NOT NULL DEFAULT 0,
  avg_comments integer NOT NULL DEFAULT 0,
  posts_per_week numeric(4,1) NOT NULL DEFAULT 0,
  reels_percentage integer NOT NULL DEFAULT 0,
  content_focus text,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photographer_id, username)
);

ALTER TABLE public.instagram_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own competitors" ON public.instagram_competitors
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);
