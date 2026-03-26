// ============================================================================
// SHARED DESIGN + SCRIPT TYPES
// ============================================================================

export type PerformanceColour = 'green' | 'amber' | 'red';
export type TradeTag = 'FL' | 'PT' | 'TR';

// ============================================================================
// SCRIPT TYPES
// ============================================================================

export type ScriptPhase =
  'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'turnover';

export type ScriptPhaseStatus = 'complete' | 'active' | 'upcoming' | 'locked';

export interface ScriptPhaseEntry {
  status: ScriptPhaseStatus;
  performanceColour?: PerformanceColour;
  startDate?: string;
  completedDate?: string;
}

export interface Project {
  id: string;
  clientName: string;
  address: string;
  trades: TradeTag[];
  sqft: number;
  rooms: number;
  startDate: string;
  endDate: string;
  phases: {
    shield: ScriptPhaseEntry;
    clear: ScriptPhaseEntry;
    ready: ScriptPhaseEntry;
    install: ScriptPhaseEntry;
    punch: ScriptPhaseEntry;
    turnover: ScriptPhaseEntry;
  };
  margin?: number;
  quotedValue: number;
  actualValue?: number;
  pmAssigned?: string;
  foremanAssigned?: string;
  notes?: string;
}

// ============================================================================
// SCRIPT CONSTANTS
// ============================================================================

export const SCRIPT_PHASE_KEYS: ScriptPhase[] = [
  'shield', 'clear', 'ready', 'install', 'punch', 'turnover',
];

export const SCRIPT_PHASE_LABELS = ['S', 'C', 'R', 'I', 'P', 'T'] as const;

export const SCRIPT_PHASE_WORDS = [
  'Shield', 'Clear', 'Ready', 'Install', 'Punch', 'Turnover',
] as const;

// ============================================================================
// MOCK PROJECTS
// ============================================================================

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    clientName: 'Arsenault',
    address: '42 Champlain Dr, Dieppe',
    trades: ['FL', 'PT'],
    sqft: 1450,
    rooms: 6,
    startDate: 'Mar 10',
    endDate: 'Apr 4',
    phases: {
      shield: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 10' },
      clear: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 12' },
      ready: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 15' },
      install: { status: 'active', startDate: 'Mar 16' },
      punch: { status: 'locked' },
      turnover: { status: 'locked' },
    },
    margin: 59,
    quotedValue: 14200,
    actualValue: 5800,
    pmAssigned: 'Nathan M.',
    foremanAssigned: 'Dave K.',
    notes: 'Main floor hardwood + accent wall paint. Client flexible on schedule.',
  },
  {
    id: 'proj-2',
    clientName: 'Bourque',
    address: '118 Mountain Rd, Moncton',
    trades: ['TR', 'PT'],
    sqft: 980,
    rooms: 4,
    startDate: 'Mar 18',
    endDate: 'Apr 1',
    phases: {
      shield: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 18' },
      clear: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 19' },
      ready: { status: 'active', startDate: 'Mar 20' },
      install: { status: 'locked' },
      punch: { status: 'locked' },
      turnover: { status: 'locked' },
    },
    margin: 35,
    quotedValue: 8600,
    actualValue: 5590,
    pmAssigned: 'Nathan M.',
    foremanAssigned: 'Mike R.',
    notes: 'Trim replacement + full interior paint. Materials not yet confirmed.',
  },
  {
    id: 'proj-3',
    clientName: 'LeBlanc',
    address: '7 Elmwood Ct, Riverview',
    trades: ['FL'],
    sqft: 1120,
    rooms: 5,
    startDate: 'Mar 24',
    endDate: 'Apr 11',
    phases: {
      shield: { status: 'active', startDate: 'Mar 24' },
      clear: { status: 'locked' },
      ready: { status: 'locked' },
      install: { status: 'locked' },
      punch: { status: 'locked' },
      turnover: { status: 'locked' },
    },
    margin: 35,
    quotedValue: 9800,
    pmAssigned: 'Nathan M.',
    foremanAssigned: 'Dave K.',
    notes: 'LVT throughout main floor. Dog on premises.',
  },
  {
    id: 'proj-4',
    clientName: 'Goguen',
    address: '205 St. George St, Moncton',
    trades: ['PT'],
    sqft: 760,
    rooms: 3,
    startDate: 'Mar 3',
    endDate: 'Mar 26',
    phases: {
      shield: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 3' },
      clear: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 4' },
      ready: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 5' },
      install: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 14' },
      punch: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 20' },
      turnover: { status: 'active', startDate: 'Mar 21' },
    },
    margin: 3,
    quotedValue: 4200,
    actualValue: 4074,
    pmAssigned: 'Nathan M.',
    notes: 'Interior paint only. Margin thin — no overruns.',
  },
];
