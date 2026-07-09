---
title: Vehicle purchase fields and employee edit/delete
status: done
priority: high
type: feature
tags: [vehicles, employees, ui]
created_by: agent
created_at: 2026-07-09T20:20:00Z
position: 7
---

## Notes
User requested:
- Add Purchase price and Purchase date editing to the vehicle edit form.
- Add employee edit and soft-delete capabilities.

## Checklist
- [x] Add Purchase price and Purchase date inputs to `src/pages/vehicles/[id]/edit.tsx`
- [x] Add `profileService.softDelete` in `src/services/fleetService.ts`
- [x] Create `src/pages/employees/[id]/edit.tsx`
- [x] Add edit/delete links/buttons in `src/pages/employees/index.tsx`
- [x] Run build check

## Acceptance
- Admin can edit Purchase price and Purchase date on a vehicle.
- Admin can edit an employee's details.
- Admin can soft-delete an employee from the employees list.