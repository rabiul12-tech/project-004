'use client';

import React from 'react';

interface EmployeeAvatarProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function EmployeeAvatar({
  name,
  color = '#0D9488',
  size = 'md',
  className = '',
}: EmployeeAvatarProps) {
  const parts = (name || 'Employee').trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) || 'PX').toUpperCase();

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg',
  }[size];

  return (
    <div
      style={{ backgroundColor: color }}
      aria-label={`Avatar for ${name}`}
      className={`inline-flex items-center justify-center rounded-lg font-semibold text-white shrink-0 select-none shadow-xs ${sizeClasses} ${className}`}
    >
      {initials}
    </div>
  );
}
