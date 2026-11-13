'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  CalendarOff,
  Clock,
  Briefcase,
  FileCheck2,
  Plus,
  Cake,
  Award,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
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
} from 'recharts';
import { useHRStore } from '@/lib/stores/useHRStore';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import { getLeaveStatusVariant, StatusText } from '@/components/ui/StatusText';

export default function DashboardOverviewPage() {
  const { data, setQuickCreateModal, setDrawerEmployeeId, transitionLeaveStatus } =
    useHRStore();

  const activeEmployees = useMemo(
    () => data.employees.filter((e) => !e.archived),
    [data.employees]
  );

  const metrics = useMemo(() => {
    const totalEmployees = activeEmployees.length;
    const currentlyActive = activeEmployees.filter(
      (e) => e.employmentStatus === 'Active' || e.employmentStatus === 'Probation'
    ).length;
    const onLeaveCount = activeEmployees.filter(
      (e) => e.employmentStatus === 'On Leave'
    ).length;

    const todayStr = '2026-11-13';
    const todayRecords = data.attendance.filter((a) => a.date === todayStr);
    const presentToday = todayRecords.filter(
      (a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day'
    ).length;
    const absentToday = todayRecords.filter((a) => a.status === 'Absent').length;

    const openPositions = data.jobOpenings.filter((j) => j.status === 'Open').length;
    const pendingLeaves = data.leaveRequests.filter(
      (l) => l.status === 'Pending'
    ).length;

    return {
      totalEmployees,
      currentlyActive,
      onLeaveCount,
      presentToday,
      absentToday,
      openPositions,
      pendingLeaves,
    };
  }, [activeEmployees, data.attendance, data.jobOpenings, data.leaveRequests]);

  // Department headcount chart data
  const deptChartData = useMemo(() => {
    return data.departments
      .filter((d) => !d.archived)
      .map((dept) => {
        const count = activeEmployees.filter((e) => e.departmentId === dept.id).length;
        return {
          name: dept.code,
          fullName: dept.name,
          headcount: count,
        };
      });
  }, [data.departments, activeEmployees]);

  // Attendance trend across recent dates
  const attendanceTrendData = useMemo(() => {
    const dates = [
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
    ];
    return dates.map((d) => {
      const dayRecs = data.attendance.filter((a) => a.date === d);
      const present = dayRecs.filter(
        (a) => a.status === 'Present' || a.status === 'Late'
      ).length;
      const onLeave = dayRecs.filter((a) => a.status === 'On Leave').length;
      return {
        date: d.slice(5),
        Present: present,
        OnLeave: onLeave,
      };
    });
  }, [data.attendance]);

  // Workforce Growth by Join Year
  const workforceGrowthData = useMemo(() => {
    const years = ['2023', '2024', '2025', '2026'];
    let cumulative = 0;
    return years.map((yr) => {
      const joinedInYear = activeEmployees.filter((e) => e.joinDate.startsWith(yr)).length;
      cumulative += joinedInYear;
      return {
        year: yr,
        TotalHeadcount: cumulative,
        NewHires: joinedInYear,
      };
    });
  }, [activeEmployees]);

  // Upcoming Birthdays (November)
  const upcomingBirthdays = useMemo(() => {
    return activeEmployees
      .filter((e) => e.birthDate.slice(5, 7) === '11')
      .slice(0, 5);
  }, [activeEmployees]);

  // Upcoming Work Anniversaries
  const upcomingAnniversaries = useMemo(() => {
    return activeEmployees
      .filter(
        (e) =>
          (e.joinDate.slice(5, 7) === '11' || e.joinDate.slice(5, 7) === '10') &&
          !e.joinDate.startsWith('2026')
      )
      .slice(0, 5);
  }, [activeEmployees]);

  // Upcoming Holidays
  const upcomingHolidays = useMemo(() => {
    return data.holidays.filter((h) => h.date >= '2026-11-01').slice(0, 4);
  }, [data.holidays]);

  // Pending Leave Requests for Quick Review
  const pendingLeaveList = useMemo(() => {
    return data.leaveRequests.filter((l) => l.status === 'Pending').slice(0, 5);
  }, [data.leaveRequests]);

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            People Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Live local workforce metrics, attendance status for Nov 13, 2026, and pending approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQuickCreateModal('employee')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickCreateModal('attendance')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-[#304154] text-slate-700 dark:text-slate-200 text-xs font-medium hover:border-teal-500 transition-colors whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Log Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickCreateModal('leave')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-[#304154] text-slate-700 dark:text-slate-200 text-xs font-medium hover:border-teal-500 transition-colors whitespace-nowrap"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Request Leave</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (7 Core Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: 'Total Employees',
            value: metrics.totalEmployees,
            sub: `${data.departments.filter((d) => !d.archived).length} depts`,
            icon: Users,
            href: '/dashboard/employees',
          },
          {
            label: 'Active Workforce',
            value: metrics.currentlyActive,
            sub: 'Active & Probation',
            icon: UserCheck,
            href: '/dashboard/employees',
          },
          {
            label: 'On Leave',
            value: metrics.onLeaveCount,
            sub: 'Scheduled leave',
            icon: CalendarOff,
            href: '/dashboard/leave-calendar',
          },
          {
            label: 'Present Today',
            value: metrics.presentToday,
            sub: 'Nov 13 check-ins',
            icon: Clock,
            href: '/dashboard/attendance',
          },
          {
            label: 'Absent Today',
            value: metrics.absentToday,
            sub: 'Unscheduled',
            icon: Clock,
            href: '/dashboard/attendance',
          },
          {
            label: 'Open Positions',
            value: metrics.openPositions,
            sub: `${data.candidates.filter((c) => !c.archived).length} candidates`,
            icon: Briefcase,
            href: '/dashboard/recruitment',
          },
          {
            label: 'Pending Leaves',
            value: metrics.pendingLeaves,
            sub: 'Needs review',
            icon: FileCheck2,
            href: '/dashboard/leave',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] hover:border-teal-500/60 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {kpi.label}
                </span>
                <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {kpi.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {kpi.sub}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Row: Department Headcount, Attendance Trend, Workforce Growth */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Department Headcount */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Department Headcount
              </h2>
              <p className="text-xs text-slate-500">
                Active distribution across 8 departments
              </p>
            </div>
            <Link
              href="/dashboard/departments"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="headcount" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Attendance Trend
              </h2>
              <p className="text-xs text-slate-500">
                Present vs. On Leave over recent workdays
              </p>
            </div>
            <Link
              href="/dashboard/attendance"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
            >
              Attendance <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={attendanceTrendData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="Present"
                  stroke="#0D9488"
                  fill="#0D9488"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="OnLeave"
                  stroke="#D97706"
                  fill="#D97706"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workforce Growth */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Workforce Growth
              </h2>
              <p className="text-xs text-slate-500">
                Cumulative headcount & annual new hires
              </p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
            >
              Analytics <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={workforceGrowthData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="TotalHeadcount"
                  stroke="#0284C7"
                  fill="#0284C7"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="NewHires"
                  stroke="#0D9488"
                  fill="#0D9488"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable Queues: Pending Leave Approvals & Recent Employee Activity */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Pending Leave Approvals */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pending Leave Approvals ({metrics.pendingLeaves})
                </h2>
                <p className="text-xs text-slate-500">
                  Approve or reject requests directly — updates employee leave balances immediately
                </p>
              </div>
              <Link
                href="/dashboard/leave"
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
              >
                View All Requests →
              </Link>
            </div>

            {pendingLeaveList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All pending leave requests have been reviewed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingLeaveList.map((req) => {
                  const emp = data.employees.find((e) => e.id === req.employeeId);
                  return (
                    <div
                      key={req.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <EmployeeAvatar
                          name={emp?.fullName ?? 'Employee'}
                          color={emp?.avatarColor}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => emp && setDrawerEmployeeId(emp.id)}
                            className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-600 truncate block"
                          >
                            {emp?.fullName ?? req.employeeId}
                          </button>
                          <div className="text-[11px] text-slate-500 truncate">
                            {req.leaveType} Leave · {req.startDate} to {req.endDate} (
                            <span className="font-mono tabular-nums">{req.workingDays}d</span>)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusText
                          variant={getLeaveStatusVariant(req.status)}
                          label={req.status}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            transitionLeaveStatus(
                              req.id,
                              'Approved',
                              'Approved from Overview Dashboard'
                            )
                          }
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            transitionLeaveStatus(
                              req.id,
                              'Rejected',
                              'Declined from Overview Dashboard'
                            )
                          }
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Celebrations & Holidays */}
        <div className="lg:col-span-5 space-y-6">
          {/* Birthdays & Work Anniversaries */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Upcoming Birthdays & Work Anniversaries
            </h2>
            <div className="space-y-3">
              {upcomingBirthdays.slice(0, 3).map((emp) => (
                <div
                  key={`bday-${emp.id}`}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Cake className="w-4 h-4 text-rose-500 shrink-0" />
                    <button
                      type="button"
                      onClick={() => setDrawerEmployeeId(emp.id)}
                      className="font-medium text-slate-800 dark:text-slate-200 hover:text-teal-600 truncate"
                    >
                      {emp.fullName}
                    </button>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 truncate">{emp.jobTitle}</span>
                  </div>
                  <span className="text-slate-500 font-mono tabular-nums shrink-0">
                    Nov {emp.birthDate.slice(8, 10)}
                  </span>
                </div>
              ))}
              {upcomingAnniversaries.slice(0, 3).map((emp) => {
                const years = 2026 - Number(emp.joinDate.slice(0, 4));
                return (
                  <div
                    key={`anniv-${emp.id}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      <button
                        type="button"
                        onClick={() => setDrawerEmployeeId(emp.id)}
                        className="font-medium text-slate-800 dark:text-slate-200 hover:text-teal-600 truncate"
                      >
                        {emp.fullName}
                      </button>
                      <span className="text-slate-400">·</span>
                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                        {years} yr{years > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono tabular-nums shrink-0">
                      Joined {emp.joinDate.slice(0, 7)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Holidays */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Holidays
              </h2>
              <Link
                href="/dashboard/holidays"
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                Manage Holidays →
              </Link>
            </div>
            <div className="space-y-2.5">
              {upcomingHolidays.map((hol) => (
                <div
                  key={hol.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {hol.name}
                    </span>
                    <span className="text-slate-400">({hol.applicableLocation})</span>
                  </div>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {hol.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Employee Activity Stream */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent People Operations Activity
            </h2>
            <p className="text-xs text-slate-500">
              Latest updates across employees, attendance, leave, payroll, and talent
            </p>
          </div>
          <Link
            href="/dashboard/activity"
            className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            Full Activity Timeline ({data.activities.length}) →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.activities.slice(0, 8).map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {act.title}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {act.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span>By {act.actorName}</span>
                <span className="tabular-nums">{act.timestamp.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
