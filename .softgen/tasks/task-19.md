---
title: Configurable maintenance service types
status: in_progress
priority: high
type: feature
tags: [maintenance, settings, admin]
created_by: agent
created_at: 2026-07-10T04:00:00Z
position: 19
---

## Notes
Allow admins to manage maintenance service types in System settings, replacing the hardcoded dropdown list.

## Checklist
- [ ] Create maintenance_types table with RLS and seed defaults
- [ ] Add maintenanceTypeService to fleetService.ts
- [ ] Update maintenance new/edit pages to use dynamic service types
- [ ] Add maintenance type management to /admin/settings
- [ ] Run build check

## Acceptance
- Admin can add/edit service types in Settings.
- Maintenance form dropdown shows configured service types.
- Build passes.