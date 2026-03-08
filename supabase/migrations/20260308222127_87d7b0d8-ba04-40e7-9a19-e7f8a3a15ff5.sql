
-- Create website_templates table for admin-managed templates
CREATE TABLE public.website_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  
  -- Styling config
  font_family text NOT NULL DEFAULT '"Cormorant Garamond", Georgia, serif',
  ui_font_family text NOT NULL DEFAULT '"DM Sans", sans-serif',
  bg_color text NOT NULL DEFAULT '#0C0A07',
  text_color text NOT NULL DEFAULT '#F2EDE4',
  text_secondary_color text NOT NULL DEFAULT '#A69E8F',
  nav_bg text NOT NULL DEFAULT 'rgba(12,10,7,0.75)',
  nav_border text NOT NULL DEFAULT 'rgba(242,237,228,0.06)',
  header_style text NOT NULL DEFAULT 'transparent',
  hero_style text NOT NULL DEFAULT 'vows',
  card_bg text NOT NULL DEFAULT '#161310',
  footer_bg text NOT NULL DEFAULT '#0C0A07',
  footer_text_color text NOT NULL DEFAULT '#7A7365',
  
  -- Demo content (JSONB for flexibility)
  demo_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;

-- Public can read active templates
CREATE POLICY "Public can view active templates"
  ON public.website_templates
  FOR SELECT
  USING (is_active = true);

-- Super admins have full access
CREATE POLICY "Super admins manage templates"
  ON public.website_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed existing static templates
INSERT INTO public.website_templates (slug, label, description, sort_order, font_family, ui_font_family, bg_color, text_color, text_secondary_color, nav_bg, nav_border, header_style, hero_style, card_bg, footer_bg, footer_text_color, demo_content)
VALUES
  ('vows-elegance', 'Vows Elegance', 'Cinematic dark wedding template with full-bleed gallery and dramatic typography', 1,
   '"Cormorant Garamond", Georgia, serif', '"DM Sans", sans-serif',
   '#0C0A07', '#F2EDE4', '#A69E8F', 'rgba(12,10,7,0.75)', 'rgba(242,237,228,0.06)',
   'transparent', 'vows', '#161310', '#0C0A07', '#7A7365',
   '{"hero":{"headline":"Your Story, Beautifully Told","tagline":"Wedding & Portrait Photography","button_text":"View Portfolio","image_url":null},"portfolio":{"layout":"grid","max_images":20,"demo_images":[]},"about":{"bio":"Award-winning photographer specializing in timeless wedding and portrait photography.","profile_image_url":null},"services":[{"title":"Wedding Photography","description":"Full day coverage","icon":"camera"},{"title":"Portrait Sessions","description":"Studio & outdoor","icon":"people"}],"contact":{"heading":"Get In Touch","button_text":"Send Message"},"footer":{"text":"© 2025 Studio Name. All Rights Reserved.","show_social":true}}'::jsonb),
  ('editorial-luxury', 'Editorial Luxury', 'Fine-art editorial magazine layout with cream tones and elegant serif typography', 2,
   '"Playfair Display", Georgia, serif', '"DM Sans", sans-serif',
   '#F5F0EA', '#2B2A28', '#6B6560', 'rgba(245,240,234,0.92)', 'rgba(43,42,40,0.08)',
   'solid', 'editorial', '#FFFFFF', '#2B2A28', '#A09A92',
   '{"hero":{"headline":"Luxury Photography","tagline":"Fine Art Wedding & Editorial","button_text":"Explore","image_url":null},"portfolio":{"layout":"masonry","max_images":20,"demo_images":[]},"about":{"bio":"Specializing in fine-art editorial photography with a timeless aesthetic.","profile_image_url":null},"services":[{"title":"Editorial Shoots","description":"Magazine-quality photography","icon":"camera"},{"title":"Wedding Collections","description":"Curated luxury packages","icon":"heart"}],"contact":{"heading":"Let''s Create Together","button_text":"Inquire Now"},"footer":{"text":"© 2025 Studio. Crafted with passion.","show_social":true}}'::jsonb);
