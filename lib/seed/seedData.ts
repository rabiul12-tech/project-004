import {
  Activity,
  ActivityEventType,
  AttendanceRecord,
  Candidate,
  CompensationRecord,
  DemoTeamMember,
  Department,
  Employee,
  EmploymentHistory,
  EmploymentStatus,
  EmploymentType,
  Holiday,
  HRDataset,
  JobOpening,
  JobRole,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  OnboardingTask,
  OnboardingTemplate,
  PayrollEntry,
  PayrollRun,
  Payslip,
  PerformanceReview,
  RecruitmentStage,
  SavedReportConfig,
  UIPreferences,
  WorkLocationCategory,
  WorkSchedule,
  WorkspaceSettings,
} from '@/lib/types/hr';
import { calculatePayrollEntryAmounts, summarizePayrollRun } from '@/lib/calculations/payroll';
import { calculateWorkingDaysBetween } from '@/lib/calculations/leave';

export const STORAGE_SCHEMA_VERSION = 1;

const FIRST_NAMES = [
  'Elena', 'Marcus', 'Sofia', 'David', 'Priya', 'Lucas', 'Amara', 'Julian', 'Hannah', 'Mateo',
  'Chloe', 'Liam', 'Nadia', 'Ethan', 'Maya', 'Noah', 'Zara', 'Oliver', 'Camila', 'Daniel',
  'Aria', 'Sebastian', 'Leah', 'Gabriel', 'Nina', 'Samuel', 'Eva', 'Benjamin', 'Clara', 'Adrian',
  'Iris', 'Victor', 'Tessa', 'Leo', 'Naomi', 'Isaac', 'Ruby', 'Caleb', 'Stella', 'Owen',
  'Freya', 'Nathan', 'Alice', 'miles', 'Vera', 'Simon', 'Lydia', 'Felix', 'Sienna', 'Gavin',
  'Amina', 'Rowan', 'Eleanor', 'Xavier', 'Astrid', 'jonah', 'Hazel', 'Theo', 'Maeve', 'Aiden',
];

const LAST_NAMES = [
  'Rostova', 'Vance', 'Chen', 'Kowalski', 'Patel', 'Moreau', 'Okafor', 'Thorne', 'Lindqvist', 'Delgado',
  'Bennett', 'Takahashi', 'Al-Mansoor', 'Mercer', 'Sinclair', 'Solis', 'Keller', 'Navarro', 'Sterling', 'Bauer',
  'Voss', 'Haddad', 'Sato', 'Cavanaugh', 'Ferreira', 'Mendoza', 'Bergman', 'Davenport', 'Reyes', 'choi',
  'Kaur', 'Lambert', 'Santoro', 'mcAllister', 'Nolan', 'Gallagher', 'Hartman', 'Lozano', 'Verma', 'Duarte',
];

const AVATAR_COLORS = [
  '#0D9488', '#0284C7', '#4F46E5', '#7C3AED', '#DB2777', '#E11D48', '#D97706', '#059669', '#2563EB', '#9333EA',
];

const CITIES = ['San Francisco', 'New York', 'Austin', 'London', 'Berlin', 'Toronto', 'Singapore', 'Sydney'];

export function createDefaultSettings(): WorkspaceSettings {
  return {
    companyName: 'Peoplix Technologies Inc.',
    companyTagline: 'Better People Operations.',
    companyDescription:
      'Interactive portfolio HRMS demonstration showcasing enterprise people operations, attendance, leave workflows, payroll simulation, and org governance.',
    logoText: 'PEOPLIX HR',
    defaultCurrency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MMM dd, yyyy',
    weekStartDay: 1,
    workingDays: [1, 2, 3, 4, 5],
    defaultStartTime: '09:00',
    defaultEndTime: '17:30',
    lateArrivalThresholdMinutes: 15,
    halfDayThresholdMinutes: 240,
    standardMonthlyWorkingDays: 22,
    leavePolicies: [
      { leaveType: 'Annual', annualAllocationDays: 20, carryForwardLimit: 5, isPaid: true, allowNegativeBalance: false },
      { leaveType: 'Casual', annualAllocationDays: 7, carryForwardLimit: 0, isPaid: true, allowNegativeBalance: false },
      { leaveType: 'Sick', annualAllocationDays: 10, carryForwardLimit: 2, isPaid: true, allowNegativeBalance: true },
      { leaveType: 'Unpaid', annualAllocationDays: 30, carryForwardLimit: 0, isPaid: false, allowNegativeBalance: true },
      { leaveType: 'Other', annualAllocationDays: 5, carryForwardLimit: 0, isPaid: true, allowNegativeBalance: false },
    ],
    notificationsEnabled: true,
    emailDigestSimulation: true,
    autoDeductUnpaidLeaveInPayroll: true,
  };
}

export function createDefaultUIPreferences(): UIPreferences {
  return {
    theme: 'light',
    sidebarCollapsed: false,
    activeDemoRole: 'HR Admin',
    activeDemoEmployeeId: 'emp-004',
    recentSearches: ['Elena Rostova', 'Engineering', 'Payroll October 2026', 'Leave Policy'],
  };
}

