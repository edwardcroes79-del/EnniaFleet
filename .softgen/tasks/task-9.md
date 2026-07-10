---
title: Admin rebranding and logo upload
status: in_progress
priority: high
type: feature
tags: [settings, branding, admin, storage]
created_by: agent
created_at: 2026-07-10T01:20:00Z
position: 9
---

## Notes
Let admins upload a company logo and set company name/branding via a settings page. Store in app_settings table and logos bucket.

## Checklist
- [ ] Create app_settings table with logo_url, company_name, currency
- [ ] Create logos storage bucket and policies
- [ ] Create /admin/settings page with logo upload and company name input
- [ ] Read settings in AppShell or layout and display logo/company name
- [ ] Validate build

## Acceptance
- Admin can upload a logo and change company name.
- Logo and company name appear in the app shell/sidebar.
- Build passes.