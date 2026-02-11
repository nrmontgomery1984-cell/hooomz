/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ================================================================
        // Hooomz Design System — Monochrome + Teal Accent
        // 90% mono, 10% accent. Teal = interaction. Status = information.
        // ================================================================

        // Brand / Text — references var(--theme-*) via CSS
        primary: 'var(--theme-primary, #111827)',
        secondary: 'var(--theme-secondary, #6B7280)',
        muted: 'var(--theme-muted, #9CA3AF)',
        'text-body': 'var(--theme-text-body, #374151)',

        // Accent — deep teal for INTERACTION only
        accent: {
          DEFAULT: 'var(--theme-accent, #2A7A7A)',
          dark: 'var(--theme-accent-dark, #1E5E5E)',
          light: 'var(--theme-accent-light, #E8F4F4)',
        },

        // Status colors — semantic, for INFORMATION only
        'status-green': 'var(--theme-status-green, #22C55E)',
        'status-blue': 'var(--theme-status-blue, #3B82F6)',
        'status-amber': 'var(--theme-status-amber, #F59E0B)',
        'status-red': 'var(--theme-status-red, #EF4444)',
        'status-gray': 'var(--theme-status-gray, #9CA3AF)',

        // Surface
        background: 'var(--theme-background, #F3F4F6)',
        surface: 'var(--theme-surface, #FFFFFF)',
        border: 'var(--theme-border, #E5E7EB)',

        // Neutrals
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // ================================================================
        // LEGACY ALIASES — map old class names to new system
        // bg-cream -> white, text-coral -> teal accent, etc.
        // These keep existing components working during migration.
        // ================================================================
        cream: 'var(--theme-background, #F3F4F6)',
        coral: 'var(--theme-accent, #2A7A7A)',
        teal: 'var(--theme-accent, #2A7A7A)',
        healthy: 'var(--theme-status-green, #22C55E)',
        progress: 'var(--theme-status-blue, #3B82F6)',
        attention: 'var(--theme-status-amber, #F59E0B)',
        blocked: 'var(--theme-status-red, #EF4444)',
        complete: 'var(--theme-status-green, #22C55E)',
        verified: 'var(--theme-status-green, #22C55E)',
        limited: 'var(--theme-status-amber, #F59E0B)',
        estimate: 'var(--theme-status-red, #EF4444)',
      },

      fontFamily: {
        sans: ['var(--theme-font, Inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--theme-font-mono, "JetBrains Mono")', '"Fira Code"', 'monospace'],
      },

      borderRadius: {
        DEFAULT: 'var(--theme-radius, 12px)',
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
