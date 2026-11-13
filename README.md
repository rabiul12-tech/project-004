# PEOPLIX HR — Better People Operations

**Project 005** — Interactive Human Resources Management System (HRMS) built with Next.js App Router, React, TypeScript, Tailwind CSS, Zustand, Recharts, Decimal.js, dnd-kit, and jsPDF.

---

## Portfolio Demo vs Production HR Management Software

PEOPLIX HR is an **interactive frontend portfolio demonstration**, not a multi-user production HRMS. Please note the following architectural boundaries:

1. **No Secure Authentication or Server-Side Access Controls**: Role switching (`HR Admin`, `HR Manager`, `Department Manager`, `Employee`) in `/dashboard/team` and the sidebar is a client-side UX preview to showcase persona workflows. There is no server-enforced RBAC or credential authentication.
2. **Browser-Local Storage Only (No Cloud Synchronization)**: All data persists locally in your browser via `window.localStorage` (`peoplix:version`, `peoplix:hr-data`, `peoplix:settings`, `peoplix:ui`). No external SQL/NoSQL databases or cloud storage buckets are used.
3. **Simulated Payroll & Payslips (Not Legally Certified)**: Payroll runs and client-side A4 PDF payslips use `Decimal.js` to demonstrate exact compensation math, unpaid leave adjustments, and immutable finalized snapshots. They do not perform statutory tax filing, real banking disbursements, or jurisdiction-specific labor law compliance.
4. **Fictional Employee Records Only**: All 120 seeded employees, salaries, contact details, and performance reviews are deterministic fictional records. Never enter real employee identification numbers, banking details, medical records, or sensitive personal information.

---

## Signature Workflows & Complete Route Map

- `/` — Landing Hero & Direct Workflow Entry Points
- `/dashboard` — HR Overview Dashboard (Live KPIs, Recharts analytics, Pending Leave Queue, Celebrations, Holidays, Activity Stream)
- `/dashboard/employees` — Employee Directory (List & Grid views, Search, Multi-filters, Sorting, Pagination, Bulk CSV Export, CRUD)
- `/dashboard/employees/[id]` — **Signature Employee 360° Workspace** (8 unified tabs: Overview, Job Details, Attendance, Leave, Compensation, Performance, Documents & Links, Activity)
- `/dashboard/organization` — **Signature Interactive Organization Chart** (Cycle-safe hierarchy canvas, Zoom, Lineage tracer, Accessible Tree View, Manager validation)
- `/dashboard/departments` — Department Management (Cards & Table views, Roster inspector, Safe archiving)
- `/dashboard/attendance` — **Signature Attendance Management** (Check-in/Check-out simulator, Schedule threshold rules, Holiday & Approved Leave priority, Monthly Calendar, CSV export)
- `/dashboard/leave` — **Signature Leave Management** (Working-day calculator, Overlap detection, Approve/Reject/Cancel transitions, Balance restoration)
- `/dashboard/leave-calendar` — Team Leave Calendar (Monthly & Weekly views, Availability indicator)
- `/dashboard/holidays` — Holiday Calendar & JSON Import
- `/dashboard/payroll` — **Signature Payroll Simulation Workspace** (Decimal.js engine, Unpaid leave adjustments, Finalized immutable snapshots, CSV export)
- `/dashboard/payslips` — Payslip Management & Client-Side A4 PDF Generator
- `/dashboard/compensation` — Compensation Management & Effective-Date History
- `/dashboard/recruitment` — Kanban Applicant Tracking System (7 stages with `@dnd-kit` drag-and-drop & accessible controls)
- `/dashboard/performance` — Performance Reviews & OKR Goal Tracking
- `/dashboard/onboarding` — Employee Onboarding & Offboarding Checklists
- `/dashboard/analytics` — HR Analytics & Documented Metric Definitions
- `/dashboard/reports` — HR Reporting Center (7 report types, Saved presets, Print & CSV export)
- `/dashboard/team` — Demo Roles & Workspace Perspective Switcher
- `/dashboard/activity` — Activity Audit Timeline (300+ seeded events)
- `/dashboard/settings` — Workspace Settings, Policy Propagation, JSON Backup/Restore & Demo Reset
- `/dashboard/help` — Help Center & System Documentation
