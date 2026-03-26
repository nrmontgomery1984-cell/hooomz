import { useState, useCallback } from 'react';
import {
  MOCK_PROJECTS,
  SCRIPT_PHASE_KEYS,
  SCRIPT_PHASE_LABELS,
  SCRIPT_PHASE_WORDS,
  type Project,
  type ScriptPhase,
  type ScriptPhaseEntry,
  type PerformanceColour,
} from '../../types/design';
import { colors, typography } from '../../constants/designSystem';

const MONO = typography.mono;
const FIG = typography.primary;

// ============================================================================
// TYPES
// ============================================================================

interface ScriptPhasePageLayoutProps {
  phase: ScriptPhase;
  phaseLabel: string;
  phaseLetter: string;
  phaseDescription: string;
}

type CheckItemType = 'auto' | 'killer' | 'normal';

interface ChecklistItem {
  id: number;
  type: CheckItemType;
  label: string;
  note: string;
  checked: boolean;
}

// ============================================================================
// PHASE DOT HELPERS
// ============================================================================

const PERF_COLOURS: Record<PerformanceColour, string> = {
  green: colors.green, amber: colors.amber, red: colors.red,
};

function phaseDotStyle(entry: ScriptPhaseEntry): { background: string; borderColor: string; color: string } {
  if (entry.status === 'active') return { background: colors.nearBlack, borderColor: colors.nearBlack, color: '#FFFFFF' };
  if (entry.status === 'complete' && entry.performanceColour === 'green') return { background: colors.greenBg, borderColor: colors.greenDim, color: colors.green };
  if (entry.status === 'complete' && entry.performanceColour === 'amber') return { background: colors.amberBg, borderColor: colors.amberDim, color: colors.amber };
  if (entry.status === 'complete' && entry.performanceColour === 'red') return { background: colors.redBg, borderColor: colors.redDim, color: colors.red };
  return { background: colors.linenDark, borderColor: colors.border, color: colors.lightGrey };
}

function phaseTabColour(entry: ScriptPhaseEntry): string {
  if (entry.status === 'active') return colors.nearBlack;
  if (entry.status === 'complete' && entry.performanceColour) return PERF_COLOURS[entry.performanceColour];
  return colors.lightGrey;
}

const TRADE_COLORS: Record<string, string> = {
  FL: '#4A7FA5', PT: '#7C3AED', TR: '#D97706',
};

// ============================================================================
// CHECKLISTS — one per SCRIPT phase
// ============================================================================

