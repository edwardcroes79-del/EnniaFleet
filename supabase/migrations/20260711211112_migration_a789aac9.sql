ALTER TABLE email_reminders
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE maintenance_reminders
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS error_message text;

UPDATE email_reminders SET status = 'sent' WHERE status = 'pending';
UPDATE maintenance_reminders SET status = 'sent' WHERE status = 'pending';

ALTER TABLE email_reminders ADD CONSTRAINT email_reminders_status_check CHECK (status IN ('pending', 'sent', 'failed'));
ALTER TABLE maintenance_reminders ADD CONSTRAINT maintenance_reminders_status_check CHECK (status IN ('pending', 'sent', 'failed'));