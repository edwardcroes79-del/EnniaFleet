-- Create incident_types table
CREATE TABLE IF NOT EXISTS public.incident_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.incident_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incident_types_public_read" ON public.incident_types
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "incident_types_admin_all" ON public.incident_types
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

INSERT INTO public.incident_types (name) VALUES
  ('Accident'),
  ('Damage'),
  ('Traffic fine'),
  ('Mechanical issue'),
  ('Breakdown')
ON CONFLICT (name) DO NOTHING;

-- Create incident_photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident_photos', 'incident_photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "incident_photos_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'incident_photos');

CREATE POLICY "incident_photos_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident_photos');