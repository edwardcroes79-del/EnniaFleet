-- Create maintenance_types table
CREATE TABLE IF NOT EXISTS public.maintenance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed defaults
INSERT INTO public.maintenance_types (name)
VALUES
  ('Oil change'),
  ('Tire replacement'),
  ('Brake service'),
  ('General repair'),
  ('Small service'),
  ('General service'),
  ('Annual inspection')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.maintenance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_maintenance_types"
  ON public.maintenance_types
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_maintenance_types"
  ON public.maintenance_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'
    )
  );