/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ================================================================
        // Hooomz Design System — Monochrome + Warm Grey Accent
        // 90% mono, 10% accent. Accent = interaction. Status = information.
        // globals.css is the source of truth. These fallbacks must match it.
        // ================================================================

        // Brand / Text
        primary: 'var(--theme-primary, #1A1714)',
        secondary: 'var(--theme-secondary, #5C5349)',
        muted: 'var(--theme-muted, #9A8E84)',
        'text-body': 'var(--theme-text-body, #5C5349)',

        // Accent — warm grey for INTERACTION only
        accent: {
          DEFAULT: 'var(--theme-accent, #6B6560)',
          dark: 'var(--theme-accent-dark, #5C5349)',
          light: 'var(--theme-accent-light, rgba(107,101,96,.09))',
        },

        // Status colors — semantic, for INFORMATION only
        'status-green': 'var(--theme-status-green, #16A34A)',
        'status-blue': 'var(--theme-status-blue, #4A7FA5)',
        'status-amber': 'var(--theme-status-amber, #D97706)',
        'status-red': 'var(--theme-status-red, #DC2626)',
        'status-gray': 'var(--theme-status-gray, #9A8E84)',

        // Surface
        background: 'var(--theme-background, #F0EDE8)',
        surface: 'var(--theme-surface, #FAF8F5)',
        border: 'var(--theme-border, #E0DCD7)',

        // ================================================================
        // LEGACY ALIASES — kept for 42 existing usages across 12 files.
        // Migrate to canonical names, then remove.
        // ================================================================
        cream: 'var(--theme-background, #F0EDE8)',
        coral: 'var(--theme-accent, #6B6560)',
        healthy: 'var(--theme-status-green, #16A34A)',
        progress: 'var(--theme-status-blue, #4A7FA5)',
        attention: 'var(--theme-status-amber, #D97706)',
        blocked: 'var(--theme-status-red, #DC2626)',
        complete: 'var(--theme-status-green, #16A34A)',
        verified: 'var(--theme-status-green, #16A34A)',
        limited: 'var(--theme-status-amber, #D97706)',
        estimate: 'var(--theme-status-red, #DC2626)',
      },

      fontFamily: {
        sans: ['Figtree', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['DM Mono', 'SF Mono', 'ui-monospace', 'monospace'],
      },

      borderRadius: {
        DEFAULT: 'var(--theme-radius, 10px)',
      },

      boxShadow: {
        'card': 'var(--theme-card-shadow, 0 2px 8px rgba(0, 0, 0, 0.06))',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'widget': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
