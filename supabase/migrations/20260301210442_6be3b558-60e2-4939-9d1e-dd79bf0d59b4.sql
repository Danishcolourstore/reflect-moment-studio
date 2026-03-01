
-- Add columns to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS guest_face_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS qr_enabled BOOLEAN DEFAULT false;

-- Event QR Access tokens
CREATE TABLE IF NOT EXISTS event_qr_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  public_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Guest selfie uploads
CREATE TABLE IF NOT EXISTS guest_selfies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  qr_access_id UUID REFERENCES event_qr_access(id),
  image_url TEXT NOT NULL,
  processing_status TEXT DEFAULT 'pending',
  match_results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create validation trigger for processing_status
CREATE OR REPLACE FUNCTION validate_processing_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.processing_status NOT IN ('pending', 'processing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid processing_status: %', NEW.processing_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_guest_selfies_status
  BEFORE INSERT OR UPDATE ON guest_selfies
  FOR EACH ROW EXECUTE FUNCTION validate_processing_status();

-- Photo face embeddings
CREATE TABLE IF NOT EXISTS photo_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  embedding JSONB,
  azure_face_id TEXT,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Face indexing jobs
CREATE TABLE IF NOT EXISTS face_indexing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  photos_total INT DEFAULT 0,
  photos_processed INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_indexing_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'processing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_face_indexing_jobs_status
  BEFORE INSERT OR UPDATE ON face_indexing_jobs
  FOR EACH ROW EXECUTE FUNCTION validate_indexing_status();

-- Enable RLS
ALTER TABLE event_qr_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_selfies ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_indexing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read active QR" ON event_qr_access FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage QR access" ON event_qr_access FOR ALL USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "Public insert selfies" ON guest_selfies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read selfies" ON guest_selfies FOR SELECT USING (true);
CREATE POLICY "Public update selfies" ON guest_selfies FOR UPDATE USING (true);

CREATE POLICY "Owners manage photo_faces" ON photo_faces FOR ALL USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Public read photo_faces" ON photo_faces FOR SELECT USING (true);

CREATE POLICY "Owners manage indexing_jobs" ON face_indexing_jobs FOR ALL USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
