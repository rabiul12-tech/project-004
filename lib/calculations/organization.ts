import { Employee } from '@/lib/types/hr';

export interface ManagerValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates that assigning proposedManagerId as the manager of employeeId:
 * 1. Is not self-reporting (employeeId === proposedManagerId)
 * 2. References a valid existing non-archived employee
 * 3. Does not create a circular reporting chain (A -> B -> C -> A)
 */
export function validateManagerAssignment(
  employeeId: string,
  proposedManagerId: string | null,
  employees: Employee[]
): ManagerValidationResult {
  if (!proposedManagerId) {
    return { valid: true };
  }

  if (employeeId === proposedManagerId) {
    return {
      valid: false,
      reason: 'An employee cannot report directly to themselves.',
    };
  }

  const empMap = new Map(employees.map((e) => [e.id, e]));
  const manager = empMap.get(proposedManagerId);

  if (!manager || manager.archived) {
    return {
      valid: false,
      reason: 'Selected manager does not exist or is archived.',
    };
  }

  // Walk up the proposed manager's ancestor chain to ensure we never encounter employeeId
  const visited = new Set<string>([employeeId]);
  let cursorId: string | null = proposedManagerId;

  while (cursorId) {
    if (visited.has(cursorId)) {
      return {
        valid: false,
        reason: 'Circular reporting hierarchy detected. A subordinate cannot manage their own supervisor chain.',
      };
    }
    visited.add(cursorId);
    const currentEmp = empMap.get(cursorId);
    cursorId = currentEmp?.managerId ?? null;
  }

  return { valid: true };
}

export interface OrgTreeNode {
  employee: Employee;
  directReports: OrgTreeNode[];
  totalSubordinatesCount: number;
  depth: number;
}

/**
 * Builds a clean, cycle-safe organization hierarchy tree.
 * Employees with no manager (or whose manager is filtered out/missing) become valid roots.
 */
export function buildOrganizationTree(employees: Employee[]): OrgTreeNode[] {
  const activeEmployees = employees.filter((e) => !e.archived);
  const empMap = new Map(activeEmployees.map((e) => [e.id, e]));
  const childrenMap = new Map<string, Employee[]>();
  const roots: Employee[] = [];

  for (const emp of activeEmployees) {
    const managerId = emp.managerId;
    if (!managerId || !empMap.has(managerId) || managerId === emp.id) {
      roots.push(emp);
    } else {
      // Also guard against pre-existing corrupt cycles
      const check = validateManagerAssignment(emp.id, managerId, activeEmployees);
      if (!check.valid) {
        roots.push(emp);
      } else {
        const list = childrenMap.get(managerId) ?? [];
        list.push(emp);
        childrenMap.set(managerId, list);
      }
    }
  }

  const visitedNodes = new Set<string>();

  function buildNode(emp: Employee, depth: number): OrgTreeNode {
    visitedNodes.add(emp.id);
    const directChildren = (childrenMap.get(emp.id) ?? []).filter(
      (child) => !visitedNodes.has(child.id)
    );
    const directReports = directChildren.map((child) => buildNode(child, depth + 1));
    const totalSubordinatesCount = directReports.reduce(
      (sum, childNode) => sum + 1 + childNode.totalSubordinatesCount,
      0
    );

    return {
      employee: emp,
      directReports,
      totalSubordinatesCount,
      depth,
    };
  }

  return roots.map((root) => buildNode(root, 0));
}

/**
 * Returns the reporting chain of employee IDs from the CEO/root down to the specified employee.
 */
export function getReportingChainIds(
  employeeId: string,
  employees: Employee[]
): string[] {
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const chain: string[] = [];
  const visited = new Set<string>();

  let currentId: string | null = employeeId;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    chain.unshift(currentId);
    const emp = empMap.get(currentId);
    currentId = emp?.managerId ?? null;
  }

  return chain;
}
