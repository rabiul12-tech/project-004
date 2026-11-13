'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  CalendarOff,
  Sparkles,
  MinusCircle,
} from 'lucide-react';

interface StatusTextProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  label: string;
  className?: string;
}

/**
 * Accessible status indicator that pairs an explicit text label with a semantic icon
 * so status is never communicated by color alone (WCAG 2.2 AA).
 */
export function StatusText({ variant, label, className = '' }: StatusTextProps) {
  const styles = {
    success: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-rose-700 dark:text-rose-300',
    info: 'text-teal-700 dark:text-teal-300',
    neutral: 'text-slate-600 dark:text-slate-400',
  }[variant];

  const Icon = {
    success: CheckCircle2,
    warning: Clock,
    danger: XCircle,
    info: Sparkles,
    neutral: MinusCircle,
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${styles} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function getEmploymentStatusVariant(status: string): StatusTextProps['variant'] {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Probation':
      return 'info';
    case 'On Leave':
      return 'warning';
    case 'Terminated':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function getAttendanceStatusVariant(status: string): StatusTextProps['variant'] {
  switch (status) {
    case 'Present':
      return 'success';
    case 'Late':
    case 'Half Day':
      return 'warning';
    case 'Absent':
      return 'danger';
    case 'On Leave':
    case 'Holiday':
      return 'info';
    default:
      return 'neutral';
  }
}

export function getLeaveStatusVariant(status: string): StatusTextProps['variant'] {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}
