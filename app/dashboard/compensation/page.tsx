'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Search,
  Plus,
  Archive,
  History,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';

export default function CompensationPage() {
  const {
    data,
    settings,
    upsertCompensation,
    archiveCompensation,
    setDrawerEmployeeId,
  } = useHRStore();

  const [search, setSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('emp-002');
  const [modalOpen, setModalOpen] = useState(false);

  // Adjustment Form
  const [formEmpId, setFormEmpId] = useState('emp-002');
  const [baseSalary, setBaseSalary] = useState(14500);
  const [housing, setHousing] = useState(850);
  const [transport, setTransport] = useState(250);
  const [meal, setMeal] = useState(180);
  const [bonus, setBonus] = useState(1500);
  const [deduction, setDeduction] = useState(520);
  const [effectiveDate, setEffectiveDate] = useState('2026-11-15');
  const [reason, setReason] = useState('Annual Merit & Promotion Cycle');

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const activeComps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.compensations
      .filter((c) => !c.archived)
      .filter((c) => {
        if (!q) return true;
        const emp = empMap.get(c.employeeId);
        return (
          emp?.fullName.toLowerCase().includes(q) ||
          emp?.jobTitle.toLowerCase().includes(q) ||
          emp?.employeeCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  }, [data.compensations, search, empMap]);

  const selectedHistory = useMemo(
    () =>
      data.compensations
        .filter((c) => c.employeeId === selectedEmpId)
        .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)),
    [data.compensations, selectedEmpId]
  );

  const cur = settings.currencySymbol || '$';

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    upsertCompensation({
      employeeId: formEmpId,
      baseSalary: Number(baseSalary),
      payFrequency: 'Monthly',
      housingAllowance: Number(housing),
      transportAllowance: Number(transport),
      mealAllowance: Number(meal),
      targetBonusAmount: Number(bonus),
      standardDeduction: Number(deduction),
      effectiveDate,
      changeReason: reason.trim() || 'Compensation adjustment',
    });
    setSelectedEmpId(formEmpId);
    setModalOpen(false);
    toast.success(
      'Saved new effective compensation record. Finalized payroll snapshots remain unchanged.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Compensation & Effective-Date Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage fictional base salaries, allowances, and historical effective dates without mutating finalized payroll runs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Compensation Revision</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee compensation records..."
          className="w-full text-xs bg-transparent focus:outline-none"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Main Compensation Table */}
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4 text-right">Base Salary</th>
                  <th className="py-3 px-4 text-right">Allowances</th>
                  <th className="py-3 px-4 text-right">Target Bonus</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeComps.slice(0, 60).map((comp) => {
                  const emp = empMap.get(comp.employeeId);
                  const totalAllowances =
                    comp.housingAllowance +
                    comp.transportAllowance +
                    comp.mealAllowance;
                  return (
                    <tr
                      key={comp.id}
                      onClick={() => setSelectedEmpId(comp.employeeId)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <EmployeeAvatar
                            name={emp?.fullName ?? comp.employeeId}
                            color={emp?.avatarColor}
                            size="xs"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (emp) setDrawerEmployeeId(emp.id);
                              }}
                              className="font-semibold text-slate-900 dark:text-white hover:text-teal-600"
                            >
                              {emp?.fullName ?? comp.employeeId}
                            </button>
                            <div className="text-[11px] text-slate-400">
                              {emp?.jobTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        {cur}
                        {comp.baseSalary.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {cur}
                        {totalAllowances.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-600">
                        {cur}
                        {comp.targetBonusAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {comp.effectiveDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveCompensation(comp.id);
                            toast.success('Archived compensation configuration');
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600"
                          title="Archive configuration"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Effective-Date History Inspector */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Effective-Date History — {empMap.get(selectedEmpId)?.fullName}
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            {selectedHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                    {cur}
                    {item.baseSalary.toLocaleString()} / {item.payFrequency}
                  </span>
                  <span className="font-mono text-[11px] text-teal-600">
                    Eff: {item.effectiveDate}
                  </span>
                </div>
                <div className="text-slate-500">
                  Allowances: Housing {cur}
                  {item.housingAllowance} · Transport {cur}
                  {item.transportAllowance} · Meal {cur}
                  {item.mealAllowance}
                </div>
                <div className="text-[11px] text-slate-400">
                  {item.changeReason} {item.archived ? '(Archived)' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Compensation Revision Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Record Compensation Revision</h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Employee</label>
                <select
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {data.employees
                    .filter((e) => !e.archived)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.jobTitle})
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    Monthly Base Salary ({cur})
                  </label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">Housing ({cur})</label>
                  <input
                    type="number"
                    value={housing}
                    onChange={(e) => setHousing(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Transport ({cur})</label>
                  <input
                    type="number"
                    value={transport}
                    onChange={(e) => setTransport(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Meal ({cur})</label>
                  <input
                    type="number"
                    value={meal}
                    onChange={(e) => setMeal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Target Bonus ({cur})</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Standard Deduction ({cur})
                  </label>
                  <input
                    type="number"
                    value={deduction}
                    onChange={(e) => setDeduction(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Change Reason</label>
                <input
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold"
                >
                  Save Compensation Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
