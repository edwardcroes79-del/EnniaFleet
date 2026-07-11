---
title: Remove maintenance records and filter deleted vehicles
status: done
priority: high
type: feature
tags: [maintenance, vehicles, soft-delete, ui]
created_by: agent
created_at: 2026-07-11T21:55:00Z
position: 23
---
## Notes
User wants ability to remove vehicles from Maintenance / service history. Implement soft-delete on maintenance records and filter out deleted vehicles/maintenance rows.
## Checklist
- [x] Add is_deleted column to maintenance table if missing
- [x] Add softDelete method to maintenanceService
- [x] Filter deleted maintenance records and deleted vehicles in maintenanceService.list
- [x] Add delete button to Maintenance page rows with confirmation
- [x] Run build check
## Acceptance
- Admin can remove a service record from the Maintenance page
- Deleted vehicles no longer appear in service history
- Build passes
---