'use client';

/**
 * Badge Component
 *
 * Status indicators with colors from shared-contracts.
 * Used for project status, task priority, inspection results, etc.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="warning">In Progress</Badge>
 * <Badge variant="error">Failed</Badge>
 * <Badge variant="info" size="lg">Scheduled</Badge>
 * ```
 */

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full';

  const variantStyles = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border border-gray-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
