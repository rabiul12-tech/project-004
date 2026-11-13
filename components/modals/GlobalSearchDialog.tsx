'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  Building2,
  Briefcase,
  CalendarClock,
  FileText,
  PlusCircle,
  SunMoon,
  ArrowRight,
  X,
} from 'lucide-react';
import { useHRStore } from '@/lib/stores/useHRStore';

const APP_PAGES = [
  { label: 'HR Overview Dashboard', path: '/dashboard', section: 'Workspace' },
  { label: 'Employee Directory', path: '/dashboard/employees', section: 'Workspace' },
  { label: 'Organization Chart', path: '/dashboard/organization', section: 'Workspace' },
  { label: 'Departments', path: '/dashboard/departments', section: 'Workspace' },
  { label: 'Attendance Management', path: '/dashboard/attendance', section: 'Time & Attendance' },
  { label: 'Leave Requests & Approval', path: '/dashboard/leave', section: 'Time & Attendance' },
  { label: 'Team Leave Calendar', path: '/dashboard/leave-calendar', section: 'Time & Attendance' },
  { label: 'Holidays Configuration', path: '/dashboard/holidays', section: 'Time & Attendance' },
  { label: 'Payroll Simulation Workspace', path: '/dashboard/payroll', section: 'Payroll' },
  { label: 'Payslips & A4 PDF Export', path: '/dashboard/payslips', section: 'Payroll' },
  { label: 'Compensation Management', path: '/dashboard/compensation', section: 'Payroll' },
  { label: 'Recruitment Pipeline (ATS)', path: '/dashboard/recruitment', section: 'Talent' },
  { label: 'Performance Reviews & Goals', path: '/dashboard/performance', section: 'Talent' },
  { label: 'Employee Onboarding Checklists', path: '/dashboard/onboarding', section: 'Talent' },
  { label: 'HR Analytics & Workforce Trends', path: '/dashboard/analytics', section: 'Insights' },
  { label: 'HR Reporting Center & CSV Export', path: '/dashboard/reports', section: 'Insights' },
  { label: 'Demo Team & Role Switcher', path: '/dashboard/team', section: 'System' },
  { label: 'Activity Timeline Log', path: '/dashboard/activity', section: 'System' },
  { label: 'Workspace Settings & Backup', path: '/dashboard/settings', section: 'System' },
  { label: 'Help & Documentation', path: '/dashboard/help', section: 'System' },
];

