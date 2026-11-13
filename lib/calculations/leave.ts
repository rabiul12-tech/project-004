import { getDayOfWeekFromDateKey, isHolidayOnDate, toLocalDateKey } from './attendance';
import { Holiday, LeaveBalance, LeaveRequest, LeaveType } from '@/lib/types/hr';

/**
 * Calculates working days between startDate and endDate inclusive,
 * excluding configured weekend days and applicable holidays.
 */
export function calculateWorkingDaysBetween(
  startDate: string,
  endDate: string,
  workingDays: number[] = [1, 2, 3, 4, 5],
  holidays: Holiday[] = [],
  employeeLocation?: string
): number {
  if (!startDate || !endDate || startDate > endDate) {
    return 0;
  }

  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

  const cursor = new Date(sYear, sMonth - 1, sDay, 12, 0, 0);
  const end = new Date(eYear, eMonth - 1, eDay, 12, 0, 0);

  let count = 0;
  while (cursor <= end) {
    const key = toLocalDateKey(cursor);
    const dayOfWeek = getDayOfWeekFromDateKey(key);
    const isWorkingDay = workingDays.includes(dayOfWeek);
    const isHoliday = Boolean(isHolidayOnDate(key, holidays, employeeLocation));

    if (isWorkingDay && !isHoliday) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/**
 * Checks whether a date range [startDate, endDate] overlaps with any existing
 * Pending or Approved leave request for the same employee.
 */
export function findOverlappingLeaveRequest(
  employeeId: string,
  startDate: string,
  endDate: string,
  existingRequests: LeaveRequest[],
  excludeRequestId?: string
): LeaveRequest | undefined {
  return existingRequests.find((req) => {
    if (req.employeeId !== employeeId) return false;
    if (excludeRequestId && req.id === excludeRequestId) return false;
    if (req.status === 'Rejected' || req.status === 'Cancelled') return false;
    return req.startDate <= endDate && req.endDate >= startDate;
  });
}

export interface ComputedLeaveBalanceSummary {
  openingBalance: number;
  accruedDays: number;
  adjustments: number;
  usedDays: number;
  pendingDays: number;
  availableBalance: number; // Opening + Accrued + Adjustments - Approved Used
  projectedBalanceAfterPending: number; // Available - Pending
}

/**
 * Computes available balance according to section 8:
 * Opening Balance + Accrued Leave + Approved Adjustments - Approved Leave Usage = Available Leave Balance
 * Pending requests do not permanently reduce available balance.
 */
export function computeLeaveBalanceSummary(
  balance: Pick<
    LeaveBalance,
    'openingBalance' | 'accruedDays' | 'adjustments' | 'usedDays' | 'pendingDays'
  >
): ComputedLeaveBalanceSummary {
  const availableBalance =
    balance.openingBalance +
    balance.accruedDays +
    balance.adjustments -
    balance.usedDays;

  const projectedBalanceAfterPending = availableBalance - balance.pendingDays;

  return {
    openingBalance: balance.openingBalance,
    accruedDays: balance.accruedDays,
    adjustments: balance.adjustments,
    usedDays: balance.usedDays,
    pendingDays: balance.pendingDays,
    availableBalance,
    projectedBalanceAfterPending,
  };
}

/**
 * Transitions a leave request status and updates the corresponding leave balance record safely,
 * preventing duplicate deductions and restoring balance once when an approved request is cancelled.
 */
export function applyLeaveStatusTransition(
  request: LeaveRequest,
  nextStatus: 'Approved' | 'Rejected' | 'Cancelled',
  balances: LeaveBalance[],
  approverId: string | null = null,
  reviewNotes: string = ''
): { updatedRequest: LeaveRequest; updatedBalances: LeaveBalance[] } {
  const prevStatus = request.status;
  if (prevStatus === nextStatus) {
    return { updatedRequest: request, updatedBalances: balances };
  }

  let nextBalanceDeducted = request.balanceDeducted;

  const updatedBalances = balances.map((bal) => {
    if (bal.employeeId !== request.employeeId || bal.leaveType !== request.leaveType) {
      return bal;
    }

    let usedDays = bal.usedDays;
    let pendingDays = bal.pendingDays;

    // Transition from Pending -> Approved
    if (prevStatus === 'Pending' && nextStatus === 'Approved') {
      pendingDays = Math.max(0, pendingDays - request.workingDays);
      if (!request.balanceDeducted) {
        usedDays = usedDays + request.workingDays;
        nextBalanceDeducted = true;
      }
    }
    // Transition from Pending -> Rejected or Cancelled
    else if (
      prevStatus === 'Pending' &&
      (nextStatus === 'Rejected' || nextStatus === 'Cancelled')
    ) {
      pendingDays = Math.max(0, pendingDays - request.workingDays);
    }
    // Transition from Approved -> Cancelled (restore balance exactly once)
    else if (prevStatus === 'Approved' && nextStatus === 'Cancelled') {
      if (request.balanceDeducted) {
        usedDays = Math.max(0, usedDays - request.workingDays);
        nextBalanceDeducted = false;
      }
    }

    return {
      ...bal,
      usedDays,
      pendingDays,
    };
  });

  const updatedRequest: LeaveRequest = {
    ...request,
    status: nextStatus,
    approverId: approverId ?? request.approverId,
    reviewNotes: reviewNotes || request.reviewNotes,
    updatedAt: new Date().toISOString(),
    balanceDeducted: nextBalanceDeducted,
  };

  return { updatedRequest, updatedBalances };
}

/**
 * Gets the total unpaid leave working days approved for an employee in a specific YYYY-MM period.
 */
export function getApprovedUnpaidLeaveDaysInMonth(
  employeeId: string,
  periodMonth: string, // YYYY-MM
  leaveRequests: LeaveRequest[],
  workingDays: number[] = [1, 2, 3, 4, 5],
  holidays: Holiday[] = []
): number {
  const [yearStr, monthStr] = periodMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();
  const monthStart = `${periodMonth}-01`;
  const monthEnd = `${periodMonth}-${String(lastDay).padStart(2, '0')}`;

  return leaveRequests
    .filter(
      (r) =>
        r.employeeId === employeeId &&
        r.status === 'Approved' &&
        r.leaveType === ('Unpaid' as LeaveType) &&
        r.startDate <= monthEnd &&
        r.endDate >= monthStart
    )
    .reduce((sum, req) => {
      const overlapStart = req.startDate > monthStart ? req.startDate : monthStart;
      const overlapEnd = req.endDate < monthEnd ? req.endDate : monthEnd;
      return (
        sum +
        calculateWorkingDaysBetween(overlapStart, overlapEnd, workingDays, holidays)
      );
    }, 0);
}
