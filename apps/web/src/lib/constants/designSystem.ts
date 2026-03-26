export const colors = {
  // Base palette
  linen: '#F0EDE8',
  linenDark: '#E8E4DE',
  linenMid: '#D8D3CC',
  nearBlack: '#111010',
  charcoal: '#2A2826',
  midGrey: '#6B6660',
  lightGrey: '#9C9690',
  border: '#D0CBC3',
  surface: '#FAFAF8',

  // Signal colours
  red: '#C0392B',
  amber: '#D4830A',
  green: '#2D7A4F',

  // Signal backgrounds
  redBg: '#FDF2F1',
  amberBg: '#FDF7EE',
  greenBg: '#EEF5F1',

  // Signal borders
  redDim: '#E8B4AF',
  amberDim: '#E8C98A',
  greenDim: '#90C4A8',

  // Blue accent
  blue: '#2C5F8A',
  blueBg: '#EEF3F8',
  blueBorder: '#B8CCE0',

  // Brand
  brandAccent: '#D4830A',

  // Phase dot states
  phaseOff: '#9C9690',

  // Sidebar specific
  sidebarBg: '#111010',
  sidebarNavDefault: '#7A7570',
  sidebarNavHover: '#D0CBC3',
  sidebarNavActive: '#F0EDE8',
  sidebarActiveBorder: '#F0EDE8',
  sidebarActiveBg: '#161412',
  sidebarGroupLabel: '#3A3632',
  sidebarDivider: '#1E1C1A',
  sidebarUserText: '#4A4440',
} as const

export const typography = {
  primary: "'Figtree', sans-serif",
  mono: "'DM Mono', monospace",
} as const

export const fontSizes = {
  // DM Mono sizes
  monoXs: '7.5px',
  monoSm: '8px',
  monoBase: '9px',
  monoMd: '9.5px',
  monoLg: '10px',
  monoNav: '9px',
  monoNavSub: '9px',
  monoGroupLabel: '7.5px',

  // Figtree sizes
  bodyXs: '11px',
  bodySm: '12px',
  bodyBase: '13px',
  bodyMd: '14px',
  heading: '19px',
  headingLg: '20px',
} as const

export const spacing = {
  cardPadding: '14px 16px',
  cardHeadPadding: '11px 16px 9px',
  panelWidth: '296px',
  sidebarWidth: '158px',
  phaseTabPadding: '9px 16px 11px',
} as const

export const borders = {
  card: `1px solid ${colors.border}`,
  cardLeftDefault: `3px solid ${colors.linenMid}`,
  cardLeftActive: `3px solid ${colors.nearBlack}`,
  cardLeftGreen: `3px solid ${colors.green}`,
  cardLeftAmber: `3px solid ${colors.amber}`,
  cardLeftRed: `3px solid ${colors.red}`,
} as const
