'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  RefreshCw,
  Lock,
  Download,
  ReceiptText,
  Search,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { StatusText } from '@/components/ui/StatusText';
import { convertRecordsToCSV, downloadTextFile } from '@/lib/export/exporters';

export default function PayrollWorkspacePage() {
  const {
    data,
    settings,
    generatePayrollRun,
    finalizePayrollRun,
    setDrawerEmployeeId,
  } = useHRStore();

  const [selectedPeriod, setSelectedPeriod] = useState('2026-11');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const selectedRun = useMemo(
    () => data.payrollRuns.find((r) => r.periodMonth === selectedPeriod) ?? data.payrollRuns[data.payrollRuns.length - 1],
    [data.payrollRuns, selectedPeriod]
  );

  const runEntries = useMemo(() => {
    if (!selectedRun) return [];
    const q = search.trim().toLowerCase();
    return data.payrollEntries.filter((e) => {
      if (e.payrollRunId !== selectedRun.id) return false;
      if (deptFilter !== 'All' && e.departmentNameSnapshot !== deptFilter) return false;
      if (q) {
        return (
          e.employeeNameSnapshot.toLowerCase().includes(q) ||
          e.employeeCodeSnapshot.toLowerCase().includes(q) ||
          e.jobTitleSnapshot.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.payrollEntries, selectedRun, deptFilter, search]);

  const cur = settings.currencySymbol || '$';
  const fmt = (n: number) =>
    `${cur}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleRecalculateRun = () => {
    if (!selectedRun) return;
    const res = generatePayrollRun(selectedRun.periodMonth, selectedRun.periodLabel);
    if (!res.success) {
      toast.error(res.error || 'Cannot recalculate finalized run');
      return;
    }
    toast.success(`Recalculated payroll run for ${selectedRun.periodLabel} using Decimal precision.`);
  };

  const handleFinalizeRun = () => {
    if (!selectedRun) return;
    const res = finalizePayrollRun(selectedRun.id);
    if (!res.success) {
      toast.error(res.error || 'Could not finalize payroll run');
      return;
    }
    toast.success(
      `Finalized ${selectedRun.periodLabel} payroll snapshot and issued employee payslips.`
    );
  };

  const handleExportSummary = () => {
    const rows = runEntries.map((e) => ({
      Period: selectedRun?.periodLabel ?? selectedPeriod,
      EmployeeCode: e.employeeCodeSnapshot,
      EmployeeName: e.employeeNameSnapshot,
      Department: e.departmentNameSnapshot,
      JobTitle: e.jobTitleSnapshot,
      BaseSalary: e.baseSalary,
      Allowances: e.allowances,
      Bonuses: e.bonuses,
      GrossPay: e.grossPay,
      UnpaidLeaveDays: e.unpaidLeaveDays,
      UnpaidLeaveAdjustment: e.unpaidLeaveAdjustment,
      ConfiguredDeductions: e.configuredDeductions,
      TotalDeductions: e.totalDeductions,
      NetPay: e.netPay,
      Status: e.status,
    }));
    const csv = convertRecordsToCSV(rows);
    downloadTextFile(csv, `peoplix-payroll-${selectedPeriod}.csv`);
    toast.success(`Exported ${rows.length} payroll ledger rows to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payroll Simulation Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Exact decimal calculation: Gross Pay = Base + Allowances + Bonuses; Net Pay = Gross − (Configured Deductions + Unpaid Leave Adjustments).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            aria-label="Select Payroll Period"
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#182535] text-xs font-semibold"
          >
            {data.payrollRuns.map((run) => (
              <option key={run.id} value={run.periodMonth}>
                {run.periodLabel} ({run.status})
              </option>
            ))}
          </select>

          {selectedRun?.status !== 'Finalized' && (
            <>
              <button
                type="button"
                onClick={handleRecalculateRun}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-teal-500"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                <span>Recalculate Preview</span>
              </button>
              <button
                type="button"
                onClick={handleFinalizeRun}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Mark Finalized & Issue Payslips</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-teal-500"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export Payroll CSV</span>
          </button>

          <Link
            href="/dashboard/payslips"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium"
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Payslips & PDF</span>
          </Link>
        </div>
      </div>

      {/* Simulation Notice */}
      <div className="p-3.5 rounded-xl bg-[#E8F7F4]/70 dark:bg-teal-950/30 border border-teal-500/30 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-teal-950 dark:text-teal-200">
          <AlertCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Interactive Simulation Notice:</strong> All payroll figures are fictional portfolio simulations. Finalized payroll runs lock employee compensation snapshots so subsequent salary edits never alter historical payroll ledgers.
          </span>
        </div>
        {selectedRun && (
          <StatusText
            variant={selectedRun.status === 'Finalized' ? 'success' : 'warning'}
            label={`Run Status: ${selectedRun.status}`}
          />
        )}
      </div>

      {/* Period Summary Strip */}
      {selectedRun && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Eligible Employees', value: selectedRun.employeeCount },
            { label: 'Total Base Salary', value: fmt(selectedRun.totalBaseSalary) },
            { label: 'Total Allowances', value: fmt(selectedRun.totalAllowances) },
            { label: 'Total Bonuses', value: fmt(selectedRun.totalBonuses) },
            { label: 'Total Deductions', value: fmt(selectedRun.totalDeductions) },
            { label: 'Total Net Payable', value: fmt(selectedRun.totalNetPay), highlight: true },
          ].map((card) => (
            <div
              key={card.label}
              className={`p-4 rounded-xl border ${
                card.highlight
                  ? 'bg-[#E8F7F4] dark:bg-teal-950/40 border-teal-500/40'
                  : 'bg-white dark:bg-[#182535] border-[#E7EAF0] dark:border-[#304154]'
              }`}
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {card.label}
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & Department Filter */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter payroll ledger by employee name, code, or role..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="Filter payroll by department"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Departments</option>
          {data.departments
            .filter((d) => !d.archived)
            .map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
        </select>
      </div>

      {/* Employee Payroll Ledger Table */}
      <div className="rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Base Salary</th>
                <th className="py-3 px-4 text-right">Allowances</th>
                <th className="py-3 px-4 text-right">Bonuses</th>
                <th className="py-3 px-4 text-right">Gross Pay</th>
                <th className="py-3 px-4 text-right">Unpaid Leave Adj.</th>
                <th className="py-3 px-4 text-right">Total Deductions</th>
                <th className="py-3 px-4 text-right">Net Pay</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
              {runEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="py-2.5 px-4 font-sans">
                    <button
                      type="button"
                      onClick={() => setDrawerEmployeeId(entry.employeeId)}
                      className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 text-left block"
                    >
                      {entry.employeeNameSnapshot}
                    </button>
                    <div className="text-[11px] text-slate-400">
                      {entry.employeeCodeSnapshot} · {entry.jobTitleSnapshot}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                    {entry.departmentNameSnapshot}
                  </td>
                  <td className="py-2.5 px-4 text-right">{fmt(entry.baseSalary)}</td>
                  <td className="py-2.5 px-4 text-right">{fmt(entry.allowances)}</td>
                  <td className="py-2.5 px-4 text-right text-teal-600">
                    {entry.bonuses > 0 ? `+${fmt(entry.bonuses)}` : fmt(0)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold">
                    {fmt(entry.grossPay)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-amber-600">
                    {entry.unpaidLeaveAdjustment > 0
                      ? `-${fmt(entry.unpaidLeaveAdjustment)} (${entry.unpaidLeaveDays}d)`
                      : fmt(0)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-rose-600">
                    -{fmt(entry.totalDeductions)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {fmt(entry.netPay)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <StatusText
                      variant={entry.status === 'Finalized' ? 'success' : 'warning'}
                      label={entry.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
