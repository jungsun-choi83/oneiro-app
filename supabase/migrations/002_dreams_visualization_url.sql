-- Add visualization_url to dreams (public URL of the image in dream-images bucket)
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS visualization_url TEXT;

-- Ensure dream-images bucket exists with public read
INSERT INTO storage.buckets (id, name, public)
VALUES ('dream-images', 'dream-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
