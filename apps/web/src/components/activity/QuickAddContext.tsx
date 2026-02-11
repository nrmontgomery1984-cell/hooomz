'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface QuickAddContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <QuickAddContext.Provider value={{ isOpen, open, close }}>
      {children}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd(): QuickAddContextValue {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
}
