'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// FONTS
// ============================================================================
const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

// ============================================================================
// TYPES
// ============================================================================
type PerformanceColour = 'green' | 'amber' | 'red';
type TradeTag = 'FL' | 'PT' | 'TR';
type ScriptPhase = 'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'turnover';
type ScriptPhaseStatus = 'complete' | 'active' | 'upcoming' | 'locked';
type CheckItemType = 'auto' | 'killer' | 'normal';

interface ChecklistItem {
  id: number;
  type: CheckItemType;
  label: string;
  note: string;
  checked: boolean;
}

interface ScriptPhaseEntry {
  status: ScriptPhaseStatus;
  performanceColour?: PerformanceColour;
  startDate?: string;
  completedDate?: string;
}

interface Project {
  id: string;
  clientName: string;
  address: string;
  trades: TradeTag[];
  sqft: number;
  rooms: number;
  startDate: string;
  endDate: string;
  phases: Record<ScriptPhase, ScriptPhaseEntry>;
  margin?: number;
  quotedValue: number;
  actualValue?: number;
  pmAssigned?: string;
  foremanAssigned?: string;
  notes?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const SCRIPT_PHASE_KEYS: ScriptPhase[] = ['shield', 'clear', 'ready', 'install', 'punch', 'turnover'];
const SCRIPT_PHASE_LABELS = ['S', 'C', 'R', 'I', 'P', 'T'] as const;
const SCRIPT_PHASE_WORDS = ['Shield', 'Clear', 'Ready', 'Install', 'Punch', 'Turnover'] as const;

const TRADE_COLORS: Record<TradeTag, string> = { FL: '#4A7FA5', PT: '#7C3AED', TR: '#D97706' };

const PERF_COLOURS: Record<PerformanceColour, string> = {
  green: '#2D7A4F', amber: '#D4830A', red: '#C0392B',
};

const CURRENT_PHASE: ScriptPhase = 'install';

// ============================================================================
// MOCK DATA
// ============================================================================
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1', clientName: 'Arsenault', address: '42 Champlain Dr, Dieppe',
    trades: ['FL', 'PT'], sqft: 1450, rooms: 6, startDate: 'Mar 10', endDate: 'Apr 4',
    phases: {
      shield: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 10' },
      clear: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 12' },
      ready: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 15' },
      install: { status: 'active', startDate: 'Mar 16' },
      punch: { status: 'locked' }, turnover: { status: 'locked' },
    },
    margin: 59, quotedValue: 14200, actualValue: 5800, pmAssigned: 'Nathan M.', foremanAssigned: 'Dave K.',
    notes: 'Main floor hardwood + accent wall paint. Client flexible on schedule.',
  },
  {
    id: 'proj-2', clientName: 'Bourque', address: '118 Mountain Rd, Moncton',
    trades: ['TR', 'PT'], sqft: 980, rooms: 4, startDate: 'Mar 18', endDate: 'Apr 1',
    phases: {
      shield: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 18' },
      clear: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 19' },
      ready: { status: 'active', startDate: 'Mar 20' },
      install: { status: 'locked' }, punch: { status: 'locked' }, turnover: { status: 'locked' },
    },
    margin: 35, quotedValue: 8600, actualValue: 5590, pmAssigned: 'Nathan M.', foremanAssigned: 'Mike R.',
    notes: 'Trim replacement + full interior paint. Materials not yet confirmed.',
  },
  {
    id: 'proj-3', clientName: 'LeBlanc', address: '7 Elmwood Ct, Riverview',
    trades: ['FL'], sqft: 1120, rooms: 5, startDate: 'Mar 24', endDate: 'Apr 11',
    phases: {
      shield: { status: 'active', startDate: 'Mar 24' },
      clear: { status: 'locked' }, ready: { status: 'locked' },
      install: { status: 'locked' }, punch: { status: 'locked' }, turnover: { status: 'locked' },
    },
    margin: 35, quotedValue: 9800, pmAssigned: 'Nathan M.', foremanAssigned: 'Dave K.',
    notes: 'LVT throughout main floor. Dog on premises.',
  },
  {
    id: 'proj-4', clientName: 'Goguen', address: '205 St. George St, Moncton',
    trades: ['PT'], sqft: 760, rooms: 3, startDate: 'Mar 3', endDate: 'Mar 26',
    phases: {
      shield: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 3' },
      clear: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 4' },
      ready: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 5' },
      install: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 14' },
      punch: { status: 'complete', performanceColour: 'green', completedDate: 'Mar 20' },
      turnover: { status: 'active', startDate: 'Mar 21' },
    },
    margin: 3, quotedValue: 4200, actualValue: 4074, pmAssigned: 'Nathan M.',
    notes: 'Interior paint only. Margin thin — no overruns.',
  },
];

