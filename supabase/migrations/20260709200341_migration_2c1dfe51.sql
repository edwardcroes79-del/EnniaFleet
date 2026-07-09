DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fleet-documents-public-read'
  ) THEN
    CREATE POLICY "fleet-documents-public-read" ON storage.objects
      FOR SELECT USING (bucket_id = 'fleet-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fleet-documents-auth-insert'
  ) THEN
    CREATE POLICY "fleet-documents-auth-insert" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'fleet-documents' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fleet-documents-auth-update'
  ) THEN
    CREATE POLICY "fleet-documents-auth-update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'fleet-documents' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fleet-documents-auth-delete'
  ) THEN
    CREATE POLICY "fleet-documents-auth-delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'fleet-documents' AND auth.uid() IS NOT NULL);
  END IF;
END $$;