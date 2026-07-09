---
title: Design System + Layout + Auth
status: in_progress
priority: urgent
type: chore
tags: [design-system, auth, layout]
created_by: agent
created_at: 2026-07-09T13:35:47Z
position: 1
---

## Notes
Set up the visual system and application shell. Configure Tailwind tokens, global styles, fonts, and role-based authentication entry points. Build the sidebar layout used across all authenticated pages.

## Checklist
- [ ] Theme globals.css with fleet color tokens and font imports
- [ ] Sync custom tokens to tailwind.config.ts
- [ ] Create AppShell with responsive sidebar and top bar
- [ ] Build login page using Supabase Auth
- [ ] Add role-based access guards and hooks
- [ ] Wire _app.tsx with providers and layout

## Acceptance
- Authenticated users see a sidebar with fleet navigation
- Login works via email/password through Supabase
- UI uses the graphite/amber design tokens