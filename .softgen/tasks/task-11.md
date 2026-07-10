---
title: Email reminders before assignment return
status: done
priority: high
type: feature
tags: [email, assignments, reminders, admin]
created_by: agent
created_at: 2026-07-10T01:43:00Z
position: 11
---

## Notes
Send an email reminder to the assigned employee 3 months before the expected return date. Reminder subject/body should be editable by Admin in System Settings. Use employee email from profiles.

## Checklist
- [x] Add reminder_email_subject and reminder_email_body to app_settings
- [x] Create email_reminders table to prevent duplicate sends
- [x] Update settingsService and admin/settings.tsx for editable templates
- [x] Create /api/send-reminders API route
- [x] Use Resend if RESEND_API_KEY is configured, otherwise log/send no email
- [x] Run build check

## Acceptance
- Admin can edit reminder email subject and body.
- Reminder is sent once per assignment when expected return is exactly 3 months away.
- Build passes.