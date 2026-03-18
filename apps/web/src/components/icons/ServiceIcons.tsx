import React from 'react';

interface IconProps {
  color?: string;
  size?: number;
}

// ── INTERIORS ──

export function FlooringIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const bg = color === '#ffffff' ? '#111010' : '#F0EDE8';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="3" y="3" width="8" height="14" rx="1" fill={color} />
      <rect x="13" y="3" width="8" height="14" rx="1" fill={color} />
      <rect x="23" y="3" width="8" height="14" rx="1" fill={color} />
      <rect x="3" y="19" width="8" height="14" rx="1" fill={color} opacity=".55" />
      <rect x="13" y="19" width="8" height="14" rx="1" fill={color} />
      <rect x="23" y="19" width="8" height="14" rx="1" fill={color} opacity=".55" />
      <rect x="11" y="3" width="2" height="30" fill={bg} />
      <rect x="21" y="3" width="2" height="30" fill={bg} />
      <rect x="3" y="17" width="30" height="2" fill={bg} />
    </svg>
  );
}

export function PaintIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  const bg = color === '#ffffff' ? '#111010' : '#F0EDE8';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="15" y="4" width="3" height="14" rx="1.5" fill={color} />
      <rect x="7" y="14" width="19" height="8" rx="3" fill={color} />
      <rect x="10" y="16" width="2" height="4" rx="1" fill={surface} />
      <rect x="14" y="16" width="2" height="4" rx="1" fill={surface} />
      <rect x="18" y="16" width="2" height="4" rx="1" fill={surface} />
      <rect x="22" y="16" width="2" height="4" rx="1" fill={surface} />
      <path d="M4 26h28l-2 6H6l-2-6z" fill={color} />
      <rect x="8" y="28" width="20" height="2" rx="1" fill={bg} opacity=".4" />
    </svg>
  );
}

export function TrimIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const bg = color === '#ffffff' ? '#111010' : '#F0EDE8';
  const panel = color === '#ffffff' ? '#333' : '#E0DCD7';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M4 33V6a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v27H4z" fill={color} />
      <rect x="10" y="8" width="16" height="23" rx="1" fill={bg} />
      <rect x="13" y="11" width="10" height="9" rx="1" fill={panel} />
      <rect x="13" y="22" width="10" height="6" rx="1" fill={panel} />
      <circle cx="22" cy="26" r="1.5" fill={color} />
      <rect x="4" y="31" width="28" height="2" rx="1" fill={color} />
    </svg>
  );
}

export function FeatureWallIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="3" y="3" width="30" height="30" rx="2" fill={color} />
      <rect x="5" y="5" width="12" height="12" rx="1" fill={surface} opacity=".15" />
      <rect x="19" y="5" width="12" height="12" rx="1" fill={surface} opacity=".15" />
      <rect x="5" y="19" width="12" height="12" rx="1" fill={surface} opacity=".15" />
      <rect x="19" y="19" width="12" height="12" rx="1" fill={surface} opacity=".15" />
      <path d="M11 8l3 3-3 3-3-3z" fill={surface} />
      <path d="M25 8l3 3-3 3-3-3z" fill={surface} />
      <path d="M11 22l3 3-3 3-3-3z" fill={surface} />
      <path d="M25 22l3 3-3 3-3-3z" fill={surface} />
      <rect x="3" y="16" width="30" height="3" fill={color} />
      <rect x="16" y="3" width="3" height="30" fill={color} />
    </svg>
  );
}

export function PassportIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="5" y="3" width="22" height="28" rx="2" fill={color} />
      <rect x="9" y="9" width="14" height="2" rx="1" fill={surface} opacity=".6" />
      <rect x="9" y="13" width="10" height="2" rx="1" fill={surface} opacity=".4" />
      <rect x="9" y="17" width="12" height="2" rx="1" fill={surface} opacity=".4" />
      <circle cx="24" cy="26" r="8" fill="#16A34A" />
      <path d="M20 26l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── EXTERIORS ──