const INSTALL_CHECKLIST_TEMPLATE: ChecklistItem[] = [
  { id: 1, type: 'normal', label: 'Installation started — date and time logged', note: '', checked: false },
  { id: 2, type: 'normal', label: 'Pattern and direction confirmed — matches production brief', note: '', checked: false },
  { id: 3, type: 'normal', label: 'Expansion gaps maintained throughout', note: '', checked: false },
  { id: 4, type: 'normal', label: 'Transitions and thresholds planned at all doorways', note: '', checked: false },
  { id: 5, type: 'killer', label: 'Mid-install quality check — first room inspected before continuing', note: '⚑ Catch pattern or flatness issues before full install', checked: false },
  { id: 6, type: 'normal', label: 'All cuts accurate — no visible gaps at walls or obstacles', note: '', checked: false },
  { id: 7, type: 'normal', label: 'Installation complete — full visual inspection done', note: '', checked: false },
  { id: 8, type: 'normal', label: 'Time tracked — hours logged against labour budget', note: '', checked: false },
  { id: 9, type: 'normal', label: 'Lock I phase with performance colour → advance to Punch', note: '🟢 On time + zero deficiencies · 🟡 Minor issues noted · 🔴 Deficiencies or over budget', checked: false },
];

// ============================================================================
// SECTION CARD
// ============================================================================
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 6, padding: 16 }}>
      {children}
    </div>
  );
}

// ============================================================================
// CHECKLIST ROW
// ============================================================================
function ChecklistRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const isAuto = item.type === 'auto';
  const isKiller = item.type === 'killer';

  const checkboxBorder = item.checked
    ? '2px solid #16A34A'
    : isKiller
      ? '2px solid #C0392B'
      : isAuto
        ? '2px solid #2C5F8A'
        : '2px solid #D4CEC7';

  const checkboxBg = item.checked
    ? '#16A34A'
    : isAuto
      ? 'rgba(44,95,138,0.08)'
      : 'transparent';

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', gap: 10, padding: '7px 8px', borderRadius: 4,
        cursor: isAuto ? 'default' : 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!isAuto) e.currentTarget.style.background = '#F0EDE8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 15, height: 15, borderRadius: 3, border: checkboxBorder,
          background: checkboxBg, flexShrink: 0, marginTop: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {item.checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </div>

      {/* Label + note */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FIG, fontSize: 12, color: item.checked ? '#9C9690' : isKiller ? '#C0392B' : '#1A1714',
            textDecoration: item.checked ? 'line-through' : 'none', lineHeight: 1.4,
          }}
        >
          {isAuto && !item.checked && <span style={{ marginRight: 4 }}>⚡</span>}
          {isKiller && !item.checked && <span style={{ marginRight: 4 }}>⚑</span>}
          {item.label}
        </div>
        {item.note && (
          <div style={{ fontFamily: MONO, fontSize: 8.5, color: '#6B6560', marginTop: 2, lineHeight: 1.4 }}>
            {item.note}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// JOB CARD
// ============================================================================
function JobCard({ project, selected, onClick }: { project: Project; selected: boolean; onClick: () => void }) {
  const phase = project.phases[CURRENT_PHASE];
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
        background: selected ? '#F0EDE8' : 'transparent',
        border: selected ? '1px solid #D4CEC7' : '1px solid transparent',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = '#FAF8F5'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: FIG, fontSize: 13, fontWeight: 600, color: '#1A1714' }}>
          {project.clientName}
        </span>
        {project.trades.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: MONO, fontSize: 8, fontWeight: 600, color: TRADE_COLORS[t],
              background: `${TRADE_COLORS[t]}14`, padding: '1px 5px', borderRadius: 3,
              letterSpacing: '0.06em',
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 9, color: '#6B6560', letterSpacing: '0.04em' }}>
        {project.address}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 8.5, color: '#9C9690', letterSpacing: '0.04em' }}>
          {project.sqft} sqft · {project.rooms} rooms
        </span>
        <span style={{ fontFamily: MONO, fontSize: 8.5, color: '#9C9690' }}>
          {phase.startDate ?? phase.completedDate ?? ''}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// PHASE DOT (tab bar)
