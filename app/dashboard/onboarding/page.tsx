'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';

export default function OnboardingPage() {
  const {
    data,
    assignOnboardingTemplate,
    toggleOnboardingTask,
    addOnboardingTask,
    setDrawerEmployeeId,
  } = useHRStore();

  const [typeFilter, setTypeFilter] = useState<'All' | 'Onboarding' | 'Offboarding'>('All');
  const [selectedEmpId, setSelectedEmpId] = useState('emp-096');
  const [selectedTplId, setSelectedTplId] = useState('tpl-onboard-std');

  // Custom task form
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<
    'IT & Access' | 'HR & Compliance' | 'Team Introduction' | 'Role Training' | 'Handover'
  >('IT & Access');

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const filteredTasks = useMemo(() => {
    return data.onboardingTasks.filter((t) => {
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      return true;
    });
  }, [data.onboardingTasks, typeFilter]);

  // Group tasks by employee to compute completion progress
  const groupedByEmployee = useMemo(() => {
    const map = new Map<string, typeof filteredTasks>();
    for (const t of filteredTasks) {
      const list = map.get(t.employeeId) ?? [];
      list.push(t);
      map.set(t.employeeId, list);
    }
    return Array.from(map.entries());
  }, [filteredTasks]);

  const totalCompleted = filteredTasks.filter((t) => t.completed).length;
  const overallProgress =
    filteredTasks.length > 0
      ? Math.round((totalCompleted / filteredTasks.length) * 100)
      : 0;

  const handleAssignTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    assignOnboardingTemplate(selectedEmpId, selectedTplId, 'emp-004');
    const emp = empMap.get(selectedEmpId);
    toast.success(`Assigned checklist template to ${emp?.fullName ?? selectedEmpId}`);
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    addOnboardingTask({
      templateId: 'tpl-onboard-std',
      type: 'Onboarding',
      employeeId: selectedEmpId,
      assignedTeamMemberId: 'emp-004',
      title: customTitle.trim(),
      category: customCategory,
      dueDate: '2026-11-25',
      completed: false,
      notes: 'Custom onboarding task',
    });
    setCustomTitle('');
    toast.success('Added checklist item');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Employee Onboarding & Offboarding Checklists
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Completion percentages derive directly from live checklist task records.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs">
          {(['All', 'Onboarding', 'Offboarding'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-md font-medium ${
                typeFilter === tab
                  ? 'bg-[#E8F7F4] dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  : 'text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics & Template Generator */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Assign Onboarding / Offboarding Template
          </h2>
          <form onSubmit={handleAssignTemplate} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Employee
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Checklist Template
              </label>
              <select
                value={selectedTplId}
                onChange={(e) => setSelectedTplId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                {data.onboardingTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.type})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
            >
              Generate Checklist Tasks
            </button>
          </form>

          {/* Add Single Custom Task */}
          <form
            onSubmit={handleAddCustomTask}
            className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs"
          >
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              Add Custom Checklist Task
            </div>
            <div className="flex gap-2">
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Task title..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <select
                value={customCategory}
                onChange={(e) =>
                  setCustomCategory(
                    e.target.value as
                      | 'IT & Access'
                      | 'HR & Compliance'
                      | 'Team Introduction'
                      | 'Role Training'
                      | 'Handover'
                  )
                }
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="IT & Access">IT & Access</option>
                <option value="HR & Compliance">HR & Compliance</option>
                <option value="Team Introduction">Team Intro</option>
                <option value="Role Training">Training</option>
                <option value="Handover">Handover</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Overall Progress Summary */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Checklist Completion Progress
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalCompleted} of {filteredTasks.length} checklist items completed ({overallProgress}%)
            </p>
            <div className="mt-4 w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${overallProgress}%` }}
                className="h-full bg-[#0D9488] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {data.onboardingTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="col-span-2 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="font-bold text-slate-900 dark:text-white">
                  {tpl.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {tpl.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Checklists Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {groupedByEmployee.map(([empId, tasks]) => {
          const emp = empMap.get(empId);
          const doneCount = tasks.filter((t) => t.completed).length;
          const pct = Math.round((doneCount / Math.max(1, tasks.length)) * 100);

          return (
            <div
              key={empId}
              className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EmployeeAvatar
                    name={emp?.fullName ?? empId}
                    color={emp?.avatarColor}
                    size="sm"
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => emp && setDrawerEmployeeId(emp.id)}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-teal-600"
                    >
                      {emp?.fullName ?? empId}
                    </button>
                    <div className="text-slate-500">
                      {emp?.jobTitle} · Joined {emp?.joinDate}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="font-bold text-teal-600">{pct}%</span>
                  <div className="text-[10px] text-slate-400">
                    {doneCount}/{tasks.length} tasks
                  </div>
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className="h-full bg-[#0D9488] transition-all"
                />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task) => {
                  const owner = empMap.get(task.assignedTeamMemberId);
                  return (
                    <div
                      key={task.id}
                      className="py-2.5 flex items-start justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          toggleOnboardingTask(task.id);
                          toast.success(
                            task.completed
                              ? 'Reopened checklist item'
                              : 'Completed checklist item'
                          );
                        }}
                        className="flex items-start gap-2.5 text-left group"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 group-hover:text-teal-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div
                            className={`font-medium ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {task.category} · Owner: {owner?.firstName ?? 'HR'} · Due{' '}
                            {task.dueDate}
                          </div>
                        </div>
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {task.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
