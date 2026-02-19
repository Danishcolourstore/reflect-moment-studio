
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  studio_name TEXT NOT NULL DEFAULT 'My Studio',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, studio_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'studio_name', 'My Studio'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_type TEXT NOT NULL DEFAULT 'Wedding',
  cover_url TEXT,
  gallery_pin TEXT,
  photo_count INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);
-- Public gallery access
CREATE POLICY "Public can view events by id" ON public.events FOR SELECT USING (true);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  file_name TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos" ON public.photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photos" ON public.photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON public.photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON public.photos FOR DELETE USING (auth.uid() = user_id);
-- Public gallery photos
CREATE POLICY "Public can view photos" ON public.photos FOR SELECT USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('event-covers', 'event-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-photos', 'gallery-photos', true);

-- Storage policies
CREATE POLICY "Users can upload event covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update event covers" ON storage.objects FOR UPDATE USING (bucket_id = 'event-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view event covers" ON storage.objects FOR SELECT USING (bucket_id = 'event-covers');
CREATE POLICY "Users can upload gallery photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete gallery photos" ON storage.objects FOR DELETE USING (bucket_id = 'gallery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view gallery photos" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-photos');
