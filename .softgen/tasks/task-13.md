---
title: Maintenance editing
status: in_progress
priority: high
type: feature
tags: [maintenance, ui, crud]
created_by: agent
created_at: 2026-07-10T03:00:00Z
position: 13
---

## Notes
Maintenance records currently only have a create page and list. Add edit page and edit links.

## Checklist
- [ ] Add `maintenanceService.get` and `maintenanceService.update` to fleetService
- [ ] Create `src/pages/maintenance/[id]/edit.tsx`
- [ ] Add edit action to `src/pages/maintenance/index.tsx`
- [ ] Run build check

## Acceptance
- Admin can edit an existing maintenance record.
- Build passes.