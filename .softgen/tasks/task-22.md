---
title: Cron job status and countdown monitor
status: done
priority: high
type: feature
tags: [settings, cron, email, ui]
created_by: agent
created_at: 2026-07-11T21:12:00Z
position: 22
---
## Notes
Add a monitor section in System Settings that shows whether the last cron-run emails succeeded or failed, who received them, and a countdown to the next scheduled send for each employee.
## Checklist
- [x] Add status/error columns to email_reminders and maintenance_reminders
- [x] Update send-reminders and send-maintenance-reminders to record success/failure
- [x] Create /api/reminder-history endpoint returning history + upcoming countdowns
- [x] Add cron monitor card to /admin/settings with status badges and countdown timer
- [x] Regenerate Supabase types and run build check
## Acceptance
- Admin sees latest cron email status per employee with sent/failed badge
- Countdown shows time remaining until next scheduled cron run
- Errors are visible if a send failed