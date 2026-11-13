'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Download,
  Edit3,
  Archive,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import {
  Employee,
  EmploymentStatus,
  EmploymentType,
  WorkLocationCategory,
} from '@/lib/types/hr';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import { getEmploymentStatusVariant, StatusText } from '@/components/ui/StatusText';
import { convertRecordsToCSV, downloadTextFile } from '@/lib/export/exporters';

export default function EmployeeDirectoryPage() {
  const {
    data,
    setQuickCreateModal,
    setDrawerEmployeeId,
    updateEmployee,
    archiveEmployee,
  } = useHRStore();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [titleFilter, setTitleFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'department' | 'title'>('name');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const activeEmployees = useMemo(
    () => data.employees.filter((e) => !e.archived),
    [data.employees]
  );

  const deptMap = useMemo(
    () => new Map(data.departments.map((d) => [d.id, d.name])),
    [data.departments]
  );

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e.fullName])),
    [data.employees]
  );

  const uniqueJobTitles = useMemo(() => {
    const set = new Set(activeEmployees.map((e) => e.jobTitle));
    return Array.from(set).sort();
  }, [activeEmployees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeEmployees
      .filter((emp) => {
        if (deptFilter !== 'All' && emp.departmentId !== deptFilter) return false;
        if (statusFilter !== 'All' && emp.employmentStatus !== statusFilter) return false;
        if (titleFilter !== 'All' && emp.jobTitle !== titleFilter) return false;
        if (q) {
          const matches =
            emp.fullName.toLowerCase().includes(q) ||
            emp.employeeCode.toLowerCase().includes(q) ||
            emp.workEmail.toLowerCase().includes(q) ||
            emp.jobTitle.toLowerCase().includes(q) ||
            emp.locationCity.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
        if (sortBy === 'joinDate') return b.joinDate.localeCompare(a.joinDate);
        if (sortBy === 'title') return a.jobTitle.localeCompare(b.jobTitle);
        const dA = deptMap.get(a.departmentId) ?? '';
        const dB = deptMap.get(b.departmentId) ?? '';
        return dA.localeCompare(dB);
      });
  }, [activeEmployees, search, deptFilter, statusFilter, titleFilter, sortBy, deptMap]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSelectAllOnPage = () => {
    const pageIds = paginatedEmployees.map((e) => e.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkExport = () => {
    const source =
      selectedIds.length > 0
        ? filteredEmployees.filter((e) => selectedIds.includes(e.id))
        : filteredEmployees;

    const rows = source.map((e) => ({
      EmployeeCode: e.employeeCode,
      FullName: e.fullName,
      JobTitle: e.jobTitle,
      Department: deptMap.get(e.departmentId) ?? '',
      Manager: e.managerId ? empMap.get(e.managerId) ?? '' : 'Executive Root',
      Status: e.employmentStatus,
      EmploymentType: e.employmentType,
      WorkArrangement: e.workLocation,
      City: e.locationCity,
      WorkEmail: e.workEmail,
      JoinDate: e.joinDate,
    }));

    const csv = convertRecordsToCSV(rows);
    downloadTextFile(csv, `peoplix-employees-export-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${rows.length} employee record(s) to CSV.`);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    const res = updateEmployee(editingEmployee.id, editingEmployee);
    if (!res.success) {
      toast.error(res.error || 'Could not update employee.');
      return;
    }
    toast.success(`Updated profile for ${editingEmployee.fullName}`);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Employee Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Showing <span className="font-mono tabular-nums font-semibold">{filteredEmployees.length}</span> of{' '}
            <span className="font-mono tabular-nums">{activeEmployees.length}</span> employees across{' '}
            {data.departments.filter((d) => !d.archived).length} departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleBulkExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-[#304154] text-slate-700 dark:text-slate-200 text-xs font-medium hover:border-teal-500 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>
              {selectedIds.length > 0
                ? `Export Selected (${selectedIds.length})`
                : 'Export Directory CSV'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setQuickCreateModal('employee')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filters & View Switcher Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, code, email, title, city..."
              aria-label="Search employees"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              aria-label="Filter by Department"
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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

          {/* Employment Status Filter */}
          <div>
            <select
              aria-label="Filter by Employment Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Probation">Probation</option>
              <option value="Inactive">Inactive</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          {/* Job Title Filter */}
          <div>
            <select
              aria-label="Filter by Job Title"
              value={titleFilter}
              onChange={(e) => {
                setTitleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="All">All Job Titles</option>
              {uniqueJobTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort & View Toggle */}
          <div className="flex items-center gap-2">
            <select
              aria-label="Sort employees"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'name' | 'joinDate' | 'department' | 'title')
              }
              className="flex-1 px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="name">Sort: Name</option>
              <option value="joinDate">Sort: Join Date</option>
              <option value="department">Sort: Department</option>
              <option value="title">Sort: Job Title</option>
            </select>

            <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-teal-600 shadow-2xs'
                    : 'text-slate-500'
                }`}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-teal-600 shadow-2xs'
                    : 'text-slate-500'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List View */}
      {viewMode === 'list' ? (
        <div className="rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/40">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all employees on page"
                      checked={
                        paginatedEmployees.length > 0 &&
                        paginatedEmployees.every((e) => selectedIds.includes(e.id))
                      }
                      onChange={toggleSelectAllOnPage}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Title</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Type & Location</th>
                  <th className="py-3 px-4">Join Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${emp.fullName}`}
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => toggleSelectOne(emp.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <EmployeeAvatar
                          name={emp.fullName}
                          color={emp.avatarColor}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/employees/${emp.id}`}
                            className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 block truncate"
                          >
                            {emp.fullName}
                          </Link>
                          <div className="text-[11px] text-slate-500 truncate">
                            {emp.employeeCode} · {emp.workEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {emp.jobTitle}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {deptMap.get(emp.departmentId) ?? 'Operations'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {emp.managerId ? (
                        <button
                          type="button"
                          onClick={() => setDrawerEmployeeId(emp.managerId)}
                          className="hover:text-teal-600 hover:underline"
                        >
                          {empMap.get(emp.managerId) ?? emp.managerId}
                        </button>
                      ) : (
                        <span className="text-slate-400">Executive Root</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        variant={getEmploymentStatusVariant(emp.employmentStatus)}
                        label={emp.employmentStatus}
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{emp.employmentType}</div>
                      <div className="text-[11px] text-slate-400">
                        {emp.locationCity} · {emp.workLocation}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {emp.joinDate}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerEmployeeId(emp.id)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Quick Inspect Drawer"
                          aria-label={`Quick inspect ${emp.fullName}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/dashboard/employees/${emp.id}`}
                          className="p-1.5 rounded-md text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Open 360 Profile"
                          aria-label={`Open 360 profile for ${emp.fullName}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditingEmployee(emp)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Employee"
                          aria-label={`Edit ${emp.fullName}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            archiveEmployee(emp.id);
                            toast.success(`Archived ${emp.fullName}`);
                          }}
                          className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Archive Employee"
                          aria-label={`Archive ${emp.fullName}`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <EmployeeAvatar
                    name={emp.fullName}
                    color={emp.avatarColor}
                    size="md"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/employees/${emp.id}`}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-teal-600 truncate block"
                    >
                      {emp.fullName}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">{emp.jobTitle}</p>
                  </div>
                </div>
                <StatusText
                  variant={getEmploymentStatusVariant(emp.employmentStatus)}
                  label={emp.employmentStatus}
                />
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department</span>
                  <span className="font-medium">
                    {deptMap.get(emp.departmentId) ?? 'General'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Manager</span>
                  <span>
                    {emp.managerId
                      ? empMap.get(emp.managerId) ?? emp.managerId
                      : 'Executive Root'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="truncate max-w-[180px]">{emp.workEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Joined</span>
                  <span className="font-mono tabular-nums">{emp.joinDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDrawerEmployeeId(emp.id)}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600"
                >
                  Quick Inspect
                </button>
                <Link
                  href={`/dashboard/employees/${emp.id}`}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Open 360° Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] text-xs">
        <span className="text-slate-500">
          Page <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{totalPages}</span> ({filteredEmployees.length} matching records)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Employee"
        >
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Employee — {editingEmployee.fullName}
              </h2>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    required
                    value={editingEmployee.firstName}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    required
                    value={editingEmployee.lastName}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    required
                    value={editingEmployee.jobTitle}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        jobTitle: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editingEmployee.departmentId}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        departmentId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {data.departments
                      .filter((d) => !d.archived)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Reporting Manager
                  </label>
                  <select
                    value={editingEmployee.managerId ?? ''}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        managerId: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">No Manager (Root)</option>
                    {activeEmployees
                      .filter((m) => m.id !== editingEmployee.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.jobTitle})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={editingEmployee.employmentStatus}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        employmentStatus: e.target.value as EmploymentStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Probation">Probation</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={editingEmployee.employmentType}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        employmentType: e.target.value as EmploymentType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Work Arrangement
                  </label>
                  <select
                    value={editingEmployee.workLocation}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        workLocation: e.target.value as WorkLocationCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-Site">On-Site</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
