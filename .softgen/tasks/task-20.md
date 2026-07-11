---
title: Maintenance service reminder cron job and settings
status: done
priority: high
type: feature
tags: [cron, email, maintenance, settings]
created_by: agent
created_at: 2026-07-11T02:34:54Z
position: 20
---
## Notes
Send maintenance reminders ~2 weeks before next_service_due for maintenance logs with service_type "Small service" or "General service". Add service reminder email template configuration in System Settings and a test button.
## Checklist
- [x] Add service reminder email columns to app_settings
- [x] Create maintenance_reminders table for deduplication
- [x] Create /api/send-maintenance-reminders route
- [x] Add cron schedule to vercel.json
- [x] Add service reminder UI to /admin/settings
- [x] Add send test maintenance reminder endpoint and service method
- [x] Regenerate Supabase types and run build check
## Acceptance
- Cron runs daily and emails admin(s) about upcoming small/general services due within 2 weeks
- Admin can edit service reminder subject/body and send a test email