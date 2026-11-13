'use client';

import React, { useMemo, useState } from 'react';
import {
  Download,
  Printer,
  Search,
  ReceiptText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { StatusText } from '@/components/ui/StatusText';
import { downloadPayslipPdf } from '@/lib/pdf/payslipPdf';

export default function PayslipsPage() {
  const { data, settings } = useHRStore();

  const [periodFilter, setPeriodFilter] = useState('2026-10');
  const [search, setSearch] = useState('');
  const [selectedPayslipId, setSelectedPayslipId] = useState<string>('');

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const deptMap = useMemo(
    () => new Map(data.departments.map((d) => [d.id, d])),
    [data.departments]
  );

  const filteredPayslips = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.payslips.filter((ps) => {
      if (periodFilter !== 'All' && ps.periodMonth !== periodFilter) return false;
      if (q) {
        const emp = empMap.get(ps.employeeId);
        return (
          emp?.fullName.toLowerCase().includes(q) ||
          emp?.employeeCode.toLowerCase().includes(q) ||
          ps.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.payslips, periodFilter, search, empMap]);

  const activePayslip =
    filteredPayslips.find((p) => p.id === selectedPayslipId) ??
    filteredPayslips[0] ??
    data.payslips[0];

  const activeEmployee = activePayslip
    ? empMap.get(activePayslip.employeeId)
    : undefined;
  const activeDept = activeEmployee
    ? deptMap.get(activeEmployee.departmentId)
    : undefined;

  const cur = settings.currencySymbol || '$';
  const fmt = (n: number) =>
    `${cur}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDownloadPdf = () => {
    if (!activePayslip || !activeEmployee) return;
    downloadPayslipPdf({
      payslip: activePayslip,
      employee: activeEmployee,
      department: activeDept,
      settings,
    });
    toast.success(`Downloaded A4 Payslip PDF for ${activeEmployee.fullName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payslip Management & Client-Side A4 PDF Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Inspect itemized earnings & deductions breakdowns, print statements, or download A4 PDF payslips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-teal-500"
          >
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            <span>Print Payslip</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download A4 PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee name, code, or payslip ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        </div>

        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          aria-label="Filter payslips by period"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Periods</option>
          {data.payrollRuns.map((r) => (
            <option key={r.id} value={r.periodMonth}>
              {r.periodLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Split Workspace: Payslip Roster on Left, A4 Preview on Right */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              Payslip Statements ({filteredPayslips.length})
            </span>
            <span className="text-slate-400">Select to preview</span>
          </div>
          <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredPayslips.slice(0, 60).map((ps) => {
              const emp = empMap.get(ps.employeeId);
              const isSelected = activePayslip?.id === ps.id;
              return (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => setSelectedPayslipId(ps.id)}
                  className={`w-full text-left p-3.5 flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#E8F7F4]/80 dark:bg-teal-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {emp?.fullName ?? ps.employeeId}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {ps.periodLabel} · {emp?.employeeCode}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {fmt(ps.netPay)}
                    </div>
                    <StatusText
                      variant={ps.status === 'Issued' ? 'success' : 'warning'}
                      label={ps.status}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Premium A4 Payslip Template Preview */}
        {activePayslip && activeEmployee && (
          <div className="lg:col-span-7 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] shadow-sm overflow-hidden">
            {/* Teal Header Band */}
            <div className="bg-[#0D9488] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold tracking-tight">
                  {settings.logoText || 'PEOPLIX HR'}
                </div>
                <div className="text-xs text-teal-100">
                  {settings.companyName} — Simulated Payslip Statement
                </div>
              </div>
              <div className="sm:text-right text-xs">
                <div className="font-bold text-sm uppercase">
                  Pay Period: {activePayslip.periodLabel}
                </div>
                <div className="text-teal-100 font-mono tabular-nums">
                  ID: {activePayslip.id} · Issued: {activePayslip.issuedDate}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Employee Identity Block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Employee Name</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeEmployee.fullName}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Employee ID</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeEmployee.employeeCode}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Job Title</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {activeEmployee.jobTitle}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Department</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {activeDept?.name ?? 'Operations'}
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Columns */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                    Earnings Breakdown
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Salary</span>
                    <span className="font-mono tabular-nums">
                      {fmt(activePayslip.earningsBreakdown.baseSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Housing Allowance</span>
                    <span className="font-mono tabular-nums">
                      {fmt(activePayslip.earningsBreakdown.housingAllowance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transport Allowance</span>
                    <span className="font-mono tabular-nums">
                      {fmt(activePayslip.earningsBreakdown.transportAllowance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Meal & Wellness Allowance</span>
                    <span className="font-mono tabular-nums">
                      {fmt(activePayslip.earningsBreakdown.mealAllowance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Performance & Spot Bonus</span>
                    <span className="font-mono tabular-nums text-teal-600">
                      {fmt(activePayslip.earningsBreakdown.bonus)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Gross Pay</span>
                    <span className="font-mono tabular-nums">
                      {fmt(activePayslip.grossPay)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                    Deductions Breakdown
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Configured Standard Deduction</span>
                    <span className="font-mono tabular-nums text-rose-600">
                      -{fmt(activePayslip.deductionsBreakdown.configuredDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unpaid Leave Adjustment</span>
                    <span className="font-mono tabular-nums text-amber-600">
                      -{fmt(activePayslip.deductionsBreakdown.unpaidLeaveAdjustment)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Deductions</span>
                    <span className="font-mono tabular-nums text-rose-600">
                      -{fmt(activePayslip.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Box */}
              <div className="p-4 rounded-xl bg-[#E8F7F4] dark:bg-teal-950/50 border border-teal-500/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase">
                    Net Payable Simulation Amount
                  </div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400">
                    Gross Pay ({fmt(activePayslip.grossPay)}) − Total Deductions ({fmt(activePayslip.totalDeductions)})
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {fmt(activePayslip.netPay)}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong>Portfolio Demonstration Disclaimer:</strong> Generated on the client by PEOPLIX HR. This document is a simulated portfolio artifact and does not constitute certified legal payroll or tax withholding documentation.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
