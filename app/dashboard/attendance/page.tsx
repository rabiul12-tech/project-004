'use client';

import React, { useMemo, useState } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  List,
  Download,
  LogIn,
  LogOut,
  Plus,
  Edit3,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { AttendanceRecord } from '@/lib/types/hr';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import { getAttendanceStatusVariant, StatusText } from '@/components/ui/StatusText';
import { convertRecordsToCSV, downloadTextFile } from '@/lib/export/exporters';

export default function AttendancePage() {
  const { data, ui, recordOrCorrectAttendance, setDrawerEmployeeId } = useHRStore();

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [dateFrom, setDateFrom] = useState('2026-11-01');
  const [dateTo, setDateTo] = useState('2026-11-13');
  const [empFilter, setEmpFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Check-in / Check-out simulator state
  const [simEmployeeId, setSimEmployeeId] = useState(ui.activeDemoEmployeeId || 'emp-004');
  const [simDate, setSimDate] = useState('2026-11-13');

  // Manual Correction Modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const deptMap = useMemo(
    () => new Map(data.departments.map((d) => [d.id, d.name])),
    [data.departments]
  );

  const filteredRecords = useMemo(() => {
    return data.attendance
      .filter((rec) => {
        if (dateFrom && rec.date < dateFrom) return false;
        if (dateTo && rec.date > dateTo) return false;
        if (empFilter !== 'All' && rec.employeeId !== empFilter) return false;
        if (statusFilter !== 'All' && rec.status !== statusFilter) return false;
        if (deptFilter !== 'All') {
          const emp = empMap.get(rec.employeeId);
          if (!emp || emp.departmentId !== deptFilter) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.attendance, dateFrom, dateTo, empFilter, statusFilter, deptFilter, empMap]);

  const summary = useMemo(() => {
    const present = filteredRecords.filter((r) => r.status === 'Present').length;
    const late = filteredRecords.filter((r) => r.status === 'Late').length;
    const halfDay = filteredRecords.filter((r) => r.status === 'Half Day').length;
    const absent = filteredRecords.filter((r) => r.status === 'Absent').length;
    const onLeave = filteredRecords.filter((r) => r.status === 'On Leave').length;
    const avgMinutes =
      filteredRecords.length > 0
        ? Math.round(
            filteredRecords.reduce((s, r) => s + r.workingMinutes, 0) /
              Math.max(
                1,
                filteredRecords.filter((r) => r.workingMinutes > 0).length
              )
          )
        : 0;
    return { present, late, halfDay, absent, onLeave, avgMinutes };
  }, [filteredRecords]);

  // Calendar grid days for November 2026
  const calendarDays = useMemo(() => {
    const days: string[] = [];
    for (let d = 1; d <= 30; d++) {
      days.push(`2026-11-${String(d).padStart(2, '0')}`);
    }
    return days;
  }, []);

  const handleSimulateCheckIn = () => {
    const existing = data.attendance.find(
      (a) => a.employeeId === simEmployeeId && a.date === simDate
    );
    const rec = recordOrCorrectAttendance({
      employeeId: simEmployeeId,
      date: simDate,
      checkIn: '08:58',
      checkOut: existing?.checkOut ?? '17:32',
      notes: 'Simulated check-in action',
    });
    const emp = empMap.get(simEmployeeId);
    toast.success(`Check-in recorded for ${emp?.fullName ?? simEmployeeId} on ${simDate} (${rec.status})`);
  };

  const handleSimulateCheckOut = () => {
    const existing = data.attendance.find(
      (a) => a.employeeId === simEmployeeId && a.date === simDate
    );
    const rec = recordOrCorrectAttendance({
      employeeId: simEmployeeId,
      date: simDate,
      checkIn: existing?.checkIn ?? '09:00',
      checkOut: '17:40',
      notes: 'Simulated check-out action',
    });
    const emp = empMap.get(simEmployeeId);
    toast.success(`Check-out recorded for ${emp?.fullName ?? simEmployeeId} on ${simDate} (${rec.workingMinutes} mins)`);
  };

  const handleExportCSV = () => {
    const rows = filteredRecords.map((r) => {
      const emp = empMap.get(r.employeeId);
      return {
        Date: r.date,
        EmployeeCode: emp?.employeeCode ?? r.employeeId,
        EmployeeName: emp?.fullName ?? '',
        Department: emp ? deptMap.get(emp.departmentId) ?? '' : '',
        Status: r.status,
        CheckIn: r.checkIn ?? '',
        CheckOut: r.checkOut ?? '',
        WorkingMinutes: r.workingMinutes,
        LateMinutes: r.lateMinutes,
        Notes: r.notes,
      };
    });
    const csv = convertRecordsToCSV(rows);
    downloadTextFile(csv, `peoplix-attendance-${dateFrom}-to-${dateTo}.csv`);
    toast.success(`Exported ${rows.length} attendance records to CSV.`);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const updated = recordOrCorrectAttendance({
      employeeId: editingRecord.employeeId,
      date: editingRecord.date,
      checkIn: editingRecord.checkIn,
      checkOut: editingRecord.checkOut,
      notes: editingRecord.notes,
      isManualCorrection: true,
    });
    toast.success(`Attendance corrected (${updated.status}) for ${editingRecord.date}`);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attendance Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule-aware attendance engine with late arrival thresholds, holiday rules, and approved leave priority.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                viewMode === 'table'
                  ? 'bg-[#E8F7F4] dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Attendance Log</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                viewMode === 'calendar'
                  ? 'bg-[#E8F7F4] dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  : 'text-slate-500'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Monthly Calendar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-[#304154] text-xs font-medium hover:border-teal-500"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Interactive Check-In / Check-Out Simulation Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#E8F7F4] dark:bg-teal-950/60 text-[#0D9488] dark:text-[#2DD4BF]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Attendance Clock Simulation (No Hardware / Biometric Tracking)
            </div>
            <div className="text-[11px] text-slate-500">
              Select an employee and date to simulate check-in, check-out, or manual schedule entry.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={simEmployeeId}
            onChange={(e) => setSimEmployeeId(e.target.value)}
            aria-label="Select employee for check-in simulation"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            {data.employees
              .filter((e) => !e.archived)
              .slice(0, 40)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode})
                </option>
              ))}
          </select>

          <input
            type="date"
            value={simDate}
            onChange={(e) => setSimDate(e.target.value)}
            aria-label="Simulation date"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />

          <button
            type="button"
            onClick={handleSimulateCheckIn}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Simulate Check-In</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateCheckOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500 font-medium"
          >
            <LogOut className="w-3.5 h-3.5 text-teal-600" />
            <span>Simulate Check-Out</span>
          </button>
        </div>
      </div>

      {/* Monthly Attendance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: 'Present Records', value: summary.present, tone: 'text-emerald-600' },
          { label: 'Late Arrivals', value: summary.late, tone: 'text-amber-600' },
          { label: 'Half Days', value: summary.halfDay, tone: 'text-amber-600' },
          { label: 'Unscheduled Absent', value: summary.absent, tone: 'text-rose-600' },
          { label: 'Approved On Leave', value: summary.onLeave, tone: 'text-teal-600' },
          {
            label: 'Avg Shift Duration',
            value: `${Math.floor(summary.avgMinutes / 60)}h ${summary.avgMinutes % 60}m`,
            tone: 'text-slate-900 dark:text-white',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]"
          >
            <div className="text-[11px] text-slate-500">{stat.label}</div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${stat.tone}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Employee</label>
          <select
            value={empFilter}
            onChange={(e) => setEmpFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Table or Monthly Calendar View */}
      {viewMode === 'table' ? (
        <div className="rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Late / Early</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Correct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.slice(0, 80).map((rec) => {
                  const emp = empMap.get(rec.employeeId);
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <EmployeeAvatar
                            name={emp?.fullName ?? rec.employeeId}
                            color={emp?.avatarColor}
                            size="xs"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => emp && setDrawerEmployeeId(emp.id)}
                              className="font-semibold text-slate-900 dark:text-white hover:text-teal-600"
                            >
                              {emp?.fullName ?? rec.employeeId}
                            </button>
                            <div className="text-[11px] text-slate-400">
                              {emp ? deptMap.get(emp.departmentId) : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums">{rec.date}</td>
                      <td className="py-2.5 px-4">
                        <StatusText
                          variant={getAttendanceStatusVariant(rec.status)}
                          label={rec.status}
                        />
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums">
                        {rec.checkIn ?? '--:--'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums">
                        {rec.checkOut ?? '--:--'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums">
                        {rec.workingMinutes > 0
                          ? `${Math.floor(rec.workingMinutes / 60)}h ${rec.workingMinutes % 60}m`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-[11px]">
                        {rec.lateMinutes > 0 && (
                          <span className="text-amber-600">+{rec.lateMinutes}m late</span>
                        )}
                        {rec.earlyDepartureMinutes > 0 && (
                          <span className="text-amber-600 ml-1">
                            -{rec.earlyDepartureMinutes}m early
                          </span>
                        )}
                        {rec.lateMinutes === 0 && rec.earlyDepartureMinutes === 0 && 'On schedule'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 max-w-[180px] truncate">
                        {rec.notes || (rec.isManualCorrection ? 'Manual adjustment' : '—')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingRecord(rec)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-teal-600"
                          title="Correct attendance record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            November 2026 Daily Attendance Density Calendar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
            {calendarDays.map((dayStr) => {
              const dayRecs = data.attendance.filter((a) => a.date === dayStr);
              const pres = dayRecs.filter((a) => a.status === 'Present').length;
              const late = dayRecs.filter((a) => a.status === 'Late').length;
              const leave = dayRecs.filter((a) => a.status === 'On Leave').length;
              return (
                <div
                  key={dayStr}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-xs space-y-1.5"
                >
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {dayStr}
                  </div>
                  {dayRecs.length === 0 ? (
                    <div className="text-[11px] text-slate-400">Weekend / Unlogged</div>
                  ) : (
                    <div className="space-y-0.5 text-[11px] tabular-nums">
                      <div className="text-emerald-600">Present: {pres}</div>
                      <div className="text-amber-600">Late: {late}</div>
                      <div className="text-teal-600">On Leave: {leave}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Correct Attendance — {editingRecord.date}
              </h3>
              <button type="button" onClick={() => setEditingRecord(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCorrection} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Check-In (HH:mm)</label>
                  <input
                    type="time"
                    value={editingRecord.checkIn ?? ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        checkIn: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Check-Out (HH:mm)</label>
                  <input
                    type="time"
                    value={editingRecord.checkOut ?? ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        checkOut: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Correction Notes</label>
                <input
                  value={editingRecord.notes}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, notes: e.target.value })
                  }
                  placeholder="Reason for manual attendance correction..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold"
                >
                  Apply Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
