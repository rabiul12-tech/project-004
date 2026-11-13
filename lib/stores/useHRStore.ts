'use client';

import { create } from 'zustand';
import {
  Activity,
  ActivityEventType,
  AttendanceRecord,
  Candidate,
  CompensationRecord,
  DemoRole,
  Department,
  Employee,
  Holiday,
  HRDataset,
  JobOpening,
  LeaveRequest,
  LeaveType,
  OnboardingTask,
  Payslip,
  PerformanceReview,
  RecruitmentStage,
  SavedReportConfig,
  UIPreferences,
  WorkspaceSettings,
} from '@/lib/types/hr';
import {
  createDefaultSettings,
  createDefaultUIPreferences,
  generateDeterministicSeedData,
} from '@/lib/seed/seedData';
import {
  loadPersistedWorkspace,
  parseAndValidateBackupJson,
  saveHRDataset,
  saveUIPreferences,
  saveWorkspaceSettings,
} from '@/lib/storage/localStorage';
import { validateManagerAssignment } from '@/lib/calculations/organization';
import {
  calculateAttendanceMetrics,
  upsertAttendanceRecord,
} from '@/lib/calculations/attendance';
import {
  applyLeaveStatusTransition,
  calculateWorkingDaysBetween,
  findOverlappingLeaveRequest,
  getApprovedUnpaidLeaveDaysInMonth,
} from '@/lib/calculations/leave';
import {
  buildPayrollEntriesForPeriod,
  summarizePayrollRun,
} from '@/lib/calculations/payroll';

export type QuickCreateModalType =
  | 'employee'
  | 'department'
  | 'attendance'
  | 'leave'
  | 'job'
  | 'candidate'
  | 'review'
  | null;

interface HRStoreState {
  isHydrated: boolean;
  recoveredFromCorruption: boolean;
  data: HRDataset;
  settings: WorkspaceSettings;
  ui: UIPreferences;

  // Ephemeral UI overlays
  globalSearchOpen: boolean;
  quickCreateModal: QuickCreateModalType;
  drawerEmployeeId: string | null;

  // Initialization
  hydrateWorkspace: () => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setQuickCreateModal: (modal: QuickCreateModalType) => void;
  setDrawerEmployeeId: (employeeId: string | null) => void;

  // UI & Settings
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setActiveDemoRole: (role: DemoRole, employeeId?: string) => void;
  addRecentSearch: (term: string) => void;
  updateSettings: (updates: Partial<WorkspaceSettings>) => void;

  // Employees
  addEmployee: (
    payload: Omit<Employee, 'id' | 'employeeCode' | 'fullName' | 'archived' | 'documents'> & {
      baseSalary?: number;
    }
  ) => { success: boolean; error?: string; employee?: Employee };
  updateEmployee: (
    id: string,
    updates: Partial<Employee>
  ) => { success: boolean; error?: string };
  archiveEmployee: (id: string) => void;

  // Departments
  addDepartment: (
    payload: Omit<Department, 'id' | 'archived' | 'createdAt'>
  ) => Department;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  archiveDepartment: (id: string, fallbackDepartmentId?: string) => void;

  // Attendance
  recordOrCorrectAttendance: (payload: {
    employeeId: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    notes?: string;
    isManualCorrection?: boolean;
  }) => AttendanceRecord;

  // Leave
  createLeaveRequest: (payload: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }) => { success: boolean; error?: string; request?: LeaveRequest };
  updateLeaveRequest: (
    id: string,
    updates: Partial<Pick<LeaveRequest, 'leaveType' | 'startDate' | 'endDate' | 'reason'>>
  ) => { success: boolean; error?: string };
  transitionLeaveStatus: (
    requestId: string,
    nextStatus: 'Approved' | 'Rejected' | 'Cancelled',
    reviewNotes?: string
  ) => { success: boolean; error?: string };

  // Holidays
  addHoliday: (payload: Omit<Holiday, 'id'>) => Holiday;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;
  importHolidays: (items: Omit<Holiday, 'id'>[]) => number;

  // Compensation & Payroll
  upsertCompensation: (
    payload: Omit<CompensationRecord, 'id' | 'archived'>
  ) => CompensationRecord;
  archiveCompensation: (id: string) => void;
  generatePayrollRun: (
    periodMonth: string,
    periodLabel: string,
    bonusOverrides?: Record<string, number>
  ) => { success: boolean; error?: string };
  finalizePayrollRun: (payrollRunId: string) => { success: boolean; error?: string };

  // Recruitment
  addJobOpening: (payload: Omit<JobOpening, 'id'>) => JobOpening;
  updateJobOpening: (id: string, updates: Partial<JobOpening>) => void;
  addCandidate: (payload: Omit<Candidate, 'id' | 'archived'>) => Candidate;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  moveCandidateStage: (candidateId: string, stage: RecruitmentStage) => void;
  archiveCandidate: (candidateId: string) => void;

  // Performance
  createPerformanceReview: (
    payload: Omit<PerformanceReview, 'id' | 'createdAt' | 'finalizedAt'>
  ) => PerformanceReview;
  updatePerformanceReview: (id: string, updates: Partial<PerformanceReview>) => void;
  finalizePerformanceReview: (id: string) => void;

  // Onboarding
  assignOnboardingTemplate: (
    employeeId: string,
    templateId: string,
    assignedTeamMemberId: string
  ) => void;
  addOnboardingTask: (
    payload: Omit<OnboardingTask, 'id' | 'completedAt'>
  ) => OnboardingTask;
  toggleOnboardingTask: (taskId: string) => void;

  // Reports, Backup, Reset
  saveReportConfig: (payload: Omit<SavedReportConfig, 'id' | 'createdAt'>) => void;
  deleteReportConfig: (id: string) => void;
  restoreFromBackup: (jsonString: string) => { success: boolean; error?: string };
  resetDemoData: () => void;
}

