'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';

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
// IDB → PROJECT MAPPER
// ============================================================================
const SCRIPT_PHASE_ORDER: ScriptPhase[] = ['shield', 'clear', 'ready', 'install', 'punch', 'turnover'];

function mapIDBProject(p: Record<string, unknown>): Project {
  const addr = p.address as { street?: string; city?: string } | undefined;
  const dates = p.dates as { startDate?: string; estimatedEndDate?: string } | undefined;
  const budget = p.budget as { estimatedCost?: number; actualCost?: number } | undefined;
  const jobStage = (p.jobStage as string) || '';

  const currentIdx = SCRIPT_PHASE_ORDER.indexOf(jobStage as ScriptPhase);
  const isComplete = jobStage === 'complete';
  const phases = {} as Record<ScriptPhase, ScriptPhaseEntry>;

  SCRIPT_PHASE_ORDER.forEach((phase, i) => {
    if (isComplete || i < currentIdx) {
      phases[phase] = { status: 'complete', performanceColour: 'green' };
    } else if (i === currentIdx) {
      phases[phase] = { status: 'active' };
    } else {
      phases[phase] = { status: 'locked' };
    }
  });

  if (currentIdx === -1 && !isComplete) {
    SCRIPT_PHASE_ORDER.forEach(phase => { phases[phase] = { status: 'locked' }; });
  }

  const estimated = budget?.estimatedCost || 0;
  const actual = budget?.actualCost || 0;

  return {
    id: p.id as string,
    clientName: (p.name as string) || 'Unnamed',
    address: addr ? `${addr.street || ''}, ${addr.city || ''}`.replace(/^, |, $/g, '') : '',
    trades: ['FL'],
    sqft: 0,
    rooms: 0,
    startDate: dates?.startDate ? new Date(dates.startDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '',
    endDate: dates?.estimatedEndDate ? new Date(dates.estimatedEndDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '',
    phases,
    margin: estimated > 0 ? Math.round(((estimated - actual) / estimated) * 100) : undefined,
    quotedValue: estimated,
    actualValue: actual > 0 ? actual : undefined,
    notes: '',
  };
}

// ============================================================================
// CHECKLIST TEMPLATE
// ============================================================================
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
  const { data: projectData, isLoading: projectsLoading } = useLocalProjects();
  const allProjects = useMemo(() => {
    if (!projectData?.projects) return [];
    return projectData.projects.map(p => mapIDBProject(p as Record<string, unknown>));
  }, [projectData]);

  // Filter to jobs relevant to this phase (active or complete in CURRENT_PHASE)
  const relevantJobs = useMemo(() =>
    allProjects.filter(p => p.phases[CURRENT_PHASE].status === 'active' || p.phases[CURRENT_PHASE].status === 'complete'),
    [allProjects]
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ScriptPhase>(CURRENT_PHASE);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    INSTALL_CHECKLIST_TEMPLATE.map((c) => ({ ...c })),
  );

  const effectiveSelectedId = selectedId || relevantJobs[0]?.id || '';
  const selectedProject = relevantJobs.find((p) => p.id === effectiveSelectedId) ?? relevantJobs[0];

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

  if (projectsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: 24, height: 24, border: '2px solid #E0DCD7', borderTopColor: '#1A1714',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
          Install · {relevantJobs.length} Active
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {relevantJobs.map((p) => (
            <JobCard
              key={p.id}
              project={p}
              selected={p.id === effectiveSelectedId}
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
