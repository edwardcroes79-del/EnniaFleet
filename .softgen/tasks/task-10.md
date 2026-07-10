---
title: Currency AWG across the app
status: in_progress
priority: medium
type: chore
tags: [currency, awg, formatting]
created_by: agent
created_at: 2026-07-10T01:20:00Z
position: 10
---

## Notes
Replace all USD `$` formatting with AWG (Aruban Florin) across vehicle pages, reports, maintenance, fuel, and dashboard.

## Checklist
- [ ] Create formatCurrency utility returning "AWG X,XXX.XX"
- [ ] Update vehicle detail/new/edit pages
- [ ] Update reports page
- [ ] Update maintenance and fuel pages
- [ ] Update dashboard if it shows currency
- [ ] Validate build

## Acceptance
- All monetary values display in AWG.
- Build passes with no errors.