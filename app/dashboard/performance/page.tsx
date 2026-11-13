'use client';

import React, { useMemo, useState } from 'react';
import { Award, Plus, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import { StatusText } from '@/components/ui/StatusText';

export default function PerformancePage() {
  const {
    data,
    setQuickCreateModal,
    finalizePerformanceReview,
    updatePerformanceReview,
    setDrawerEmployeeId,
  } = useHRStore();

  const [cycleFilter, setCycleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const filteredReviews = useMemo(() => {
    return data.performanceReviews.filter((r) => {
      if (cycleFilter !== 'All' && r.cycleName !== cycleFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      return true;
    });
  }, [data.performanceReviews, cycleFilter, statusFilter]);

  const avgScore = useMemo(() => {
    if (filteredReviews.length === 0) return 0;
    const sum = filteredReviews.reduce((acc, r) => acc + r.overallScore, 0);
    return Number((sum / filteredReviews.length).toFixed(2));
  }, [filteredReviews]);

  const toggleGoalCompletion = (reviewId: string, goalId: string) => {
    const rev = data.performanceReviews.find((r) => r.id === reviewId);
    if (!rev) return;
    const nextGoals = rev.goals.map((g) =>
      g.id === goalId ? { ...g, completed: !g.completed } : g
    );
    updatePerformanceReview(reviewId, { goals: nextGoals });
    toast.success('Updated goal completion status.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Performance Reviews & Goal Alignment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track review cycles, employee OKR goals, self-assessments, and manager evaluations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setQuickCreateModal('review')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Performance Review</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">Total Reviews</div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {filteredReviews.length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">Finalized Reviews</div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums mt-1">
            {filteredReviews.filter((r) => r.status === 'Finalized').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">In Review / Draft</div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums mt-1">
            {filteredReviews.filter((r) => r.status !== 'Finalized').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]">
          <div className="text-xs text-slate-500">Mean Demo Score</div>
          <div className="text-2xl font-bold text-teal-600 tabular-nums mt-1">
            {avgScore} / 5.0
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-3 text-xs">
        <select
          value={cycleFilter}
          onChange={(e) => setCycleFilter(e.target.value)}
          aria-label="Filter reviews by cycle"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Review Cycles</option>
          <option value="H2 2026 Performance Cycle">H2 2026 Performance Cycle</option>
          <option value="H1 2026 Performance Cycle">H1 2026 Performance Cycle</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter reviews by status"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Statuses</option>
          <option value="Finalized">Finalized</option>
          <option value="In Review">In Review</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredReviews.slice(0, 30).map((rev) => {
          const emp = empMap.get(rev.employeeId);
          const reviewer = empMap.get(rev.reviewerId);
          return (
            <div
              key={rev.id}
              className="p-5 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-col justify-between gap-4 text-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar
                      name={emp?.fullName ?? rev.employeeId}
                      color={emp?.avatarColor}
                      size="sm"
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => emp && setDrawerEmployeeId(emp.id)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-teal-600"
                      >
                        {emp?.fullName ?? rev.employeeId}
                      </button>
                      <div className="text-slate-500">
                        {emp?.jobTitle} · {rev.cycleName}
                      </div>
                    </div>
                  </div>
                  <StatusText
                    variant={rev.status === 'Finalized' ? 'success' : 'warning'}
                    label={rev.status}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 font-mono tabular-nums">
                  <div>
                    <div className="text-[10px] text-slate-400 font-sans">Self Rating</div>
                    <div className="font-bold text-sm">{rev.selfAssessmentScore.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-sans">Manager Rating</div>
                    <div className="font-bold text-sm">{rev.managerScore.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-sans">Overall Score</div>
                    <div className="font-bold text-sm text-teal-600">
                      {rev.overallScore.toFixed(1)} / 5.0
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Manager Feedback ({reviewer?.fullName ?? 'Lead'}):</strong>{' '}
                  {rev.managerFeedback}
                </p>

                {/* Goals Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-slate-500">Assigned Goals</div>
                  {rev.goals.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoalCompletion(rev.id, g.id)}
                      className="w-full flex items-center justify-between text-left py-1 hover:text-teal-600"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            g.completed ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span className={g.completed ? 'line-through text-slate-400' : ''}>
                          {g.title}
                        </span>
                      </span>
                      <span className="font-mono text-slate-400 tabular-nums shrink-0 ml-2">
                        {g.weight}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {rev.status !== 'Finalized' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      finalizePerformanceReview(rev.id);
                      toast.success(`Finalized review for ${emp?.fullName}`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
                  >
                    Finalize Review
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
