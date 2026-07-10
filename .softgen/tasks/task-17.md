---
title: Vehicle insurance number field
status: in_progress
priority: high
type: feature
tags: [vehicles, insurance, form]
created_by: agent
created_at: 2026-07-10T03:30:00Z
position: 17
---

## Notes
Add an "Insurance number" field to the vehicle form, organized in an Insurance tab/section.

## Checklist
- [ ] Add insurance_number column to vehicles table if missing
- [ ] Update src/pages/vehicles/new.tsx with Insurance number field
- [ ] Update src/pages/vehicles/[id]/edit.tsx with Insurance number field
- [ ] Regenerate Supabase types
- [ ] Run build check

## Acceptance
- Users can enter an insurance number when creating/editing a vehicle.
- Build passes.