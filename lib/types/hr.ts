export type EmploymentStatus = 'Active' | 'On Leave' | 'Probation' | 'Inactive' | 'Terminated';
export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
export type WorkLocationCategory = 'Hybrid' | 'Remote' | 'On-Site';

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Half Day'
  | 'On Leave'
  | 'Holiday'
  | 'Weekend';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveType = 'Annual' | 'Casual' | 'Sick' | 'Unpaid' | 'Other';

export type PayrollStatus = 'Draft' | 'Calculated' | 'Finalized';
export type PayslipStatus = 'Draft' | 'Issued';

export type RecruitmentStage =
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Assessment'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export type DemoRole = 'HR Admin' | 'HR Manager' | 'Department Manager' | 'Employee';

export interface Department {
  id: string;
  name: string;
  code: string;
  headEmployeeId: string | null;
  description: string;
  location: string;
  budgetCode: string;
  archived: boolean;
  createdAt: string;
}

export interface JobRole {
  id: string;
  title: string;
  departmentId: string;
  level: string;
  baseSalaryMin: number;
  baseSalaryMax: number;
}

export interface WorkSchedule {
  id: string;
  name: string;
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string;   // HH:mm e.g. "17:30"
  workingDays: number[]; // 0=Sun, 1=Mon ... 6=Sat
  lateThresholdMinutes: number;
  halfDayThresholdMinutes: number;
  standardDailyMinutes: number;
}

export interface EmployeeDocumentLink {
  id: string;
  name: string;
  type: 'Contract' | 'Policy' | 'Certification' | 'Identification' | 'Portfolio';
  referenceUrl: string;
  addedAt: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string;
  phone: string;
  avatarColor: string;
  departmentId: string;
  jobRoleId: string;
  jobTitle: string;
  managerId: string | null;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  workLocation: WorkLocationCategory;
  locationCity: string;
  joinDate: string; // YYYY-MM-DD
  birthDate: string; // YYYY-MM-DD (month/day used for upcoming birthdays)
  scheduleId: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  bio: string;
  skills: string[];
  documents: EmployeeDocumentLink[];
  archived: boolean;
}

export interface EmploymentHistory {
  id: string;
  employeeId: string;
  jobTitle: string;
  departmentId: string;
  employmentType: EmploymentType;
  startDate: string;
  endDate: string | null;
  changeReason: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD local date key
  checkIn: string | null; // HH:mm
  checkOut: string | null; // HH:mm
  workingMinutes: number;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  notes: string;
  isManualCorrection: boolean;
}

export interface LeavePolicy {
  leaveType: LeaveType;
  annualAllocationDays: number;
  carryForwardLimit: number;
  isPaid: boolean;
  allowNegativeBalance: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  leaveType: LeaveType;
  openingBalance: number;
  accruedDays: number;
  adjustments: number;
  usedDays: number;
  pendingDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  approverId: string | null;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
  balanceDeducted: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  recurring: boolean;
  applicableLocation: string; // 'All' or specific city/department
  description: string;
}

export interface CompensationRecord {
  id: string;
  employeeId: string;
  baseSalary: number; // Monthly base salary in default currency
  payFrequency: 'Monthly' | 'Bi-Weekly';
  housingAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  targetBonusAmount: number;
  standardDeduction: number; // Configured recurring deduction (demo)
  effectiveDate: string; // YYYY-MM-DD
  changeReason: string;
  archived: boolean;
}

export interface PayrollRun {
  id: string;
  periodMonth: string; // YYYY-MM e.g. "2026-10"
  periodLabel: string; // e.g. "October 2026"
  status: PayrollStatus;
  standardWorkingDays: number;
  employeeCount: number;
  totalBaseSalary: number;
  totalAllowances: number;
  totalBonuses: number;
  totalDeductions: number;
  totalUnpaidLeaveAdjustment: number;
  totalGrossPay: number;
  totalNetPay: number;
  createdAt: string;
  finalizedAt: string | null;
}

export interface PayrollEntry {
  id: string;
  payrollRunId: string;
  periodMonth: string;
  employeeId: string;
  // Snapshot fields so finalized runs remain immutable even if employee/comp changes
  employeeNameSnapshot: string;
  employeeCodeSnapshot: string;
  jobTitleSnapshot: string;
  departmentNameSnapshot: string;
  baseSalary: number;
  allowances: number;
  bonuses: number;
  configuredDeductions: number;
  unpaidLeaveDays: number;
  unpaidLeaveAdjustment: number;
  totalDeductions: number;
  grossPay: number;
  netPay: number;
  status: PayrollStatus;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  payrollEntryId: string;
  employeeId: string;
  periodMonth: string;
  periodLabel: string;
  status: PayslipStatus;
  issuedDate: string;
  earningsBreakdown: {
    baseSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    mealAllowance: number;
    bonus: number;
  };
  deductionsBreakdown: {
    configuredDeduction: number;
    unpaidLeaveAdjustment: number;
  };
  grossPay: number;
  totalDeductions: number;
  netPay: number;
}

