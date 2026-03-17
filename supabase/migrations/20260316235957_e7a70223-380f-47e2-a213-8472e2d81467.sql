
-- Feature 5: Preset Marketplace
CREATE TABLE public.preset_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  preview_images TEXT[] DEFAULT '{}',
  before_after_pairs JSONB DEFAULT '[]',
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  download_url TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.preset_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preset_id UUID NOT NULL REFERENCES public.preset_marketplace(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, preset_id)
);

-- Feature 6: Weekly Mood Board Drop
CREATE TABLE public.mood_board_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  theme TEXT NOT NULL,
  cover_image TEXT,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  lighting_tip TEXT,
  pose_suggestion TEXT,
  color_palette TEXT[] DEFAULT '{}',
  recommended_preset_id UUID REFERENCES public.preset_marketplace(id),
  reference_images JSONB DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_number, year)
);

-- Feature 7: Save & Build Collections
CREATE TABLE public.user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  icon TEXT DEFAULT '📁',
  is_private BOOLEAN NOT NULL DEFAULT true,
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.user_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'post',
  item_id TEXT NOT NULL,
  item_title TEXT,
  item_image TEXT,
  item_data JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, item_id)
);

-- Feature 8: Photographer Spotlight
CREATE TABLE public.photographer_spotlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_name TEXT NOT NULL,
  photographer_id UUID,
  tagline TEXT,
  story TEXT NOT NULL,
  style_description TEXT,
  portrait_url TEXT,
  showcase_images TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  gallery_url TEXT,
  booking_url TEXT,
  instagram_handle TEXT,
  website_url TEXT,
  packages JSONB DEFAULT '[]',
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_number, year)
);

-- RLS policies
ALTER TABLE public.preset_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_board_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photographer_spotlights ENABLE ROW LEVEL SECURITY;

-- Preset marketplace: everyone can read published, sellers manage own
CREATE POLICY "Anyone can view published presets" ON public.preset_marketplace
  FOR SELECT USING (is_published = true);
CREATE POLICY "Sellers manage own presets" ON public.preset_marketplace
  FOR ALL TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

-- Preset purchases: users manage own
CREATE POLICY "Users view own purchases" ON public.preset_purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create purchases" ON public.preset_purchases
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Mood board drops: public read
CREATE POLICY "Anyone can view published mood boards" ON public.mood_board_drops
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage mood boards" ON public.mood_board_drops
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User collections: users manage own
CREATE POLICY "Users manage own collections" ON public.user_collections
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Collection items: users manage own
CREATE POLICY "Users manage own collection items" ON public.collection_items
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Photographer spotlights: public read
CREATE POLICY "Anyone can view published spotlights" ON public.photographer_spotlights
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage spotlights" ON public.photographer_spotlights
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
