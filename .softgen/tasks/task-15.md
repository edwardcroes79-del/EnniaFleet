---
title: Incident photo upload and configurable types
status: in_progress
priority: high
type: feature
tags: [incidents, photos, admin]
created_by: agent
created_at: 2026-07-10T02:50:00Z
position: 15
---

## Notes
Allow uploading vehicle damage photos when reporting an accident. Admin can manage custom incident types in settings.

## Checklist
- [ ] Add photo_urls column to incidents table
- [ ] Create incident_photos storage bucket with RLS
- [ ] Create incident_types table for admin-managed types
- [ ] Seed incident_types with defaults (Accident, Damage, Traffic fine, Mechanical, Breakdown)
- [ ] Update incidents new/edit pages with conditional photo upload
- [ ] Add incident types management to /admin/settings
- [ ] Run build check

## Acceptance
- Users can upload multiple photos when reporting an Accident.
- Admin can add/edit incident types in Settings.
- Build passes.