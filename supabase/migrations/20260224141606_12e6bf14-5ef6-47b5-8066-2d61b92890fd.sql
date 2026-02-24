-- Change default for is_published to true so new events are automatically published
ALTER TABLE public.events ALTER COLUMN is_published SET DEFAULT true;