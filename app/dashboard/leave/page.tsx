'use client';

import React, { useMemo, useState } from 'react';
import {
  FileCheck2,
  Plus,
  Check,
  X,
  Ban,
  Edit3,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { LeaveRequest, LeaveType } from '@/lib/types/hr';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import { getLeaveStatusVariant, StatusText } from '@/components/ui/StatusText';
import { computeLeaveBalanceSummary } from '@/lib/calculations/leave';

export default function LeaveManagementPage() {
  const {
    data,
    setQuickCreateModal,
    transitionLeaveStatus,
    updateLeaveRequest,
  } = useHRStore();

  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState('');

  const empMap = useMemo(
    () => new Map(data.employees.map((e) => [e.id, e])),
    [data.employees]
  );

  const filteredLeaves = useMemo(() => {
    return data.leaveRequests.filter((req) => {
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;
      if (typeFilter !== 'All' && req.leaveType !== typeFilter) return false;
      return true;
    });
  }, [data.leaveRequests, statusFilter, typeFilter]);

  const handleTransition = (
    req: LeaveRequest,
    nextStatus: 'Approved' | 'Rejected' | 'Cancelled',
    notes?: string
  ) => {
    const res = transitionLeaveStatus(req.id, nextStatus, notes ?? reviewNoteInput);
    if (!res.success) {
      toast.error(res.error || 'Failed to update leave status');
      return;
    }
    toast.success(`Leave request marked as ${nextStatus}. Employee leave balance updated.`);
    setReviewNoteInput('');
    if (selectedRequest?.id === req.id) {
      const refreshed = useHRStore
        .getState()
        .data.leaveRequests.find((r) => r.id === req.id);
      setSelectedRequest(refreshed ?? null);
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    const res = updateLeaveRequest(editingRequest.id, {
      leaveType: editingRequest.leaveType,
      startDate: editingRequest.startDate,
      endDate: editingRequest.endDate,
      reason: editingRequest.reason,
    });
    if (!res.success) {
      toast.error(res.error || 'Could not update request');
      return;
    }
    toast.success('Updated pending leave request and recalculated working days.');
    setEditingRequest(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Leave Requests & Approval Workflow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Working-day calculator excludes configured weekends & holidays. Pending requests do not permanently deduct balance; cancelling approved leave restores balance once.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setQuickCreateModal('leave')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Leave Request</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Pending Approval',
            count: data.leaveRequests.filter((r) => r.status === 'Pending').length,
            tone: 'text-amber-600',
          },
          {
            label: 'Approved Leaves',
            count: data.leaveRequests.filter((r) => r.status === 'Approved').length,
            tone: 'text-emerald-600',
          },
          {
            label: 'Rejected Requests',
            count: data.leaveRequests.filter((r) => r.status === 'Rejected').length,
            tone: 'text-rose-600',
          },
          {
            label: 'Cancelled Requests',
            count: data.leaveRequests.filter((r) => r.status === 'Cancelled').length,
            tone: 'text-slate-500',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154]"
          >
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className={`text-2xl font-bold tabular-nums mt-1 ${item.tone}`}>
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-3 text-xs">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter leave requests by status"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter leave requests by leave type"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Leave Types</option>
          <option value="Annual">Annual</option>
          <option value="Casual">Casual</option>
          <option value="Sick">Sick</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Leave Requests Table */}
      <div className="rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Working Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeaves.map((req) => {
                const emp = empMap.get(req.employeeId);
                return (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <EmployeeAvatar
                          name={emp?.fullName ?? req.employeeId}
                          color={emp?.avatarColor}
                          size="xs"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {emp?.fullName ?? req.employeeId}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {emp?.jobTitle}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{req.leaveType}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold tabular-nums">
                      {req.workingDays}d
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[220px] truncate">
                      {req.reason}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        variant={getLeaveStatusVariant(req.status)}
                        label={req.status}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-teal-600"
                          title="Inspect Request & Balance Drawer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {req.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingRequest(req)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-teal-600"
                              title="Edit Pending Request"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleTransition(req, 'Approved', 'Approved by HR')
                              }
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleTransition(req, 'Rejected', 'Declined due to coverage')
                              }
                              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {(req.status === 'Pending' || req.status === 'Approved') && (
                          <button
                            type="button"
                            onClick={() =>
                              handleTransition(
                                req,
                                'Cancelled',
                                'Cancelled and restored balance'
                              )
                            }
                            className="px-2 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700"
                            title="Cancel request and restore balance"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Drawer */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#182535] h-full border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Leave Request Details & Balance Formula
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(() => {
                const emp = empMap.get(selectedRequest.employeeId);
                const approver = selectedRequest.approverId
                  ? empMap.get(selectedRequest.approverId)
                  : null;
                const bal = data.leaveBalances.find(
                  (b) =>
                    b.employeeId === selectedRequest.employeeId &&
                    b.leaveType === selectedRequest.leaveType
                );
                const computed = bal ? computeLeaveBalanceSummary(bal) : null;

                return (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        name={emp?.fullName ?? 'Employee'}
                        color={emp?.avatarColor}
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {emp?.fullName}
                        </div>
                        <div className="text-slate-500">{emp?.jobTitle}</div>
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <div>
                        <dt className="text-slate-400">Leave Type</dt>
                        <dd className="font-semibold mt-0.5">{selectedRequest.leaveType}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Status</dt>
                        <dd className="mt-0.5">
                          <StatusText
                            variant={getLeaveStatusVariant(selectedRequest.status)}
                            label={selectedRequest.status}
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Start Date</dt>
                        <dd className="font-mono font-semibold mt-0.5">
                          {selectedRequest.startDate}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">End Date</dt>
                        <dd className="font-mono font-semibold mt-0.5">
                          {selectedRequest.endDate}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Working Days</dt>
                        <dd className="font-mono font-bold text-teal-600 mt-0.5">
                          {selectedRequest.workingDays} working day(s)
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Approver</dt>
                        <dd className="font-medium mt-0.5">
                          {approver?.fullName ?? 'People Operations'}
                        </dd>
                      </div>
                    </dl>

                    <div>
                      <div className="text-slate-400 mb-1">Request Reason</div>
                      <p className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        {selectedRequest.reason}
                      </p>
                    </div>

                    {computed && (
                      <div className="p-4 rounded-xl bg-[#E8F7F4]/60 dark:bg-teal-950/30 border border-teal-500/30 space-y-1.5">
                        <div className="font-bold text-teal-900 dark:text-teal-200">
                          {selectedRequest.leaveType} Leave Balance Ledger
                        </div>
                        <div className="flex justify-between">
                          <span>Opening + Accrued + Adjustments:</span>
                          <span className="font-mono tabular-nums">
                            {computed.openingBalance +
                              computed.accruedDays +
                              computed.adjustments}
                            d
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>− Approved Leave Usage:</span>
                          <span className="font-mono tabular-nums">{computed.usedDays}d</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-teal-500/20 pt-1">
                          <span>= Available Leave Balance:</span>
                          <span className="font-mono tabular-nums">
                            {computed.availableBalance}d
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Pending Requests (Not Deducted Yet):</span>
                          <span className="font-mono tabular-nums">
                            {computed.pendingDays}d
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block font-medium mb-1">Reviewer Notes</label>
                      <textarea
                        rows={2}
                        value={reviewNoteInput}
                        onChange={(e) => setReviewNoteInput(e.target.value)}
                        placeholder={
                          selectedRequest.reviewNotes || 'Add approval or rejection note...'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              {selectedRequest.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleTransition(selectedRequest, 'Rejected')}
                    className="px-3.5 py-2 rounded-lg border border-rose-300 text-rose-600 font-medium"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransition(selectedRequest, 'Approved')}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
                  >
                    Approve Request
                  </button>
                </>
              )}
              {(selectedRequest.status === 'Pending' ||
                selectedRequest.status === 'Approved') && (
                <button
                  type="button"
                  onClick={() => handleTransition(selectedRequest, 'Cancelled')}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel Leave
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Pending Request Modal */}
      {editingRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit Pending Leave Request</h3>
              <button type="button" onClick={() => setEditingRequest(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Leave Type</label>
                <select
                  value={editingRequest.leaveType}
                  onChange={(e) =>
                    setEditingRequest({
                      ...editingRequest,
                      leaveType: e.target.value as LeaveType,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Annual">Annual</option>
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingRequest.startDate}
                    onChange={(e) =>
                      setEditingRequest({
                        ...editingRequest,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={editingRequest.endDate}
                    onChange={(e) =>
                      setEditingRequest({
                        ...editingRequest,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Reason</label>
                <textarea
                  rows={2}
                  value={editingRequest.reason}
                  onChange={(e) =>
                    setEditingRequest({
                      ...editingRequest,
                      reason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold"
                >
                  Save Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
