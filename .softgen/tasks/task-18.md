---
title: Incident PDF document upload
status: done
priority: high
type: feature
tags: [incidents, documents, pdf]
created_by: agent
created_at: 2026-07-10T03:45:00Z
position: 18
---

## Notes
Add PDF upload support to incident accident reports for documents like quotes and survey reports. Stored in `incidents.documents` and uploaded to `incident_documents` Supabase Storage bucket.

## Checklist
- [x] Add documents text[] column to incidents table
- [x] Create incident_documents storage bucket with RLS
- [x] Add incidentDocumentService to fleetService.ts
- [x] Update src/pages/incidents/[id]/edit.tsx with document upload UI
- [x] Run build check

## Acceptance
- Admins can upload PDF quotes/survey reports when editing an Accident incident.
- Uploaded PDFs are clickable/downloadable from the incident edit form.
- Build passes.