const CHECKLISTS: Record<ScriptPhase, ChecklistItem[]> = {
  shield: [
    { id: 1, type: 'killer', label: 'Site walkthrough completed with client before work begins', note: '⚑ Confirm scope, access, protection requirements', checked: false },
    { id: 2, type: 'normal', label: 'All furniture and belongings moved or covered', note: '', checked: false },
    { id: 3, type: 'normal', label: 'Floor protection laid — all traffic areas covered', note: '', checked: false },
    { id: 4, type: 'normal', label: 'Wall and door frame masking complete', note: '', checked: false },
    { id: 5, type: 'normal', label: 'Dust containment set up for demo areas', note: '', checked: false },
    { id: 6, type: 'killer', label: 'Client has confirmed they have vacated or are aware of work schedule', note: '', checked: false },
    { id: 7, type: 'normal', label: 'Site photos taken — pre-work condition documented', note: '', checked: false },
    { id: 8, type: 'normal', label: 'Lock Shield phase → advance to Clear', note: '', checked: false },
  ],
  clear: [
    { id: 1, type: 'normal', label: 'Existing flooring removed — all rooms in scope', note: '', checked: false },
    { id: 2, type: 'normal', label: 'Existing trim and moulding removed if in scope', note: '', checked: false },
    { id: 3, type: 'normal', label: 'Debris removed from site — no material left overnight', note: '', checked: false },
    { id: 4, type: 'killer', label: 'Subfloor inspected — moisture reading taken and logged', note: '⚑ Do not proceed to Ready if moisture exceeds threshold', checked: false },
    { id: 5, type: 'normal', label: 'Any rot, damage, or anomalies photographed and reported', note: '', checked: false },
    { id: 6, type: 'normal', label: 'Subfloor swept and vacuumed', note: '', checked: false },
    { id: 7, type: 'normal', label: 'Lock Clear phase → advance to Ready', note: '', checked: false },
  ],
  ready: [
    { id: 1, type: 'killer', label: 'Subfloor flat to 3/16" over 10ft — measured and confirmed', note: '⚑ Do not install over an out-of-flat subfloor', checked: false },
    { id: 2, type: 'normal', label: 'Subfloor repairs completed — squeaks, voids, high spots addressed', note: '', checked: false },
    { id: 3, type: 'normal', label: 'Primer or skim coat applied where required', note: '', checked: false },
    { id: 4, type: 'normal', label: 'Materials acclimated on site — confirm duration meets spec', note: '', checked: false },
    { id: 5, type: 'normal', label: 'Layout lines snapped — first row confirmed square', note: '', checked: false },
    { id: 6, type: 'normal', label: 'All materials and tools staged — ready for install', note: '', checked: false },
    { id: 7, type: 'killer', label: 'Installer has read the production brief and confirmed scope', note: '', checked: false },
    { id: 8, type: 'normal', label: 'Lock Ready phase → advance to Install', note: '', checked: false },
  ],
  install: [
    { id: 1, type: 'normal', label: 'Installation started — date and time logged', note: '', checked: false },
    { id: 2, type: 'normal', label: 'Pattern / direction confirmed matches plan', note: '', checked: false },
    { id: 3, type: 'normal', label: 'Expansion gaps maintained throughout', note: '', checked: false },
    { id: 4, type: 'normal', label: 'Transitions and thresholds planned at doorways', note: '', checked: false },
    { id: 5, type: 'killer', label: 'Mid-install quality check — first room inspected before continuing', note: '⚑ Catch pattern or flatness issues before full install', checked: false },
    { id: 6, type: 'normal', label: 'All cuts accurate — no visible gaps at walls or obstacles', note: '', checked: false },
    { id: 7, type: 'normal', label: 'Installation complete — full visual inspection done', note: '', checked: false },
    { id: 8, type: 'normal', label: 'Time tracked — hours logged against labour budget', note: '', checked: false },
    { id: 9, type: 'normal', label: 'Lock Install phase → advance to Punch', note: '', checked: false },
  ],
  punch: [
    { id: 1, type: 'normal', label: 'Full deficiency walkthrough completed', note: '', checked: false },
    { id: 2, type: 'normal', label: 'All transitions and thresholds installed and seated', note: '', checked: false },
    { id: 3, type: 'normal', label: 'Touch-ups and repairs completed', note: '', checked: false },
    { id: 4, type: 'normal', label: 'Trim and moulding tight — no gaps at walls or corners', note: '', checked: false },
    { id: 5, type: 'killer', label: 'Client or PM walkthrough completed — sign-off obtained', note: '⚑ No Turnover without sign-off', checked: false },
    { id: 6, type: 'normal', label: 'Punch list items resolved — zero open deficiencies', note: '', checked: false },
    { id: 7, type: 'normal', label: 'Lock Punch phase → advance to Turnover', note: '', checked: false },
  ],
  turnover: [
    { id: 1, type: 'normal', label: 'Full site cleanup — all debris, tools, protection removed', note: '', checked: false },
    { id: 2, type: 'normal', label: 'Final photos taken — completed work documented', note: '', checked: false },
    { id: 3, type: 'killer', label: 'Client final walkthrough completed', note: '⚑ Walk every room, confirm satisfaction before leaving', checked: false },
    { id: 4, type: 'normal', label: 'Care guide delivered — maintenance schedule, product specs, warranty info', note: '', checked: false },
    { id: 5, type: 'normal', label: 'Final invoice issued', note: '', checked: false },
    { id: 6, type: 'killer', label: 'Client signature on completion — job formally closed', note: '', checked: false },
    { id: 7, type: 'normal', label: 'Job record archived — SCRIPT complete', note: '', checked: false },
  ],
};

// ============================================================================
// SHIMMER CSS
// ============================================================================

const SHIMMER_ID = 'hooomz-shimmer-keyframes';
function ensureShimmerCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SHIMMER_ID)) return;
  const style = document.createElement('style');
  style.id = SHIMMER_ID;
  style.textContent = `@keyframes hooomzShimmer{0%,100%{opacity:1}50%{opacity:0.5}}`;
  document.head.appendChild(style);
}

// ============================================================================
// SCRIPT PHASE PAGE LAYOUT
// ============================================================================

