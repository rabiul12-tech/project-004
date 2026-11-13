'use client';

import React from 'react';
import Link from 'next/link';
import { X, ExternalLink, Mail, Phone, MapPin, Calendar, UserCheck } from 'lucide-react';
import { useHRStore } from '@/lib/stores/useHRStore';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import { getEmploymentStatusVariant, StatusText } from '@/components/ui/StatusText';
import { computeLeaveBalanceSummary } from '@/lib/calculations/leave';

export function EmployeeProfileDrawer() {
  const { drawerEmployeeId, setDrawerEmployeeId, data, settings } = useHRStore();

  if (!drawerEmployeeId) return null;

  const employee = data.employees.find((e) => e.id === drawerEmployeeId);
  if (!employee) return null;

  const dept = data.departments.find((d) => d.id === employee.departmentId);
  const manager = data.employees.find((e) => e.id === employee.managerId);
  const directReports = data.employees.filter(
    (e) => e.managerId === employee.id && !e.archived
  );
  const comp = data.compensations.find(
    (c) => c.employeeId === employee.id && !c.archived
  );
  const annualBal = data.leaveBalances.find(
    (b) => b.employeeId === employee.id && b.leaveType === 'Annual'
  );
  const computedBal = annualBal ? computeLeaveBalanceSummary(annualBal) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Employee drawer for ${employee.fullName}`}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#182535] h-full border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-400">
              Employee Quick Inspector · {employee.employeeCode}
            </span>
            <button
              type="button"
              onClick={() => setDrawerEmployeeId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Close profile drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Identity Summary */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <EmployeeAvatar
                name={employee.fullName}
                color={employee.avatarColor}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                  {employee.fullName}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {employee.jobTitle}
                </p>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <StatusText
                    variant={getEmploymentStatusVariant(employee.employmentStatus)}
                    label={employee.employmentStatus}
                  />
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {dept?.name ?? 'General'}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {employee.employmentType}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {employee.bio}
            </p>
          </div>

          {/* Contact & Reporting Info */}
          <div className="p-6 space-y-3 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Work Email
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {employee.workEmail}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Phone
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {employee.phone}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Location
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {employee.locationCity} ({employee.workLocation})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Join Date
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {employee.joinDate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5" /> Reporting Manager
              </span>
              {manager ? (
                <button
                  type="button"
                  onClick={() => setDrawerEmployeeId(manager.id)}
                  className="font-medium text-teal-600 dark:text-teal-400 hover:underline"
                >
                  {manager.fullName}
                </button>
              ) : (
                <span className="font-medium text-slate-500">Executive Root</span>
              )}
            </div>
          </div>

          {/* Snapshot Metrics */}
          <div className="p-6 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Annual Leave</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {computedBal ? `${computedBal.availableBalance}d` : '15d'}
              </div>
              <div className="text-[10px] text-slate-400">Available</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Base Salary</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {settings.currencySymbol}
                {(comp?.baseSalary ?? 7500).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Monthly Demo</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">Direct Reports</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {directReports.length}
              </div>
              <div className="text-[10px] text-slate-400">Team Members</div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDrawerEmployeeId(null)}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Close
          </button>
          <Link
            href={`/dashboard/employees/${employee.id}`}
            onClick={() => setDrawerEmployeeId(null)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
          >
            <span>Open Full Employee 360° Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
