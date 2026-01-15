'use client';

/**
 * Tabs Component
 *
 * Navigation within sections with large touch targets.
 * Supports keyboard navigation.
 *
 * @example
 * ```tsx
 * <Tabs value={activeTab} onChange={setActiveTab}>
 *   <TabsList>
 *     <TabsTrigger value="details">Details</TabsTrigger>
 *     <TabsTrigger value="tasks">Tasks</TabsTrigger>
 *     <TabsTrigger value="photos">Photos</TabsTrigger>
 *   </TabsList>
 *
 *   <TabsContent value="details">
 *     <ProjectDetails project={project} />
 *   </TabsContent>
 *
 *   <TabsContent value="tasks">
 *     <TaskList projectId={project.id} />
 *   </TabsContent>
 *
 *   <TabsContent value="photos">
 *     <PhotoGallery projectId={project.id} />
 *   </TabsContent>
 * </Tabs>
 * ```
 */

import React, { createContext, useContext } from 'react';

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
}

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className = '' }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      className={`flex border-b border-gray-200 overflow-x-auto ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function TabsTrigger({
  value,
  children,
  disabled = false,
  className = '',
}: TabsTriggerProps) {
  const { value: activeValue, onChange } = useTabsContext();
  const isActive = activeValue === value;

  const baseStyles = 'px-6 py-3 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[48px] whitespace-nowrap';

  const stateStyles = isActive
    ? 'text-primary-600 border-b-2 border-primary-600'
    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent';

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      className={`${baseStyles} ${stateStyles} ${disabledStyles} ${className}`}
      onClick={() => !disabled && onChange(value)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onChange(value);
        }
      }}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({
  value,
  children,
  className = '',
}: TabsContentProps) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={`py-4 focus:outline-none ${className}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
