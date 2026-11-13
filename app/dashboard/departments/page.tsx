'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Users,
  Edit3,
  Archive,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { Department } from '@/lib/types/hr';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';

export default function DepartmentsPage() {
  const {
    data,
    setQuickCreateModal,
    setDrawerEmployeeId,
    updateDepartment,
    archiveDepartment,
  } = useHRStore();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-eng');
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const activeEmployees = useMemo(
    () => data.employees.filter((e) => !e.archived),
    [data.employees]
  );

  const activeDepts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.departments
      .filter((d) => !d.archived)
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q)
      );
  }, [data.departments, search]);

  const selectedDept =
    data.departments.find((d) => d.id === selectedDeptId) ?? activeDepts[0];

  const selectedDeptEmployees = useMemo(
    () =>
      activeEmployees.filter(
        (e) => selectedDept && e.departmentId === selectedDept.id
      ),
    [activeEmployees, selectedDept]
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    updateDepartment(editingDept.id, editingDept);
    toast.success(`Updated department ${editingDept.name}`);
    setEditingDept(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Department Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize workforce units, department leadership, headcount budgets, and safe department archiving.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards'
                  ? 'bg-slate-100 dark:bg-slate-800 text-teal-600'
                  : 'text-slate-500'
              }`}
              aria-label="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-slate-800 text-teal-600'
                  : 'text-slate-500'
              }`}
              aria-label="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setQuickCreateModal('department')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Department</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search department name, code, or location..."
          className="w-full text-xs bg-transparent focus:outline-none"
        />
      </div>

      {/* Cards or Table View */}
      {viewMode === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeDepts.map((dept) => {
            const deptEmps = activeEmployees.filter((e) => e.departmentId === dept.id);
            const activeCount = deptEmps.filter(
              (e) => e.employmentStatus === 'Active' || e.employmentStatus === 'Probation'
            ).length;
            const head = data.employees.find((e) => e.id === dept.headEmployeeId);
            const isSelected = selectedDept?.id === dept.id;

            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`p-5 rounded-xl bg-white dark:bg-[#182535] border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-[#0D9488] ring-2 ring-teal-500/20'
                    : 'border-[#E7EAF0] dark:border-[#304154] hover:border-teal-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                      {dept.code} · {dept.budgetCode}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDept(dept);
                        }}
                        className="p-1 text-slate-400 hover:text-teal-600"
                        aria-label={`Edit ${dept.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {activeDepts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveDepartment(dept.id);
                            toast.success(
                              `Archived ${dept.name} and reassigned members safely.`
                            );
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          aria-label={`Archive ${dept.name}`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {dept.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {dept.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department Head</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                      {head?.fullName ?? 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Headcount</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {activeCount} active / {deptEmps.length} total
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department Head</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Total / Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeDepts.map((dept) => {
                const deptEmps = activeEmployees.filter((e) => e.departmentId === dept.id);
                const head = data.employees.find((e) => e.id === dept.headEmployeeId);
                return (
                  <tr key={dept.id} onClick={() => setSelectedDeptId(dept.id)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {dept.name}
                    </td>
                    <td className="py-3 px-4 font-mono">{dept.code}</td>
                    <td className="py-3 px-4">{head?.fullName ?? '—'}</td>
                    <td className="py-3 px-4">{dept.location}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      {deptEmps.length} members
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingDept(dept)}
                        className="text-teal-600 hover:underline mr-3"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Department Member Roster */}
      {selectedDept && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>
                  {selectedDept.name} Roster ({selectedDeptEmployees.length} Employees)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDept.description}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Hub: {selectedDept.location} · Cost Center: {selectedDept.budgetCode}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {selectedDeptEmployees.map((emp) => (
              <div
                key={emp.id}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <EmployeeAvatar
                    name={emp.fullName}
                    color={emp.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setDrawerEmployeeId(emp.id)}
                      className="text-xs font-semibold text-slate-900 dark:text-white hover:text-teal-600 truncate block text-left"
                    >
                      {emp.fullName}
                    </button>
                    <div className="text-[11px] text-slate-500 truncate">
                      {emp.jobTitle}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/dashboard/employees/${emp.id}`}
                  className="text-[11px] text-teal-600 font-medium shrink-0 hover:underline"
                >
                  360° →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit Department</h3>
              <button type="button" onClick={() => setEditingDept(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input
                  required
                  value={editingDept.name}
                  onChange={(e) =>
                    setEditingDept({ ...editingDept, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Department Head</label>
                <select
                  value={editingDept.headEmployeeId ?? ''}
                  onChange={(e) =>
                    setEditingDept({
                      ...editingDept,
                      headEmployeeId: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {activeEmployees.slice(0, 25).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingDept.description}
                  onChange={(e) =>
                    setEditingDept({ ...editingDept, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
