
-- Fix ALL RLS policies to be PERMISSIVE (default) instead of RESTRICTIVE

-- ═══ EVENTS ═══
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view published events" ON public.events FOR SELECT USING (is_published = true);
CREATE POLICY "Users can insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- ═══ PHOTOS ═══
DROP POLICY IF EXISTS "Public can view photos" ON public.photos;
DROP POLICY IF EXISTS "Users can view own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.photos;

CREATE POLICY "Public can view photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Users can insert own photos" ON public.photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON public.photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON public.photos FOR DELETE USING (auth.uid() = user_id);

-- ═══ FAVORITES ═══
DROP POLICY IF EXISTS "Anyone can create favorites" ON public.favorites;
DROP POLICY IF EXISTS "Anyone can delete favorites" ON public.favorites;
DROP POLICY IF EXISTS "Anyone can read favorites" ON public.favorites;

CREATE POLICY "Anyone can read favorites" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Anyone can create favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete favorites" ON public.favorites FOR DELETE USING (true);

-- ═══ GUEST SESSIONS ═══
DROP POLICY IF EXISTS "Anyone can create guest sessions" ON public.guest_sessions;
DROP POLICY IF EXISTS "Anyone can read guest sessions" ON public.guest_sessions;
DROP POLICY IF EXISTS "Anyone can update guest sessions" ON public.guest_sessions;

CREATE POLICY "Anyone can read guest sessions" ON public.guest_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create guest sessions" ON public.guest_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update guest sessions" ON public.guest_sessions FOR UPDATE USING (true);

-- ═══ PROFILES ═══
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