export default function ScriptPhasePageLayout({
  phase,
  phaseLabel,
  phaseLetter,
  phaseDescription,
}: ScriptPhasePageLayoutProps) {
  const activeProjects = MOCK_PROJECTS.filter((p) => p.phases[phase].status === 'active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = activeProjects.find((p) => p.id === selectedId) ?? null;

  // Checklist state keyed by project id
  const [checkStates, setCheckStates] = useState<Record<string, ChecklistItem[]>>(() => {
    const init: Record<string, ChecklistItem[]> = {};
    for (const p of MOCK_PROJECTS) {
      init[p.id] = CHECKLISTS[phase].map((c) => ({ ...c }));
    }
    return init;
  });

  const handleCheckToggle = useCallback((projectId: string, itemId: number) => {
    setCheckStates((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] ?? []).map((c) =>
        c.id === itemId ? { ...c, checked: !c.checked } : c,
      ),
    }));
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: colors.linen }}>
      {/* ── Jobs Panel ── */}
      <div
        style={{
          width: 296, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: colors.surface, borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            padding: '14px 16px 10px', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.midGrey }}>
            {phaseLabel} — Active
          </span>
          {activeProjects.length > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: 'white', background: colors.nearBlack, borderRadius: 8, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>
              {activeProjects.length}
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeProjects.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontFamily: MONO, fontSize: 9, color: colors.lightGrey, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              No active jobs in {phaseLabel}
            </div>
          )}
          {activeProjects.map((project) => (
            <JobCard
              key={project.id}
              project={project}
              selected={selectedId === project.id}
              onClick={() => setSelectedId(project.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Job Detail Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedProject ? (
          <JobDetail
            project={selectedProject}
            phase={phase}
            checklist={checkStates[selectedProject.id] ?? []}
            onCheckToggle={handleCheckToggle}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.lightGrey }}>
                {activeProjects.length > 0 ? 'Select a job to view details' : `No jobs in ${phaseLabel} phase`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// JOB CARD (sidebar)
// ============================================================================

function JobCard({ project, selected, onClick }: { project: Project; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderLeft: selected ? `3px solid ${colors.nearBlack}` : `3px solid ${colors.linenMid}`,
        borderBottom: `1px solid ${colors.border}`,
        cursor: 'pointer',
        background: selected ? 'rgba(17,16,16,0.04)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <div style={{ fontFamily: FIG, fontWeight: 600, fontSize: 12.5, color: colors.nearBlack }}>
        {project.clientName}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: colors.lightGrey, marginTop: 3 }}>
        {project.address}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {project.trades.map((t) => (
            <span key={t} style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', background: TRADE_COLORS[t] ?? colors.lightGrey, borderRadius: 3, padding: '1px 5px' }}>{t}</span>
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 8, color: '#9A8E84' }}>{project.sqft} sqft · {project.rooms} rm</span>
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 7 }}>
        {SCRIPT_PHASE_KEYS.map((ph, i) => {
          const ds = phaseDotStyle(project.phases[ph]);
          return (
            <div
              key={ph}
              style={{
                width: 15, height: 15, borderRadius: 0,
                background: ds.background, border: `1px solid ${ds.borderColor}`, color: ds.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 7, fontWeight: 500,
              }}
            >
              {SCRIPT_PHASE_LABELS[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// JOB DETAIL
// ============================================================================

function JobDetail({
  project,
  phase,
  checklist,
  onCheckToggle,
}: {
  project: Project;
  phase: ScriptPhase;
  checklist: ChecklistItem[];
  onCheckToggle: (projectId: string, itemId: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<ScriptPhase>(phase);
  const tradesLabel = project.trades.join(' / ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 20px 14px', background: colors.surface, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FIG, fontWeight: 700, fontSize: 19, color: colors.nearBlack, lineHeight: 1.2 }}>{project.clientName}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.midGrey, marginTop: 4 }}>
              {project.sqft} SQFT · {project.rooms} ROOMS · {tradesLabel} · {project.startDate} – {project.endDate}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, marginTop: 2 }}>
            <ActionButton label="📋 Brief" />
            <ActionButton label="📞 Call PM" />
            <ActionButton label="Edit" />
          </div>
        </div>
      </div>

      {/* ── Phase Tab Bar ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', background: colors.surface, borderBottom: `1px solid ${colors.border}`, flexShrink: 0, paddingLeft: 20, paddingRight: 20 }}>
        {SCRIPT_PHASE_KEYS.map((key, i) => {
          const entry = project.phases[key];
          const isAct = activeTab === key;
          const tc = isAct ? colors.nearBlack : phaseTabColour(entry);
          const bb = isAct
            ? `3px solid ${colors.nearBlack}`
            : (entry.status === 'complete' && entry.performanceColour)
              ? `3px solid ${PERF_COLOURS[entry.performanceColour]}`
              : '3px solid transparent';
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: 'none', border: 'none', borderBottom: bb,
                cursor: 'pointer', padding: '10px 12px 8px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, color: tc, lineHeight: 1 }}>{SCRIPT_PHASE_LABELS[i]}</span>
              <span style={{ fontFamily: MONO, fontSize: '8.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: tc, lineHeight: 1 }}>{SCRIPT_PHASE_WORDS[i]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === phase ? (
          <PhaseChecklist
            projectId={project.id}
            phaseLabel={SCRIPT_PHASE_WORDS[SCRIPT_PHASE_KEYS.indexOf(phase)]}
            checklist={checklist}
            onToggle={onCheckToggle}
          />
        ) : (
          <PhaseSkeleton label={SCRIPT_PHASE_WORDS[SCRIPT_PHASE_KEYS.indexOf(activeTab)]} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PHASE CHECKLIST (fully built for active phase)
// ============================================================================

function PhaseChecklist({
  projectId,
  phaseLabel,
  checklist,
  onToggle,
}: {
  projectId: string;
  phaseLabel: string;
  checklist: ChecklistItem[];
  onToggle: (projectId: string, itemId: number) => void;
}) {
  const checkedCount = checklist.filter((c) => c.checked).length;
  const totalCount = checklist.length;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.midGrey }}>
            {phaseLabel} — READ-DO Checklist
          </span>
          <span style={{ fontFamily: MONO, fontSize: 8, color: 'white', background: colors.nearBlack, borderRadius: 4, padding: '2px 8px' }}>
            {checkedCount === totalCount ? 'Complete' : 'In Progress'} {checkedCount}/{totalCount}
          </span>
        </div>

        {checklist.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            onToggle={() => {
              if (item.type === 'killer' && !item.checked) {
                const ok = window.confirm('⚑ STOP & CONFIRM — This is a killer item. Verify before marking complete. Proceed?');
                if (!ok) return;
              }
              onToggle(projectId, item.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CHECKLIST ROW
// ============================================================================

function ChecklistRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const isKiller = item.type === 'killer';

  const checkboxBorder = item.checked
    ? `2px solid ${colors.green}`
    : isKiller
      ? `2px solid ${colors.red}`
      : `2px solid ${colors.border}`;

  const checkboxBg = item.checked ? colors.green : 'transparent';

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', gap: 10, padding: '7px 8px', borderRadius: 4,
        cursor: 'pointer', transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.linen; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FIG, fontSize: 12,
            color: item.checked ? colors.lightGrey : isKiller ? colors.red : colors.nearBlack,
            textDecoration: item.checked ? 'line-through' : 'none', lineHeight: 1.4,
          }}
        >
          {isKiller && !item.checked && <span style={{ marginRight: 4 }}>⚑</span>}
          {item.label}
        </div>
        {item.note && (
          <div style={{ fontFamily: MONO, fontSize: '8.5px', color: colors.midGrey, marginTop: 2, lineHeight: 1.4 }}>
            {item.note}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PHASE SKELETON (non-active tabs)
// ============================================================================

function PhaseSkeleton({ label }: { label: string }) {
  ensureShimmerCSS();
  const shimmer: React.CSSProperties = {
    background: colors.border, borderRadius: 4,
    animation: 'hooomzShimmer 1.5s ease-in-out infinite',
  };

  return (
    <div style={{ display: 'flex', gap: 16, padding: 20, minHeight: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 6, padding: 16, flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.midGrey, marginBottom: 16 }}>
            {label} — Checklist
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ ...shimmer, width: 15, height: 15, flexShrink: 0, animationDelay: `${n * 0.1}s` }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...shimmer, height: 10, width: `${70 + (n * 5) % 30}%`, marginBottom: 6, animationDelay: `${n * 0.1}s` }} />
                <div style={{ ...shimmer, height: 7, width: `${50 + (n * 7) % 40}%`, animationDelay: `${n * 0.1 + 0.05}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 6, padding: 16, flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.midGrey, marginBottom: 16 }}>
            {label} — Details
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ ...shimmer, height: 8, width: 60, animationDelay: `${n * 0.12}s` }} />
              <div style={{ ...shimmer, height: 8, width: `${40 + (n * 11) % 50}%`, animationDelay: `${n * 0.12 + 0.06}s` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTION BUTTON
// ============================================================================

function ActionButton({ label }: { label: string }) {
  return (
    <button
      style={{
        fontFamily: MONO, fontSize: '8.5px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: colors.nearBlack, background: 'white', border: `1px solid ${colors.border}`,
        borderRadius: 4, padding: '6px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
        flexShrink: 0, transition: 'background 0.12s, opacity 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.linen; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
    >
      {label}
    </button>
  );
}
