-- FleetCommand schema
-- Add role and employee fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_expiry date,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  vehicle_id text UNIQUE NOT NULL,
  license_plate text NOT NULL,
  vin text,
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  color text,
  fuel_type text,
  transmission text,
  mileage integer NOT NULL DEFAULT 0,
  purchase_date date,
  purchase_price numeric(12,2),
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Assigned','Maintenance','Retired')),
  photo_url text,
  insurance_provider text,
  insurance_policy_number text,
  insurance_expiry date,
  registration_expiry date,
  service_due_date date,
  service_due_mileage integer,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date date,
  actual_return_date date,
  odometer_issue integer,
  odometer_return integer,
  fuel_level_issue text,
  fuel_level_return text,
  condition_comments text,
  is_active boolean NOT NULL DEFAULT true
);

-- Maintenance records
CREATE TABLE IF NOT EXISTS maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_provider text,
  cost numeric(12,2),
  mileage_at_service integer,
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  next_service_due date,
  next_service_due_mileage integer,
  notes text,
  receipt_url text
);

-- Fuel log
CREATE TABLE IF NOT EXISTS fuel_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fuel_date date NOT NULL DEFAULT CURRENT_DATE,
  odometer integer,
  liters numeric(8,2),
  gallons numeric(8,3),
  cost numeric(10,2),
  fuel_station text,
  receipt_url text,
  notes text
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_type text NOT NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved')),
  location text,
  description text,
  photos text[],
  resolution_notes text,
  resolved_at timestamptz
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  expiry_date date,
  notes text
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'vehicles_updated_at') THEN
    CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'assignments_updated_at') THEN
    CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'maintenance_updated_at') THEN
    CREATE TRIGGER maintenance_updated_at BEFORE UPDATE ON maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'fuel_log_updated_at') THEN
    CREATE TRIGGER fuel_log_updated_at BEFORE UPDATE ON fuel_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'incidents_updated_at') THEN
    CREATE TRIGGER incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'documents_updated_at') THEN
    CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
    CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to be idempotent
DROP POLICY IF EXISTS vehicles_admin_all ON vehicles;
DROP POLICY IF EXISTS vehicles_authenticated_read ON vehicles;
DROP POLICY IF EXISTS assignments_admin_all ON assignments;
DROP POLICY IF EXISTS assignments_employee_read_own ON assignments;
DROP POLICY IF EXISTS assignments_authenticated_read ON assignments;
DROP POLICY IF EXISTS maintenance_admin_all ON maintenance;
DROP POLICY IF EXISTS maintenance_employee_read ON maintenance;
DROP POLICY IF EXISTS fuel_log_admin_all ON fuel_log;
DROP POLICY IF EXISTS fuel_log_employee_own ON fuel_log;
DROP POLICY IF EXISTS incidents_admin_all ON incidents;
DROP POLICY IF EXISTS incidents_employee_own ON incidents;
DROP POLICY IF EXISTS documents_admin_all ON documents;
DROP POLICY IF EXISTS documents_employee_read ON documents;
DROP POLICY IF EXISTS audit_log_admin_read ON audit_log;

CREATE POLICY vehicles_admin_all ON vehicles FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY vehicles_authenticated_read ON vehicles FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY assignments_admin_all ON assignments FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY assignments_employee_read_own ON assignments FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY assignments_authenticated_read ON assignments FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY maintenance_admin_all ON maintenance FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY maintenance_employee_read ON maintenance FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY fuel_log_admin_all ON fuel_log FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY fuel_log_employee_own ON fuel_log FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY fuel_log_employee_insert ON fuel_log FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY incidents_admin_all ON incidents FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY incidents_employee_own ON incidents FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY incidents_employee_insert ON incidents FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY documents_admin_all ON documents FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY documents_employee_read ON documents FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY audit_log_admin_read ON audit_log FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Ensure trigger auto-creates profile row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();