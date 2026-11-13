import { AttendanceRecord, AttendanceStatus, Holiday, LeaveRequest, WorkSchedule } from '@/lib/types/hr';

/**
 * Parses an "HH:mm" time string into minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr.trim())) {
    return null;
  }
  const [hoursStr, minutesStr] = timeStr.trim().split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

/**
 * Formats a Date object as a local YYYY-MM-DD date string without UTC shifts.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a local YYYY-MM-DD key into its day of week (0 = Sunday ... 6 = Saturday)
 * without timezone drift.
 */
export function getDayOfWeekFromDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  return localDate.getDay();
}

export interface CalculateAttendanceParams {
  date: string; // YYYY-MM-DD
  checkIn: string | null;
  checkOut: string | null;
  schedule: WorkSchedule;
  holidays: Holiday[];
  approvedLeaves: LeaveRequest[];
  employeeLocation?: string;
}

export interface CalculatedAttendanceResult {
  status: AttendanceStatus;
  workingMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
}

/**
 * Determines if a given local date key matches a configured holiday.
 */
export function isHolidayOnDate(
  dateKey: string,
  holidays: Holiday[],
  employeeLocation?: string
): Holiday | undefined {
  const monthDay = dateKey.slice(5); // MM-DD
  return holidays.find((h) => {
    const locationMatch =
      h.applicableLocation === 'All' ||
      !employeeLocation ||
      h.applicableLocation.toLowerCase() === employeeLocation.toLowerCase();
    if (!locationMatch) return false;
    if (h.date === dateKey) return true;
    if (h.recurring && h.date.slice(5) === monthDay) return true;
    return false;
  });
}

/**
 * Determines if an employee has an approved leave covering dateKey.
 */
export function hasApprovedLeaveOnDate(
  dateKey: string,
  approvedLeaves: LeaveRequest[]
): boolean {
  return approvedLeaves.some(
    (leave) =>
      leave.status === 'Approved' &&
      leave.startDate <= dateKey &&
      leave.endDate >= dateKey
  );
}

/**
 * Central attendance calculation engine.
 * Handles:
 * - Approved leave priority (never marks approved leave as Absent)
 * - Holiday & Weekend recognition
 * - Check-in / Check-out duration (including overnight shifts if checkOut < checkIn)
 * - Late arrival threshold
 * - Half-day threshold
 * - Missing check-in or check-out
 */
export function calculateAttendanceMetrics(
  params: CalculateAttendanceParams
): CalculatedAttendanceResult {
  const { date, checkIn, checkOut, schedule, holidays, approvedLeaves, employeeLocation } = params;

  const schedStart = parseTimeToMinutes(schedule.startTime) ?? 9 * 60;
  const schedEnd = parseTimeToMinutes(schedule.endTime) ?? 17 * 60 + 30;
  const inMin = parseTimeToMinutes(checkIn);
  const outMin = parseTimeToMinutes(checkOut);

  let workingMinutes = 0;
  let lateMinutes = 0;
  let earlyDepartureMinutes = 0;

  if (inMin !== null && outMin !== null) {
    // Support overnight shift if outMin < inMin
    workingMinutes = outMin >= inMin ? outMin - inMin : 24 * 60 - inMin + outMin;
  }

  if (inMin !== null && inMin > schedStart) {
    lateMinutes = inMin - schedStart;
  }

  if (outMin !== null && outMin < schedEnd && (inMin === null || outMin >= inMin)) {
    earlyDepartureMinutes = schedEnd - outMin;
  }

  // 1. Approved leave always takes priority over unexplained absence
  if (hasApprovedLeaveOnDate(date, approvedLeaves)) {
    return {
      status: 'On Leave',
      workingMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
    };
  }

  // 2. Check Holiday
  if (isHolidayOnDate(date, holidays, employeeLocation)) {
    return {
      status: workingMinutes > 0 ? 'Present' : 'Holiday',
      workingMinutes,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
    };
  }

  // 3. Check Weekend
  const dayOfWeek = getDayOfWeekFromDateKey(date);
  if (!schedule.workingDays.includes(dayOfWeek)) {
    return {
      status: workingMinutes > 0 ? 'Present' : 'Weekend',
      workingMinutes,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
    };
  }

  // 4. Workday evaluation
  if (inMin === null && outMin === null) {
    return {
      status: 'Absent',
      workingMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
    };
  }

  // Missing check-in or missing check-out is treated as Half Day
  if (inMin === null || outMin === null) {
    return {
      status: 'Half Day',
      workingMinutes: Math.max(0, Math.round(schedule.standardDailyMinutes / 2)),
      lateMinutes,
      earlyDepartureMinutes,
    };
  }

  // Worked less than half-day threshold
  if (workingMinutes < schedule.halfDayThresholdMinutes) {
    return {
      status: 'Half Day',
      workingMinutes,
      lateMinutes,
      earlyDepartureMinutes,
    };
  }

  // Late check-in beyond threshold
  if (lateMinutes > schedule.lateThresholdMinutes) {
    return {
      status: 'Late',
      workingMinutes,
      lateMinutes,
      earlyDepartureMinutes,
    };
  }

  return {
    status: 'Present',
    workingMinutes,
    lateMinutes,
    earlyDepartureMinutes,
  };
}

/**
 * Deduplicates attendance records by (employeeId + date), keeping the latest record.
 */
export function upsertAttendanceRecord(
  records: AttendanceRecord[],
  nextRecord: AttendanceRecord
): AttendanceRecord[] {
  const existingIndex = records.findIndex(
    (r) => r.employeeId === nextRecord.employeeId && r.date === nextRecord.date
  );
  if (existingIndex === -1) {
    return [nextRecord, ...records];
  }
  const updated = [...records];
  updated[existingIndex] = {
    ...records[existingIndex],
    ...nextRecord,
    id: records[existingIndex].id,
  };
  return updated;
}
