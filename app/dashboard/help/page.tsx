'use client';

import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  BookOpen,
  ShieldAlert,
  Database,
  Calculator,
  CheckCircle2,
} from 'lucide-react';

const DOC_SECTIONS = [
  {
    title: '1. Getting Started & Architecture',
    content:
      'PEOPLIX HR is a complete browser-local Human Resources Management System seeded with 120 fictional employees, 8 departments, 15 job roles, 6 months of attendance, 100 leave requests, 6 payroll periods, 30 recruitment candidates, 75 performance reviews, and 80 onboarding tasks. Use Cmd/Ctrl + K at any time to search across all entities or trigger quick commands.',
  },
  {
    title: '2. Employee Management & 360° Profiles',
    content:
      'Navigate to /dashboard/employees to filter, sort, bulk-export, or create employees. Clicking any employee opens either the quick slide-over inspector or the full 8-tab Employee 360° Workspace (/dashboard/employees/[id]), where job history, attendance, leave balances, compensation, reviews, document links, and audit activity are unified under a single employee ID.',
  },
  {
    title: '3. Attendance Calculation Rules',
    content:
      'Attendance records use local YYYY-MM-DD date keys to prevent timezone day-shift bugs. Approved leave always takes priority over unexplained absence. Late arrivals are calculated against the employee’s assigned WorkSchedule startTime and lateThresholdMinutes.',
  },
  {
    title: '4. Leave Approval Workflow & Working-Day Math',
    content:
      'Available Leave Balance = Opening Balance + Accrued Leave + Approved Adjustments − Approved Leave Usage. Working days automatically exclude configured weekends and location-matched holidays. Pending requests do not permanently reduce available balance, and cancelling an approved request restores the balance exactly once.',
  },
  {
    title: '5. Payroll Simulation & Client-Side A4 PDF Payslips',
    content:
      'Payroll calculations use Decimal.js to avoid floating-point errors: Gross Pay = Base Salary + Allowances + Bonuses; Net Pay = Gross Pay − (Configured Deductions + Unpaid Leave Adjustments). Marking a payroll run as Finalized locks employee snapshots so subsequent salary changes never alter historical payroll runs. Payslips can be previewed and exported as A4 PDFs directly in the browser.',
  },
  {
    title: '6. Interactive Organization Chart & Cycle Prevention',
    content:
      'The Organization Chart (/dashboard/organization) validates every manager assignment to prevent self-reporting and circular reporting chains (A → B → C → A). Employees without a manager appear as valid root nodes.',
  },
  {
    title: '7. LocalStorage Persistence, Backup & Limitations',
    content:
      'All records persist under versioned LocalStorage keys (peoplix:version, peoplix:hr-data, peoplix:settings, peoplix:ui). If storage is corrupted, PEOPLIX HR automatically recovers from the deterministic seed generator. You can export and restore full JSON snapshots from /dashboard/settings.',
  },
];

const FAQS = [
  {
    q: 'Does PEOPLIX HR transmit data to an external database or server?',
    a: 'No. All records are stored strictly in your browser’s LocalStorage. No external database, cloud storage, or third-party payroll processor is used.',
  },
  {
    q: 'Why don’t changes to an employee’s base salary alter past finalized payroll runs?',
    a: 'Finalized payroll runs store immutable PayrollEntry snapshots. Updating base salary in Compensation creates a new effective-dated record for future calculations while preserving historical audit accuracy.',
  },
  {
    q: 'How do I reset the workspace if I want a clean starting state?',
    a: 'Open Workspace Settings (/dashboard/settings) and click "Reset Demo Data" to re-seed all 120 fictional employees and related records.',
  },
];

export default function HelpDocumentationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Help Center & System Documentation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Comprehensive guide to PEOPLIX HR workflows, calculation formulas, and portfolio demonstration boundaries.
        </p>
      </div>

      {/* Portfolio Demo vs Production Comparison Banner */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <h2>Portfolio Demo vs. Production HR Management Software</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          PEOPLIX HR is an interactive frontend engineering demonstration built with Next.js App Router, TypeScript, Tailwind CSS, Zustand, Decimal.js, dnd-kit, Recharts, and jsPDF. Unlike a multi-tenant production HRMS, this application intentionally omits server-side authentication, encrypted PII vaults, statutory tax filing, and real bank ACH disbursements. Never enter real employee identification numbers or banking credentials.
        </p>
      </div>

      {/* Documentation Modules Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {DOC_SECTIONS.map((sec) => (
          <div
            key={sec.title}
            className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-2 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{sec.title}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {sec.content}
            </p>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-teal-600" />
          <span>Frequently Asked Questions</span>
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {FAQS.map((item) => (
            <div key={item.q} className="py-3 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {item.q}
              </div>
              <p className="text-slate-600 dark:text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
