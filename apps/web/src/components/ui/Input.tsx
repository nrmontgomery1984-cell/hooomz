'use client';

/**
 * Input Component
 *
 * Large text input with clear labels and error states.
 * Optimized for field use with large touch targets.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Project Name"
 *   placeholder="Enter project name"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 * />
 *
 * <Input
 *   label="Email"
 *   type="email"
 *   error="Invalid email address"
 *   required
 * />
 * ```
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = 'block rounded-lg border px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]';

  const stateStyles = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <input
        id={inputId}
        className={`${baseStyles} ${stateStyles} ${widthStyles} ${className}`}
        {...props}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}

      {!error && helperText && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
