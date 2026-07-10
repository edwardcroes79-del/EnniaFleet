---
title: Dashboard vehicle cost and logo flash fix
status: done
priority: high
type: feature
tags: [dashboard, settings, logo]
created_by: agent
created_at: 2026-07-10T03:15:00Z
position: 16
---

## Notes
- Added a "Total vehicle cost" card on the dashboard summing vehicle purchase prices.
- Fixed the default logo/company name flash on load by loading settings once via a shared provider and bootstrapping initial settings server-side in _app.tsx.

## Checklist
- [x] Add total vehicle cost computation and card to src/pages/index.tsx
- [x] Create SettingsProvider context with server-side initial settings
- [x] Update _app.tsx to use getInitialProps and SettingsProvider
- [x] Update AppShell and login.tsx to consume SettingsProvider
- [x] Run build check

## Acceptance
- Dashboard shows total vehicle purchase cost.
- No default logo/company name flash on refresh.
- Build passes.