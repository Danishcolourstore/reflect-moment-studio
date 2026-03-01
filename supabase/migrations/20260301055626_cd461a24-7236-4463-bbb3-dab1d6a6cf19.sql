
-- Add gallery_password column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gallery_password text;

-- Add description column to gallery_chapters
ALTER TABLE public.gallery_chapters ADD COLUMN IF NOT EXISTS description text;

-- Add DELETE policy for notifications so users can delete their read notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications"
      ON public.notifications
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add DELETE policy for photo_comments so event owners can delete comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'photo_comments' AND policyname = 'Event owners can delete comments'
  ) THEN
    CREATE POLICY "Event owners can delete comments"
      ON public.photo_comments
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = photo_comments.event_id
          AND events.user_id = auth.uid()
        )
      );
  END IF;
END $$;
