'use client';

import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'hooomz-theme';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  // Initialize from localStorage on mount — light is default
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const dark = stored === 'dark';
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggle };
}

function applyTheme(dark: boolean) {
  const el = document.documentElement;
  if (dark) {
    el.setAttribute('data-theme', 'dark');
    el.classList.add('dark');
  } else {
    el.removeAttribute('data-theme');
    el.classList.remove('dark');
  }
}
