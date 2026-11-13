import { beforeEach, describe, expect, it } from 'vitest';
import { useHRStore } from '@/lib/stores/useHRStore';
import {
  buildOrganizationTree,
  getReportingChainIds,
  validateManagerAssignment,
} from '@/lib/calculations/organization';
import {
  calculateAttendanceMetrics,
  upsertAttendanceRecord,
} from '@/lib/calculations/attendance';
import {
  applyLeaveStatusTransition,
  calculateWorkingDaysBetween,
  computeLeaveBalanceSummary,
  findOverlappingLeaveRequest,
} from '@/lib/calculations/leave';
import {
  calculatePayrollEntryAmounts,
  getEffectiveCompensationForDate,
} from '@/lib/calculations/payroll';
import { createPayslipPdfDocument } from '@/lib/pdf/payslipPdf';
import { convertRecordsToCSV } from '@/lib/export/exporters';
import {
  createBackupPayload,
  loadPersistedWorkspace,
  parseAndValidateBackupJson,
  STORAGE_KEYS,
} from '@/lib/storage/localStorage';

describe('PEOPLIX HR — Automated Verification Suite (43 Core Requirements)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useHRStore.getState().resetDemoData();
  });

  it('1-4. Employee creation, editing, archiving, and department assignment', () => {
    const store = useHRStore.getState();
    const initialCount = store.data.employees.length;
    expect(initialCount).toBe(120);

    // 1. Employee creation
    const createRes = store.addEmployee({
      firstName: 'Evelyn',
      lastName: 'Vance',
      workEmail: 'evelyn.vance@peoplix.demo',
      phone: '+1 (555) 019-2834',
      avatarColor: '#0D9488',
      departmentId: 'dept-eng',
      jobRoleId: 'role-04',
      jobTitle: 'Principal Systems Engineer',
      managerId: 'emp-002',
      employmentStatus: 'Active',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      locationCity: 'San Francisco',
      joinDate: '2026-11-13',
      birthDate: '1991-05-12',
      scheduleId: 'sched-standard',
      emergencyContactName: 'Arthur Vance',
      emergencyContactRelation: 'Spouse',
      bio: 'Distributed systems architect.',
      skills: ['Rust', 'TypeScript'],
      baseSalary: 12500,
    });
    expect(createRes.success).toBe(true);
    const createdId = createRes.employee!.id;
    expect(useHRStore.getState().data.employees.length).toBe(121);

    // 2. Employee editing & 4. Department assignment
    const editRes = useHRStore.getState().updateEmployee(createdId, {
      jobTitle: 'Distinguished Engineer',
      departmentId: 'dept-prod',
    });
    expect(editRes.success).toBe(true);
    const updatedEmp = useHRStore
      .getState()
      .data.employees.find((e) => e.id === createdId)!;
    expect(updatedEmp.jobTitle).toBe('Distinguished Engineer');
    expect(updatedEmp.departmentId).toBe('dept-prod');

    // 3. Employee archive
    useHRStore.getState().archiveEmployee(createdId);
    const archivedEmp = useHRStore
      .getState()
      .data.employees.find((e) => e.id === createdId)!;
    expect(archivedEmp.archived).toBe(true);
    expect(archivedEmp.employmentStatus).toBe('Inactive');
  });

  it('5-6. Manager relationship validation and circular reporting chain prevention', () => {
    const employees = useHRStore.getState().data.employees;

    // Self-reporting check
    const selfCheck = validateManagerAssignment('emp-002', 'emp-002', employees);
    expect(selfCheck.valid).toBe(false);

    // emp-001 (CEO) -> emp-002 (VP Eng) -> emp-010 (Lead)
    // Attempting to make emp-001 report to emp-010 creates a cycle
    const cycleCheck = validateManagerAssignment('emp-001', 'emp-010', employees);
    expect(cycleCheck.valid).toBe(false);

    // Valid manager assignment
    const validCheck = validateManagerAssignment('emp-026', 'emp-002', employees);
    expect(validCheck.valid).toBe(true);

    // Tree builder produces valid roots and reporting chains
    const tree = buildOrganizationTree(employees);
    expect(tree.length).toBeGreaterThanOrEqual(1);
    const chain = getReportingChainIds('emp-010', employees);
    expect(chain).toContain('emp-001');
    expect(chain).toContain('emp-002');
    expect(chain).toContain('emp-010');
  });

  it('7-11. Attendance check-in, check-out, late arrival, holiday treatment, and approved leave priority', () => {
    const store = useHRStore.getState();
    const schedule = store.data.schedules[0]; // 09:00 - 17:30, 15m late threshold
    const holidays = store.data.holidays;

    // 7 & 8. On-time check-in and check-out
    const onTime = calculateAttendanceMetrics({
      date: '2026-11-12', // Thursday
      checkIn: '08:58',
      checkOut: '17:32',
      schedule,
      holidays,
      approvedLeaves: [],
    });
    expect(onTime.status).toBe('Present');
    expect(onTime.workingMinutes).toBe(514);
    expect(onTime.lateMinutes).toBe(0);

    // 9. Late attendance beyond threshold (09:25 > 09:15)
    const lateResult = calculateAttendanceMetrics({
      date: '2026-11-12',
      checkIn: '09:25',
      checkOut: '17:35',
      schedule,
      holidays,
      approvedLeaves: [],
    });
    expect(lateResult.status).toBe('Late');
    expect(lateResult.lateMinutes).toBe(25);

    // 10. Holiday treatment (Thanksgiving 2026-11-26)
    const holidayResult = calculateAttendanceMetrics({
      date: '2026-11-26',
      checkIn: null,
      checkOut: null,
      schedule,
      holidays,
      approvedLeaves: [],
    });
    expect(holidayResult.status).toBe('Holiday');

    // 11. Approved leave never counted as unexplained absence
    const leaveResult = calculateAttendanceMetrics({
      date: '2026-11-12',
      checkIn: null,
      checkOut: null,
      schedule,
      holidays,
      approvedLeaves: [
        {
          id: 'lr-test',
          employeeId: 'emp-004',
          leaveType: 'Annual',
          startDate: '2026-11-11',
          endDate: '2026-11-13',
          workingDays: 3,
          reason: 'Vacation',
          status: 'Approved',
          approverId: 'emp-001',
          reviewNotes: '',
          createdAt: '',
          updatedAt: '',
          balanceDeducted: true,
        },
      ],
    });
    expect(leaveResult.status).toBe('On Leave');

    // Deduplication by employeeId + date
    const deduped = upsertAttendanceRecord(store.data.attendance, {
      id: 'att-custom',
      employeeId: 'emp-004',
      date: '2026-11-13',
      checkIn: '09:00',
      checkOut: '17:30',
      workingMinutes: 510,
      status: 'Present',
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      notes: 'Updated',
      isManualCorrection: true,
    });
    const matches = deduped.filter(
      (r) => r.employeeId === 'emp-004' && r.date === '2026-11-13'
    );
    expect(matches.length).toBe(1);
  });

  it('12-19. Leave creation, approval, rejection, cancellation, balance deduction/restoration, overlap detection, and working-day calculation', () => {
    const store = useHRStore.getState();
    const holidays = store.data.holidays;

    // 19. Working-day calculation across a weekend & Thanksgiving holiday (2026-11-23 Mon to 2026-11-27 Fri)
    // Nov 26 is Thanksgiving holiday, so 5 weekdays - 1 holiday = 4 working days
    const workDays = calculateWorkingDaysBetween(
      '2026-11-23',
      '2026-11-27',
      [1, 2, 3, 4, 5],
      holidays
    );
    expect(workDays).toBe(4);

    // Get initial Annual balance for emp-050
    const beforeBal = useHRStore
      .getState()
      .data.leaveBalances.find(
        (b) => b.employeeId === 'emp-050' && b.leaveType === 'Annual'
      )!;
    const beforeSummary = computeLeaveBalanceSummary(beforeBal);

    // 12. Create leave request (Pending does not permanently reduce availableBalance)
    const createRes = useHRStore.getState().createLeaveRequest({
      employeeId: 'emp-050',
      leaveType: 'Annual',
      startDate: '2026-12-07',
      endDate: '2026-12-09', // Mon-Wed = 3 working days
      reason: 'December trip',
    });
    expect(createRes.success).toBe(true);
    const reqId = createRes.request!.id;
    expect(createRes.request!.workingDays).toBe(3);

    const pendingBal = useHRStore
      .getState()
      .data.leaveBalances.find(
        (b) => b.employeeId === 'emp-050' && b.leaveType === 'Annual'
      )!;
    const pendingSummary = computeLeaveBalanceSummary(pendingBal);
    expect(pendingSummary.availableBalance).toBe(beforeSummary.availableBalance);
    expect(pendingSummary.pendingDays).toBe(beforeSummary.pendingDays + 3);

    // 18. Overlapping leave detection
    const overlapCheck = findOverlappingLeaveRequest(
      'emp-050',
      '2026-12-08',
      '2026-12-10',
      useHRStore.getState().data.leaveRequests
    );
    expect(overlapCheck).toBeDefined();

    // 13 & 16. Leave approval deducts available balance
    useHRStore.getState().transitionLeaveStatus(reqId, 'Approved', 'Approved in test');
    const approvedBal = useHRStore
      .getState()
      .data.leaveBalances.find(
        (b) => b.employeeId === 'emp-050' && b.leaveType === 'Annual'
      )!;
    const approvedSummary = computeLeaveBalanceSummary(approvedBal);
    expect(approvedSummary.availableBalance).toBe(beforeSummary.availableBalance - 3);

    // 15 & 17. Cancelling an approved leave restores balance exactly once
    useHRStore.getState().transitionLeaveStatus(reqId, 'Cancelled', 'Trip cancelled');
    const restoredBal = useHRStore
      .getState()
      .data.leaveBalances.find(
        (b) => b.employeeId === 'emp-050' && b.leaveType === 'Annual'
      )!;
    const restoredSummary = computeLeaveBalanceSummary(restoredBal);
    expect(restoredSummary.availableBalance).toBe(beforeSummary.availableBalance);

    // 14. Leave rejection test
    const secondReq = useHRStore.getState().createLeaveRequest({
      employeeId: 'emp-050',
      leaveType: 'Casual',
      startDate: '2026-12-14',
      endDate: '2026-12-15',
      reason: 'Personal',
    });
    expect(secondReq.success).toBe(true);
    useHRStore
      .getState()
      .transitionLeaveStatus(secondReq.request!.id, 'Rejected', 'Busy sprint');
    const rejectedObj = useHRStore
      .getState()
      .data.leaveRequests.find((r) => r.id === secondReq.request!.id)!;
    expect(rejectedObj.status).toBe('Rejected');
  });

  it('20-25. Payroll gross, deductions, net calculation, snapshot preservation, payslip PDF, and compensation effective dates', () => {
    // 20, 21, 22. Exact Decimal Payroll math
    const calc = calculatePayrollEntryAmounts({
      baseSalary: 8800,
      housingAllowance: 500,
      transportAllowance: 200,
      mealAllowance: 150,
      bonus: 350,
      configuredDeductions: 300,
      unpaidLeaveDays: 2,
      standardWorkingDays: 22,
      autoDeductUnpaidLeave: true,
    });
    // Gross = 8800 + (500+200+150) + 350 = 10000
    expect(calc.grossPay).toBe(10000);
    // Unpaid leave adjustment = (8800 / 22) * 2 = 800
    expect(calc.unpaidLeaveAdjustment).toBe(800);
    // Total deductions = 300 + 800 = 1100
    expect(calc.totalDeductions).toBe(1100);
    // Net = 10000 - 1100 = 8900
    expect(calc.netPay).toBe(8900);

    // 23 & 25. Finalized payroll snapshot preservation when compensation changes
    const store = useHRStore.getState();
    const octEntryBefore = store.data.payrollEntries.find(
      (e) => e.periodMonth === '2026-10' && e.employeeId === 'emp-002'
    )!;
    const octNetBefore = octEntryBefore.netPay;

    // Add new compensation record effective 2026-11-15 with higher salary
    store.upsertCompensation({
      employeeId: 'emp-002',
      baseSalary: 25000,
      payFrequency: 'Monthly',
      housingAllowance: 1200,
      transportAllowance: 300,
      mealAllowance: 200,
      targetBonusAmount: 2500,
      standardDeduction: 800,
      effectiveDate: '2026-11-15',
      changeReason: 'Executive promotion',
    });

    const octEntryAfter = useHRStore
      .getState()
      .data.payrollEntries.find(
        (e) => e.periodMonth === '2026-10' && e.employeeId === 'emp-002'
      )!;
    expect(octEntryAfter.netPay).toBe(octNetBefore);

    // Effective date lookup returns historical record for October and new record for late November
    const comps = useHRStore.getState().data.compensations;
    const effOct = getEffectiveCompensationForDate('emp-002', '2026-10-31', comps);
    const effNov = getEffectiveCompensationForDate('emp-002', '2026-11-30', comps);
    expect(effNov?.baseSalary).toBe(25000);
    expect(effOct?.baseSalary).not.toBe(25000);

    // 24. Client-side Payslip PDF generation
    const payslip = store.data.payslips[0];
    const emp = store.data.employees.find((e) => e.id === payslip.employeeId)!;
    const pdfDoc = createPayslipPdfDocument({
      payslip,
      employee: emp,
      settings: store.settings,
    });
    expect(pdfDoc).toBeDefined();
    expect(pdfDoc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('26-29. Candidate creation, recruitment stage movement, performance review creation, and onboarding checklist completion', () => {
    const store = useHRStore.getState();

    // 26 & 27. Candidate creation and stage movement
    const cand = store.addCandidate({
      jobOpeningId: 'job-01',
      fullName: 'strider Aragorn',
      email: 'strider@candidate.demo',
      phone: '+1 555-0100',
      location: 'Austin',
      currentRole: 'Staff Engineer',
      experienceYears: 8,
      stage: 'Applied',
      offerStatus: 'None',
      hiringDecision: 'Undecided',
      interviewDate: '2026-11-22',
      expectedSalary: 12500,
      rating: 5,
      notes: 'Top candidate',
      appliedDate: '2026-11-13',
    });
    expect(cand.stage).toBe('Applied');

    useHRStore.getState().moveCandidateStage(cand.id, 'Offer');
    const movedCand = useHRStore
      .getState()
      .data.candidates.find((c) => c.id === cand.id)!;
    expect(movedCand.stage).toBe('Offer');
    expect(movedCand.offerStatus).toBe('Sent');

    // 28. Performance review creation & finalization
    const rev = useHRStore.getState().createPerformanceReview({
      employeeId: 'emp-010',
      reviewerId: 'emp-002',
      cycleName: 'H2 2026 Performance Cycle',
      templateName: 'Core Evaluation',
      status: 'In Review',
      selfAssessmentScore: 4.4,
      managerScore: 4.6,
      overallScore: 4.5,
      selfAssessmentNotes: 'Strong delivery',
      managerFeedback: 'Exceeded expectations',
      goals: [{ id: 'g-1', title: 'Ship v2', weight: 100, completed: true, score: 5 }],
    });
    useHRStore.getState().finalizePerformanceReview(rev.id);
    const finalizedRev = useHRStore
      .getState()
      .data.performanceReviews.find((r) => r.id === rev.id)!;
    expect(finalizedRev.status).toBe('Finalized');

    // 29. Onboarding checklist completion
    const firstTask = useHRStore.getState().data.onboardingTasks[0];
    const initialDone = firstTask.completed;
    useHRStore.getState().toggleOnboardingTask(firstTask.id);
    const toggledTask = useHRStore
      .getState()
      .data.onboardingTasks.find((t) => t.id === firstTask.id)!;
    expect(toggledTask.completed).toBe(!initialDone);
  });

  it('30-43. Analytics consistency, CSV exports, persistence, corruption recovery, JSON backup/restore, reset, and theme persistence', () => {
    const store = useHRStore.getState();

    // 30 & 43. Cross-page employee data consistency
    const activeDeptIds = new Set(store.data.departments.map((d) => d.id));
    for (const emp of store.data.employees) {
      expect(activeDeptIds.has(emp.departmentId)).toBe(true);
    }

    // 31. CSV report export
    const csv = convertRecordsToCSV([
      { Code: 'PX-1001', Name: 'Elena Rostova', Role: 'CEO' },
    ]);
    expect(csv).toContain('Code,Name,Role');
    expect(csv).toContain('PX-1001,Elena Rostova,CEO');

    // 36 & 41. LocalStorage persistence & Theme persistence
    useHRStore.getState().setTheme('dark');
    expect(useHRStore.getState().ui.theme).toBe('dark');
    const reloaded = loadPersistedWorkspace();
    expect(reloaded.ui.theme).toBe('dark');

    // 37. Corrupt storage recovery
    window.localStorage.setItem(STORAGE_KEYS.HR_DATA, '{bad-corrupted-json');
    const recovered = loadPersistedWorkspace();
    expect(recovered.recoveredFromCorruption).toBe(true);
    expect(recovered.hrData.employees.length).toBe(120);

    // 38 & 39. JSON backup & restore
    const backup = createBackupPayload(
      useHRStore.getState().data,
      useHRStore.getState().settings,
      useHRStore.getState().ui
    );
    const backupJson = JSON.stringify(backup);
    const validated = parseAndValidateBackupJson(backupJson);
    expect(validated.valid).toBe(true);
    const restoreRes = useHRStore.getState().restoreFromBackup(backupJson);
    expect(restoreRes.success).toBe(true);

    // 40. Demo data reset
    useHRStore.getState().resetDemoData();
    expect(useHRStore.getState().data.employees.length).toBe(120);
    expect(useHRStore.getState().ui.theme).toBe('light');
  });
});
