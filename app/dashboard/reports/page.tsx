'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  BookmarkPlus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { SavedReportConfig } from '@/lib/types/hr';
import { convertRecordsToCSV, downloadTextFile } from '@/lib/export/exporters';

export default function HRReportsPage() {
  const { data, saveReportConfig, deleteReportConfig } = useHRStore();

  const [reportType, setReportType] =
    useState<SavedReportConfig['reportType']>('employees');
  const [deptId, setDeptId] = useState('All');
  const [empId, setEmpId] = useState('All');
  const [dateFrom, setDateFrom] = useState('2026-10-01');
  const [dateTo, setDateTo] = useState('2026-11-13');
  const [configName, setConfigName] = useState('');

  const deptMap = useMemo(
    () => new Map(data.departments.map((d) => [d.id, d.name])),
    [data.departments]
  );

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const reportRows = useMemo(() => {
    if (reportType === 'employees') {
      return data.employees
        .filter((e) => !e.archived)
        .filter((e) => (deptId === 'All' ? true : e.departmentId === deptId))
        .filter((e) => (empId === 'All' ? true : e.id === empId))
        .map((e) => ({
          Code: e.employeeCode,
          Name: e.fullName,
          Department: deptMap.get(e.departmentId) ?? '',
          JobTitle: e.jobTitle,
          Status: e.employmentStatus,
          Type: e.employmentType,
          Location: `${e.locationCity} (${e.workLocation})`,
          JoinDate: e.joinDate,
        }));
    }

    if (reportType === 'attendance') {
      return data.attendance
        .filter((a) => a.date >= dateFrom && a.date <= dateTo)
        .filter((a) => (empId === 'All' ? true : a.employeeId === empId))
        .filter((a) => {
          if (deptId === 'All') return true;
          const emp = empMap.get(a.employeeId);
          return emp?.departmentId === deptId;
        })
        .map((a) => {
          const emp = empMap.get(a.employeeId);
          return {
            Date: a.date,
            Employee: emp?.fullName ?? a.employeeId,
            Department: emp ? deptMap.get(emp.departmentId) ?? '' : '',
            Status: a.status,
            CheckIn: a.checkIn ?? '',
            CheckOut: a.checkOut ?? '',
            WorkingMinutes: a.workingMinutes,
            LateMinutes: a.lateMinutes,
          };
        });
    }

    if (reportType === 'leave') {
      return data.leaveRequests
        .filter((l) => (empId === 'All' ? true : l.employeeId === empId))
        .filter((l) => {
          if (deptId === 'All') return true;
          const emp = empMap.get(l.employeeId);
          return emp?.departmentId === deptId;
        })
        .map((l) => {
          const emp = empMap.get(l.employeeId);
          return {
            Employee: emp?.fullName ?? l.employeeId,
            LeaveType: l.leaveType,
            StartDate: l.startDate,
            EndDate: l.endDate,
            WorkingDays: l.workingDays,
            Status: l.status,
            Reason: l.reason,
          };
        });
    }

    if (reportType === 'payroll') {
      return data.payrollEntries
        .filter((p) => (empId === 'All' ? true : p.employeeId === empId))
        .map((p) => ({
          Period: p.periodMonth,
          Code: p.employeeCodeSnapshot,
          Employee: p.employeeNameSnapshot,
          Department: p.departmentNameSnapshot,
          BaseSalary: p.baseSalary,
          Allowances: p.allowances,
          Bonuses: p.bonuses,
          GrossPay: p.grossPay,
          TotalDeductions: p.totalDeductions,
          NetPay: p.netPay,
          Status: p.status,
        }));
    }

    if (reportType === 'departments') {
      return data.departments
        .filter((d) => !d.archived)
        .map((d) => ({
          Code: d.code,
          DepartmentName: d.name,
          Location: d.location,
          BudgetCode: d.budgetCode,
          Headcount: data.employees.filter(
            (e) => !e.archived && e.departmentId === d.id
          ).length,
        }));
    }

    if (reportType === 'recruitment') {
      return data.candidates
        .filter((c) => !c.archived)
        .map((c) => ({
          Candidate: c.fullName,
          Role: c.currentRole,
          Stage: c.stage,
          Decision: c.hiringDecision,
          OfferStatus: c.offerStatus,
          ExperienceYears: c.experienceYears,
          AppliedDate: c.appliedDate,
        }));
    }

    return data.performanceReviews.map((r) => {
      const emp = empMap.get(r.employeeId);
      return {
        Employee: emp?.fullName ?? r.employeeId,
        Cycle: r.cycleName,
        SelfScore: r.selfAssessmentScore,
        ManagerScore: r.managerScore,
        OverallScore: r.overallScore,
        Status: r.status,
      };
    });
  }, [reportType, data, deptId, empId, dateFrom, dateTo, deptMap, empMap]);

  const handleExportCSV = () => {
    const csv = convertRecordsToCSV(reportRows);
    downloadTextFile(
      csv,
      `peoplix-report-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success(`Exported ${reportRows.length} rows from ${reportType} report.`);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configName.trim()) {
      toast.error('Please enter a name for the saved report preset.');
      return;
    }
    saveReportConfig({
      name: configName.trim(),
      reportType,
      departmentId: deptId,
      dateFrom,
      dateTo,
    });
    setConfigName('');
    toast.success('Saved report configuration preset.');
  };

  const headers = reportRows.length > 0 ? Object.keys(reportRows[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            HR Reporting Center & CSV Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Generate, filter, print, and export live HR datasets across all 7 operational modules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-teal-500"
          >
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ({reportRows.length} rows)</span>
          </button>
        </div>
      </div>

      {/* Saved Report Presets */}
      <div className="flex flex-wrap items-center gap-2">
        {data.savedReports.map((rep) => (
          <div
            key={rep.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs"
          >
            <button
              type="button"
              onClick={() => {
                setReportType(rep.reportType);
                setDeptId(rep.departmentId);
                setDateFrom(rep.dateFrom);
                setDateTo(rep.dateTo);
                toast.info(`Loaded report preset: ${rep.name}`);
              }}
              className="font-medium text-slate-800 dark:text-slate-200 hover:text-teal-600"
            >
              {rep.name}
            </button>
            <button
              type="button"
              onClick={() => deleteReportConfig(rep.id)}
              className="text-slate-400 hover:text-rose-600"
              aria-label={`Delete preset ${rep.name}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Report Configuration & Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as SavedReportConfig['reportType'])
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
            >
              <option value="employees">Employee Directory Report</option>
              <option value="attendance">Attendance Audit Report</option>
              <option value="leave">Leave Utilization Report</option>
              <option value="payroll">Payroll Summary Report</option>
              <option value="departments">Department Summary Report</option>
              <option value="recruitment">Recruitment Pipeline Report</option>
              <option value="performance">Performance Review Report</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Department</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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
            <label className="block text-[11px] text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Save Report Configuration Preset */}
        <form
          onSubmit={handleSavePreset}
          className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2"
        >
          <input
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="Name this report configuration to save as a preset..."
            className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-medium"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Report Configuration</span>
          </button>
        </form>
      </div>

      {/* Report Data Preview Table */}
      <div className="rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                {headers.map((h) => (
                  <th key={h} className="py-3 px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportRows.slice(0, 60).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  {headers.map((h) => (
                    <td key={h} className="py-2.5 px-4 tabular-nums">
                      {String((row as Record<string, unknown>)[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
