---
title: Dashboard manual service reminder alerts
status: done
priority: high
type: feature
tags: [dashboard, alerts, maintenance, email]
created_by: agent
created_at: 2026-07-11T02:45:39Z
position: 21
---

## Notes
Add an Alerts section on the dashboard that lists vehicles/maintenance records due for service (Small service and General service types with next_service_due within 14 days or overdue). Each alert should have a send icon to manually trigger a service reminder email to admins using the configured service reminder template.

## Checklist
- [x] Create /api/send-manual-service-reminder.ts endpoint
- [x] Add sendManualServiceReminder method to settingsService
- [x] Update dashboard Alerts to show due service records with send icon
- [x] Run build check

## Acceptance
- Dashboard shows upcoming Small service / General service reminders
- Clicking the send icon emails admins and shows a success toast
- No duplicate email is sent for the same maintenance record