function createActivityRecord(
  ui: UIPreferences,
  employees: Employee[],
  eventType: ActivityEventType,
  title: string,
  description: string,
  entityType: Activity['entityType'],
  entityId: string
): Activity {
  const actor = employees.find((e) => e.id === ui.activeDemoEmployeeId) ?? employees[3] ?? employees[0];
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventType,
    title,
    description,
    actorId: actor?.id ?? 'emp-004',
    actorName: actor?.fullName ?? 'People Operations Admin',
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
  };
}

export const useHRStore = create<HRStoreState>((set, get) => ({
  isHydrated: false,
  recoveredFromCorruption: false,
  data: generateDeterministicSeedData(),
  settings: createDefaultSettings(),
  ui: createDefaultUIPreferences(),

  globalSearchOpen: false,
  quickCreateModal: null,
  drawerEmployeeId: null,

  hydrateWorkspace: () => {
    const loaded = loadPersistedWorkspace();
    set({
      isHydrated: true,
      recoveredFromCorruption: loaded.recoveredFromCorruption,
      data: loaded.hrData,
      settings: loaded.settings,
      ui: loaded.ui,
    });
  },

  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setQuickCreateModal: (modal) => set({ quickCreateModal: modal }),
  setDrawerEmployeeId: (employeeId) => set({ drawerEmployeeId: employeeId }),

  setTheme: (theme) => {
    const nextUI = { ...get().ui, theme };
    saveUIPreferences(nextUI);
    set({ ui: nextUI });
  },

  toggleSidebar: () => {
    const nextUI = { ...get().ui, sidebarCollapsed: !get().ui.sidebarCollapsed };
    saveUIPreferences(nextUI);
    set({ ui: nextUI });
  },

  setActiveDemoRole: (role, employeeId) => {
    const { data, ui } = get();
    const matchedMember = data.demoTeamMembers.find((m) => m.role === role);
    const nextUI: UIPreferences = {
      ...ui,
      activeDemoRole: role,
      activeDemoEmployeeId: employeeId ?? matchedMember?.employeeId ?? ui.activeDemoEmployeeId,
    };
    saveUIPreferences(nextUI);
    set({ ui: nextUI });
  },

  addRecentSearch: (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const { ui } = get();
    const deduped = [trimmed, ...ui.recentSearches.filter((s) => s !== trimmed)].slice(0, 6);
    const nextUI = { ...ui, recentSearches: deduped };
    saveUIPreferences(nextUI);
    set({ ui: nextUI });
  },

  updateSettings: (updates) => {
    const { settings, data, ui } = get();
    const nextSettings: WorkspaceSettings = { ...settings, ...updates };
    // Sync default schedule settings with sched-standard
    const nextSchedules = data.schedules.map((s) =>
      s.id === 'sched-standard'
        ? {
            ...s,
            startTime: nextSettings.defaultStartTime,
            endTime: nextSettings.defaultEndTime,
            workingDays: nextSettings.workingDays,
            lateThresholdMinutes: nextSettings.lateArrivalThresholdMinutes,
            halfDayThresholdMinutes: nextSettings.halfDayThresholdMinutes,
          }
        : s
    );
    const act = createActivityRecord(
      ui,
      data.employees,
      'settings_updated',
      'Workspace settings updated',
      `Updated configuration for ${nextSettings.companyName}.`,
      'settings',
      'workspace-settings'
    );
    const nextData: HRDataset = {
      ...data,
      schedules: nextSchedules,
      activities: [act, ...data.activities],
    };
    saveWorkspaceSettings(nextSettings);
    saveHRDataset(nextData);
    set({ settings: nextSettings, data: nextData });
  },

  addEmployee: (payload) => {
    const { data, ui } = get();
    const newId = `emp-${String(data.employees.length + 1).padStart(3, '0')}`;
    const newCode = `PX-${String(1001 + data.employees.length)}`;
    const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`;

    const mgrCheck = validateManagerAssignment(newId, payload.managerId, data.employees);
    if (!mgrCheck.valid) {
      return { success: false, error: mgrCheck.reason };
    }

    const newEmployee: Employee = {
      ...payload,
      id: newId,
      employeeCode: newCode,
      fullName,
      archived: false,
      documents: [
        {
          id: `doc-${newId}-1`,
          name: `${fullName} — Employment Agreement (Demo Reference)`,
          type: 'Contract',
          referenceUrl: `https://docs.peoplix.demo/contracts/${newCode.toLowerCase()}.pdf`,
          addedAt: payload.joinDate,
        },
      ],
    };

    const baseSalary = payload.baseSalary ?? 7800;
    const newComp: CompensationRecord = {
      id: `comp-${newId}-1`,
      employeeId: newId,
      baseSalary,
      payFrequency: 'Monthly',
      housingAllowance: Math.round(baseSalary * 0.06),
      transportAllowance: 200,
      mealAllowance: 160,
      targetBonusAmount: Math.round(baseSalary * 0.1),
      standardDeduction: Math.round(baseSalary * 0.04),
      effectiveDate: payload.joinDate,
      changeReason: 'Initial Hire Compensation',
      archived: false,
    };

    const newBalances = [
      {
        id: `lb-${newId}-annual`,
        employeeId: newId,
        year: 2026,
        leaveType: 'Annual' as LeaveType,
        openingBalance: 20,
        accruedDays: 0,
        adjustments: 0,
        usedDays: 0,
        pendingDays: 0,
      },
      {
        id: `lb-${newId}-casual`,
        employeeId: newId,
        year: 2026,
        leaveType: 'Casual' as LeaveType,
        openingBalance: 7,
        accruedDays: 0,
        adjustments: 0,
        usedDays: 0,
        pendingDays: 0,
      },
      {
        id: `lb-${newId}-sick`,
        employeeId: newId,
        year: 2026,
        leaveType: 'Sick' as LeaveType,
        openingBalance: 10,
        accruedDays: 0,
        adjustments: 0,
        usedDays: 0,
        pendingDays: 0,
      },
      {
        id: `lb-${newId}-unpaid`,
        employeeId: newId,
        year: 2026,
        leaveType: 'Unpaid' as LeaveType,
        openingBalance: 0,
        accruedDays: 0,
        adjustments: 0,
        usedDays: 0,
        pendingDays: 0,
      },
    ];

    const newHistory = {
      id: `eh-${newId}-1`,
      employeeId: newId,
      jobTitle: newEmployee.jobTitle,
      departmentId: newEmployee.departmentId,
      employmentType: newEmployee.employmentType,
      startDate: newEmployee.joinDate,
      endDate: null,
      changeReason: 'Initial Hire',
    };

    const act = createActivityRecord(
      ui,
      data.employees,
      'employee_created',
      `Added employee ${fullName}`,
      `Created employee profile ${newCode} (${newEmployee.jobTitle}).`,
      'employee',
      newId
    );

    const nextData: HRDataset = {
      ...data,
      employees: [newEmployee, ...data.employees],
      compensations: [newComp, ...data.compensations],
      leaveBalances: [...data.leaveBalances, ...newBalances],
      employmentHistory: [newHistory, ...data.employmentHistory],
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return { success: true, employee: newEmployee };
  },

  updateEmployee: (id, updates) => {
    const { data, ui } = get();
    const target = data.employees.find((e) => e.id === id);
    if (!target) {
      return { success: false, error: 'Employee not found.' };
    }

    if (updates.managerId !== undefined) {
      const mgrCheck = validateManagerAssignment(id, updates.managerId, data.employees);
      if (!mgrCheck.valid) {
        return { success: false, error: mgrCheck.reason };
      }
    }

    const firstName = updates.firstName ?? target.firstName;
    const lastName = updates.lastName ?? target.lastName;
    const fullName = updates.fullName ?? `${firstName.trim()} ${lastName.trim()}`;

    const updatedEmp: Employee = {
      ...target,
      ...updates,
      firstName,
      lastName,
      fullName,
    };

    let nextHistory = data.employmentHistory;
    if (
      (updates.jobTitle && updates.jobTitle !== target.jobTitle) ||
      (updates.departmentId && updates.departmentId !== target.departmentId) ||
      (updates.employmentType && updates.employmentType !== target.employmentType)
    ) {
      nextHistory = [
        {
          id: `eh-${id}-${Date.now()}`,
          employeeId: id,
          jobTitle: updatedEmp.jobTitle,
          departmentId: updatedEmp.departmentId,
          employmentType: updatedEmp.employmentType,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: null,
          changeReason: 'Role or Department Transition',
        },
        ...data.employmentHistory,
      ];
    }

    const act = createActivityRecord(
      ui,
      data.employees,
      'employee_updated',
      `Updated profile for ${updatedEmp.fullName}`,
      `Modified employee profile fields (${updatedEmp.jobTitle}).`,
      'employee',
      id
    );

    const nextData: HRDataset = {
      ...data,
      employees: data.employees.map((e) => (e.id === id ? updatedEmp : e)),
      employmentHistory: nextHistory,
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return { success: true };
  },

  archiveEmployee: (id) => {
    const { data, ui } = get();
    const target = data.employees.find((e) => e.id === id);
    if (!target) return;

    const fallbackManagerId = target.managerId;
    const nextEmployees = data.employees.map((e) => {
      if (e.id === id) {
        return { ...e, archived: true, employmentStatus: 'Inactive' as const };
      }
      if (e.managerId === id) {
        return { ...e, managerId: fallbackManagerId };
      }
      return e;
    });

    const act = createActivityRecord(
      ui,
      data.employees,
      'employee_archived',
      `Archived employee ${target.fullName}`,
      `Archived profile ${target.employeeCode} and reassigned direct reports safely.`,
      'employee',
      id
    );

    const nextData: HRDataset = {
      ...data,
      employees: nextEmployees,
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
  },

  addDepartment: (payload) => {
    const { data, ui } = get();
    const newDept: Department = {
      ...payload,
      id: `dept-${Date.now()}`,
      archived: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const act = createActivityRecord(
      ui,
      data.employees,
      'department_updated',
      `Created department ${newDept.name}`,
      `Configured department ${newDept.code} in ${newDept.location}.`,
      'department',
      newDept.id
    );
    const nextData: HRDataset = {
      ...data,
      departments: [...data.departments, newDept],
      activities: [act, ...data.activities],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
    return newDept;
  },

  updateDepartment: (id, updates) => {
    const { data, ui } = get();
    const nextDepts = data.departments.map((d) => (d.id === id ? { ...d, ...updates } : d));
    const target = nextDepts.find((d) => d.id === id);
    const act = createActivityRecord(
      ui,
      data.employees,
      'department_updated',
      `Updated department ${target?.name ?? id}`,
      `Updated department configuration and leadership metadata.`,
      'department',
      id
    );
    const nextData: HRDataset = {
      ...data,
      departments: nextDepts,
      activities: [act, ...data.activities],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  archiveDepartment: (id, fallbackDepartmentId) => {
    const { data, ui } = get();
    const activeDepts = data.departments.filter((d) => d.id !== id && !d.archived);
    const safeFallbackId = fallbackDepartmentId ?? activeDepts[0]?.id ?? id;

    // Never silently delete employee records when a department is archived
    const nextEmployees = data.employees.map((e) =>
      e.departmentId === id ? { ...e, departmentId: safeFallbackId } : e
    );

    const targetDept = data.departments.find((d) => d.id === id);
    const act = createActivityRecord(
      ui,
      data.employees,
      'department_updated',
      `Archived department ${targetDept?.name ?? id}`,
      `Reassigned department members to ${activeDepts.find((d) => d.id === safeFallbackId)?.name ?? 'fallback department'}.`,
      'department',
      id
    );

    const nextData: HRDataset = {
      ...data,
      departments: data.departments.map((d) => (d.id === id ? { ...d, archived: true } : d)),
      employees: nextEmployees,
      activities: [act, ...data.activities],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  recordOrCorrectAttendance: ({
    employeeId,
    date,
    checkIn,
    checkOut,
    notes = '',
    isManualCorrection = false,
  }) => {
    const { data, ui } = get();
    const emp = data.employees.find((e) => e.id === employeeId);
    const schedule =
      data.schedules.find((s) => s.id === emp?.scheduleId) ?? data.schedules[0];
    const empApprovedLeaves = data.leaveRequests.filter(
      (lr) => lr.employeeId === employeeId && lr.status === 'Approved'
    );

    const metrics = calculateAttendanceMetrics({
      date,
      checkIn,
      checkOut,
      schedule,
      holidays: data.holidays,
      approvedLeaves: empApprovedLeaves,
      employeeLocation: emp?.locationCity,
    });

    const record: AttendanceRecord = {
      id: `att-${date}-${employeeId}`,
      employeeId,
      date,
      checkIn,
      checkOut,
      workingMinutes: metrics.workingMinutes,
      status: metrics.status,
      lateMinutes: metrics.lateMinutes,
      earlyDepartureMinutes: metrics.earlyDepartureMinutes,
      notes,
      isManualCorrection,
    };

    const nextAttendance = upsertAttendanceRecord(data.attendance, record);
    const act = createActivityRecord(
      ui,
      data.employees,
      isManualCorrection ? 'attendance_corrected' : 'attendance_recorded',
      `${isManualCorrection ? 'Corrected' : 'Recorded'} attendance for ${emp?.fullName ?? employeeId}`,
      `Date ${date} marked as ${metrics.status} (${checkIn || '--:--'} to ${checkOut || '--:--'}).`,
      'attendance',
      record.id
    );

    const nextData: HRDataset = {
      ...data,
      attendance: nextAttendance,
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return record;
  },

  createLeaveRequest: ({ employeeId, leaveType, startDate, endDate, reason }) => {
    const { data, settings, ui } = get();
    if (!startDate || !endDate || startDate > endDate) {
      return { success: false, error: 'End date must be on or after start date.' };
    }

    const emp = data.employees.find((e) => e.id === employeeId);
    if (!emp) {
      return { success: false, error: 'Employee not found.' };
    }

    const overlap = findOverlappingLeaveRequest(
      employeeId,
      startDate,
      endDate,
      data.leaveRequests
    );
    if (overlap) {
      return {
        success: false,
        error: `Overlaps with existing ${overlap.status.toLowerCase()} ${overlap.leaveType} leave (${overlap.startDate} to ${overlap.endDate}).`,
      };
    }

    const workingDays = calculateWorkingDaysBetween(
      startDate,
      endDate,
      settings.workingDays,
      data.holidays,
      emp.locationCity
    );

    if (workingDays <= 0) {
      return {
        success: false,
        error: 'Selected date range contains 0 working days (weekends or holidays only).',
      };
    }

    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId,
      leaveType,
      startDate,
      endDate,
      workingDays,
      reason,
      status: 'Pending',
      approverId: emp.managerId ?? 'emp-004',
      reviewNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      balanceDeducted: false,
    };

    // Pending requests increment pendingDays without permanently deducting usedDays
    const nextBalances = data.leaveBalances.map((bal) =>
      bal.employeeId === employeeId && bal.leaveType === leaveType
        ? { ...bal, pendingDays: bal.pendingDays + workingDays }
        : bal
    );

    const act = createActivityRecord(
      ui,
      data.employees,
      'leave_requested',
      `${emp.fullName} requested ${workingDays}d ${leaveType} leave`,
      `Period ${startDate} to ${endDate}: "${reason}"`,
      'leave',
      newReq.id
    );

    const nextData: HRDataset = {
      ...data,
      leaveRequests: [newReq, ...data.leaveRequests],
      leaveBalances: nextBalances,
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return { success: true, request: newReq };
  },

  updateLeaveRequest: (id, updates) => {
    const { data, settings } = get();
    const existing = data.leaveRequests.find((r) => r.id === id);
    if (!existing) return { success: false, error: 'Leave request not found.' };
    if (existing.status !== 'Pending') {
      return { success: false, error: 'Only Pending leave requests can be edited.' };
    }

    const nextStart = updates.startDate ?? existing.startDate;
    const nextEnd = updates.endDate ?? existing.endDate;
    const nextType = updates.leaveType ?? existing.leaveType;

    const overlap = findOverlappingLeaveRequest(
      existing.employeeId,
      nextStart,
      nextEnd,
      data.leaveRequests,
      id
    );
    if (overlap) {
      return {
        success: false,
        error: `Overlaps with existing leave (${overlap.startDate} to ${overlap.endDate}).`,
      };
    }

    const emp = data.employees.find((e) => e.id === existing.employeeId);
    const nextWorkingDays = calculateWorkingDaysBetween(
      nextStart,
      nextEnd,
      settings.workingDays,
      data.holidays,
      emp?.locationCity
    );
    if (nextWorkingDays <= 0) {
      return { success: false, error: 'Selected range has 0 working days.' };
    }

    const updatedReq: LeaveRequest = {
      ...existing,
      ...updates,
      startDate: nextStart,
      endDate: nextEnd,
      leaveType: nextType,
      workingDays: nextWorkingDays,
      updatedAt: new Date().toISOString(),
    };

    // Reconcile pending days if leaveType or workingDays changed
    const nextBalances = data.leaveBalances.map((bal) => {
      if (bal.employeeId !== existing.employeeId) return bal;
      let pending = bal.pendingDays;
      if (bal.leaveType === existing.leaveType) {
        pending = Math.max(0, pending - existing.workingDays);
      }
      if (bal.leaveType === nextType) {
        pending = pending + nextWorkingDays;
      }
      return { ...bal, pendingDays: pending };
    });

    const nextData: HRDataset = {
      ...data,
      leaveRequests: data.leaveRequests.map((r) => (r.id === id ? updatedReq : r)),
      leaveBalances: nextBalances,
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return { success: true };
  },

  transitionLeaveStatus: (requestId, nextStatus, reviewNotes = '') => {
    const { data, ui } = get();
    const target = data.leaveRequests.find((r) => r.id === requestId);
    if (!target) {
      return { success: false, error: 'Leave request not found.' };
    }

    const { updatedRequest, updatedBalances } = applyLeaveStatusTransition(
      target,
      nextStatus,
      data.leaveBalances,
      ui.activeDemoEmployeeId,
      reviewNotes
    );

    const emp = data.employees.find((e) => e.id === target.employeeId);
    const eventType: ActivityEventType =
      nextStatus === 'Approved'
        ? 'leave_approved'
        : nextStatus === 'Rejected'
        ? 'leave_rejected'
        : 'leave_cancelled';

    const act = createActivityRecord(
      ui,
      data.employees,
      eventType,
      `Leave request ${nextStatus.toLowerCase()} for ${emp?.fullName ?? target.employeeId}`,
      `${target.workingDays} working day(s) of ${target.leaveType} leave (${target.startDate} to ${target.endDate}).`,
      'leave',
      target.id
    );

    const nextData: HRDataset = {
      ...data,
      leaveRequests: data.leaveRequests.map((r) =>
        r.id === requestId ? updatedRequest : r
      ),
      leaveBalances: updatedBalances,
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return { success: true };
  },

  addHoliday: (payload) => {
    const { data } = get();
    const newHol: Holiday = {
      ...payload,
      id: `hol-${Date.now()}`,
    };
    const nextData: HRDataset = {
      ...data,
      holidays: [...data.holidays, newHol].sort((a, b) => a.date.localeCompare(b.date)),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
    return newHol;
  },

  updateHoliday: (id, updates) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      holidays: data.holidays
        .map((h) => (h.id === id ? { ...h, ...updates } : h))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  deleteHoliday: (id) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      holidays: data.holidays.filter((h) => h.id !== id),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  importHolidays: (items) => {
    const { data } = get();
    const validItems = items.filter((item) => item.name && /^\d{4}-\d{2}-\d{2}$/.test(item.date));
    const created: Holiday[] = validItems.map((item, idx) => ({
      ...item,
      id: `hol-imp-${Date.now()}-${idx}`,
    }));
    const nextData: HRDataset = {
      ...data,
      holidays: [...data.holidays, ...created].sort((a, b) => a.date.localeCompare(b.date)),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
    return created.length;
  },

  upsertCompensation: (payload) => {
    const { data, ui } = get();
    const emp = data.employees.find((e) => e.id === payload.employeeId);
    const newRecord: CompensationRecord = {
      ...payload,
      id: `comp-${payload.employeeId}-${Date.now()}`,
      archived: false,
    };

    const act = createActivityRecord(
      ui,
      data.employees,
      'compensation_updated',
      `Updated compensation for ${emp?.fullName ?? payload.employeeId}`,
      `New effective base salary: $${payload.baseSalary.toLocaleString()} effective ${payload.effectiveDate}. Finalized historical payroll snapshots remain unchanged.`,
      'payroll',
      newRecord.id
    );

    const nextData: HRDataset = {
      ...data,
      compensations: [newRecord, ...data.compensations],
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return newRecord;
  },

  archiveCompensation: (id) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      compensations: data.compensations.map((c) =>
        c.id === id ? { ...c, archived: true } : c
      ),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  generatePayrollRun: (periodMonth, periodLabel, bonusOverrides = {}) => {
    const { data, settings, ui } = get();
    const existingRun = data.payrollRuns.find((r) => r.periodMonth === periodMonth);
    if (existingRun && existingRun.status === 'Finalized') {
      return {
        success: false,
        error: 'Finalized payroll runs are locked snapshots and cannot be overwritten.',
      };
    }

    const runId = existingRun?.id ?? `pr-${periodMonth}`;
    const unpaidDaysByEmployee: Record<string, number> = {};
    for (const emp of data.employees) {
      unpaidDaysByEmployee[emp.id] = getApprovedUnpaidLeaveDaysInMonth(
        emp.id,
        periodMonth,
        data.leaveRequests,
        settings.workingDays,
        data.holidays
      );
    }

    const entries = buildPayrollEntriesForPeriod({
      payrollRunId: runId,
      periodMonth,
      standardWorkingDays: settings.standardMonthlyWorkingDays,
      employees: data.employees,
      departments: data.departments,
      compensations: data.compensations,
      unpaidDaysByEmployee,
      bonusOverridesByEmployee: bonusOverrides,
      status: 'Calculated',
      autoDeductUnpaidLeave: settings.autoDeductUnpaidLeaveInPayroll,
    });

    const summary = summarizePayrollRun(
      runId,
      periodMonth,
      periodLabel,
      'Calculated',
      settings.standardMonthlyWorkingDays,
      entries,
      existingRun?.createdAt ?? new Date().toISOString(),
      null
    );

    const otherEntries = data.payrollEntries.filter((e) => e.payrollRunId !== runId);
    const otherRuns = data.payrollRuns.filter((r) => r.id !== runId);

    const act = createActivityRecord(
      ui,
      data.employees,
      'payroll_generated',
      `Generated payroll simulation for ${periodLabel}`,
      `Calculated gross and net pay across ${entries.length} eligible employees.`,
      'payroll',
      runId
    );

    const nextData: HRDataset = {
      ...data,
      payrollRuns: [...otherRuns, summary].sort((a, b) =>
        a.periodMonth.localeCompare(b.periodMonth)
      ),
      payrollEntries: [...otherEntries, ...entries],
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return { success: true };
  },

  finalizePayrollRun: (payrollRunId) => {
    const { data, ui } = get();
    const run = data.payrollRuns.find((r) => r.id === payrollRunId);
    if (!run) return { success: false, error: 'Payroll run not found.' };
    if (run.status === 'Finalized') {
      return { success: true };
    }

    const nowIso = new Date().toISOString();
    const nextRuns = data.payrollRuns.map((r) =>
      r.id === payrollRunId ? { ...r, status: 'Finalized' as const, finalizedAt: nowIso } : r
    );
    const nextEntries = data.payrollEntries.map((e) =>
      e.payrollRunId === payrollRunId ? { ...e, status: 'Finalized' as const } : e
    );

    const runEntries = nextEntries.filter((e) => e.payrollRunId === payrollRunId);
    const otherPayslips = data.payslips.filter((p) => p.payrollRunId !== payrollRunId);
    const issuedPayslips: Payslip[] = runEntries.map((entry) => {
      const comp = data.compensations.find((c) => c.employeeId === entry.employeeId);
      return {
        id: `ps-${run.periodMonth}-${entry.employeeId}`,
        payrollRunId,
        payrollEntryId: entry.id,
        employeeId: entry.employeeId,
        periodMonth: run.periodMonth,
        periodLabel: run.periodLabel,
        status: 'Issued',
        issuedDate: nowIso.slice(0, 10),
        earningsBreakdown: {
          baseSalary: entry.baseSalary,
          housingAllowance: comp?.housingAllowance ?? Math.round(entry.allowances * 0.5),
          transportAllowance: comp?.transportAllowance ?? Math.round(entry.allowances * 0.3),
          mealAllowance:
            entry.allowances -
            (comp?.housingAllowance ?? Math.round(entry.allowances * 0.5)) -
            (comp?.transportAllowance ?? Math.round(entry.allowances * 0.3)),
          bonus: entry.bonuses,
        },
        deductionsBreakdown: {
          configuredDeduction: entry.configuredDeductions,
          unpaidLeaveAdjustment: entry.unpaidLeaveAdjustment,
        },
        grossPay: entry.grossPay,
        totalDeductions: entry.totalDeductions,
        netPay: entry.netPay,
      };
    });

    const act = createActivityRecord(
      ui,
      data.employees,
      'payroll_finalized',
      `Finalized payroll run for ${run.periodLabel}`,
      `Locked payroll snapshot and issued ${issuedPayslips.length} employee payslips.`,
      'payroll',
      payrollRunId
    );

    const nextData: HRDataset = {
      ...data,
      payrollRuns: nextRuns,
      payrollEntries: nextEntries,
      payslips: [...issuedPayslips, ...otherPayslips],
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
    return { success: true };
  },

  addJobOpening: (payload) => {
    const { data } = get();
    const newJob: JobOpening = {
      ...payload,
      id: `job-${Date.now()}`,
    };
    const nextData: HRDataset = {
      ...data,
      jobOpenings: [newJob, ...data.jobOpenings],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
    return newJob;
  },

  updateJobOpening: (id, updates) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      jobOpenings: data.jobOpenings.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  addCandidate: (payload) => {
    const { data, ui } = get();
    const newCand: Candidate = {
      ...payload,
      id: `cand-${Date.now()}`,
      archived: false,
    };
    const act = createActivityRecord(
      ui,
      data.employees,
      'candidate_created',
      `Added candidate ${newCand.fullName}`,
      `Entered recruitment pipeline at ${newCand.stage} stage.`,
      'recruitment',
      newCand.id
    );
    const nextData: HRDataset = {
      ...data,
      candidates: [newCand, ...data.candidates],
      activities: [act, ...data.activities],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
    return newCand;
  },

  updateCandidate: (id, updates) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      candidates: data.candidates.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  moveCandidateStage: (candidateId, stage) => {
    const { data, ui } = get();
    const cand = data.candidates.find((c) => c.id === candidateId);
    if (!cand || cand.stage === stage) return;

    const offerStatus: Candidate['offerStatus'] =
      stage === 'Offer'
        ? 'Sent'
        : stage === 'Hired'
        ? 'Accepted'
        : stage === 'Rejected'
        ? 'Declined'
        : cand.offerStatus;

    const act = createActivityRecord(
      ui,
      data.employees,
      'candidate_moved',
      `Moved ${cand.fullName} to ${stage}`,
      `Transitioned candidate from ${cand.stage} to ${stage}.`,
      'recruitment',
      candidateId
    );

    const nextData: HRDataset = {
      ...data,
      candidates: data.candidates.map((c) =>
        c.id === candidateId ? { ...c, stage, offerStatus } : c
      ),
      activities: [act, ...data.activities],
    };

    saveHRDataset(nextData);
    set({ data: nextData });
  },

  archiveCandidate: (candidateId) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      candidates: data.candidates.map((c) =>
        c.id === candidateId ? { ...c, archived: true } : c
      ),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  createPerformanceReview: (payload) => {
    const { data, ui } = get();
    const emp = data.employees.find((e) => e.id === payload.employeeId);
    const newRev: PerformanceReview = {
      ...payload,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      finalizedAt: payload.status === 'Finalized' ? new Date().toISOString() : null,
    };

    const act = createActivityRecord(
      ui,
      data.employees,
      'review_created',
      `Created performance review for ${emp?.fullName ?? payload.employeeId}`,
      `${payload.cycleName} — Overall rating ${payload.overallScore.toFixed(1)} / 5.0.`,
      'performance',
      newRev.id
    );

    const nextData: HRDataset = {
      ...data,
      performanceReviews: [newRev, ...data.performanceReviews],
      activities: [act, ...data.activities],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
    return newRev;
  },

  updatePerformanceReview: (id, updates) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      performanceReviews: data.performanceReviews.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  finalizePerformanceReview: (id) => {
    const { data, ui } = get();
    const rev = data.performanceReviews.find((r) => r.id === id);
    if (!rev) return;
    const emp = data.employees.find((e) => e.id === rev.employeeId);

    const act = createActivityRecord(
      ui,
      data.employees,
      'review_finalized',
      `Finalized performance review for ${emp?.fullName ?? rev.employeeId}`,
      `${rev.cycleName} finalized with score ${rev.overallScore.toFixed(1)} / 5.0.`,
      'performance',
      id
    );

    const nextData: HRDataset = {
      ...data,
      performanceReviews: data.performanceReviews.map((r) =>
        r.id === id
          ? { ...r, status: 'Finalized', finalizedAt: new Date().toISOString() }
          : r
      ),
      activities: [act, ...data.activities],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  assignOnboardingTemplate: (employeeId, templateId, assignedTeamMemberId) => {
    const { data } = get();
    const tpl = data.onboardingTemplates.find((t) => t.id === templateId);
    if (!tpl) return;

    const today = new Date();
    const newTasks: OnboardingTask[] = tpl.defaultTasks.map((dt, idx) => {
      const due = new Date(today);
      due.setDate(due.getDate() + dt.dueOffsetDays);
      const dueStr = due.toISOString().slice(0, 10);
      return {
        id: `ob-task-${Date.now()}-${idx}`,
        templateId: tpl.id,
        type: tpl.type,
        employeeId,
        assignedTeamMemberId,
        title: dt.title,
        category: dt.category,
        dueDate: dueStr,
        completed: false,
        completedAt: null,
        notes: `Generated from ${tpl.name}`,
      };
    });

    const nextData: HRDataset = {
      ...data,
      onboardingTasks: [...newTasks, ...data.onboardingTasks],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  addOnboardingTask: (payload) => {
    const { data } = get();
    const task: OnboardingTask = {
      ...payload,
      id: `ob-task-${Date.now()}`,
      completedAt: payload.completed ? new Date().toISOString() : null,
    };
    const nextData: HRDataset = {
      ...data,
      onboardingTasks: [task, ...data.onboardingTasks],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
    return task;
  },

  toggleOnboardingTask: (taskId) => {
    const { data, ui } = get();
    const target = data.onboardingTasks.find((t) => t.id === taskId);
    if (!target) return;
    const nextCompleted = !target.completed;
    const emp = data.employees.find((e) => e.id === target.employeeId);

    const nextTasks = data.onboardingTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          }
        : t
    );

    const act = createActivityRecord(
      ui,
      data.employees,
      'onboarding_completed',
      `${nextCompleted ? 'Completed' : 'Reopened'} checklist task for ${emp?.fullName ?? target.employeeId}`,
      target.title,
      'onboarding',
      taskId
    );

    const nextData: HRDataset = {
      ...data,
      onboardingTasks: nextTasks,
      activities: [act, ...data.activities],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  saveReportConfig: (payload) => {
    const { data } = get();
    const newRep: SavedReportConfig = {
      ...payload,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextData: HRDataset = {
      ...data,
      savedReports: [newRep, ...data.savedReports],
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  deleteReportConfig: (id) => {
    const { data } = get();
    const nextData: HRDataset = {
      ...data,
      savedReports: data.savedReports.filter((r) => r.id !== id),
    };
    saveHRDataset(nextData);
    set({ data: nextData });
  },

  restoreFromBackup: (jsonString) => {
    const parsed = parseAndValidateBackupJson(jsonString);
    if (!parsed.valid || !parsed.payload) {
      return { success: false, error: parsed.error ?? 'Invalid backup file.' };
    }
    saveHRDataset(parsed.payload.hrData);
    saveWorkspaceSettings(parsed.payload.settings);
    saveUIPreferences(parsed.payload.ui);
    set({
      data: parsed.payload.hrData,
      settings: parsed.payload.settings,
      ui: parsed.payload.ui,
      recoveredFromCorruption: false,
    });
    return { success: true };
  },

  resetDemoData: () => {
    const freshData = generateDeterministicSeedData();
    const freshSettings = createDefaultSettings();
    const freshUI = createDefaultUIPreferences();
    saveHRDataset(freshData);
    saveWorkspaceSettings(freshSettings);
    saveUIPreferences(freshUI);
    set({
      data: freshData,
      settings: freshSettings,
      ui: freshUI,
      recoveredFromCorruption: false,
    });
  },
}));