// ============================================================================
function PhaseDot({ phase, label, project, activePhase, onClick }: {
  phase: ScriptPhase; label: string;
  project: Project; activePhase: ScriptPhase; onClick: () => void;
}) {
  const entry = project.phases[phase];
  const isActive = phase === activePhase;

  let dotColor = '#D4CEC7'; // locked
  if (entry.status === 'complete' && entry.performanceColour) {
    dotColor = PERF_COLOURS[entry.performanceColour];
  } else if (entry.status === 'active') {
    dotColor = '#1A1714';
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
        background: isActive ? '#F0EDE8' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: '50%', background: dotColor,
        border: isActive ? '2px solid #1A1714' : '2px solid transparent',
        boxSizing: 'content-box',
      }} />
      <span style={{
        fontFamily: MONO, fontSize: 9, fontWeight: isActive ? 700 : 500,
        color: isActive ? '#1A1714' : '#9C9690',
        letterSpacing: '0.08em',
      }}>
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// INSTALL PAGE
// ============================================================================
export default function InstallPage() {
  const filteredProjects = MOCK_PROJECTS.filter((p) => p.phases[CURRENT_PHASE].status === 'active');
  const [selectedId, setSelectedId] = useState<string>(filteredProjects[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<ScriptPhase>(CURRENT_PHASE);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    INSTALL_CHECKLIST_TEMPLATE.map((c) => ({ ...c })),
  );

  const selectedProject = filteredProjects.find((p) => p.id === selectedId) ?? filteredProjects[0];

  const handleSelectProject = useCallback((id: string) => {
    setSelectedId(id);
    setActiveTab(CURRENT_PHASE);
    setChecklist(INSTALL_CHECKLIST_TEMPLATE.map((c) => ({ ...c })));
  }, []);

  const handleToggle = useCallback((itemId: number, type: CheckItemType) => {
    if (type === 'auto') return;
    if (type === 'killer') {
      const ok = window.confirm('⚑ STOP & CONFIRM — This is a killer item. Verify before marking complete. Proceed?');
      if (!ok) return;
    }
    setChecklist((prev) => prev.map((c) => c.id === itemId ? { ...c, checked: !c.checked } : c));
  }, []);

  const checkedCount = checklist.filter((c) => c.checked).length;
  const totalCount = checklist.length;
  const allComplete = checkedCount === totalCount;

  if (!selectedProject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: '#9C9690', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          No active Install jobs
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FDFCFA' }}>
      {/* ── LEFT PANEL ── */}
      <div style={{
        width: 296, minWidth: 296, borderRight: '1px solid #E0DCD7',
        padding: '20px 12px', overflowY: 'auto',
      }}>
        <div style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#6B6660', marginBottom: 14, paddingLeft: 12,
        }}>
          Install · {filteredProjects.length} Active
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredProjects.map((p) => (
            <JobCard
              key={p.id}
              project={p}
              selected={p.id === selectedId}
              onClick={() => handleSelectProject(p.id)}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        {/* Job Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: FIG, fontSize: 20, fontWeight: 700, color: '#1A1714' }}>
              {selectedProject.clientName}
            </span>
            {selectedProject.trades.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 600, color: TRADE_COLORS[t],
                  background: `${TRADE_COLORS[t]}14`, padding: '2px 7px', borderRadius: 3,
                  letterSpacing: '0.06em',
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#6B6560', letterSpacing: '0.04em', marginBottom: 4 }}>
            {selectedProject.address}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690' }}>
              {selectedProject.sqft} sqft · {selectedProject.rooms} rooms
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690' }}>
              {selectedProject.startDate} → {selectedProject.endDate}
            </span>
            {selectedProject.foremanAssigned && (
              <span style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690' }}>
                Foreman: {selectedProject.foremanAssigned}
              </span>
            )}
          </div>
        </div>

        {/* S·C·R·I·P·T Tab Bar */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20, padding: '8px 4px',
          borderBottom: '1px solid #E0DCD7',
        }}>
          {SCRIPT_PHASE_KEYS.map((phase, i) => (
            <PhaseDot
              key={phase}
              phase={phase}
              label={SCRIPT_PHASE_LABELS[i]}

              project={selectedProject}
              activePhase={activeTab}
              onClick={() => setActiveTab(phase)}
            />
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === CURRENT_PHASE ? (
          <SectionCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#1A1714', fontWeight: 600,
              }}>
                Install Checklist
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em',
                color: allComplete ? '#2D7A4F' : '#6B6560',
                background: allComplete ? 'rgba(45,122,79,0.08)' : 'rgba(107,101,96,0.08)',
                padding: '2px 8px', borderRadius: 3,
              }}>
                {allComplete ? 'Complete' : 'In Progress'} {checkedCount}/{totalCount}
              </span>
            </div>
            {checklist.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item.id, item.type)}
              />
            ))}
          </SectionCard>
        ) : (
          <SectionCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#1A1714', fontWeight: 600,
              }}>
                {SCRIPT_PHASE_WORDS[SCRIPT_PHASE_KEYS.indexOf(activeTab)]}
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em',
                color: selectedProject.phases[activeTab].status === 'complete' ? '#2D7A4F'
                  : selectedProject.phases[activeTab].status === 'active' ? '#1A1714'
                  : '#9C9690',
                background: selectedProject.phases[activeTab].status === 'complete' ? 'rgba(45,122,79,0.08)'
                  : selectedProject.phases[activeTab].status === 'active' ? 'rgba(26,23,20,0.06)'
                  : 'rgba(156,150,144,0.08)',
                padding: '2px 8px', borderRadius: 3, textTransform: 'uppercase',
              }}>
                {selectedProject.phases[activeTab].status}
              </span>
            </div>
            {selectedProject.phases[activeTab].completedDate && (
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', marginTop: 6 }}>
                Completed {selectedProject.phases[activeTab].completedDate}
              </div>
            )}
            {selectedProject.phases[activeTab].startDate && !selectedProject.phases[activeTab].completedDate && (
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', marginTop: 6 }}>
                Started {selectedProject.phases[activeTab].startDate}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
