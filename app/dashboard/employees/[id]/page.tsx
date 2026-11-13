'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  UserCheck,
  Clock,
  FileCheck2,
  Wallet,
  Award,
  Link2,
  Activity as ActivityIcon,
  Download,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import {
  getAttendanceStatusVariant,
  getEmploymentStatusVariant,
  getLeaveStatusVariant,
  StatusText,
} from '@/components/ui/StatusText';
import { computeLeaveBalanceSummary } from '@/lib/calculations/leave';
import { downloadPayslipPdf } from '@/lib/pdf/payslipPdf';

type ProfileTab =
  | 'overview'
  | 'job'
  | 'attendance'
  | 'leave'
  | 'compensation'
  | 'performance'
  | 'documents'
  | 'activity';

export default function Employee360ProfilePage() {
  const params = useParams<{ id: string }>();
  const employeeId = params?.id || 'emp-004';

  const {
    data,
    settings,
    updateEmployee,
    recordOrCorrectAttendance,
    upsertCompensation,
  } = useHRStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'Contract' | 'Policy' | 'Certification' | 'Identification' | 'Portfolio'>('Certification');
  const [docUrl, setDocUrl] = useState('');

  const [newBaseSalary, setNewBaseSalary] = useState<number | ''>('');
  const [newCompReason, setNewCompReason] = useState('Annual Merit & Market Adjustment');

  const employee = useMemo(
    () => data.employees.find((e) => e.id === employeeId) ?? data.employees[0],
    [data.employees, employeeId]
  );

  const department = useMemo(
    () => data.departments.find((d) => d.id === employee?.departmentId),
    [data.departments, employee]
  );

  const manager = useMemo(
    () => data.employees.find((e) => e.id === employee?.managerId),
    [data.employees, employee]
  );

  const directReports = useMemo(
    () =>
      data.employees.filter(
        (e) => e.managerId === employee?.id && !e.archived
      ),
    [data.employees, employee]
  );

  const empHistory = useMemo(
    () => data.employmentHistory.filter((h) => h.employeeId === employee?.id),
    [data.employmentHistory, employee]
  );

  const empAttendance = useMemo(
    () =>
      data.attendance
        .filter((a) => a.employeeId === employee?.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.attendance, employee]
  );

  const empLeaveBalances = useMemo(
    () => data.leaveBalances.filter((b) => b.employeeId === employee?.id),
    [data.leaveBalances, employee]
  );

  const empLeaveRequests = useMemo(
    () =>
      data.leaveRequests
        .filter((r) => r.employeeId === employee?.id)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [data.leaveRequests, employee]
  );

  const empCompensations = useMemo(
    () =>
      data.compensations
        .filter((c) => c.employeeId === employee?.id && !c.archived)
        .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)),
    [data.compensations, employee]
  );

  const empPayslips = useMemo(
    () =>
      data.payslips
        .filter((p) => p.employeeId === employee?.id)
        .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth)),
    [data.payslips, employee]
  );

  const empReviews = useMemo(
    () => data.performanceReviews.filter((r) => r.employeeId === employee?.id),
    [data.performanceReviews, employee]
  );

  const empActivities = useMemo(
    () =>
      data.activities.filter(
        (a) => a.entityId === employee?.id || a.actorId === employee?.id
      ),
    [data.activities, employee]
  );

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Employee profile not found.</p>
        <Link
          href="/dashboard/employees"
          className="text-xs text-teal-600 hover:underline mt-2 inline-block"
        >
          ← Return to Employee Directory
        </Link>
      </div>
    );
  }

  const latestComp = empCompensations[0];
  const latestPayslip = empPayslips[0];

  const handleAddDocumentLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docUrl.trim()) {
      toast.error('Please enter both document name and reference URL.');
      return;
    }
    const nextDocs = [
      ...employee.documents,
      {
        id: `doc-${employee.id}-${Date.now()}`,
        name: docName.trim(),
        type: docType,
        referenceUrl: docUrl.trim(),
        addedAt: '2026-11-13',
      },
    ];
    updateEmployee(employee.id, { documents: nextDocs });
    setDocName('');
    setDocUrl('');
    toast.success('Added document reference link to employee profile.');
  };

  const handleAddCompensation = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = Number(newBaseSalary);
    if (!sal || sal <= 0) {
      toast.error('Enter a valid base salary.');
      return;
    }
    upsertCompensation({
      employeeId: employee.id,
      baseSalary: sal,
      payFrequency: 'Monthly',
      housingAllowance: Math.round(sal * 0.06),
      transportAllowance: 220,
      mealAllowance: 180,
      targetBonusAmount: Math.round(sal * 0.1),
      standardDeduction: Math.round(sal * 0.04),
      effectiveDate: '2026-11-13',
      changeReason: newCompReason.trim() || 'Compensation adjustment',
    });
    setNewBaseSalary('');
    toast.success('Recorded new effective compensation package.');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
        <span className="text-xs font-mono text-slate-400 tabular-nums">
          Employee 360° Workspace · ID: {employee.id}
        </span>
      </div>

      {/* Signature 360 Profile Header */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <EmployeeAvatar
              name={employee.fullName}
              color={employee.avatarColor}
              size="xl"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {employee.fullName}
                </h1>
                <StatusText
                  variant={getEmploymentStatusVariant(employee.employmentStatus)}
                  label={employee.employmentStatus}
                />
                <span className="text-xs font-mono text-slate-400">
                  {employee.employeeCode}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {employee.jobTitle} · {department?.name ?? 'Operations'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {employee.workEmail}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {employee.locationCity} (
                  {employee.workLocation})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Joined {employee.joinDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Manager:{' '}
                  {manager ? (
                    <Link
                      href={`/dashboard/employees/${manager.id}`}
                      className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                    >
                      {manager.fullName}
                    </Link>
                  ) : (
                    'Executive Root'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                recordOrCorrectAttendance({
                  employeeId: employee.id,
                  date: '2026-11-13',
                  checkIn: '08:56',
                  checkOut: '17:34',
                  notes: 'Logged from Employee 360 Header',
                });
                toast.success(`Logged today's attendance for ${employee.fullName}`);
              }}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-teal-500 transition-colors whitespace-nowrap"
            >
              Simulate Check-In Today
            </button>

            {latestPayslip && (
              <button
                type="button"
                onClick={() => {
                  downloadPayslipPdf({
                    payslip: latestPayslip,
                    employee,
                    department,
                    settings,
                  });
                  toast.success(`Downloaded ${latestPayslip.periodLabel} A4 Payslip PDF`);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Latest Payslip PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* 8 Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Employee 360 Sections"
          className="flex items-center gap-1 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 overflow-x-auto"
        >
          {[
            { id: 'overview', label: '1. Overview', icon: Building2 },
            { id: 'job', label: '2. Job Details', icon: UserCheck },
            { id: 'attendance', label: '3. Attendance', icon: Clock },
            { id: 'leave', label: '4. Leave', icon: FileCheck2 },
            { id: 'compensation', label: '5. Compensation', icon: Wallet },
            { id: 'performance', label: '6. Performance', icon: Award },
            { id: 'documents', label: '7. Documents & Links', icon: Link2 },
            { id: 'activity', label: '8. Activity', icon: ActivityIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#E8F7F4] dark:bg-teal-500/15 text-[#0D9488] dark:text-[#2DD4BF] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Employee Summary & Bio
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {employee.bio}
              </p>
              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  Core Competencies & Skills
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  {employee.skills.map((skill, idx) => (
                    <React.Fragment key={skill}>
                      {idx > 0 && <span className="text-slate-300">·</span>}
                      <span className="font-medium">{skill}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Reporting Structure */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reporting Structure ({directReports.length} Direct Reports)
                </h2>
                <Link
                  href="/dashboard/organization"
                  className="text-xs text-teal-600 hover:underline"
                >
                  Open Org Chart →
                </Link>
              </div>
              {directReports.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {employee.fullName} is an individual contributor with no direct reports.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {directReports.map((rep) => (
                    <Link
                      key={rep.id}
                      href={`/dashboard/employees/${rep.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-colors"
                    >
                      <EmployeeAvatar
                        name={rep.fullName}
                        color={rep.avatarColor}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {rep.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {rep.jobTitle}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Leave Balance & Attendance Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Leave Balances (2026)
              </h2>
              <div className="space-y-3">
                {empLeaveBalances.map((bal) => {
                  const summary = computeLeaveBalanceSummary(bal);
                  return (
                    <div
                      key={bal.id}
                      className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {bal.leaveType} Leave
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Used: {summary.usedDays}d · Pending: {summary.pendingDays}d
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                          {summary.availableBalance}d
                        </span>
                        <div className="text-[10px] text-slate-400">Available</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Attendance Snapshot
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-slate-400">Present Days</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {empAttendance.filter((a) => a.status === 'Present').length}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-slate-400">Late / Half Day</div>
                  <div className="text-lg font-bold text-amber-600 tabular-nums mt-0.5">
                    {
                      empAttendance.filter(
                        (a) => a.status === 'Late' || a.status === 'Half Day'
                      ).length
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JOB DETAILS */}
      {activeTab === 'job' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Position & Organizational Assignment
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-400">Position Title</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {employee.jobTitle}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Employment Type</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {employee.employmentType}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Department</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {department?.name ?? 'General'} ({department?.code})
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Reporting Manager</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {manager ? manager.fullName : 'Executive Root'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Join Date</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                  {employee.joinDate}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Work Location Category</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {employee.workLocation} — {employee.locationCity}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Emergency Contact</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {employee.emergencyContactName} ({employee.emergencyContactRelation})
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Phone</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                  {employee.phone}
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-6 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Employment History Timeline
            </h2>
            <div className="space-y-3">
              {empHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                    <span>{item.jobTitle}</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {item.startDate} → {item.endDate ?? 'Present'}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    {item.employmentType} · {item.changeReason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Attendance Records for {employee.fullName}
              </h2>
              <p className="text-xs text-slate-500">
                Showing {empAttendance.length} recorded workdays
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Check-Out</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Late Minutes</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {empAttendance.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-medium">
                      {rec.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusText
                        variant={getAttendanceStatusVariant(rec.status)}
                        label={rec.status}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {rec.checkIn ?? '--:--'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {rec.checkOut ?? '--:--'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {rec.workingMinutes > 0
                        ? `${Math.floor(rec.workingMinutes / 60)}h ${rec.workingMinutes % 60}m`
                        : '0h 0m'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-amber-600">
                      {rec.lateMinutes > 0 ? `${rec.lateMinutes}m` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{rec.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-4 gap-4">
            {empLeaveBalances.map((bal) => {
              const s = computeLeaveBalanceSummary(bal);
              return (
                <div
                  key={bal.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]"
                >
                  <div className="text-xs font-semibold text-slate-500">
                    {bal.leaveType} Leave
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                    {s.availableBalance} days
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                    Opening {s.openingBalance}d + Accrued {s.accruedDays}d − Used {s.usedDays}d
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Leave Request History ({empLeaveRequests.length})
            </h2>
            {empLeaveRequests.length === 0 ? (
              <p className="text-xs text-slate-500">
                No leave requests recorded for this employee.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Start Date</th>
                      <th className="py-2.5 px-3">End Date</th>
                      <th className="py-2.5 px-3">Working Days</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {empLeaveRequests.map((lr) => (
                      <tr key={lr.id}>
                        <td className="py-2.5 px-3 font-medium">{lr.leaveType}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">
                          {lr.startDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">
                          {lr.endDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">
                          {lr.workingDays}d
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusText
                            variant={getLeaveStatusVariant(lr.status)}
                            label={lr.status}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{lr.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: COMPENSATION */}
      {activeTab === 'compensation' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Fictional Compensation History & Effective Packages
            </h2>
            <div className="space-y-3">
              {empCompensations.map((comp) => (
                <div
                  key={comp.id}
                  className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                      {settings.currencySymbol}
                      {comp.baseSalary.toLocaleString()} / {comp.payFrequency}
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      Effective {comp.effectiveDate}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-500">
                    <span>
                      Housing: {settings.currencySymbol}
                      {comp.housingAllowance}
                    </span>
                    <span>
                      Transport: {settings.currencySymbol}
                      {comp.transportAllowance}
                    </span>
                    <span>
                      Meal: {settings.currencySymbol}
                      {comp.mealAllowance}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Reason: {comp.changeReason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Record New Compensation Adjustment
            </h2>
            <p className="text-xs text-slate-500">
              Historical finalized payroll runs remain immutable snapshots when base salary is updated.
            </p>
            <form onSubmit={handleAddCompensation} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  New Monthly Base Salary ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  placeholder={String((latestComp?.baseSalary ?? 8000) + 500)}
                  value={newBaseSalary}
                  onChange={(e) =>
                    setNewBaseSalary(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Adjustment Reason
                </label>
                <input
                  required
                  value={newCompReason}
                  onChange={(e) => setNewCompReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
              >
                Save Compensation Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Performance Reviews & Goals ({empReviews.length})
          </h2>
          {empReviews.length === 0 ? (
            <p className="text-xs text-slate-500">
              No performance reviews logged yet for {employee.fullName}.
            </p>
          ) : (
            <div className="space-y-4">
              {empReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {rev.cycleName}
                      </span>
                      <span className="text-slate-400 ml-2">
                        · {rev.templateName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                      Overall Rating: {rev.overallScore.toFixed(1)} / 5.0 ({rev.status})
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Manager Feedback:</strong> {rev.managerFeedback}
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {rev.goals.map((g) => (
                      <div key={g.id} className="flex items-center justify-between">
                        <span>
                          {g.completed ? '✓' : '○'} {g.title} ({g.weight}%)
                        </span>
                        <span className="font-mono tabular-nums">Score: {g.score}/5</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DOCUMENTS & LINKS */}
      {activeTab === 'documents' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Employee Reference Documents & Links
              </h2>
              <p className="text-xs text-slate-500">
                Stores document names, categories, and reference URLs locally (no cloud document blob storage).
              </p>
            </div>
            <div className="space-y-2.5">
              {employee.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {doc.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {doc.type} · Added {doc.addedAt} · {doc.referenceUrl}
                    </div>
                  </div>
                  <span className="text-teal-600 dark:text-teal-400 font-medium">
                    Reference Link
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Add Document Reference Link
            </h2>
            <form onSubmit={handleAddDocumentLink} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. AWS Solutions Architect Certification"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Document Category
                </label>
                <select
                  value={docType}
                  onChange={(e) =>
                    setDocType(
                      e.target.value as
                        | 'Contract'
                        | 'Policy'
                        | 'Certification'
                        | 'Identification'
                        | 'Portfolio'
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Certification">Certification</option>
                  <option value="Contract">Contract</option>
                  <option value="Policy">Policy</option>
                  <option value="Portfolio">Portfolio</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Reference URL
                </label>
                <input
                  required
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://docs.peoplix.demo/certs/aws.pdf"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reference Link</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 8: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Employee Activity Audit Log ({empActivities.length})
          </h2>
          <div className="space-y-2.5">
            {empActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {act.title}
                  </div>
                  <div className="text-slate-500 mt-0.5">{act.description}</div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400 tabular-nums">
                  <div>{act.timestamp.slice(0, 10)}</div>
                  <div>By {act.actorName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
