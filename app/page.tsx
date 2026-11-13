import React from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  FileCheck2,
  Wallet,
  Network,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Database,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFC] dark:bg-[#0D1420] text-[#172033] dark:text-[#F8FAFC] flex flex-col justify-between">
      {/* Top Bar Contract: 3 zones */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-white dark:bg-[#121D2B] border-b border-[#E7EAF0] dark:border-[#304154]">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          PEOPLIX HR
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link
            href="/dashboard/employees"
            className="hover:text-teal-600 transition-colors whitespace-nowrap shrink-0"
          >
            Employee 360°
          </Link>
          <Link
            href="/dashboard/attendance"
            className="hover:text-teal-600 transition-colors whitespace-nowrap shrink-0"
          >
            Attendance & Leave
          </Link>
          <Link
            href="/dashboard/payroll"
            className="hover:text-teal-600 transition-colors whitespace-nowrap shrink-0"
          >
            Payroll & PDF Payslips
          </Link>
          <Link
            href="/dashboard/organization"
            className="hover:text-teal-600 transition-colors whitespace-nowrap shrink-0"
          >
            Org Hierarchy
          </Link>
          <Link
            href="/dashboard/recruitment"
            className="hover:text-teal-600 transition-colors whitespace-nowrap shrink-0"
          >
            Recruitment ATS
          </Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Launch HR Workspace
          </Link>
        </div>
      </header>

      {/* Main Hero & Signature Capabilities */}
      <main className="max-w-6xl mx-auto px-6 py-14 lg:py-20 space-y-16">
        <section className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF] tracking-wide">
              Better People Operations · Interactive Portfolio HRMS
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Human-centric people operations for modern organizations.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Manage 120+ employee profiles, reporting hierarchies, daily attendance schedules,
              working-day leave balances, exact decimal payroll simulations with client-side A4 PDF
              payslips, and drag-and-drop talent pipelines — persisted reliably in your browser.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <span>Enter Peoplix HR Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/employees/emp-004"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium hover:border-teal-500 transition-colors"
              >
                <span>Inspect Employee 360° Profile</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                120 Seeded Employees · 8 Departments
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-teal-600" />
                100% Browser-Local Persistence
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Fictional Portfolio Dataset Only
              </span>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Signature HR Workflows
                </h2>
                <p className="text-xs text-slate-500">
                  Direct entry points into core modules
                </p>
              </div>
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400 tabular-nums">
                21 Routes Ready
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  title: 'Employee 360° Workspace',
                  desc: '8-tab profile with job history, attendance, leave, compensation & reviews',
                  href: '/dashboard/employees/emp-002',
                  icon: Users,
                },
                {
                  title: 'Interactive Organization Chart',
                  desc: 'Cycle-safe reporting tree with zoom, pan, search & lineage highlighting',
                  href: '/dashboard/organization',
                  icon: Network,
                },
                {
                  title: 'Attendance & Schedule Engine',
                  desc: 'Check-in simulation, late thresholds, holiday & approved leave rules',
                  href: '/dashboard/attendance',
                  icon: Clock,
                },
                {
                  title: 'Leave Approval & Balance Ledger',
                  desc: 'Working-day calculator, overlap prevention & balance restoration',
                  href: '/dashboard/leave',
                  icon: FileCheck2,
                },
                {
                  title: 'Payroll Simulation & A4 PDF Payslips',
                  desc: 'Decimal-accurate payroll runs, immutable snapshots & client PDF export',
                  href: '/dashboard/payroll',
                  icon: Wallet,
                },
                {
                  title: 'Kanban Recruitment Pipeline',
                  desc: '7-stage applicant tracking board with drag-and-drop persistence',
                  href: '/dashboard/recruitment',
                  icon: Briefcase,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-[#E8F7F4] dark:bg-teal-950/50 text-[#0D9488] dark:text-[#2DD4BF] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E7EAF0] dark:border-[#304154] py-6 px-6 lg:px-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>PEOPLIX HR — Better People Operations. Interactive Frontend Portfolio Demonstration.</span>
        <span>All employee records are fictional and stored locally in your browser.</span>
      </footer>
    </div>
  );
}
