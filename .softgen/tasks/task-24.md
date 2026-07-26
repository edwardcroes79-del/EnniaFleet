---
title: Database schema and MFA service
status: in_progress
priority: high
type: feature
tags: [auth, mfa, security]
created_by: agent
created_at: 2026-07-26T20:45:00Z
position: 24
---

## Notes
Add MFA support to the authentication system using TOTP (Time-based One-Time Password). This includes:
- Database columns for MFA configuration per user
- Service functions to generate MFA secrets, verify tokens, and manage backup codes
- API endpoints for MFA setup and verification

## Checklist
- [ ] Add MFA columns to profiles table (mfa_enabled, mfa_secret, mfa_backup_codes)
- [ ] Install otplib package for TOTP generation and verification
- [ ] Create MFA service module with generateSecret, verifyToken, enableMFA, disableMFA functions
- [ ] Create API endpoint to initiate MFA setup (generate secret + QR code)
- [ ] Create API endpoint to verify and enable MFA
- [ ] Create API endpoint to disable MFA (admin or user with password confirmation)

## Acceptance
- Database schema supports MFA configuration per user
- MFA service can generate secrets and verify TOTP tokens
- API endpoints handle MFA setup and verification flows