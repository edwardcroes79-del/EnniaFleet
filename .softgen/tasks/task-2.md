---
title: Database Schema + RLS
status: todo
priority: urgent
type: chore
tags: [supabase, schema, rls]
created_by: agent
created_at: 2026-07-09T13:35:47Z
position: 2
---

## Notes
Create the relational schema for vehicles, employees, assignments, maintenance, fuel logs, incidents, documents, and audit logs. Enable RLS with policies matching user roles.

## Checklist
- [ ] Create profiles table with role column
- [ ] Create vehicles table with full vehicle fields
- [ ] Create employees table
- [ ] Create assignments table with issue/return tracking
- [ ] Create maintenance_records table
- [ ] Create fuel_logs table
- [ ] Create incidents table
- [ ] Create documents table with storage path
- [ ] Create audit_logs table
- [ ] Enable RLS and write policies for Admin/Director/Employee
- [ ] Generate Supabase types

## Acceptance
- Schema supports all core entities and relationships
- RLS allows employees to read their own assignments/incidents
- Admins have full CRUD access