export interface JobOpening {
  id: string;
  title: string;
  departmentId: string;
  location: string;
  employmentType: EmploymentType;
  workLocation: WorkLocationCategory;
  status: 'Open' | 'On Hold' | 'Closed';
  headcountTarget: number;
  salaryRangeMin: number;
  salaryRangeMax: number;
  hiringManagerId: string;
  postedDate: string;
  description: string;
}

export interface Candidate {
  id: string;
  jobOpeningId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  experienceYears: number;
  stage: RecruitmentStage;
  offerStatus: 'None' | 'Drafting' | 'Sent' | 'Accepted' | 'Declined';
  hiringDecision: 'Undecided' | 'Strong Hire' | 'Hire' | 'No Hire';
  interviewDate: string | null;
  expectedSalary: number;
  rating: number; // 1-5
  notes: string;
  appliedDate: string;
  archived: boolean;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  weight: number; // percentage
  completed: boolean;
  score: number; // 1-5
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  cycleName: string; // e.g. "H2 2026 Performance Cycle"
  templateName: string;
  status: 'Draft' | 'In Review' | 'Finalized';
  selfAssessmentScore: number;
  managerScore: number;
  overallScore: number;
  selfAssessmentNotes: string;
  managerFeedback: string;
  goals: PerformanceGoal[];
  createdAt: string;
  finalizedAt: string | null;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  type: 'Onboarding' | 'Offboarding';
  departmentId: string | 'All';
  description: string;
  defaultTasks: {
    title: string;
    category: 'IT & Access' | 'HR & Compliance' | 'Team Introduction' | 'Role Training' | 'Handover';
    dueOffsetDays: number;
  }[];
}

export interface OnboardingTask {
  id: string;
  templateId: string;
  type: 'Onboarding' | 'Offboarding';
  employeeId: string;
  assignedTeamMemberId: string;
  title: string;
  category: 'IT & Access' | 'HR & Compliance' | 'Team Introduction' | 'Role Training' | 'Handover';
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string | null;
  notes: string;
}

export type ActivityEventType =
  | 'employee_created'
  | 'employee_updated'
  | 'employee_archived'
  | 'attendance_recorded'
  | 'attendance_corrected'
  | 'leave_requested'
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_cancelled'
  | 'payroll_generated'
  | 'payroll_finalized'
  | 'compensation_updated'
  | 'candidate_created'
  | 'candidate_moved'
  | 'review_created'
  | 'review_finalized'
  | 'department_updated'
  | 'onboarding_completed'
  | 'settings_updated';

export interface Activity {
  id: string;
  eventType: ActivityEventType;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  entityType: 'employee' | 'department' | 'attendance' | 'leave' | 'payroll' | 'recruitment' | 'performance' | 'onboarding' | 'settings';
  entityId: string;
  timestamp: string; // ISO string
}

export interface DemoTeamMember {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: DemoRole;
  departmentId: string;
  jobTitle: string;
  permissionsSummary: string[];
}

export interface SavedReportConfig {
  id: string;
  name: string;
  reportType: 'employees' | 'attendance' | 'leave' | 'payroll' | 'departments' | 'recruitment' | 'performance';
  departmentId: string;
  dateFrom: string;
  dateTo: string;
  createdAt: string;
}

export interface WorkspaceSettings {
  companyName: string;
  companyTagline: string;
  companyDescription: string;
  logoText: string;
  defaultCurrency: string;
  currencySymbol: string;
  dateFormat: 'YYYY-MM-DD' | 'MMM dd, yyyy' | 'dd/MM/yyyy';
  weekStartDay: 0 | 1; // 0=Sunday, 1=Monday
  workingDays: number[]; // [1,2,3,4,5]
  defaultStartTime: string; // "09:00"
  defaultEndTime: string;   // "17:30"
  lateArrivalThresholdMinutes: number;
  halfDayThresholdMinutes: number;
  standardMonthlyWorkingDays: number;
  leavePolicies: LeavePolicy[];
  notificationsEnabled: boolean;
  emailDigestSimulation: boolean;
  autoDeductUnpaidLeaveInPayroll: boolean;
}

export interface UIPreferences {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeDemoRole: DemoRole;
  activeDemoEmployeeId: string;
  recentSearches: string[];
}

export interface HRDataset {
  version: number;
  employees: Employee[];
  departments: Department[];
  jobRoles: JobRole[];
  schedules: WorkSchedule[];
  employmentHistory: EmploymentHistory[];
  attendance: AttendanceRecord[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  compensations: CompensationRecord[];
  payrollRuns: PayrollRun[];
  payrollEntries: PayrollEntry[];
  payslips: Payslip[];
  jobOpenings: JobOpening[];
  candidates: Candidate[];
  performanceReviews: PerformanceReview[];
  onboardingTemplates: OnboardingTemplate[];
  onboardingTasks: OnboardingTask[];
  activities: Activity[];
  demoTeamMembers: DemoTeamMember[];
  savedReports: SavedReportConfig[];
}
