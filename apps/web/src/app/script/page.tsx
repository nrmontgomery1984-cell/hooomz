'use client';
import { useMemo } from 'react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

// ============================================================================
// CONSTANTS
// ============================================================================

type ScriptPhase = 'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'turnover';

const SCRIPT_PHASES: { letter: string; name: string; href: string; stage: ScriptPhase }[] = [
  { letter: 'S', name: 'Shield', href: '/script/shield', stage: 'shield' },
  { letter: 'C', name: 'Clear', href: '/script/clear', stage: 'clear' },
  { letter: 'R', name: 'Ready', href: '/script/ready', stage: 'ready' },
  { letter: 'I', name: 'Install', href: '/script/install', stage: 'install' },
  { letter: 'P', name: 'Punch', href: '/script/punch', stage: 'punch' },
  { letter: 'T', name: 'Turnover', href: '/script/turnover', stage: 'turnover' },
];

const SCRIPT_STAGE_SET = new Set(SCRIPT_PHASES.map((p) => p.stage));

const PHASE_COLORS: Record<ScriptPhase, string> = {
  shield: '#2C5F8A', clear: '#D4830A', ready: '#7C3AED',
  install: '#2D7A4F', punch: '#C0392B', turnover: '#1A1714',
};

function formatCAD(value: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function stageName(stage: string): string {
  const found = SCRIPT_PHASES.find((p) => p.stage === stage);
  return found ? found.name : stage;
}

// ============================================================================
// TYPES
// ============================================================================

interface BlockedItem {
  name: string;
  reason: string;
  severity: 'red' | 'amber';
}

interface AlertItem {
  id: string;
  jobName: string;
  message: string;
  severity: 'red' | 'amber';
}

// ============================================================================
// PAGE
// ============================================================================

export default function ScriptDashboardPage() {
  const { data, isLoading } = useLocalProjects();

  const projects = useMemo(() => {
    const all = data?.projects ?? [];
    return all.filter((p: { jobStage?: string }) => p.jobStage && SCRIPT_STAGE_SET.has(p.jobStage as ScriptPhase));
  }, [data]);

  // Phase counts
  const phaseCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const phase of SCRIPT_PHASES) {
      map[phase.stage] = projects.filter((p: { jobStage?: string }) => p.jobStage === phase.stage).length;
    }
    return map;
  }, [projects]);

  // Phase load for right panel
  const phaseLoad = useMemo(() => {
    return SCRIPT_PHASES.map((phase) => ({
      stage: phase.stage,
      label: phase.name,
      count: phaseCounts[phase.stage] ?? 0,
    }));
  }, [phaseCounts]);

  // Blocked items
  const blocked = useMemo<BlockedItem[]>(() => {
    const items: BlockedItem[] = [];
    for (const project of projects) {
      const p = project as { name: string; jobStage?: string; status?: string };
      if (p.status === 'blocked' || p.status === 'BLOCKED') {
        items.push({ name: p.name, reason: 'Job blocked', severity: 'red' });
      }
    }
    return items;
  }, [projects]);

  // Stats
  const onSiteCount = phaseCounts['install'] ?? 0;
  const punchCount = phaseCounts['punch'] ?? 0;
  // Overdue: projects don't have a planned_end easily accessible, so placeholder
  const overdueCount = 0;

  // Alerts
  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];
    let seq = 0;
    for (const project of projects) {
      const p = project as { name: string; jobStage?: string; budget?: { estimatedCost: number; actualCost?: number } };
      if (p.budget && p.budget.actualCost && p.budget.estimatedCost > 0) {
        const ratio = p.budget.actualCost / p.budget.estimatedCost;
        if (ratio > 1.05) {
          items.push({ id: `a-${++seq}`, jobName: p.name, message: 'Over budget', severity: 'red' });
        } else if (ratio > 0.9) {
          items.push({ id: `a-${++seq}`, jobName: p.name, message: 'Budget at risk', severity: 'amber' });
        }
      }
    }
    return items;
  }, [projects]);

  // Budget rows
  const budgetRows = useMemo(() => {
    return projects
      .map((project: { id: string; name: string; budget?: { estimatedCost: number; actualCost?: number } }) => {
        const quoted = project.budget?.estimatedCost ?? 0;
        const actual = project.budget?.actualCost ?? 0;
        if (quoted <= 0) return null;
        const ratio = quoted > 0 ? actual / quoted : 0;
        const status: 'green' | 'amber' | 'red' = ratio > 1.05 ? 'red' : ratio > 0.9 ? 'amber' : 'green';
        return { id: project.id, name: project.name, quoted, actual, status };
      })
      .filter(Boolean) as { id: string; name: string; quoted: number; actual: number; status: 'green' | 'amber' | 'red' }[];
  }, [projects]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9C9690' }}>
          Loading production...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EDE8', padding: '0 32px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* ── LAYER 1: BLOCKED STRIP ── */}
        {blocked.length > 0 ? (
          <div style={{ padding: '12px 0 16px', borderBottom: '1px solid #E0DCD7', marginBottom: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C0392B', marginBottom: 8 }}>
              Blocked — {blocked.length} job{blocked.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {blocked.map((item, i) => (
                <div key={i} style={{ flexShrink: 0, padding: '8px 12px', background: '#FAF8F5', border: '1px solid #C0392B30', borderLeft: '3px solid #C0392B', borderRadius: 6, minWidth: 180 }}>
                  <div style={{ fontFamily: FIG, fontSize: 13, fontWeight: 600, color: '#1A1714' }}>{item.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: '#C0392B', marginTop: 2 }}>{item.reason}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 0 16px', borderBottom: '1px solid #E0DCD7', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D7A4F' }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#2D7A4F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Production clear — no blockers</span>
          </div>
        )}

        {/* ── LAYER 2: STAT TILES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          <StatTile label="Active Jobs" value={String(projects.length)} accent="#2D7A4F" />
          <StatTile label="On Site" value={String(onSiteCount)} sub="Install phase" accent="#D4830A" />
          <StatTile label="Punch Open" value={String(punchCount)} accent="#2C5F8A" />
          <StatTile label="Overdue" value={String(overdueCount)} accent={overdueCount > 0 ? '#C0392B' : '#9C9690'} />
        </div>

        {/* ── LAYER 3: DETAIL ── */}
        <div style={{ display: 'flex', gap: 20 }}>

          {/* Left: Job cards */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 10 }}>
              Active Jobs — Schedule Health
            </div>

            {projects.length === 0 ? (
              <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8, padding: 32, textAlign: 'center' }}>
                <div style={{ fontFamily: FIG, fontSize: 14, color: '#6B6660' }}>No active jobs in production</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {projects.map((project: { id: string; name: string; address?: { street?: string; city?: string }; jobStage?: string; budget?: { estimatedCost: number } }) => {
                  const phase = (project.jobStage ?? 'shield') as ScriptPhase;
                  const phaseColor = PHASE_COLORS[phase] ?? '#9C9690';
                  const phaseIdx = SCRIPT_PHASES.findIndex((p) => p.stage === phase);
                  const progressPct = Math.round(((phaseIdx + 0.5) / SCRIPT_PHASES.length) * 100);
                  const address = project.address ? `${project.address.street || ''}, ${project.address.city || ''}`.replace(/^, |, $/g, '') : '—';

                  return (
                    <div key={project.id} style={{ padding: '12px 14px', background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2D7A4F', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: FIG, fontSize: 13, fontWeight: 600, color: '#1A1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
                          <div style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', marginTop: 1 }}>{address}</div>
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: phaseColor, background: `${phaseColor}12`, border: `1px solid ${phaseColor}25`, borderRadius: 3, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                          {stageName(phase)}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: '#6B6660', minWidth: 60, textAlign: 'right' }}>
                          {project.budget && project.budget.estimatedCost > 0 ? formatCAD(project.budget.estimatedCost) : '—'}
                        </span>
                      </div>
                      <div style={{ marginTop: 8, height: 4, background: '#E8E4DE', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPct}%`, background: phaseColor, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Phase load + Budget + Alerts */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Phase load */}
            <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 14 }}>
                Phase Load
              </div>
              {(() => {
                const maxCount = Math.max(...phaseLoad.map((p) => p.count), 1);
                return phaseLoad.map((row) => (
                  <div key={row.stage} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', width: 52, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
                    <div style={{ flex: 1, height: 5, background: '#E8E4DE', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${maxCount > 0 ? (row.count / maxCount) * 100 : 0}%`, background: row.count > 0 ? PHASE_COLORS[row.stage as ScriptPhase] : 'transparent', borderRadius: 2, minWidth: row.count > 0 ? 3 : 0 }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: '#1A1714', width: 20, textAlign: 'right' }}>{row.count}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Budget variance */}
            <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 14 }}>
                Budget Variance
              </div>
              {budgetRows.length === 0 ? (
                <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', textAlign: 'center', padding: 16 }}>No budget data</div>
              ) : (
                budgetRows.map((row) => {
                  const dotColor = row.status === 'red' ? '#C0392B' : row.status === 'amber' ? '#D4830A' : '#2D7A4F';
                  return (
                    <div key={row.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: FIG, fontSize: 12, color: '#1A1714', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690' }}>{formatCAD(row.actual)}/{formatCAD(row.quoted)}</span>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Alerts */}
            <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 14 }}>
                Alerts
              </div>
              {alerts.length === 0 ? (
                <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', textAlign: 'center', padding: 16 }}>No alerts</div>
              ) : (
                alerts.map((item) => {
                  const bc = item.severity === 'red' ? '#C0392B' : '#D4830A';
                  return (
                    <div key={item.id} style={{ padding: '8px 10px', background: '#F0EDE8', border: '1px solid #E0DCD7', borderLeft: `3px solid ${bc}`, borderRadius: 4, marginBottom: 6 }}>
                      <div style={{ fontFamily: FIG, fontSize: 11, color: '#1A1714' }}>{item.jobName}</div>
                      <div style={{ fontFamily: MONO, fontSize: 8, color: bc, marginTop: 2 }}>{item.message}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAT TILE
// ============================================================================

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderTop: `3px solid ${accent}`, borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 500, color: '#1A1714', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: '#6B6660', marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
