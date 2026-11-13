'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  GitBranch,
  ExternalLink,
  ListTree,
  Network,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import {
  buildOrganizationTree,
  getReportingChainIds,
  OrgTreeNode,
} from '@/lib/calculations/organization';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';

export default function OrganizationChartPage() {
  const { data, setDrawerEmployeeId, updateEmployee } = useHRStore();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'canvas' | 'tree'>('canvas');
  const [highlightedEmpId, setHighlightedEmpId] = useState<string>('emp-010');
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  // Manager reassignment tester
  const [reassignEmpId, setReassignEmpId] = useState('emp-026');
  const [reassignMgrId, setReassignMgrId] = useState('emp-010');

  const activeEmployees = useMemo(
    () => data.employees.filter((e) => !e.archived),
    [data.employees]
  );

  const deptMap = useMemo(
    () => new Map(data.departments.map((d) => [d.id, d.name])),
    [data.departments]
  );

  const orgRoots = useMemo(
    () => buildOrganizationTree(activeEmployees),
    [activeEmployees]
  );

  const highlightedChain = useMemo(
    () => new Set(getReportingChainIds(highlightedEmpId, activeEmployees)),
    [highlightedEmpId, activeEmployees]
  );

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleManagerUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateEmployee(reassignEmpId, {
      managerId: reassignMgrId || null,
    });
    if (!res.success) {
      toast.error(res.error || 'Invalid manager assignment');
      return;
    }
    toast.success('Updated reporting line safely.');
  };

  const q = search.trim().toLowerCase();

  const renderCanvasNode = (node: OrgTreeNode): React.ReactNode => {
    const emp = node.employee;
    const isCollapsed = collapsedIds[emp.id] ?? node.depth >= 2;
    const isHighlighted = highlightedChain.has(emp.id);
    const matchesSearch =
      q.length > 0 &&
      (emp.fullName.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q));
    const matchesDept = deptFilter === 'All' || emp.departmentId === deptFilter;

    if (!matchesDept && node.depth > 1 && node.directReports.length === 0) {
      return null;
    }

    return (
      <div key={emp.id} className="flex flex-col items-center">
        <div
          className={`w-60 p-3.5 rounded-xl border transition-all bg-white dark:bg-[#182535] shadow-xs ${
            isHighlighted || matchesSearch
              ? 'border-[#0D9488] ring-2 ring-teal-500/30'
              : 'border-[#E7EAF0] dark:border-[#304154]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <EmployeeAvatar
                name={emp.fullName}
                color={emp.avatarColor}
                size="sm"
              />
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setHighlightedEmpId(emp.id);
                    setDrawerEmployeeId(emp.id);
                  }}
                  className="text-xs font-bold text-slate-900 dark:text-white hover:text-teal-600 truncate block text-left"
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
              className="p-1 text-slate-400 hover:text-teal-600"
              title="Open 360 Profile"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate">
              {deptMap.get(emp.departmentId) ?? 'Operations'}
            </span>
            {node.directReports.length > 0 && (
              <button
                type="button"
                onClick={() => toggleCollapse(emp.id)}
                className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 hover:underline tabular-nums"
              >
                <span>
                  {node.directReports.length} direct ({node.totalSubordinatesCount})
                </span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Children Connectors */}
        {!isCollapsed && node.directReports.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-start gap-4 pt-3 border-t border-slate-300 dark:border-slate-700 px-2">
              {node.directReports.map((child) => renderCanvasNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAccessibleTreeNode = (node: OrgTreeNode): React.ReactNode => {
    const emp = node.employee;
    const isCollapsed = collapsedIds[emp.id] ?? false;
    return (
      <div key={emp.id} className="pl-4 border-l border-slate-200 dark:border-slate-700 my-1.5">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            {node.directReports.length > 0 && (
              <button
                type="button"
                onClick={() => toggleCollapse(emp.id)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle subordinates"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <EmployeeAvatar name={emp.fullName} color={emp.avatarColor} size="xs" />
            <button
              type="button"
              onClick={() => setDrawerEmployeeId(emp.id)}
              className="font-semibold text-slate-900 dark:text-white hover:text-teal-600"
            >
              {emp.fullName}
            </button>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-300">{emp.jobTitle}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{deptMap.get(emp.departmentId)}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
            {node.directReports.length} direct / {node.totalSubordinatesCount} total
          </span>
        </div>
        {!isCollapsed &&
          node.directReports.map((child) => renderAccessibleTreeNode(child))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Interactive Organization Hierarchy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Explore reporting lines from CEO to department heads, team leads, and individual contributors.
          </p>
        </div>

        {/* View Toggle & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                viewMode === 'canvas'
                  ? 'bg-[#E8F7F4] dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Hierarchy Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                viewMode === 'tree'
                  ? 'bg-[#E8F7F4] dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Responsive Tree List</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono tabular-nums">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(130, z + 10))}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(100);
                setCollapsedIds({});
              }}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Reporting Chain Inspector */}
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Highlight employee in org chart..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            aria-label="Filter org chart by department"
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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

          <select
            value={highlightedEmpId}
            onChange={(e) => setHighlightedEmpId(e.target.value)}
            aria-label="Trace reporting line for employee"
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            {activeEmployees.slice(0, 40).map((e) => (
              <option key={e.id} value={e.id}>
                Trace Line: {e.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Manager Relationship Validator Form */}
        <form
          onSubmit={handleManagerUpdate}
          className="lg:col-span-5 p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-2 text-xs"
        >
          <GitBranch className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-semibold">Reassign Manager:</span>
          <select
            value={reassignEmpId}
            onChange={(e) => setReassignEmpId(e.target.value)}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            {activeEmployees.slice(0, 35).map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
          <span>→</span>
          <select
            value={reassignMgrId}
            onChange={(e) => setReassignMgrId(e.target.value)}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            <option value="">Root (No Manager)</option>
            {activeEmployees.slice(0, 35).map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
          >
            Validate & Apply
          </button>
        </form>
      </div>

      {/* Main Org Viewport */}
      {viewMode === 'canvas' ? (
        <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-x-auto min-h-[540px]">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
            className="inline-flex flex-col items-center min-w-full py-4 transition-transform"
          >
            <div className="flex items-start gap-8">
              {orgRoots.map((rootNode) => renderCanvasNode(rootNode))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Accessible Hierarchical Reporting Tree
          </h2>
          {orgRoots.map((rootNode) => renderAccessibleTreeNode(rootNode))}
        </div>
      )}
    </div>
  );
}