export function GlobalSearchDialog() {
  const router = useRouter();
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    setQuickCreateModal,
    data,
    ui,
    setTheme,
    addRecentSearch,
  } = useHRStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      } else if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) {
      return {
        employees: data.employees.filter((e) => !e.archived).slice(0, 4),
        departments: data.departments.filter((d) => !d.archived).slice(0, 3),
        jobs: data.jobOpenings.slice(0, 3),
        candidates: data.candidates.filter((c) => !c.archived).slice(0, 3),
        leaves: data.leaveRequests.slice(0, 3),
        pages: APP_PAGES.slice(0, 6),
      };
    }

    return {
      employees: data.employees
        .filter(
          (e) =>
            !e.archived &&
            (e.fullName.toLowerCase().includes(q) ||
              e.jobTitle.toLowerCase().includes(q) ||
              e.employeeCode.toLowerCase().includes(q) ||
              e.workEmail.toLowerCase().includes(q))
        )
        .slice(0, 6),
      departments: data.departments
        .filter(
          (d) =>
            !d.archived &&
            (d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
        )
        .slice(0, 4),
      jobs: data.jobOpenings
        .filter((j) => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q))
        .slice(0, 4),
      candidates: data.candidates
        .filter(
          (c) =>
            !c.archived &&
            (c.fullName.toLowerCase().includes(q) ||
              c.currentRole.toLowerCase().includes(q) ||
              c.stage.toLowerCase().includes(q))
        )
        .slice(0, 4),
      leaves: data.leaveRequests
        .filter((l) => {
          const emp = data.employees.find((e) => e.id === l.employeeId);
          return (
            l.leaveType.toLowerCase().includes(q) ||
            l.reason.toLowerCase().includes(q) ||
            emp?.fullName.toLowerCase().includes(q)
          );
        })
        .slice(0, 4),
      pages: APP_PAGES.filter(
        (p) =>
          p.label.toLowerCase().includes(q) || p.section.toLowerCase().includes(q)
      ).slice(0, 6),
    };
  }, [q, data]);

  if (!globalSearchOpen) return null;

  const navigateTo = (path: string, searchTerm?: string) => {
    if (searchTerm) addRecentSearch(searchTerm);
    setGlobalSearchOpen(false);
    setQuery('');
    router.push(path);
  };

  const triggerCommand = (action: () => void) => {
    setGlobalSearchOpen(false);
    setQuery('');
    action();
  };

  const totalCount =
    results.employees.length +
    results.departments.length +
    results.jobs.length +
    results.candidates.length +
    results.leaves.length +
    results.pages.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 backdrop-blur-xs pt-16 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Search and Command Center"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, departments, candidates, leave requests, or run a command..."
            aria-label="Global search input"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setGlobalSearchOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Close global search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Searches */}
        {!q && ui.recentSearches.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400">Recent:</span>
            {ui.recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 underline-offset-2 hover:underline"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
          {/* Quick Commands */}
          <div className="py-2 px-2">
            <div className="text-xs font-semibold text-slate-400 px-2 mb-1.5">
              Quick Commands
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => triggerCommand(() => setQuickCreateModal('employee'))}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Add Employee</span>
              </button>
              <button
                type="button"
                onClick={() => triggerCommand(() => setQuickCreateModal('attendance'))}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                <CalendarClock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Record Attendance</span>
              </button>
              <button
                type="button"
                onClick={() => triggerCommand(() => setQuickCreateModal('leave'))}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Request Leave</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/dashboard/payroll')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Open Payroll</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/dashboard/recruitment')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Open Recruitment</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerCommand(() =>
                    setTheme(ui.theme === 'dark' ? 'light' : 'dark')
                  )
                }
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                <SunMoon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Switch Theme</span>
              </button>
            </div>
          </div>

          {totalCount === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No matching records found for &ldquo;{query}&rdquo;. Try searching by employee name, department, or page title.
            </div>
          )}

          {/* Employees */}
          {results.employees.length > 0 && (
            <div className="py-2 px-2">
              <div className="text-xs font-semibold text-slate-400 px-2 mb-1">
                Employees
              </div>
              {results.employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => navigateTo(`/dashboard/employees/${emp.id}`, emp.fullName)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className="w-4 h-4 text-teal-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {emp.fullName}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {emp.jobTitle} · {emp.employeeCode}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-teal-600 dark:text-teal-400 shrink-0">
                    360° Profile →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Departments */}
          {results.departments.length > 0 && (
            <div className="py-2 px-2">
              <div className="text-xs font-semibold text-slate-400 px-2 mb-1">
                Departments
              </div>
              {results.departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => navigateTo('/dashboard/departments', dept.name)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {dept.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {dept.code} · {dept.location}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Department</span>
                </button>
              ))}
            </div>
          )}

          {/* Candidates & Jobs */}
          {(results.candidates.length > 0 || results.jobs.length > 0) && (
            <div className="py-2 px-2">
              <div className="text-xs font-semibold text-slate-400 px-2 mb-1">
                Recruitment & Candidates
              </div>
              {results.jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => navigateTo('/dashboard/recruitment', job.title)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {job.title}
                    </span>
                    <span className="text-xs text-slate-500">{job.location}</span>
                  </div>
                  <span className="text-xs text-slate-400">Job Opening</span>
                </button>
              ))}
              {results.candidates.map((cand) => (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => navigateTo('/dashboard/recruitment', cand.fullName)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {cand.fullName}
                    </span>
                    <span className="text-xs text-slate-500">
                      Stage: {cand.stage}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Candidate</span>
                </button>
              ))}
            </div>
          )}

          {/* Application Pages */}
          {results.pages.length > 0 && (
            <div className="py-2 px-2">
              <div className="text-xs font-semibold text-slate-400 px-2 mb-1">
                Application Pages
              </div>
              {results.pages.map((page) => (
                <button
                  key={page.path}
                  type="button"
                  onClick={() => navigateTo(page.path, page.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {page.label}
                  </span>
                  <span className="text-xs text-slate-400">{page.section}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
