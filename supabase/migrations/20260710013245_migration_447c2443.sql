ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'admin_manage_settings'
  ) THEN
    CREATE POLICY "admin_manage_settings" ON public.app_settings
      FOR ALL
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
      WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'public_read_settings'
  ) THEN
    CREATE POLICY "public_read_settings" ON public.app_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;