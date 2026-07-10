CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'FleetCommand',
  logo_url text,
  currency text NOT NULL DEFAULT 'AWG',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'app_settings_public_read') THEN
    CREATE POLICY app_settings_public_read ON public.app_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'app_settings_admin_all') THEN
    CREATE POLICY app_settings_admin_all ON public.app_settings FOR ALL USING (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_public_read') THEN
    CREATE POLICY logos_public_read ON storage.objects FOR SELECT USING (bucket_id = 'logos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_admin_insert') THEN
    CREATE POLICY logos_admin_insert ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'logos' AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_admin_update') THEN
    CREATE POLICY logos_admin_update ON storage.objects FOR UPDATE USING (
      bucket_id = 'logos' AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_admin_delete') THEN
    CREATE POLICY logos_admin_delete ON storage.objects FOR DELETE USING (
      bucket_id = 'logos' AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );
  END IF;
END $$;