export function SidingIcon({ color = '#1A1714', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="3" y="5" width="30" height="5" rx="1" fill={color} />
      <rect x="3" y="12" width="30" height="5" rx="1" fill={color} />
      <rect x="3" y="19" width="30" height="5" rx="1" fill={color} />
      <rect x="3" y="26" width="30" height="5" rx="1" fill={color} />
      <rect x="3" y="9" width="30" height="3" fill={color} opacity=".2" />
      <rect x="3" y="16" width="30" height="3" fill={color} opacity=".2" />
      <rect x="3" y="23" width="30" height="3" fill={color} opacity=".2" />
    </svg>
  );
}

export function RoofingIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 4L33 18H3L18 4z" fill={color} />
      <rect x="8" y="10" width="6" height="3" rx=".5" fill={surface} opacity=".2" />
      <rect x="16" y="8" width="6" height="3" rx=".5" fill={surface} opacity=".2" />
      <rect x="22" y="11" width="5" height="3" rx=".5" fill={surface} opacity=".2" />
      <rect x="6" y="18" width="24" height="14" rx="1" fill={color} opacity=".6" />
      <rect x="14" y="24" width="8" height="8" rx="1" fill={surface} />
    </svg>
  );
}

export function DeckIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="3" y="20" width="30" height="4" rx="1" fill={color} />
      <rect x="3" y="26" width="30" height="4" rx="1" fill={color} />
      <rect x="12" y="20" width="1.5" height="4" fill={surface} opacity=".3" />
      <rect x="22" y="20" width="1.5" height="4" fill={surface} opacity=".3" />
      <rect x="12" y="26" width="1.5" height="4" fill={surface} opacity=".3" />
      <rect x="22" y="26" width="1.5" height="4" fill={surface} opacity=".3" />
      <rect x="3" y="8" width="30" height="3" rx="1.5" fill={color} />
      <rect x="6" y="11" width="2.5" height="9" rx="1" fill={color} />
      <rect x="13" y="11" width="2.5" height="9" rx="1" fill={color} />
      <rect x="20" y="11" width="2.5" height="9" rx="1" fill={color} />
      <rect x="27" y="11" width="2.5" height="9" rx="1" fill={color} />
      <rect x="3" y="18" width="30" height="2.5" rx="1" fill={color} />
    </svg>
  );
}

export function WindowIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="4" y="4" width="28" height="28" rx="2" fill={color} />
      <rect x="7" y="7" width="10" height="10" rx="1" fill={surface} />
      <rect x="19" y="7" width="10" height="10" rx="1" fill={surface} />
      <rect x="7" y="19" width="10" height="10" rx="1" fill={surface} />
      <rect x="19" y="19" width="10" height="10" rx="1" fill={surface} />
      <rect x="4" y="16" width="28" height="3" fill={color} />
      <rect x="16" y="4" width="3" height="28" fill={color} />
    </svg>
  );
}

export function ExteriorPaintIcon({ color = '#1A1714', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="16" y="3" width="4" height="16" rx="2" fill={color} />
      <rect x="14" y="17" width="8" height="4" rx="1" fill={color} opacity=".7" />
      <path d="M12 21h12l-2 8a2 2 0 0 1-4 0 2 2 0 0 1-4 0l-2-8z" fill={color} />
      <circle cx="29" cy="28" r="3" fill={color} opacity=".5" />
      <path d="M29 22v3" stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

// ── MAINTENANCE ──

export function InspectionIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="6" y="6" width="24" height="28" rx="2" fill={color} />
      <rect x="13" y="3" width="10" height="5" rx="2" fill={color} />
      <rect x="14" y="4" width="8" height="3" rx="1" fill={surface} opacity=".3" />
      <rect x="16" y="14" width="9" height="2" rx="1" fill={surface} opacity=".5" />
      <path d="M11 13.5l2 2 3-3" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="16" y="20" width="9" height="2" rx="1" fill={surface} opacity=".5" />
      <path d="M11 19.5l2 2 3-3" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="16" y="26" width="6" height="2" rx="1" fill={surface} opacity=".3" />
      <rect x="11" y="26" width="3" height="2" rx="1" fill={surface} opacity=".3" />
    </svg>
  );
}

