'use client';
import { useMemo } from 'react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useActiveCrewMembers } from '@/lib/hooks/useCrewData';
import { useQuery } from '@tanstack/react-query';

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

            {/* Time tracking */}
            <TimeTrackingWidget projects={projects} />

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

// ============================================================================
// TIME TRACKING WIDGET
// ============================================================================

/**
 * Live time tracking panel for the SCRIPT dashboard right column.
 *
 * Data source: Currently uses placeholder data. Will be wired to the
 * timeclock service once crew clock-in/clock-out is integrated.
 * Reads project names from the real project list for per-job variance.
 */
function TimeTrackingWidget({ projects }: { projects: { id: string; name: string; address?: { street?: string } }[] }) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  const { data: crewMembers = [] } = useActiveCrewMembers();

  const { data: liveInstallers = [] } = useQuery({
    queryKey: ['script', 'timeclock', 'live', crewMembers.map((m) => m.id).join(',')],
    queryFn: async () => {
      if (!services) return [];
      const results = await Promise.all(
        crewMembers.map(async (m) => {
          const state = await services.timeClock.getCurrentState(m.id);
          if (!state?.isClockedIn) return null;
          return {
            initials: m.name?.split(' ').map((n: string) => n[0]).join('') ?? '??',
            name: m.name ?? '??',
            task: state.currentTaskTitle ?? 'Unknown task',
            clockInTime: state.clockInTime ?? null,
            indirect: false,
          };
        })
      );
      return results.filter(Boolean) as { initials: string; name: string; task: string; clockInTime: string | null; indirect: boolean }[];
    },
    refetchInterval: 30_000,
    enabled: crewMembers.length > 0 && !servicesLoading && !!services,
  });

  const { data: indirectToday } = useQuery({
    queryKey: ['script', 'timeclock', 'indirect', crewMembers.map((m) => m.id).join(',')],
    queryFn: async () => {
      if (!services) return { hours: '0h', cost: '$0' };
      const allEntries = await Promise.all(
        crewMembers.map((m) => services.timeClock.getTodayEntries(m.id))
      );
      const flat = allEntries.flat().filter((e) => e.entryType === 'overhead' && e.clock_out !== null);
      const hours = flat.reduce((s, e) => s + (e.total_hours ?? 0), 0);
      const cost = flat.reduce((s, e) => s + (e.total_hours ?? 0) * (e.hourly_rate ?? 0), 0);
      return { hours: `${hours.toFixed(1)}h`, cost: `$${cost.toFixed(0)}` };
    },
    refetchInterval: 30_000,
    enabled: crewMembers.length > 0 && !servicesLoading && !!services,
  });

  const clockedIn = liveInstallers.length;

  return (
    <div style={{
      background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6B6660' }}>Live · Time</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: clockedIn > 0 ? '#16A34A' : '#9C9690', boxShadow: clockedIn > 0 ? '0 0 6px rgba(22,163,74,0.5)' : 'none' }}/>
          <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: clockedIn > 0 ? '#16A34A' : '#9C9690' }}>{clockedIn} clocked in</span>
        </div>
      </div>

      {/* Live installers */}
      {clockedIn === 0 ? (
        <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', textAlign: 'center', padding: '8px 0' }}>No one clocked in</div>
      ) : liveInstallers.map((installer) => (
        <div key={installer.initials} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#111010', borderRadius: 4 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#222120', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: MONO, flexShrink: 0 }}>{installer.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FIG, fontSize: 11, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{installer.task}</div>
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', color: installer.indirect ? '#D97706' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, marginTop: 1 }}>{installer.name} · {installer.indirect ? 'Indirect' : 'Install'}</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: '#16A34A', letterSpacing: '0.05em', flexShrink: 0 }}>
            {installer.clockInTime ? formatElapsedSince(installer.clockInTime) : '—'}
          </div>
        </div>
      ))}

      {/* Today's indirect */}
      <div style={{ padding: '8px 10px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#D97706' }}>Indirect today</div>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#D97706' }}>{indirectToday?.hours ?? '0h'} · {indirectToday?.cost ?? '$0'}</div>
      </div>

      {/* Per-job — real project names, placeholder hours */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {projects.slice(0, 3).map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E0DCD7' }}>
              <div style={{ fontFamily: FIG, fontSize: 11, fontWeight: 500, color: '#111010', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address?.street ?? p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#9A8E84' }}>—h</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9C9690' }}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatElapsedSince(isoTime: string): string {
  const secs = Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000);
  if (secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`;
}
