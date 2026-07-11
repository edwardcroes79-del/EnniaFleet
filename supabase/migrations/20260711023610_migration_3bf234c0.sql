CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_id uuid NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'two_week_service',
  sent_at timestamp with time zone NULL DEFAULT now(),
  recipient_email text NOT NULL
);

ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_manage_maintenance_reminders ON maintenance_reminders;
CREATE POLICY admin_manage_maintenance_reminders ON maintenance_reminders FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));