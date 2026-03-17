-- Add richer face metadata columns
ALTER TABLE photo_faces ADD COLUMN IF NOT EXISTS face_rectangle JSONB DEFAULT NULL;
ALTER TABLE photo_faces ADD COLUMN IF NOT EXISTS confidence REAL DEFAULT NULL;
ALTER TABLE photo_faces ADD COLUMN IF NOT EXISTS person_cluster TEXT DEFAULT NULL;

-- Add face_count to face_indexing_jobs for quick stats
ALTER TABLE face_indexing_jobs ADD COLUMN IF NOT EXISTS faces_found INTEGER DEFAULT 0;
ALTER TABLE face_indexing_jobs ADD COLUMN IF NOT EXISTS error_message TEXT DEFAULT NULL;
ALTER TABLE face_indexing_jobs ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT NULL;

-- Enable realtime for indexing job progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.face_indexing_jobs;