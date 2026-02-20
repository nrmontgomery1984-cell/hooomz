'use client';

import { useState, useEffect, useCallback } from 'react';

const DARK_MODE_KEY = 'hooomz-dark-mode';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    const dark = stored === 'true';
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(DARK_MODE_KEY, String(next));
      return next;
    });
  }, []);

  return { isDark, toggle };
}
