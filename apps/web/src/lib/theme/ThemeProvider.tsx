'use client';

/**
 * Theme Provider
 *
 * Injects HooomzTheme as CSS custom properties and provides
 * the theme object to all children via React context.
 *
 * White-label ready: swap the theme object and every component updates.
 */

import { createContext, useContext, useEffect, useMemo } from 'react';
import type { HooomzTheme } from './theme';
import { defaultTheme, themeToCSSProperties } from './theme';

const ThemeContext = createContext<HooomzTheme>(defaultTheme);

interface ThemeProviderProps {
  theme?: Partial<HooomzTheme>;
  children: React.ReactNode;
}

export function ThemeProvider({ theme: themeOverrides, children }: ThemeProviderProps) {
  const theme = useMemo<HooomzTheme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides]
  );

  // Inject CSS custom properties into :root
  useEffect(() => {
    const cssProps = themeToCSSProperties(theme);
    const root = document.documentElement;

    for (const [key, value] of Object.entries(cssProps)) {
      root.style.setProperty(key, value);
    }

    // Set font family on body
    document.body.style.fontFamily = theme.fontFamily;

    return () => {
      for (const key of Object.keys(cssProps)) {
        root.style.removeProperty(key);
      }
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Access the current theme in any component.
 */
export function useTheme(): HooomzTheme {
  return useContext(ThemeContext);
}
