import {
  MOCK_PROJECTS,
  SCRIPT_PHASE_KEYS,
  SCRIPT_PHASE_LABELS,
  type Project,
  type ScriptPhase,
} from '../../types/design';
import { colors, typography } from '../../constants/designSystem';

const MONO = typography.mono;
const FIG = typography.primary;

// ============================================================================
// HELPERS
// ============================================================================

function phaseDotStyle(project: Project, phase: ScriptPhase): { background: string; borderColor: string; color: string } {
  const entry = project.phases[phase];
  if (entry.status === 'active') return { background: colors.nearBlack, borderColor: colors.nearBlack, color: '#FFFFFF' };
  if (entry.status === 'complete' && entry.performanceColour === 'green') return { background: colors.greenBg, borderColor: colors.greenDim, color: colors.green };
  if (entry.status === 'complete' && entry.performanceColour === 'amber') return { background: colors.amberBg, borderColor: colors.amberDim, color: colors.amber };
  if (entry.status === 'complete' && entry.performanceColour === 'red') return { background: colors.redBg, borderColor: colors.redDim, color: colors.red };
  return { background: colors.linenDark, borderColor: colors.border, color: colors.lightGrey };
}


// ============================================================================
// SCRIPT DASHBOARD PAGE
// ============================================================================

export default function ScriptDashboardPage() {
  const projects = MOCK_PROJECTS;

  const activeCount = projects.length;
  const onSiteCount = projects.filter((p) => p.phases.install.status === 'active').length;
  const punchCount = projects.filter((p) => p.phases.punch.status === 'active').length;
  const overdueCount = 0;

  // Phase load counts
  const phaseLoadCounts = SCRIPT_PHASE_KEYS.map((phase) => ({
    phase,
    label: SCRIPT_PHASE_LABELS[SCRIPT_PHASE_KEYS.indexOf(phase)],
    count: projects.filter((p) => p.phases[phase].status === 'active').length,
  }));

  const maxCount = Math.max(...phaseLoadCounts.map((p) => p.count), 1);

  return (
    <div style={{ display: 'flex', gap: 16, padding: 20, height: '100%', overflow: 'hidden' }}>
      {/* ── Main Column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 0 }}>
        {/* Stat Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard value={activeCount} label="Active Jobs" sub="In production" borderColor={colors.green} />
          <StatCard value={onSiteCount} label="On Site" sub="Install phase" borderColor={colors.amber} />
          <StatCard value={punchCount} label="Punch Open" sub="Deficiency walk" borderColor={colors.blue} />
          <StatCard value={overdueCount} label="Overdue" sub="Behind schedule" borderColor={colors.red} />
        </div>

        {/* Active Jobs List */}
        <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${colors.border}` }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.midGrey }}>
              Active Jobs
            </span>
          </div>
          {projects.map((project, i) => (
            <JobRow key={project.id} project={project} isLast={i === projects.length - 1} />
          ))}
        </div>
      </div>

      {/* ── Side Column ── */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        {/* Phase Load Card */}
        <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 6, padding: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.midGrey, display: 'block', marginBottom: 14 }}>
            Phase Load
          </span>
          {phaseLoadCounts.map((row) => {
            const word = SCRIPT_PHASE_KEYS.indexOf(row.phase);
            return (
              <div key={row.phase} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 8.5, color: colors.midGrey, width: 58, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {['Shield', 'Clear', 'Ready', 'Install', 'Punch', 'Turnover'][word]}
                </span>
                <div style={{ flex: 1, height: 6, background: colors.linenDark, borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${maxCount > 0 ? (row.count / maxCount) * 100 : 0}%`,
                      background: row.count > 0 ? colors.green : 'transparent',
                      borderRadius: 3,
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: colors.nearBlack, width: 16, textAlign: 'right' }}>
                  {row.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Alerts Card */}
        <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 6, padding: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.midGrey, display: 'block', marginBottom: 14 }}>
            Alerts
          </span>
          <AlertItem color={colors.amber} text="Bourque — materials not confirmed" />
          <AlertItem color={colors.blue} text="Arsenault — 2 days to punch" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({ value, label, sub, borderColor }: { value: number; label: string; sub: string; borderColor: string }) {
  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${colors.border}`,
        borderTop: `3px solid ${borderColor}`,
        borderRadius: 6,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 500, color: colors.nearBlack, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: MONO, fontSize: '8.5px', color: colors.midGrey, marginTop: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>
        {sub}
      </div>
    </div>
  );
}

// ============================================================================
// JOB ROW
// ============================================================================

function JobRow({ project, isLast }: { project: Project; isLast: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${colors.linen}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FIG, fontWeight: 600, fontSize: 13, color: colors.nearBlack }}>
          {project.clientName}
        </div>
        <div style={{ fontFamily: MONO, fontSize: '8.5px', color: colors.midGrey, marginTop: 2 }}>
          {project.address} · {project.trades.join(' / ')} · {project.startDate}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginLeft: 12 }}>
        {SCRIPT_PHASE_KEYS.map((phase, i) => {
          const ds = phaseDotStyle(project, phase);
          return (
            <div
              key={phase}
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
// ALERT ITEM
// ============================================================================

function AlertItem({ color, text }: { color: string; text: string }) {
  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 4,
        padding: '8px 12px',
        marginBottom: 6,
        fontFamily: FIG,
        fontSize: '11.5px',
        color: colors.nearBlack,
        lineHeight: 1.4,
      }}
    >
      {text}
    </div>
  );
}
