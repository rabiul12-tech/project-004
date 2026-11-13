'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useHRStore } from '@/lib/stores/useHRStore';

const COLORS = ['#0D9488', '#0284C7', '#4F46E5', '#D97706', '#E11D48', '#7C3AED', '#059669', '#2563EB'];

export default function HRAnalyticsPage() {
  const { data, settings } = useHRStore();

  const activeEmployees = useMemo(
    () => data.employees.filter((e) => !e.archived),
    [data.employees]
  );

  // 1. Department Distribution
  const deptDistribution = useMemo(() => {
    return data.departments
      .filter((d) => !d.archived)
      .map((d) => ({
        name: d.code,
        fullName: d.name,
        employees: activeEmployees.filter((e) => e.departmentId === d.id).length,
      }));
  }, [data.departments, activeEmployees]);

  // 2. Employee Status Distribution
  const statusDistribution = useMemo(() => {
    const statuses = ['Active', 'Probation', 'On Leave', 'Inactive', 'Terminated'];
    return statuses.map((st) => ({
      name: st,
      value: data.employees.filter((e) => e.employmentStatus === st).length,
    }));
  }, [data.employees]);

  // 3. Payroll Cost Trend (6 Periods)
  const payrollCostTrend = useMemo(() => {
    return data.payrollRuns.map((run) => ({
      period: run.periodMonth,
      GrossPay: Math.round(run.totalGrossPay),
      NetPay: Math.round(run.totalNetPay),
      Deductions: Math.round(run.totalDeductions),
    }));
  }, [data.payrollRuns]);

  // 4. Recruitment Pipeline Funnel
  const recruitmentFunnel = useMemo(() => {
    const stages = [
      'Applied',
      'Screening',
      'Interview',
      'Assessment',
      'Offer',
      'Hired',
      'Rejected',
    ];
    return stages.map((stage) => ({
      stage,
      candidates: data.candidates.filter((c) => !c.archived && c.stage === stage).length,
    }));
  }, [data.candidates]);

  // 5. Leave Utilization by Type
  const leaveUtilization = useMemo(() => {
    const types = ['Annual', 'Casual', 'Sick', 'Unpaid', 'Other'];
    return types.map((type) => ({
      type,
      ApprovedDays: data.leaveRequests
        .filter((r) => r.leaveType === type && r.status === 'Approved')
        .reduce((sum, r) => sum + r.workingDays, 0),
      PendingDays: data.leaveRequests
        .filter((r) => r.leaveType === type && r.status === 'Pending')
        .reduce((sum, r) => sum + r.workingDays, 0),
    }));
  }, [data.leaveRequests]);

  // 6. Employee Tenure Distribution
  const tenureDistribution = useMemo(() => {
    const buckets = [
      { bucket: '< 1 Year (2026)', count: activeEmployees.filter((e) => e.joinDate.startsWith('2026')).length },
      { bucket: '1–2 Years (2025)', count: activeEmployees.filter((e) => e.joinDate.startsWith('2025')).length },
      { bucket: '2–3 Years (2024)', count: activeEmployees.filter((e) => e.joinDate.startsWith('2024')).length },
      { bucket: '3+ Years (2023)', count: activeEmployees.filter((e) => e.joinDate.startsWith('2023')).length },
    ];
    return buckets;
  }, [activeEmployees]);

  // 7. Performance Rating Distribution
  const performanceDistribution = useMemo(() => {
    const buckets = [
      { range: '4.5 – 5.0', count: data.performanceReviews.filter((r) => r.overallScore >= 4.5).length },
      { range: '4.0 – 4.4', count: data.performanceReviews.filter((r) => r.overallScore >= 4.0 && r.overallScore < 4.5).length },
      { range: '3.5 – 3.9', count: data.performanceReviews.filter((r) => r.overallScore >= 3.5 && r.overallScore < 4.0).length },
      { range: '< 3.5', count: data.performanceReviews.filter((r) => r.overallScore < 3.5).length },
    ];
    return buckets;
  }, [data.performanceReviews]);

  const attendanceRatePct = useMemo(() => {
    const workRecords = data.attendance.filter(
      (a) => a.status !== 'Holiday' && a.status !== 'Weekend'
    );
    if (workRecords.length === 0) return 0;
    const presentCount = workRecords.filter(
      (a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day'
    ).length;
    return Math.round((presentCount / workRecords.length) * 100);
  }, [data.attendance]);

  const cur = settings.currencySymbol || '$';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          HR Analytics & Workforce Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          All analytics charts derive directly from the active browser-local HR dataset.
        </p>
      </div>

      {/* Top KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">Active Headcount</div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {activeEmployees.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Across {deptDistribution.length} active departments
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">Observed Attendance Rate</div>
          <div className="text-2xl font-bold text-teal-600 tabular-nums mt-1">
            {attendanceRatePct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Present + Late / Scheduled Workdays
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">Latest Monthly Payroll Net</div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {cur}
            {Math.round(
              data.payrollRuns[data.payrollRuns.length - 1]?.totalNetPay ?? 0
            ).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            November 2026 Run
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">Approved Leave Days</div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums mt-1">
            {data.leaveRequests
              .filter((r) => r.status === 'Approved')
              .reduce((s, r) => s + r.workingDays, 0)}
            d
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Working days utilized in 2026
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Payroll Cost Trend (Gross vs. Net Pay Across 6 Periods)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Aggregated from monthly PayrollRun snapshots ({cur})
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollCostTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="GrossPay"
                  stroke="#0284C7"
                  fill="#0284C7"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="NetPay"
                  stroke="#0D9488"
                  fill="#0D9488"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Department Headcount Distribution
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Active employees grouped by assigned department code
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="employees" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Recruitment Pipeline Funnel
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Candidate count by active Kanban stage
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recruitmentFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="candidates" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Leave Utilization by Type
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Approved vs. Pending working days
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="ApprovedDays" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PendingDays" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Employee Tenure & Status Breakdown
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Cohort distribution by join year & status
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tenureDistribution}
                  dataKey="count"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, value }) => `${String(name).slice(0, 8)}: ${value}`}
                >
                  {tenureDistribution.map((entry, idx) => (
                    <Cell key={entry.bucket} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Documented Metric Definitions */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-2 text-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Documented HR Metric Definitions
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-slate-600 dark:text-slate-300">
          <div>
            <strong>Observed Attendance Rate:</strong> Calculated as{' '}
            <code>(Present + Late + Half Day) / Total Scheduled Workday Logs</code>, excluding weekends and configured company holidays.
          </div>
          <div>
            <strong>Available Leave Balance:</strong> Calculated as{' '}
            <code>Opening Balance + Accrued Days + Adjustments − Approved Used Days</code>. Pending requests are tracked separately.
          </div>
          <div>
            <strong>Performance Rating Distribution:</strong> Summarizes fictional demo review scores ({performanceDistribution.map((p) => `${p.range}: ${p.count}`).join(', ')}) for portfolio demonstration only.
          </div>
        </div>
      </div>
    </div>
  );
}