export function SeasonalIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="4" y="8" width="28" height="24" rx="2" fill={color} />
      <rect x="4" y="8" width="28" height="8" rx="2" fill={color} />
      <rect x="4" y="13" width="28" height="3" fill={color} />
      <rect x="11" y="5" width="3" height="6" rx="1.5" fill={color} opacity=".7" />
      <rect x="22" y="5" width="3" height="6" rx="1.5" fill={color} opacity=".7" />
      <circle cx="13" cy="24" r="4" fill="#D97706" />
      <rect x="20" y="20" width="2" height="8" rx="1" fill={surface} opacity=".8" />
      <rect x="18" y="22" width="6" height="2" rx="1" fill={surface} opacity=".8" />
    </svg>
  );
}

export function RepairIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M28 6a6 6 0 0 0-8 8L8 26a3 3 0 1 0 4 4l12-12a6 6 0 0 0 8-8l-3 3-3-1-1-3 3-3z" fill={color} />
      <circle cx="9.5" cy="27.5" r="1.5" fill={surface} />
    </svg>
  );
}

export function HomeHealthIcon({ color = '#1A1714', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 4L32 16H28v15a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V16H4L18 4z" fill={color} />
      <path d="M9 23h3l2-4 3 7 2-5 2 3h4" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SubscriptionIcon({ color = '#1A1714', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 6a12 12 0 1 1-8.5 3.5" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M6 4l4 6-6 1z" fill={color} />
      <path d="M18 14l6 5h-2v6h-8v-6h-2l6-5z" fill={color} />
    </svg>
  );
}

// ── LABS ──

export function TestingIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M13 4h10v12l6 12a3 3 0 0 1-3 4H10a3 3 0 0 1-3-4l6-12V4z" fill={color} />
      <path d="M10 24l16-4-3 8a3 3 0 0 1-3 4h-6a3 3 0 0 1-3-4l-1-4z" fill={surface} opacity=".2" />
      <rect x="12" y="3" width="12" height="3" rx="1.5" fill={color} />
      <circle cx="19" cy="26" r="2" fill={surface} opacity=".4" />
      <circle cx="15" cy="29" r="1.2" fill={surface} opacity=".3" />
    </svg>
  );
}

export function SensorIcon({ color = '#1A1714', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="26" r="3.5" fill={color} />
      <path d="M11 20a10 10 0 0 1 14 0" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M7 15a16 16 0 0 1 22 0" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M4 10a22 22 0 0 1 28 0" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MaterialsIcon({ color = '#1A1714', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 4L33 11 18 18 3 11z" fill={color} />
      <path d="M3 18l15 7 15-7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 25l15 7 15-7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
    </svg>
  );
}

export function ContentIcon({ color = '#1A1714', size = 28 }: IconProps) {
  const surface = color === '#ffffff' ? '#111010' : '#FAF8F5';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="4" y="8" width="28" height="20" rx="2" fill={color} />
      <rect x="6" y="11" width="3" height="3" rx=".5" fill={surface} opacity=".4" />
      <rect x="6" y="16" width="3" height="3" rx=".5" fill={surface} opacity=".4" />
      <rect x="6" y="21" width="3" height="3" rx=".5" fill={surface} opacity=".4" />
      <rect x="27" y="11" width="3" height="3" rx=".5" fill={surface} opacity=".4" />
      <rect x="27" y="16" width="3" height="3" rx=".5" fill={surface} opacity=".4" />
      <rect x="27" y="21" width="3" height="3" rx=".5" fill={surface} opacity=".4" />
      <path d="M15 14l9 4-9 4v-8z" fill={surface} />
    </svg>
  );
}

export function ReportsIcon({ color = '#1A1714', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="4" y="22" width="6" height="10" rx="1" fill={color} />
      <rect x="13" y="16" width="6" height="16" rx="1" fill={color} />
      <rect x="22" y="9" width="6" height="23" rx="1" fill={color} />
      <rect x="4" y="32" width="28" height="2" rx="1" fill={color} opacity=".3" />
      <path d="M7 21l9-5 9-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── TRADE ICON MAP ──

export const TRADE_ICONS = {
  flooring: FlooringIcon,
  paint: PaintIcon,
  trim: TrimIcon,
  'feature-walls': FeatureWallIcon,
} as const;
