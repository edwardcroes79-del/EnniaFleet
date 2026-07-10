---
title: Vehicle insurance number field
status: done
priority: high
type: feature
tags: [vehicles, insurance, form]
created_by: agent
created_at: 2026-07-10T03:30:00Z
position: 17
---

## Notes
Add an "Insurance number" field to the vehicle form, organized in an Insurance tab. The schema already provides `insurance_policy_number`, so no migration was needed.

## Checklist
- [x] Confirm vehicles table has insurance_policy_number column
- [x] Update src/pages/vehicles/new.tsx with Insurance tab and number field
- [x] Update src/pages/vehicles/[id]/edit.tsx with Insurance tab and number field
- [x] Run build check

## Acceptance
- Users can enter an insurance number when creating/editing a vehicle.
- Build passes.