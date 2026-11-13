import Decimal from 'decimal.js';
import {
  CompensationRecord,
  Department,
  Employee,
  PayrollEntry,
  PayrollRun,
  PayrollStatus,
} from '@/lib/types/hr';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface PayrollItemCalculationInput {
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  bonus: number;
  configuredDeductions: number;
  unpaidLeaveDays: number;
  standardWorkingDays: number;
  autoDeductUnpaidLeave?: boolean;
}

export interface PayrollItemCalculationOutput {
  baseSalary: number;
  allowances: number;
  bonuses: number;
  configuredDeductions: number;
  unpaidLeaveDays: number;
  unpaidLeaveAdjustment: number;
  totalDeductions: number;
  grossPay: number;
  netPay: number;
}

/**
 * Exact decimal calculation for payroll entries:
 * Gross Pay = Base Pay + Allowances + Bonuses
 * Unpaid Leave Adjustment = round((Base Pay / Standard Working Days) * Unpaid Leave Days, 2)
 * Total Deductions = Configured Deductions + Unpaid Leave Adjustment
 * Net Pay = max(0, Gross Pay - Total Deductions)
 */
export function calculatePayrollEntryAmounts(
  input: PayrollItemCalculationInput
): PayrollItemCalculationOutput {
  const base = new Decimal(input.baseSalary || 0);
  const allowances = new Decimal(input.housingAllowance || 0)
    .plus(input.transportAllowance || 0)
    .plus(input.mealAllowance || 0);
  const bonuses = new Decimal(input.bonus || 0);
  const configuredDeductions = new Decimal(input.configuredDeductions || 0);

  const grossPay = base.plus(allowances).plus(bonuses).toDecimalPlaces(2);

  let unpaidLeaveAdjustment = new Decimal(0);
  const standardDays = Math.max(1, input.standardWorkingDays || 22);
  if (input.autoDeductUnpaidLeave !== false && input.unpaidLeaveDays > 0) {
    unpaidLeaveAdjustment = base
      .dividedBy(standardDays)
      .times(input.unpaidLeaveDays)
      .toDecimalPlaces(2);
  }

  const totalDeductions = configuredDeductions
    .plus(unpaidLeaveAdjustment)
    .toDecimalPlaces(2);

  const rawNet = grossPay.minus(totalDeductions).toDecimalPlaces(2);
  const netPay = Decimal.max(new Decimal(0), rawNet);

  return {
    baseSalary: base.toNumber(),
    allowances: allowances.toNumber(),
    bonuses: bonuses.toNumber(),
    configuredDeductions: configuredDeductions.toNumber(),
    unpaidLeaveDays: input.unpaidLeaveDays,
    unpaidLeaveAdjustment: unpaidLeaveAdjustment.toNumber(),
    totalDeductions: totalDeductions.toNumber(),
    grossPay: grossPay.toNumber(),
    netPay: netPay.toNumber(),
  };
}

/**
 * Selects the active CompensationRecord for an employee on or before periodEndDate (YYYY-MM-DD).
 * Falls back to the earliest record for that employee if all effective dates are later.
 */
export function getEffectiveCompensationForDate(
  employeeId: string,
  periodEndDate: string,
  compensations: CompensationRecord[]
): CompensationRecord | undefined {
  const empRecords = compensations
    .filter((c) => c.employeeId === employeeId && !c.archived)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (empRecords.length === 0) return undefined;

  const effective = empRecords.find((c) => c.effectiveDate <= periodEndDate);
  return effective ?? empRecords[empRecords.length - 1];
}

/**
 * Aggregates payroll entries into a PayrollRun summary using Decimal precision.
 */
