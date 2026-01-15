'use client';

/**
 * Card Component
 *
 * Container component for content sections.
 * Provides consistent spacing and visual hierarchy.
 *
 * @example
 * ```tsx
 * <Card>
 *   <h2>Project Details</h2>
 *   <p>Project information goes here</p>
 * </Card>
 *
 * <Card interactive onClick={() => navigate('/project')}>
 *   <h3>Kitchen Renovation</h3>
 *   <Badge status="in-progress">In Progress</Badge>
 * </Card>
 *
 * <Card padding="sm" shadow="lg">
 *   <Alert message="Important notice" />
 * </Card>
 * ```
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  interactive = false,
  padding = 'md',
  shadow = 'md',
  className = '',
  onClick,
}: CardProps) {
  const baseStyles = 'bg-white rounded-lg border border-gray-200';

  const interactiveStyles = interactive
    ? 'cursor-pointer transition-shadow hover:shadow-lg active:shadow-md'
    : '';

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${paddingStyles[padding]} ${shadowStyles[shadow]} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
