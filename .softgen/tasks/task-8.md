---
title: Permanent employee deletion
status: in_progress
priority: high
type: feature
tags: [employees, admin, auth]
created_by: agent
created_at: 2026-07-10T01:20:00Z
position: 8
---

## Notes
Add a hard-delete option for employees. Must remove both the Supabase Auth user and the public.profiles row. Use server-side service role key.

## Checklist
- [ ] Create `/api/admin/delete-employee` endpoint using SUPABASE_SERVICE_ROLE_KEY
- [ ] Add `profileService.hardDelete()` client helper
- [ ] Add "Remove permanently" action in employees list for admins
- [ ] Validate build

## Acceptance
- Admin can permanently delete an employee from both auth and profiles.
- Build passes with no errors.