'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Users,
} from 'lucide-react';
import { useHRStore } from '@/lib/stores/useHRStore';

const MONTHS = [
  { key: '2026-09', label: 'September 2026', days: 30 },
  { key: '2026-10', label: 'October 2026', days: 31 },
  { key: '2026-11', label: 'November 2026', days: 30 },
  { key: '2026-12', label: 'December 2026', days: 31 },
];

export default function LeaveCalendarPage() {
  const { data, setDrawerEmployeeId } = useHRStore();

  const [monthIdx, setMonthIdx] = useState(2); // Default November 2026
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [deptFilter, setDeptFilter] = useState('All');
  const [empFilter, setEmpFilter] = useState('All');

  const currentMonth = MONTHS[monthIdx];

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const activeEmployees = useMemo(() => {
    return data.employees.filter((e) => {
      if (e.archived) return false;
      if (deptFilter !== 'All' && e.departmentId !== deptFilter) return false;
      if (empFilter !== 'All' && e.id !== empFilter) return false;
      return true;
    });
  }, [data.employees, deptFilter, empFilter]);

  const calendarDates = useMemo(() => {
    const list: string[] = [];
    const maxDays = viewType === 'week' ? 7 : currentMonth.days;
    const startDay = viewType === 'week' ? 9 : 1;
    for (let d = startDay; d < startDay + maxDays; d++) {
      list.push(`${currentMonth.key}-${String(d).padStart(2, '0')}`);
    }
    return list;
  }, [currentMonth, viewType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team Leave & Availability Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized directly with Leave Management & Holiday records — distinguishes Approved vs. Pending requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewType('month')}
              className={`px-3 py-1.5 rounded-md font-medium ${
                viewType === 'month'
                  ? 'bg-[#E8F7F4] dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  : 'text-slate-500'
              }`}
            >
              Monthly Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewType('week')}
              className={`px-3 py-1.5 rounded-md font-medium ${
                viewType === 'week'
                  ? 'bg-[#E8F7F4] dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  : 'text-slate-500'
              }`}
            >
              Weekly Focus
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs">
            <button
              type="button"
              disabled={monthIdx === 0}
              onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
              className="p-1.5 rounded disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 font-semibold">{currentMonth.label}</span>
            <button
              type="button"
              disabled={monthIdx === MONTHS.length - 1}
              onClick={() => setMonthIdx((i) => Math.min(MONTHS.length - 1, i + 1))}
              className="p-1.5 rounded disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Legend */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            aria-label="Filter calendar by department"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            <option value="All">All Departments</option>
            {data.departments
              .filter((d) => !d.archived)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>

          <select
            value={empFilter}
            onChange={(e) => setEmpFilter(e.target.value)}
            aria-label="Filter calendar by employee"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            <option value="All">All Employees</option>
            {data.employees
              .filter((e) => !e.archived)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
            Approved Leave
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
            Pending Request
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Configured Holiday
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {calendarDates.map((dateStr) => {
          const holiday = data.holidays.find((h) => h.date === dateStr);
          const dayLeaves = data.leaveRequests.filter((lr) => {
            if (lr.status === 'Rejected' || lr.status === 'Cancelled') return false;
            if (lr.startDate > dateStr || lr.endDate < dateStr) return false;
            const emp = empMap.get(lr.employeeId);
            if (!emp || emp.archived) return false;
            if (deptFilter !== 'All' && emp.departmentId !== deptFilter) return false;
            if (empFilter !== 'All' && emp.id !== empFilter) return false;
            return true;
          });

          const approvedCount = dayLeaves.filter((l) => l.status === 'Approved').length;
          const availabilityPct = Math.max(
            0,
            Math.round(
              ((activeEmployees.length - approvedCount) /
                Math.max(1, activeEmployees.length)) *
                100
            )
          );

          return (
            <div
              key={dateStr}
              className="p-3.5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-col justify-between gap-3 min-h-[150px]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {dateStr}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {availabilityPct}% avail
                  </span>
                </div>

                {holiday && (
                  <div className="mt-2 p-2 rounded-lg bg-[#E8F7F4] dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 text-[11px] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{holiday.name}</span>
                  </div>
                )}

                <div className="mt-2 space-y-1.5">
                  {dayLeaves.length === 0 && !holiday && (
                    <div className="text-[11px] text-slate-400 py-2">
                      Full team coverage
                    </div>
                  )}
                  {dayLeaves.slice(0, 4).map((lr) => {
                    const emp = empMap.get(lr.employeeId);
                    const isApproved = lr.status === 'Approved';
                    return (
                      <button
                        key={lr.id}
                        type="button"
                        onClick={() => emp && setDrawerEmployeeId(emp.id)}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium truncate block ${
                          isApproved
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {emp?.fullName ?? lr.employeeId} · {lr.leaveType} ({lr.status})
                      </button>
                    );
                  })}
                  {dayLeaves.length > 4 && (
                    <div className="text-[10px] text-slate-400 pl-1">
                      +{dayLeaves.length - 4} more on leave
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {activeEmployees.length - approvedCount}/{activeEmployees.length} active
                </span>
                <span>{dayLeaves.length} leave(s)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
