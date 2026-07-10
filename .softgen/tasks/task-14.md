---
title: Fuel and incident editing
status: done
priority: medium
type: feature
tags: [fuel, incidents, editing, ui]
created_by: agent
created_at: 2026-07-10T02:20:00Z
position: 14
---

## Notes
Allow users to edit fuel logs and incident reports.

## Checklist
- [x] Add fuelService.get() and fuelService.update()
- [x] Add incidentService.get()
- [x] Create src/pages/fuel/[id]/edit.tsx
- [x] Create src/pages/incidents/[id]/edit.tsx
- [x] Add Edit links to list pages
- [x] Run build check

## Acceptance
- Admin can edit fuel logs and incidents.
- Build passes.