export function generateDeterministicSeedData(): HRDataset {
  const departments: Department[] = [
    {
      id: 'dept-eng',
      name: 'Engineering',
      code: 'ENG',
      headEmployeeId: 'emp-002',
      description: 'Core platform architecture, frontend experience, cloud infrastructure, and quality engineering.',
      location: 'San Francisco',
      budgetCode: 'CC-100',
      archived: false,
      createdAt: '2023-01-10',
    },
    {
      id: 'dept-prod',
      name: 'Product & Design',
      code: 'PRD',
      headEmployeeId: 'emp-003',
      description: 'Product strategy, user experience design, design systems, and customer research.',
      location: 'New York',
      budgetCode: 'CC-200',
      archived: false,
      createdAt: '2023-01-15',
    },
    {
      id: 'dept-hr',
      name: 'People Operations',
      code: 'POP',
      headEmployeeId: 'emp-004',
      description: 'Talent acquisition, employee experience, compensation & benefits, and workplace culture.',
      location: 'San Francisco',
      budgetCode: 'CC-300',
      archived: false,
      createdAt: '2023-01-20',
    },
    {
      id: 'dept-fin',
      name: 'Finance & Legal',
      code: 'FIN',
      headEmployeeId: 'emp-005',
      description: 'Financial planning, accounting, corporate governance, payroll audit, and compliance.',
      location: 'New York',
      budgetCode: 'CC-400',
      archived: false,
      createdAt: '2023-02-01',
    },
    {
      id: 'dept-sales',
      name: 'Revenue & Sales',
      code: 'REV',
      headEmployeeId: 'emp-006',
      description: 'Enterprise account executives, solutions engineering, and commercial partnerships.',
      location: 'Austin',
      budgetCode: 'CC-500',
      archived: false,
      createdAt: '2023-02-10',
    },
    {
      id: 'dept-cs',
      name: 'Customer Success',
      code: 'CSX',
      headEmployeeId: 'emp-007',
      description: 'Implementation onboarding, account renewals, technical support, and client advocacy.',
      location: 'London',
      budgetCode: 'CC-600',
      archived: false,
      createdAt: '2023-03-01',
    },
    {
      id: 'dept-mkt',
      name: 'Marketing & Growth',
      code: 'MKT',
      headEmployeeId: 'emp-008',
      description: 'Brand communications, demand generation, product marketing, and community events.',
      location: 'Berlin',
      budgetCode: 'CC-700',
      archived: false,
      createdAt: '2023-03-15',
    },
    {
      id: 'dept-ops',
      name: 'Operations & Workplace',
      code: 'OPS',
      headEmployeeId: 'emp-009',
      description: 'Internal IT systems, workplace operations, vendor procurement, and global mobility.',
      location: 'Toronto',
      budgetCode: 'CC-800',
      archived: false,
      createdAt: '2023-04-01',
    },
  ];

  const jobRoles: JobRole[] = [
    { id: 'role-01', title: 'Chief Executive Officer', departmentId: 'dept-ops', level: 'L10', baseSalaryMin: 18000, baseSalaryMax: 24000 },
    { id: 'role-02', title: 'VP of Engineering', departmentId: 'dept-eng', level: 'L9', baseSalaryMin: 15000, baseSalaryMax: 19000 },
    { id: 'role-03', title: 'Staff Software Engineer', departmentId: 'dept-eng', level: 'L7', baseSalaryMin: 11500, baseSalaryMax: 14500 },
    { id: 'role-04', title: 'Senior Full-Stack Engineer', departmentId: 'dept-eng', level: 'L6', baseSalaryMin: 9200, baseSalaryMax: 11800 },
    { id: 'role-05', title: 'Frontend Engineer', departmentId: 'dept-eng', level: 'L5', baseSalaryMin: 7400, baseSalaryMax: 9200 },
    { id: 'role-06', title: 'Head of Product & Design', departmentId: 'dept-prod', level: 'L8', baseSalaryMin: 13500, baseSalaryMax: 16500 },
    { id: 'role-07', title: 'Senior Product Designer', departmentId: 'dept-prod', level: 'L6', baseSalaryMin: 8800, baseSalaryMax: 11000 },
    { id: 'role-08', title: 'Product Manager', departmentId: 'dept-prod', level: 'L6', baseSalaryMin: 9000, baseSalaryMax: 11500 },
    { id: 'role-09', title: 'Director of People Operations', departmentId: 'dept-hr', level: 'L8', baseSalaryMin: 12000, baseSalaryMax: 14800 },
    { id: 'role-10', title: 'HR Business Partner', departmentId: 'dept-hr', level: 'L5', baseSalaryMin: 6800, baseSalaryMax: 8600 },
    { id: 'role-11', title: 'Talent Acquisition Specialist', departmentId: 'dept-hr', level: 'L4', baseSalaryMin: 5800, baseSalaryMax: 7400 },
    { id: 'role-12', title: 'Finance Controller', departmentId: 'dept-fin', level: 'L7', baseSalaryMin: 10500, baseSalaryMax: 13000 },
    { id: 'role-13', title: 'Enterprise Account Executive', departmentId: 'dept-sales', level: 'L6', baseSalaryMin: 8500, baseSalaryMax: 11200 },
    { id: 'role-14', title: 'Customer Success Manager', departmentId: 'dept-cs', level: 'L5', baseSalaryMin: 6500, baseSalaryMax: 8200 },
    { id: 'role-15', title: 'Growth Marketing Lead', departmentId: 'dept-mkt', level: 'L6', baseSalaryMin: 7800, baseSalaryMax: 9800 },
  ];

  const schedules: WorkSchedule[] = [
    {
      id: 'sched-standard',
      name: 'Standard Weekday Schedule (09:00 - 17:30)',
      startTime: '09:00',
      endTime: '17:30',
      workingDays: [1, 2, 3, 4, 5],
      lateThresholdMinutes: 15,
      halfDayThresholdMinutes: 240,
      standardDailyMinutes: 480,
    },
    {
      id: 'sched-flex',
      name: 'Flexible Engineering Schedule (10:00 - 18:30)',
      startTime: '10:00',
      endTime: '18:30',
      workingDays: [1, 2, 3, 4, 5],
      lateThresholdMinutes: 20,
      halfDayThresholdMinutes: 240,
      standardDailyMinutes: 480,
    },
  ];

  const holidays: Holiday[] = [
    { id: 'hol-01', name: 'New Year’s Day', date: '2026-01-01', recurring: true, applicableLocation: 'All', description: 'Annual New Year holiday' },
    { id: 'hol-02', name: 'Martin Luther King Jr. Day', date: '2026-01-19', recurring: false, applicableLocation: 'All', description: 'Civil rights commemoration day' },
    { id: 'hol-03', name: 'Presidents’ Day', date: '2026-02-16', recurring: false, applicableLocation: 'San Francisco', description: 'US federal observance' },
    { id: 'hol-04', name: 'Spring Wellness Day', date: '2026-04-03', recurring: true, applicableLocation: 'All', description: 'Company-wide recharge day' },
    { id: 'hol-05', name: 'Memorial Day', date: '2026-05-25', recurring: false, applicableLocation: 'All', description: 'Late May public holiday' },
    { id: 'hol-06', name: 'Juneteenth Observation', date: '2026-06-19', recurring: true, applicableLocation: 'All', description: 'Annual freedom observance' },
    { id: 'hol-07', name: 'Independence Day Observed', date: '2026-07-03', recurring: true, applicableLocation: 'All', description: 'Mid-year summer holiday' },
    { id: 'hol-08', name: 'Summer Founders Recharge', date: '2026-08-14', recurring: true, applicableLocation: 'All', description: 'Peoplix annual founder appreciation holiday' },
    { id: 'hol-09', name: 'Labor Day', date: '2026-09-07', recurring: false, applicableLocation: 'All', description: 'September statutory holiday' },
    { id: 'hol-10', name: 'Autumn Global Day Off', date: '2026-10-12', recurring: true, applicableLocation: 'All', description: 'Global mental health & wellness day' },
    { id: 'hol-11', name: 'Thanksgiving Day', date: '2026-11-26', recurring: false, applicableLocation: 'All', description: 'November harvest holiday' },
    { id: 'hol-12', name: 'Year-End Winter Holiday', date: '2026-12-25', recurring: true, applicableLocation: 'All', description: 'December seasonal holiday' },
  ];

  // Generate 120 deterministic employees
  const employees: Employee[] = [];
  const employmentHistory: EmploymentHistory[] = [];
  const compensations: CompensationRecord[] = [];
  const leaveBalances: LeaveBalance[] = [];

  for (let i = 1; i <= 120; i++) {
    const id = `emp-${String(i).padStart(3, '0')}`;
    const code = `PX-${String(1000 + i)}`;
    const firstRaw = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const firstName = firstRaw.charAt(0).toUpperCase() + firstRaw.slice(1);
    const lastRaw = LAST_NAMES[((i - 1) * 3) % LAST_NAMES.length];
    const lastName = lastRaw.charAt(0).toUpperCase() + lastRaw.slice(1);
    const fullName = `${firstName} ${lastName}`;
    const emailSlug = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 40 ? i : ''}@peoplix.demo`;

    let departmentId = departments[Math.max(0, i - 2) % departments.length].id;
    let managerId: string | null = null;
    let jobRole = jobRoles[(i + 2) % jobRoles.length];
    let baseSalary = 7500;

    if (i === 1) {
      // CEO
      departmentId = 'dept-ops';
      managerId = null;
      jobRole = jobRoles[0];
      baseSalary = 21500;
    } else if (i >= 2 && i <= 9) {
      // 8 Department Heads reporting to CEO
      departmentId = departments[i - 2].id;
      managerId = 'emp-001';
      if (departmentId === 'dept-eng') jobRole = jobRoles[1];
      else if (departmentId === 'dept-prod') jobRole = jobRoles[5];
      else if (departmentId === 'dept-hr') jobRole = jobRoles[8];
      else if (departmentId === 'dept-fin') jobRole = jobRoles[11];
      else if (departmentId === 'dept-sales') jobRole = jobRoles[12];
      else if (departmentId === 'dept-cs') jobRole = jobRoles[13];
      else if (departmentId === 'dept-mkt') jobRole = jobRoles[14];
      else jobRole = jobRoles[11];
      baseSalary = 14200 + (i % 4) * 800;
    } else if (i >= 10 && i <= 25) {
      // 16 Team Managers reporting to Department Heads
      const deptIdx = (i - 10) % 8;
      departmentId = departments[deptIdx].id;
      managerId = `emp-${String(deptIdx + 2).padStart(3, '0')}`;
      jobRole = jobRoles.find((r) => r.departmentId === departmentId) ?? jobRoles[3];
      baseSalary = 10400 + (i % 5) * 450;
    } else {
      // 95 Individual Contributors reporting to Team Managers or Dept Heads
      const deptIdx = (i - 26) % 8;
      departmentId = departments[deptIdx].id;
      const teamLeadIdNum = 10 + deptIdx + ((i % 2) * 8);
      managerId = `emp-${String(teamLeadIdNum).padStart(3, '0')}`;
      const deptRoles = jobRoles.filter((r) => r.departmentId === departmentId);
      jobRole = deptRoles[i % Math.max(1, deptRoles.length)] ?? jobRoles[4];
      baseSalary = 6200 + (i % 8) * 420;
    }

    let employmentStatus: EmploymentStatus = 'Active';
    if (i % 19 === 0) employmentStatus = 'On Leave';
    else if (i % 13 === 0) employmentStatus = 'Probation';
    else if (i === 118 || i === 119) employmentStatus = 'Inactive';
    else if (i === 120) employmentStatus = 'Terminated';

    const employmentTypes: EmploymentType[] = ['Full-Time', 'Full-Time', 'Full-Time', 'Part-Time', 'Contract', 'Intern'];
    const employmentType = employmentTypes[i % employmentTypes.length];

    const workLocations: WorkLocationCategory[] = ['Hybrid', 'Remote', 'On-Site'];
    const workLocation = workLocations[i % workLocations.length];

    const joinYear = 2023 + (i % 4);
    const joinMonth = String(((i * 3) % 10) + 1).padStart(2, '0');
    const joinDay = String(((i * 5) % 25) + 1).padStart(2, '0');
    const joinDate = joinYear === 2026 && Number(joinMonth) > 10 ? `2026-09-${joinDay}` : `${joinYear}-${joinMonth}-${joinDay}`;

    // Birthdates distributed across November & December so upcoming birthdays widget is always populated
    const birthMonth = i <= 15 ? '11' : String(((i * 7) % 12) + 1).padStart(2, '0');
    const birthDay = i <= 15 ? String(13 + (i % 16)).padStart(2, '0') : String(((i * 3) % 27) + 1).padStart(2, '0');
    const birthDate = `199${i % 9}-${birthMonth}-${birthDay}`;

    const emp: Employee = {
      id,
      employeeCode: code,
      firstName,
      lastName,
      fullName,
      workEmail: emailSlug,
      phone: `+1 (555) ${String(200 + (i % 700)).padStart(3, '0')}-${String(1000 + i * 17).slice(0, 4)}`,
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      departmentId,
      jobRoleId: jobRole.id,
      jobTitle: i >= 10 && i <= 25 ? `Lead ${jobRole.title}` : jobRole.title,
      managerId,
      employmentStatus,
      employmentType,
      workLocation,
      locationCity: CITIES[i % CITIES.length],
      joinDate,
      birthDate,
      scheduleId: departmentId === 'dept-eng' && i % 2 === 0 ? 'sched-flex' : 'sched-standard',
      emergencyContactName: `${FIRST_NAMES[(i + 11) % FIRST_NAMES.length]} ${lastName}`,
      emergencyContactRelation: i % 2 === 0 ? 'Spouse / Partner' : 'Sibling',
      bio: `${fullName} serves as ${i >= 10 && i <= 25 ? `Lead ${jobRole.title}` : jobRole.title} in the ${departments.find((d) => d.id === departmentId)?.name} group, focusing on operational excellence and cross-functional delivery.`,
      skills:
        departmentId === 'dept-eng'
          ? ['TypeScript', 'React', 'Distributed Systems', 'Architecture']
          : departmentId === 'dept-prod'
          ? ['Product Strategy', 'Design Systems', 'User Research', 'Prototyping']
          : departmentId === 'dept-hr'
          ? ['People Operations', 'Talent Acquisition', 'Compensation Design', 'Coaching']
          : ['Strategic Planning', 'Stakeholder Alignment', 'Data Analysis', 'Process Optimization'],
      documents: [
        {
          id: `doc-${i}-1`,
          name: `${fullName} — Employment Agreement (Demo Reference)`,
          type: 'Contract',
          referenceUrl: `https://docs.peoplix.demo/contracts/${code.toLowerCase()}.pdf`,
          addedAt: joinDate,
        },
        {
          id: `doc-${i}-2`,
          name: 'Employee Handbook & Code of Conduct Acknowledgment',
          type: 'Policy',
          referenceUrl: 'https://docs.peoplix.demo/policies/code-of-conduct-2026.pdf',
          addedAt: joinDate,
        },
      ],
      archived: false,
    };

    employees.push(emp);

    employmentHistory.push({
      id: `eh-${i}-1`,
      employeeId: id,
      jobTitle: emp.jobTitle,
      departmentId,
      employmentType,
      startDate: joinDate,
      endDate: null,
      changeReason: 'Initial Hire & Onboarding',
    });

    compensations.push({
      id: `comp-${i}-1`,
      employeeId: id,
      baseSalary,
      payFrequency: 'Monthly',
      housingAllowance: Math.round(baseSalary * 0.06),
      transportAllowance: 220,
      mealAllowance: 180,
      targetBonusAmount: Math.round(baseSalary * 0.1),
      standardDeduction: Math.round(baseSalary * 0.04),
      effectiveDate: joinDate,
      changeReason: 'Base Compensation Package',
      archived: false,
    });

    const usedAnnual = (i * 2) % 9;
    const pendingAnnual = i % 11 === 0 ? 2 : 0;

    leaveBalances.push(
      {
        id: `lb-${i}-annual`,
        employeeId: id,
        year: 2026,
        leaveType: 'Annual',
        openingBalance: 15,
        accruedDays: 5,
        adjustments: i % 10 === 0 ? 2 : 0,
        usedDays: usedAnnual,
        pendingDays: pendingAnnual,
      },
      {
        id: `lb-${i}-casual`,
        employeeId: id,
        year: 2026,
        leaveType: 'Casual',
        openingBalance: 7,
        accruedDays: 0,
        adjustments: 0,
        usedDays: i % 4,
        pendingDays: 0,
      },
      {
        id: `lb-${i}-sick`,
        employeeId: id,
        year: 2026,
        leaveType: 'Sick',
        openingBalance: 10,
        accruedDays: 0,
        adjustments: 0,
        usedDays: i % 3,
        pendingDays: 0,
      },
      {
        id: `lb-${i}-unpaid`,
        employeeId: id,
        year: 2026,
        leaveType: 'Unpaid',
        openingBalance: 0,
        accruedDays: 0,
        adjustments: 0,
        usedDays: i % 25 === 0 ? 2 : 0,
        pendingDays: 0,
      }
    );
  }

  // Generate 100 Leave Requests across the 120 employees
  const leaveRequests: LeaveRequest[] = [];
  const leaveTypes: LeaveType[] = ['Annual', 'Casual', 'Sick', 'Unpaid', 'Other'];
  const leaveStatuses: LeaveStatus[] = ['Approved', 'Approved', 'Pending', 'Rejected', 'Cancelled'];
  const leaveReasons = [
    'Family vacation and travel plans',
    'Medical appointment and recovery rest',
    'Personal administrative errands',
    'Attending family wedding ceremony',
    'Home relocation and utility setup',
    'Childcare and school conference day',
  ];

  for (let k = 1; k <= 100; k++) {
    const empIdx = ((k - 1) % 100) + 1;
    const emp = employees[empIdx - 1];
    const leaveType = leaveTypes[k % leaveTypes.length];
    const status = k <= 14 ? 'Pending' : leaveStatuses[k % leaveStatuses.length];
    const monthNum = 6 + (k % 6); // Months 06 to 11
    const startDay = ((k * 2) % 20) + 2;
    const durationDays = (k % 4) + 1;
    const startDate = `2026-${String(monthNum).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `2026-${String(monthNum).padStart(2, '0')}-${String(startDay + durationDays).padStart(2, '0')}`;
    const workingDays = Math.max(
      1,
      calculateWorkingDaysBetween(startDate, endDate, [1, 2, 3, 4, 5], holidays, emp.locationCity)
    );

    leaveRequests.push({
      id: `lr-${String(k).padStart(3, '0')}`,
      employeeId: emp.id,
      leaveType,
      startDate,
      endDate,
      workingDays,
      reason: leaveReasons[k % leaveReasons.length],
      status,
      approverId: emp.managerId ?? 'emp-004',
      reviewNotes:
        status === 'Approved'
          ? 'Approved with team handoff confirmed.'
          : status === 'Rejected'
          ? 'Conflicts with critical quarterly release freeze.'
          : '',
      createdAt: `2026-${String(Math.max(5, monthNum - 1)).padStart(2, '0')}-15T10:00:00.000Z`,
      updatedAt: `2026-${String(monthNum).padStart(2, '0')}-01T14:30:00.000Z`,
      balanceDeducted: status === 'Approved',
    });
  }

  // Generate 6 Months of Attendance records (Months 2026-06 through 2026-11 up to 2026-11-13)
  // For today (2026-11-13) and recent days, cover all 120 employees; for prior months, sample deterministic workdays across employees so all 6-month trend charts and employee histories are rich.
  const attendance: AttendanceRecord[] = [];
  const recentDates = [
    '2026-11-13',
    '2026-11-12',
    '2026-11-11',
    '2026-11-10',
    '2026-11-09',
    '2026-11-06',
    '2026-11-05',
    '2026-11-04',
    '2026-11-03',
    '2026-11-02',
  ];

  // Full 120-employee coverage for today & recent November dates
  for (const dateStr of recentDates) {
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      if (emp.employmentStatus === 'Terminated' || emp.employmentStatus === 'Inactive') continue;

      const hasLeave = leaveRequests.some(
        (lr) => lr.employeeId === emp.id && lr.status === 'Approved' && lr.startDate <= dateStr && lr.endDate >= dateStr
      );

      if (hasLeave || emp.employmentStatus === 'On Leave') {
        attendance.push({
          id: `att-${dateStr}-${emp.id}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          workingMinutes: 0,
          status: 'On Leave',
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          notes: 'Approved scheduled leave',
          isManualCorrection: false,
        });
        continue;
      }

      const seedVal = (i + Number(dateStr.slice(-2))) % 20;
      if (seedVal === 0) {
        attendance.push({
          id: `att-${dateStr}-${emp.id}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          workingMinutes: 0,
          status: 'Absent',
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          notes: 'Unscheduled absence',
          isManualCorrection: false,
        });
      } else if (seedVal === 1 || seedVal === 2) {
        attendance.push({
          id: `att-${dateStr}-${emp.id}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: '09:28',
          checkOut: '17:45',
          workingMinutes: 497,
          status: 'Late',
          lateMinutes: 28,
          earlyDepartureMinutes: 0,
          notes: 'Transit delay reported',
          isManualCorrection: false,
        });
      } else if (seedVal === 3) {
        attendance.push({
          id: `att-${dateStr}-${emp.id}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: '09:00',
          checkOut: '12:45',
          workingMinutes: 225,
          status: 'Half Day',
          lateMinutes: 0,
          earlyDepartureMinutes: 285,
          notes: 'Afternoon dental appointment',
          isManualCorrection: false,
        });
      } else {
        const inMin = (i % 12);
        const checkIn = `08:${String(48 + inMin).padStart(2, '0')}`;
        const checkOut = `17:${String(30 + (i % 25)).padStart(2, '0')}`;
        attendance.push({
          id: `att-${dateStr}-${emp.id}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn,
          checkOut,
          workingMinutes: 515 + (i % 20),
          status: 'Present',
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          notes: '',
          isManualCorrection: false,
        });
      }
    }
  }

  // Historical 6-month attendance samples (June 2026 - October 2026)
  const historicalDates = [
    '2026-06-05', '2026-06-12', '2026-06-18', '2026-06-25',
    '2026-07-07', '2026-07-14', '2026-07-21', '2026-07-28',
    '2026-08-04', '2026-08-11', '2026-08-19', '2026-08-26',
    '2026-09-03', '2026-09-10', '2026-09-17', '2026-09-24',
    '2026-10-06', '2026-10-14', '2026-10-21', '2026-10-28',
  ];

  for (const dateStr of historicalDates) {
    for (let i = 0; i < 40; i++) {
      const emp = employees[i];
      const mod = (i + dateStr.charCodeAt(6)) % 14;
      const status = mod === 0 ? 'Absent' : mod === 1 ? 'Late' : mod === 2 ? 'On Leave' : 'Present';
      attendance.push({
        id: `att-${dateStr}-${emp.id}`,
        employeeId: emp.id,
        date: dateStr,
        checkIn: status === 'Present' ? '08:55' : status === 'Late' ? '09:24' : null,
        checkOut: status === 'Present' || status === 'Late' ? '17:35' : null,
        workingMinutes: status === 'Present' ? 520 : status === 'Late' ? 491 : 0,
        status,
        lateMinutes: status === 'Late' ? 24 : 0,
        earlyDepartureMinutes: 0,
        notes: '',
        isManualCorrection: false,
      });
    }
  }

  // Generate 6 Payroll Periods (2026-06 through 2026-11)
  const payrollMonths = [
    { month: '2026-06', label: 'June 2026', status: 'Finalized' as const, finalizedAt: '2026-06-28T16:00:00.000Z' },
    { month: '2026-07', label: 'July 2026', status: 'Finalized' as const, finalizedAt: '2026-07-29T16:00:00.000Z' },
    { month: '2026-08', label: 'August 2026', status: 'Finalized' as const, finalizedAt: '2026-08-28T16:00:00.000Z' },
    { month: '2026-09', label: 'September 2026', status: 'Finalized' as const, finalizedAt: '2026-09-29T16:00:00.000Z' },
    { month: '2026-10', label: 'October 2026', status: 'Finalized' as const, finalizedAt: '2026-10-29T16:00:00.000Z' },
    { month: '2026-11', label: 'November 2026', status: 'Calculated' as const, finalizedAt: null },
  ];

  const payrollRuns: PayrollRun[] = [];
  const payrollEntries: PayrollEntry[] = [];
  const payslips: Payslip[] = [];
  const deptNameMap = new Map(departments.map((d) => [d.id, d.name]));

  for (const pm of payrollMonths) {
    const runId = `pr-${pm.month}`;
    const runEntries: PayrollEntry[] = [];

    // For current & October runs include all active employees; for earlier historical months include eligible active employees joined by then
    const eligibleEmployees = employees.filter(
      (e) =>
        e.employmentStatus !== 'Terminated' &&
        e.employmentStatus !== 'Inactive' &&
        e.joinDate <= `${pm.month}-28`
    );

    for (let idx = 0; idx < eligibleEmployees.length; idx++) {
      const emp = eligibleEmployees[idx];
      const comp = compensations.find((c) => c.employeeId === emp.id)!;
      const bonus = pm.month === '2026-09' && idx % 5 === 0 ? 600 : idx % 12 === 0 ? 350 : 0;
      const unpaidLeaveDays = idx % 29 === 0 ? 1 : 0;

      const calc = calculatePayrollEntryAmounts({
        baseSalary: comp.baseSalary,
        housingAllowance: comp.housingAllowance,
        transportAllowance: comp.transportAllowance,
        mealAllowance: comp.mealAllowance,
        bonus,
        configuredDeductions: comp.standardDeduction,
        unpaidLeaveDays,
        standardWorkingDays: 22,
        autoDeductUnpaidLeave: true,
      });

      const entryId = `pe-${pm.month}-${emp.id}`;
      const entry: PayrollEntry = {
        id: entryId,
        payrollRunId: runId,
        periodMonth: pm.month,
        employeeId: emp.id,
        employeeNameSnapshot: emp.fullName,
        employeeCodeSnapshot: emp.employeeCode,
        jobTitleSnapshot: emp.jobTitle,
        departmentNameSnapshot: deptNameMap.get(emp.departmentId) ?? 'Operations',
        baseSalary: calc.baseSalary,
        allowances: calc.allowances,
        bonuses: calc.bonuses,
        configuredDeductions: calc.configuredDeductions,
        unpaidLeaveDays: calc.unpaidLeaveDays,
        unpaidLeaveAdjustment: calc.unpaidLeaveAdjustment,
        totalDeductions: calc.totalDeductions,
        grossPay: calc.grossPay,
        netPay: calc.netPay,
        status: pm.status,
      };
      runEntries.push(entry);
      payrollEntries.push(entry);

      // Generate Payslips for October & November + key demo employees across all months
      if (pm.month === '2026-10' || pm.month === '2026-11' || idx < 15) {
        payslips.push({
          id: `ps-${pm.month}-${emp.id}`,
          payrollRunId: runId,
          payrollEntryId: entryId,
          employeeId: emp.id,
          periodMonth: pm.month,
          periodLabel: pm.label,
          status: pm.status === 'Finalized' ? 'Issued' : 'Draft',
          issuedDate: pm.finalizedAt ? pm.finalizedAt.slice(0, 10) : `${pm.month}-25`,
          earningsBreakdown: {
            baseSalary: comp.baseSalary,
            housingAllowance: comp.housingAllowance,
            transportAllowance: comp.transportAllowance,
            mealAllowance: comp.mealAllowance,
            bonus,
          },
          deductionsBreakdown: {
            configuredDeduction: comp.standardDeduction,
            unpaidLeaveAdjustment: calc.unpaidLeaveAdjustment,
          },
          grossPay: calc.grossPay,
          totalDeductions: calc.totalDeductions,
          netPay: calc.netPay,
        });
      }
    }

    const summary = summarizePayrollRun(
      runId,
      pm.month,
      pm.label,
      pm.status,
      22,
      runEntries,
      `${pm.month}-20T09:00:00.000Z`,
      pm.finalizedAt
    );
    payrollRuns.push(summary);
  }

  // 8 Job Openings
  const jobOpenings: JobOpening[] = [
    {
      id: 'job-01',
      title: 'Senior Distributed Systems Engineer',
      departmentId: 'dept-eng',
      location: 'San Francisco',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      status: 'Open',
      headcountTarget: 2,
      salaryRangeMin: 11500,
      salaryRangeMax: 14500,
      hiringManagerId: 'emp-002',
      postedDate: '2026-10-02',
      description: 'Architect resilient multi-region services and high-throughput event pipelines.',
    },
    {
      id: 'job-02',
      title: 'Staff Design Systems Architect',
      departmentId: 'dept-prod',
      location: 'New York',
      employmentType: 'Full-Time',
      workLocation: 'Remote',
      status: 'Open',
      headcountTarget: 1,
      salaryRangeMin: 10500,
      salaryRangeMax: 13200,
      hiringManagerId: 'emp-003',
      postedDate: '2026-10-08',
      description: 'Own component accessibility, token governance, and cross-platform UI patterns.',
    },
    {
      id: 'job-03',
      title: 'People Partner — Global Engineering',
      departmentId: 'dept-hr',
      location: 'San Francisco',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      status: 'Open',
      headcountTarget: 1,
      salaryRangeMin: 7600,
      salaryRangeMax: 9400,
      hiringManagerId: 'emp-004',
      postedDate: '2026-10-12',
      description: 'Partner with engineering leadership on organizational design, talent reviews, and coaching.',
    },
    {
      id: 'job-04',
      title: 'Strategic Enterprise Account Executive',
      departmentId: 'dept-sales',
      location: 'Austin',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      status: 'Open',
      headcountTarget: 3,
      salaryRangeMin: 9500,
      salaryRangeMax: 12800,
      hiringManagerId: 'emp-006',
      postedDate: '2026-10-15',
      description: 'Lead consultative enterprise SaaS sales cycles with Fortune 1000 HR leaders.',
    },
    {
      id: 'job-05',
      title: 'Technical Customer Success Lead',
      departmentId: 'dept-cs',
      location: 'London',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      status: 'Open',
      headcountTarget: 2,
      salaryRangeMin: 7200,
      salaryRangeMax: 8900,
      hiringManagerId: 'emp-007',
      postedDate: '2026-10-19',
      description: 'Guide enterprise customer onboarding and executive business reviews across EMEA.',
    },
    {
      id: 'job-06',
      title: 'Product Marketing Manager',
      departmentId: 'dept-mkt',
      location: 'Berlin',
      employmentType: 'Full-Time',
      workLocation: 'Remote',
      status: 'Open',
      headcountTarget: 1,
      salaryRangeMin: 7800,
      salaryRangeMax: 9600,
      hiringManagerId: 'emp-008',
      postedDate: '2026-10-22',
      description: 'Craft category positioning, launch narratives, and competitive sales enablement.',
    },
    {
      id: 'job-07',
      title: 'FP&A Senior Financial Analyst',
      departmentId: 'dept-fin',
      location: 'New York',
      employmentType: 'Full-Time',
      workLocation: 'On-Site',
      status: 'On Hold',
      headcountTarget: 1,
      salaryRangeMin: 8400,
      salaryRangeMax: 10200,
      hiringManagerId: 'emp-005',
      postedDate: '2026-09-25',
      description: 'Own headcount forecasting, SaaS unit economics modeling, and board reporting.',
    },
    {
      id: 'job-08',
      title: 'IT & Workplace Security Specialist',
      departmentId: 'dept-ops',
      location: 'Toronto',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      status: 'Closed',
      headcountTarget: 1,
      salaryRangeMin: 7000,
      salaryRangeMax: 8800,
      hiringManagerId: 'emp-009',
      postedDate: '2026-09-01',
      description: 'Manage zero-trust endpoint fleet, identity lifecycle, and workplace systems.',
    },
  ];

  // 30 Candidates across all 7 stages
  const stages: RecruitmentStage[] = [
    'Applied',
    'Screening',
    'Interview',
    'Assessment',
    'Offer',
    'Hired',
    'Rejected',
  ];

  const candidateNames = [
    'Lucas Meyer', 'Ananya Sharma', 'Devon Brooks', 'Mei-Ling Zhou', 'Rafael Costa',
    'Genevieve Laurent', 'Tariq Al-Sayed', 'Kirsten Lindholm', 'Soren Kierkegaard', 'Bianca Rossi',
    'Kendrick Sterling', 'Yuki Watanabe', 'Fatima Zahra', 'Callum MacLeod', 'Daria Sokolova',
    'nikolai Petrov', 'Serena Haynes', 'Joaquin Morales', 'Phoebe Bridgers', 'declan Gallagher',
    'Zainab Abubakar', 'Henrik Ibsen', 'Keiko Matsui', 'Gideon Cross', 'Paloma Silva',
    'Elias Thorne', 'Miriam Goldstein', 'Tomasz Nowak', 'Rohan Deshmukh', 'Celine Moreau',
  ];

  const candidates: Candidate[] = candidateNames.map((rawName, idx) => {
    const fullName = rawName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    const stage = stages[idx % stages.length];
    const job = jobOpenings[idx % jobOpenings.length];
    return {
      id: `cand-${String(idx + 1).padStart(3, '0')}`,
      jobOpeningId: job.id,
      fullName,
      email: `${fullName.toLowerCase().replace(/\s+/g, '.')}@candidate.demo`,
      phone: `+1 (415) ${String(310 + idx * 7).padStart(3, '0')}-${String(2200 + idx * 31).slice(0, 4)}`,
      location: CITIES[idx % CITIES.length],
      currentRole: job.title.replace('Senior ', '').replace('Staff ', ''),
      experienceYears: 3 + (idx % 9),
      stage,
      offerStatus:
        stage === 'Offer'
          ? 'Sent'
          : stage === 'Hired'
          ? 'Accepted'
          : stage === 'Rejected'
          ? 'Declined'
          : 'None',
      hiringDecision:
        stage === 'Hired' || stage === 'Offer'
          ? 'Strong Hire'
          : stage === 'Rejected'
          ? 'No Hire'
          : idx % 3 === 0
          ? 'Hire'
          : 'Undecided',
      interviewDate:
        stage === 'Interview' || stage === 'Assessment' || stage === 'Offer'
          ? `2026-11-${String(14 + (idx % 12)).padStart(2, '0')}`
          : null,
      expectedSalary: job.salaryRangeMin + ((idx * 350) % 2000),
      rating: 3 + (idx % 3),
      notes: `Strong domain depth in ${job.title}. Portfolio and technical communication scored well during panel review.`,
      appliedDate: `2026-10-${String(3 + (idx % 25)).padStart(2, '0')}`,
      archived: false,
    };
  });

  // 75 Performance Reviews
  const performanceReviews: PerformanceReview[] = [];
  for (let r = 1; r <= 75; r++) {
    const emp = employees[r - 1];
    const selfScore = Number((3.4 + ((r * 3) % 16) * 0.1).toFixed(1));
    const mgrScore = Number((3.5 + ((r * 5) % 15) * 0.1).toFixed(1));
    const overallScore = Number(((selfScore + mgrScore) / 2).toFixed(1));
    const status = r <= 55 ? 'Finalized' : r <= 68 ? 'In Review' : 'Draft';

    performanceReviews.push({
      id: `rev-${String(r).padStart(3, '0')}`,
      employeeId: emp.id,
      reviewerId: emp.managerId ?? 'emp-001',
      cycleName: r % 3 === 0 ? 'H1 2026 Performance Cycle' : 'H2 2026 Performance Cycle',
      templateName: 'Core Competency & OKR Evaluation',
      status,
      selfAssessmentScore: selfScore,
      managerScore: mgrScore,
      overallScore,
      selfAssessmentNotes:
        'Delivered key quarterly roadmap milestones ahead of schedule and mentored two new team members.',
      managerFeedback:
        'Consistently high ownership, thoughtful architectural trade-offs, and reliable cross-team collaboration.',
      goals: [
        {
          id: `goal-${r}-1`,
          title: 'Deliver Q3/Q4 Departmental OKR Target with >95% quality reliability',
          weight: 50,
          completed: status === 'Finalized',
          score: Math.min(5, Math.round(overallScore)),
        },
        {
          id: `goal-${r}-2`,
          title: 'Document team operational playbooks and mentor onboarding peers',
          weight: 30,
          completed: r % 4 !== 0,
          score: Math.min(5, Math.round(mgrScore)),
        },
        {
          id: `goal-${r}-3`,
          title: 'Complete annual leadership & cross-functional communication workshop',
          weight: 20,
          completed: r % 2 === 0,
          score: 4,
        },
      ],
      createdAt: '2026-10-05T10:00:00.000Z',
      finalizedAt: status === 'Finalized' ? '2026-11-02T17:00:00.000Z' : null,
    });
  }

  // Onboarding & Offboarding Templates + 80 Tasks
  const onboardingTemplates: OnboardingTemplate[] = [
    {
      id: 'tpl-onboard-std',
      name: 'Standard New Hire Onboarding (30-60-90 Day)',
      type: 'Onboarding',
      departmentId: 'All',
      description: 'End-to-end workstation provisioning, compliance orientation, and role ramp-up checklist.',
      defaultTasks: [
        { title: 'Provision laptop, SSO credentials, and workspace access', category: 'IT & Access', dueOffsetDays: 1 },
        { title: 'Complete I-9 / right-to-work verification & handbook sign-off', category: 'HR & Compliance', dueOffsetDays: 3 },
        { title: 'Host 1:1 welcome coffee with hiring manager & onboarding buddy', category: 'Team Introduction', dueOffsetDays: 5 },
        { title: 'Complete core product architecture & domain walkthrough', category: 'Role Training', dueOffsetDays: 10 },
      ],
    },
    {
      id: 'tpl-offboard-std',
      name: 'Standard Employee Offboarding & Handover',
      type: 'Offboarding',
      departmentId: 'All',
      description: 'Structured knowledge transfer, asset recovery, exit interview, and final payroll clearance.',
      defaultTasks: [
        { title: 'Document active project ownership & transition notes', category: 'Handover', dueOffsetDays: 3 },
        { title: 'Conduct People Operations exit interview session', category: 'HR & Compliance', dueOffsetDays: 5 },
        { title: 'Revoke production SSO tokens & recover hardware assets', category: 'IT & Access', dueOffsetDays: 7 },
      ],
    },
  ];

  const onboardingTasks: OnboardingTask[] = [];
  const taskDefinitions = [
    { title: 'Provision laptop, SSO credentials, and workspace access', category: 'IT & Access' as const },
    { title: 'Complete right-to-work verification & handbook sign-off', category: 'HR & Compliance' as const },
    { title: 'Meet onboarding buddy & complete department orientation', category: 'Team Introduction' as const },
    { title: 'Complete 30-day role training & first milestone review', category: 'Role Training' as const },
  ];

  for (let t = 0; t < 20; t++) {
    const emp = employees[95 + t]; // Recent hires & transitions
    const isOffboarding = t >= 18;
    for (let step = 0; step < 4; step++) {
      const idx = t * 4 + step + 1;
      const completed = (t + step) % 3 !== 0;
      onboardingTasks.push({
        id: `ob-task-${String(idx).padStart(3, '0')}`,
        templateId: isOffboarding ? 'tpl-offboard-std' : 'tpl-onboard-std',
        type: isOffboarding ? 'Offboarding' : 'Onboarding',
        employeeId: emp.id,
        assignedTeamMemberId: step === 0 ? 'emp-009' : step === 1 ? 'emp-004' : emp.managerId ?? 'emp-002',
        title: isOffboarding && step === 0 ? 'Document active project ownership & transition notes' : taskDefinitions[step].title,
        category: isOffboarding && step === 0 ? 'Handover' : taskDefinitions[step].category,
        dueDate: `2026-11-${String(5 + (idx % 22)).padStart(2, '0')}`,
        completed,
        completedAt: completed ? '2026-11-10T15:20:00.000Z' : null,
        notes: completed ? 'Verified and signed off in workspace.' : 'Scheduled for completion this week.',
      });
    }
  }

  // Demo Team Members (for Role Switcher & /dashboard/team)
  const demoTeamMembers: DemoTeamMember[] = [
    {
      id: 'dtm-1',
      employeeId: 'emp-004',
      name: employees[3].fullName,
      email: employees[3].workEmail,
      role: 'HR Admin',
      departmentId: 'dept-hr',
      jobTitle: employees[3].jobTitle,
      permissionsSummary: [
        'Full access to Workspace Settings, JSON Backup/Restore & Policy Rules',
        'Create, edit, and archive any employee, department, or compensation record',
        'Generate and finalize simulated payroll runs and issue payslips',
        'Approve or reject leave requests across all departments',
      ],
    },
    {
      id: 'dtm-2',
      employeeId: 'emp-012',
      name: employees[11].fullName,
      email: employees[11].workEmail,
      role: 'HR Manager',
      departmentId: 'dept-hr',
      jobTitle: employees[11].jobTitle,
      permissionsSummary: [
        'Manage employee directory, recruitment pipeline, and onboarding checklists',
        'Review and approve leave requests and attendance corrections',
        'Prepare payroll previews and export workforce analytics',
      ],
    },
    {
      id: 'dtm-3',
      employeeId: 'emp-002',
      name: employees[1].fullName,
      email: employees[1].workEmail,
      role: 'Department Manager',
      departmentId: 'dept-eng',
      jobTitle: employees[1].jobTitle,
      permissionsSummary: [
        'View and manage direct reports within Engineering',
        'Conduct performance reviews and approve team leave requests',
        'Review candidate interviews for open Engineering roles',
      ],
    },
    {
      id: 'dtm-4',
      employeeId: 'emp-028',
      name: employees[27].fullName,
      email: employees[27].workEmail,
      role: 'Employee',
      departmentId: 'dept-eng',
      jobTitle: employees[27].jobTitle,
      permissionsSummary: [
        'Self-service check-in / check-out and personal attendance log',
        'Submit leave requests and view personal leave balances',
        'View personal Employee 360 profile and download issued PDF payslips',
      ],
    },
  ];

  // 300 Activity Timeline Entries
  const activities: Activity[] = [];
  const activityTemplates: {
    type: ActivityEventType;
    entityType: Activity['entityType'];
    makeTitle: (emp: Employee, idx: number) => string;
    makeDesc: (emp: Employee, idx: number) => string;
  }[] = [
    {
      type: 'employee_updated',
      entityType: 'employee',
      makeTitle: (emp) => `Updated profile record for ${emp.fullName}`,
      makeDesc: (emp) => `Verified role assignment (${emp.jobTitle}) and work location (${emp.workLocation}).`,
    },
    {
      type: 'attendance_recorded',
      entityType: 'attendance',
      makeTitle: (emp) => `Attendance check-in logged for ${emp.fullName}`,
      makeDesc: (emp) => `Recorded daily attendance under ${emp.scheduleId === 'sched-flex' ? 'Flexible' : 'Standard'} schedule.`,
    },
    {
      type: 'leave_approved',
      entityType: 'leave',
      makeTitle: (emp) => `Approved leave request for ${emp.fullName}`,
      makeDesc: (emp) => `Leave balance updated and team coverage calendar synchronized.`,
    },
    {
      type: 'payroll_generated',
      entityType: 'payroll',
      makeTitle: (emp) => `Processed payroll entry for ${emp.fullName}`,
      makeDesc: (emp) => `Calculated monthly earnings, allowances, and net pay snapshot.`,
    },
    {
      type: 'compensation_updated',
      entityType: 'payroll',
      makeTitle: (emp) => `Reviewed compensation package for ${emp.fullName}`,
      makeDesc: (emp) => `Effective date and allowance breakdown verified in Compensation ledger.`,
    },
    {
      type: 'candidate_moved',
      entityType: 'recruitment',
      makeTitle: (_emp, idx) => `Candidate ${candidates[idx % candidates.length].fullName} advanced stage`,
      makeDesc: (_emp, idx) => `Moved to ${candidates[idx % candidates.length].stage} in recruitment pipeline.`,
    },
    {
      type: 'review_created',
      entityType: 'performance',
      makeTitle: (emp) => `Performance review updated for ${emp.fullName}`,
      makeDesc: (emp) => `H2 2026 competency ratings and goal progress recorded.`,
    },
  ];

  for (let a = 1; a <= 300; a++) {
    const emp = employees[(a - 1) % employees.length];
    const tpl = activityTemplates[(a - 1) % activityTemplates.length];
    const actor = employees[(a % 8) + 1];
    const dayOffset = Math.floor((a - 1) / 5);
    const tsDate = new Date(2026, 10, 13, 16, 30, 0);
    tsDate.setDate(tsDate.getDate() - dayOffset);
    tsDate.setMinutes(tsDate.getMinutes() - (a * 7) % 360);

    activities.push({
      id: `act-${String(a).padStart(3, '0')}`,
      eventType: tpl.type,
      title: tpl.makeTitle(emp, a),
      description: tpl.makeDesc(emp, a),
      actorId: actor.id,
      actorName: actor.fullName,
      entityType: tpl.entityType,
      entityId: tpl.entityType === 'recruitment' ? candidates[a % candidates.length].id : emp.id,
      timestamp: tsDate.toISOString(),
    });
  }

  const savedReports: SavedReportConfig[] = [
    {
      id: 'rep-01',
      name: 'Q4 Active Workforce Directory',
      reportType: 'employees',
      departmentId: 'All',
      dateFrom: '2026-10-01',
      dateTo: '2026-11-13',
      createdAt: '2026-11-01',
    },
    {
      id: 'rep-02',
      name: 'Engineering Monthly Attendance Audit',
      reportType: 'attendance',
      departmentId: 'dept-eng',
      dateFrom: '2026-11-01',
      dateTo: '2026-11-13',
      createdAt: '2026-11-05',
    },
    {
      id: 'rep-03',
      name: 'October 2026 Finalized Payroll Ledger',
      reportType: 'payroll',
      departmentId: 'All',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      createdAt: '2026-10-30',
    },
  ];

  return {
    version: STORAGE_SCHEMA_VERSION,
    employees,
    departments,
    jobRoles,
    schedules,
    employmentHistory,
    attendance,
    leaveBalances,
    leaveRequests,
    holidays,
    compensations,
    payrollRuns,
    payrollEntries,
    payslips,
    jobOpenings,
    candidates,
    performanceReviews,
    onboardingTemplates,
    onboardingTasks,
    activities,
    demoTeamMembers,
    savedReports,
  };
}
