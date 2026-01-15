'use client';

/**
 * Table Component
 *
 * Responsive table with horizontal scroll on mobile.
 * Large touch targets for interactive elements.
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Project Name</TableHead>
 *       <TableHead>Status</TableHead>
 *       <TableHead>Budget</TableHead>
 *       <TableHead>Actions</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     {projects.map((project) => (
 *       <TableRow key={project.id}>
 *         <TableCell>{project.name}</TableCell>
 *         <TableCell><Badge variant="success">{project.status}</Badge></TableCell>
 *         <TableCell>${project.budget.toLocaleString()}</TableCell>
 *         <TableCell>
 *           <Button size="sm">View</Button>
 *         </TableCell>
 *       </TableRow>
 *     ))}
 *   </TableBody>
 * </Table>
 * ```
 */

import React from 'react';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
          <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

export interface TableHeaderProps {
  children: React.ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export interface TableBodyProps {
  children: React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
}

export interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className = '' }: TableRowProps) {
  const interactiveStyles = onClick
    ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors'
    : '';

  return (
    <tr className={`${interactiveStyles} ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
}

export interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-4 py-4 text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
}
