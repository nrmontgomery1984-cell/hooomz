'use client';

// ============================================================================
// SCRIPT Pipeline — horizontal stage bar for project detail
// Shows Shield → Clear → Ready → Install → Punch → Turnover flow
// ============================================================================

type StageStatus = 'done' | 'active' | 'warn' | 'fail' | 'idle';

interface ScriptStage {
  key: 'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'turnover';
  label: string;
  status: StageStatus;
  completed: number;
  total: number;
}

interface ScriptPipelineProps {
  stages?: ScriptStage[];
  currentStage?: string;
  blockerCount?: number;
  decisionCount?: number;
  roomCount?: number;
  onSiteCount?: number;
}

const defaultStages: ScriptStage[] = [
  { key: 'shield',     label: 'Shield',     status: 'done', completed: 2, total: 2 },
  { key: 'clear',      label: 'Clear',      status: 'done', completed: 3, total: 3 },
  { key: 'ready',      label: 'Ready',      status: 'warn', completed: 1, total: 4 },
  { key: 'install',    label: 'Install',    status: 'fail', completed: 0, total: 6 },
  { key: 'punch',      label: 'Punch',      status: 'idle', completed: 0, total: 3 },
  { key: 'turnover', label: 'Turnover', status: 'idle', completed: 0, total: 0 },
];

function stageColor(status: StageStatus): string {
  switch (status) {
    case 'done':   return 'var(--green)';
    case 'active': return 'var(--blue)';
    case 'warn':   return 'var(--amber)';
    case 'fail':   return 'var(--red)';
    case 'idle':
    default:       return 'var(--border-strong)';
  }
}

function stageBg(status: StageStatus): string | undefined {
  if (status === 'warn') return 'rgba(217,119,6,0.18)';
  if (status === 'fail') return 'rgba(220,38,38,0.15)';
  return undefined;
}

function stageBorderStyle(status: StageStatus): string {
  return status === 'idle' ? '1.5px solid var(--border-strong)' : 'none';
}

const JOBSTAGE_TO_KEY: Record<string, string> = {
  shield: 'shield', clear: 'clear', ready: 'ready',
  install: 'install', punch: 'punch', turnover: 'turnover',
};

export function ScriptPipeline({
  stages = defaultStages,
  currentStage,
  blockerCount = 0,
  decisionCount = 0,
  roomCount = 0,
  onSiteCount = 0,
}: ScriptPipelineProps) {
  const currentKey = currentStage ? (JOBSTAGE_TO_KEY[currentStage] ?? currentStage) : null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        padding: '0 18px',
        height: 48,
        gap: 0,
        flexShrink: 0,
      }}
    >
      {/* "SCRIPT" label */}
      <span
        style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          marginRight: 16,
          flexShrink: 0,
        }}
      >
        SCRIPT
      </span>

      {/* Pipeline stages */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {stages.map((stage, idx) => {
          const color = stageColor(stage.status);
          const bg = stageBg(stage.status);
          const borderStyle = stageBorderStyle(stage.status);
          const isLast = idx === stages.length - 1;
          const isCurrent = currentKey === stage.key;

          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1, minWidth: 0 }}>
              {/* Stage node */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {/* Status dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: bg ?? color,
                    border: borderStyle,
                    flexShrink: 0,
                    boxShadow: stage.status === 'warn'
                      ? '0 0 4px rgba(217,119,6,0.5)'
                      : stage.status === 'fail'
                      ? '0 0 4px rgba(220,38,38,0.5)'
                      : 'none',
                  }}
                />
                {/* Stage info */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 600, color, lineHeight: 1.1, whiteSpace: 'nowrap',
                    borderBottom: isCurrent ? `2px solid ${color}` : 'none',
                    paddingBottom: isCurrent ? 1 : 0,
                  }}>
                    {stage.label}
                  </span>
                  {stage.total > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)', lineHeight: 1 }}>
                      {stage.completed}/{stage.total}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow connector */}
              {!isLast && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', maxWidth: 24, margin: '0 4px' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <div style={{ width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '4px solid var(--border)', flexShrink: 0 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right stats — separated by vertical rule */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginLeft: 12,
          paddingLeft: 12,
          borderLeft: '1px solid var(--border)',
          flexShrink: 0,
          maxWidth: 200,
        }}
      >
        <MiniStat value={blockerCount}  label="Block"     color={blockerCount  > 0 ? 'var(--red)'   : 'var(--text-2)'} />
        <MiniStat value={decisionCount} label="Dec."      color={decisionCount > 0 ? 'var(--amber)' : 'var(--text-2)'} />
        <MiniStat value={roomCount}     label="Rooms"     color="var(--text-2)" />
        <MiniStat value={onSiteCount}   label="Site"      color="var(--text-2)" />
      </div>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', lineHeight: 1 }}>
        {label}
      </span>
    </div>
  );
}
