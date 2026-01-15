'use client';

/**
 * Select Component
 *
 * Dropdown with large touch targets for field use.
 * Minimum 48px height for easy selection with gloves.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Project Status"
 *   value={status}
 *   onChange={(e) => setStatus(e.target.value)}
 * >
 *   <option value="planning">Planning</option>
 *   <option value="in-progress">In Progress</option>
 *   <option value="completed">Completed</option>
 * </Select>
 *
 * <Select label="Priority" error="Please select a priority" required>
 *   <option value="">Select priority</option>
 *   <option value="high">High</option>
 *   <option value="medium">Medium</option>
 *   <option value="low">Low</option>
 * </Select>
 * ```
 */

import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Select({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = 'block rounded-lg border px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] appearance-none bg-white pr-10';

  const stateStyles = error
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={`${baseStyles} ${stateStyles} ${widthStyles} ${className}`}
          {...props}
        >
          {children}
        </select>

        {/* Dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}

      {!error && helperText && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
