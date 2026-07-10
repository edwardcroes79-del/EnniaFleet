ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS reminder_email_subject text NOT NULL DEFAULT 'Reminder: Vehicle return due in 3 months',
ADD COLUMN IF NOT EXISTS reminder_email_body text NOT NULL DEFAULT 'Dear {{employee_name}}, your assigned vehicle {{vehicle}} is due for return on {{expected_return_date}}. Please make the necessary arrangements.';

CREATE TABLE IF NOT EXISTS public.email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'three_month_return',
  sent_at timestamp with time zone DEFAULT now(),
  recipient_email text NOT NULL
);

ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'email_reminders' AND policyname = 'admin_manage_email_reminders'
  ) THEN
    CREATE POLICY "admin_manage_email_reminders" ON public.email_reminders
      FOR ALL
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
      WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
  END IF;
END $$;