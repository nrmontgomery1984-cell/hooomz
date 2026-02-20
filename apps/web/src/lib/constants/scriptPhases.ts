/**
 * SCRIPT Framework — Phase metadata for SOP organization
 *
 * Shield → Clear → Ready → Install → Punch → Turnover
 */

import type { ScriptPhase } from '@hooomz/shared-contracts';

export interface ScriptPhaseInfo {
  label: string;
  color: string;
  icon: string;
  order: number;
  description: string;
}

export const SCRIPT_PHASES: Record<ScriptPhase, ScriptPhaseInfo> = {
  shield:   { label: 'Shield',   color: '#10B981', icon: 'Shield',         order: 1, description: 'Safety & protection' },
  clear:    { label: 'Clear',    color: '#EF4444', icon: 'Trash2',         order: 2, description: 'Demo & removal' },
  ready:    { label: 'Ready',    color: '#F97316', icon: 'Wrench',         order: 3, description: 'Prep & prime' },
  install:  { label: 'Install',  color: '#3B82F6', icon: 'Hammer',         order: 4, description: 'Core work' },
  punch:    { label: 'Punch',    color: '#8B5CF6', icon: 'ClipboardCheck', order: 5, description: 'Quality check' },
  turnover: { label: 'Turnover', color: '#0F766E', icon: 'UserCheck',      order: 6, description: 'Handoff & cleanup' },
};

/** Ordered list of SCRIPT phases */
export const SCRIPT_PHASE_ORDER: ScriptPhase[] = ['shield', 'clear', 'ready', 'install', 'punch', 'turnover'];

/** Token status colors matching the Labs document */
export const TOKEN_STATUS_COLORS = {
  validated: '#2E7D32',  // Green — test complete
  planned: '#F5A623',    // Amber — test upcoming
  standard: '#888888',   // Gray — industry standard
} as const;