export function summarizePayrollRun(
  runId: string,
  periodMonth: string,
  periodLabel: string,
  status: PayrollStatus,
  standardWorkingDays: number,
  entries: PayrollEntry[],
  createdAt: string,
  finalizedAt: string | null = null
): PayrollRun {
  let totalBase = new Decimal(0);
  let totalAllowances = new Decimal(0);
  let totalBonuses = new Decimal(0);
  let totalDeductions = new Decimal(0);
  let totalUnpaidAdj = new Decimal(0);
  let totalGross = new Decimal(0);
  let totalNet = new Decimal(0);

  for (const entry of entries) {
    totalBase = totalBase.plus(entry.baseSalary);
    totalAllowances = totalAllowances.plus(entry.allowances);
    totalBonuses = totalBonuses.plus(entry.bonuses);
    totalDeductions = totalDeductions.plus(entry.totalDeductions);
    totalUnpaidAdj = totalUnpaidAdj.plus(entry.unpaidLeaveAdjustment);
    totalGross = totalGross.plus(entry.grossPay);
    totalNet = totalNet.plus(entry.netPay);
  }

  return {
    id: runId,
    periodMonth,
    periodLabel,
    status,
    standardWorkingDays,
    employeeCount: entries.length,
    totalBaseSalary: totalBase.toDecimalPlaces(2).toNumber(),
    totalAllowances: totalAllowances.toDecimalPlaces(2).toNumber(),
    totalBonuses: totalBonuses.toDecimalPlaces(2).toNumber(),
    totalDeductions: totalDeductions.toDecimalPlaces(2).toNumber(),
    totalUnpaidLeaveAdjustment: totalUnpaidAdj.toDecimalPlaces(2).toNumber(),
    totalGrossPay: totalGross.toDecimalPlaces(2).toNumber(),
    totalNetPay: totalNet.toDecimalPlaces(2).toNumber(),
    createdAt,
    finalizedAt,
  };
}

/**
 * Builds immutable PayrollEntry snapshots for eligible employees.
 * Preserves existing finalized payroll snapshots without recalculating.
 */
export function buildPayrollEntriesForPeriod(params: {
  payrollRunId: string;
  periodMonth: string;
  standardWorkingDays: number;
  employees: Employee[];
  departments: Department[];
  compensations: CompensationRecord[];
  unpaidDaysByEmployee: Record<string, number>;
  bonusOverridesByEmployee?: Record<string, number>;
  status: PayrollStatus;
  autoDeductUnpaidLeave?: boolean;
}): PayrollEntry[] {
  const {
    payrollRunId,
    periodMonth,
    standardWorkingDays,
    employees,
    departments,
    compensations,
    unpaidDaysByEmployee,
    bonusOverridesByEmployee = {},
    status,
    autoDeductUnpaidLeave = true,
  } = params;

  const [yearStr, monthStr] = periodMonth.split('-');
  const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate();
  const periodEndDate = `${periodMonth}-${String(lastDay).padStart(2, '0')}`;

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  return employees
    .filter(
      (e) =>
        !e.archived &&
        e.employmentStatus !== 'Terminated' &&
        e.employmentStatus !== 'Inactive' &&
        e.joinDate <= periodEndDate
    )
    .map((emp) => {
      const comp = getEffectiveCompensationForDate(emp.id, periodEndDate, compensations);
      const baseSalary = comp?.baseSalary ?? 5500;
      const housingAllowance = comp?.housingAllowance ?? 400;
      const transportAllowance = comp?.transportAllowance ?? 200;
      const mealAllowance = comp?.mealAllowance ?? 150;
      const configuredDeductions = comp?.standardDeduction ?? 180;
      const bonus =
        bonusOverridesByEmployee[emp.id] !== undefined
          ? bonusOverridesByEmployee[emp.id]
          : 0;
      const unpaidLeaveDays = unpaidDaysByEmployee[emp.id] ?? 0;

      const calc = calculatePayrollEntryAmounts({
        baseSalary,
        housingAllowance,
        transportAllowance,
        mealAllowance,
        bonus,
        configuredDeductions,
        unpaidLeaveDays,
        standardWorkingDays,
        autoDeductUnpaidLeave,
      });

      return {
        id: `pe-${payrollRunId}-${emp.id}`,
        payrollRunId,
        periodMonth,
        employeeId: emp.id,
        employeeNameSnapshot: emp.fullName,
        employeeCodeSnapshot: emp.employeeCode,
        jobTitleSnapshot: emp.jobTitle,
        departmentNameSnapshot: deptMap.get(emp.departmentId) ?? 'General',
        baseSalary: calc.baseSalary,
        allowances: calc.allowances,
        bonuses: calc.bonuses,
        configuredDeductions: calc.configuredDeductions,
        unpaidLeaveDays: calc.unpaidLeaveDays,
        unpaidLeaveAdjustment: calc.unpaidLeaveAdjustment,
        totalDeductions: calc.totalDeductions,
        grossPay: calc.grossPay,
        netPay: calc.netPay,
        status,
      };
    });
}
