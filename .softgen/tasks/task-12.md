---
title: Assignment editing
status: in_progress
priority: high
type: feature
tags: [assignments, ui, crud]
created_by: agent
created_at: 2026-07-10T03:00:00Z
position: 12
---

## Notes
Assignments currently only have a create page and list. Add edit page and edit links.

## Checklist
- [ ] Add `assignmentService.get` and `assignmentService.update` to fleetService
- [ ] Create `src/pages/assignments/[id]/edit.tsx`
- [ ] Add edit action to `src/pages/assignments/index.tsx`
- [ ] Run build check

## Acceptance
- Admin can edit an existing assignment.
- Build passes.