'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Activity as ActivityIcon, ArrowUpRight } from 'lucide-react';
import { useHRStore } from '@/lib/stores/useHRStore';

export default function ActivityTimelinePage() {
  const { data } = useHRStore();

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.activities.filter((act) => {
      if (entityFilter !== 'All' && act.entityType !== entityFilter) return false;
      if (dateFrom && act.timestamp.slice(0, 10) < dateFrom) return false;
      if (q) {
        return (
          act.title.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          act.actorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.activities, search, entityFilter, dateFrom]);

  const getEntityHref = (entityType: string, entityId: string): string => {
    switch (entityType) {
      case 'employee':
        return `/dashboard/employees/${entityId}`;
      case 'department':
        return '/dashboard/departments';
      case 'attendance':
        return '/dashboard/attendance';
      case 'leave':
        return '/dashboard/leave';
      case 'payroll':
        return '/dashboard/payroll';
      case 'recruitment':
        return '/dashboard/recruitment';
      case 'performance':
        return '/dashboard/performance';
      case 'onboarding':
        return '/dashboard/onboarding';
      default:
        return '/dashboard/settings';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Workspace Activity Timeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Showing {filteredActivities.length} local demo activity events across employees, attendance, leave, payroll, and talent.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity title, description, or actor..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          aria-label="Filter activities by module"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Modules</option>
          <option value="employee">Employees</option>
          <option value="attendance">Attendance</option>
          <option value="leave">Leave</option>
          <option value="payroll">Payroll & Compensation</option>
          <option value="recruitment">Recruitment</option>
          <option value="performance">Performance</option>
          <option value="department">Departments</option>
          <option value="onboarding">Onboarding</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Filter activities from date"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        />
      </div>

      {/* Activity Feed */}
      <div className="rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] divide-y divide-slate-100 dark:divide-slate-800">
        {filteredActivities.slice(0, 100).map((act) => (
          <div
            key={act.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#E8F7F4] dark:bg-teal-950/50 text-[#0D9488] dark:text-[#2DD4BF] shrink-0 mt-0.5">
                <ActivityIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {act.title}
                </div>
                <div className="text-slate-500 mt-0.5">{act.description}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Actor: <span className="font-medium">{act.actorName}</span> · Module:{' '}
                  <span className="capitalize">{act.entityType}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 pl-9 sm:pl-0">
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {act.timestamp.slice(0, 16).replace('T', ' ')}
              </span>
              <Link
                href={getEntityHref(act.entityType, act.entityId)}
                className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium hover:underline"
              >
                <span>Inspect</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
