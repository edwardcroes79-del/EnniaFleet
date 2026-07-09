-- Create vehicle-photos bucket if missing
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid duplicates, then recreate
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_photos_public_read') THEN
    DROP POLICY "vehicle_photos_public_read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_photos_admin_insert') THEN
    DROP POLICY "vehicle_photos_admin_insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_photos_admin_delete') THEN
    DROP POLICY "vehicle_photos_admin_delete" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "vehicle_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "vehicle_photos_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ));

CREATE POLICY "vehicle_photos_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vehicle-photos' AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ));