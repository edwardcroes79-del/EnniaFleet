---
title: Login page MFA verification flow
status: todo
priority: high
type: feature
tags: [auth, mfa, login]
created_by: agent
created_at: 2026-07-26T20:45:00Z
position: 25
---

## Notes
Update the login flow to support MFA verification. After password authentication, if the user has MFA enabled, show a verification screen to enter the TOTP code.

## Checklist
- [ ] Update login.tsx to check if user has MFA enabled after password login
- [ ] Add MFA verification step UI (6-digit code input)
- [ ] Add "Use backup code" option
- [ ] Handle MFA verification success/failure
- [ ] Add "Set up MFA" option in user profile or settings
- [ ] Show QR code and secret key for MFA setup
- [ ] Allow users to verify and enable MFA after setup

## Acceptance
- Users with MFA enabled see verification screen after password login
- Users can enter TOTP code or backup code to complete login
- Users can set up MFA from their profile/settings