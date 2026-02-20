'use client';

// ============================================================================
// Timeline Panel — Horizontal project timeline with task milestone dots
// ============================================================================

import { PanelSection } from '@/components/ui/PanelSection';

interface TaskMilestone {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  room: string;
}

interface TimelinePanelProps {
  startDate: string | undefined;
  estimatedEndDate: string | undefined;
  taskMilestones: TaskMilestone[];
}

const STATUS_DOT_COLORS: Record<string, string> = {
  complete:    'var(--green)',
  in_progress: 'var(--blue)',
  not_started: 'var(--text-3)',
  blocked:     'var(--red)',
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function isOverdueDate(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function TimelinePanel({
  startDate,
  estimatedEndDate,
  taskMilestones,
}: TimelinePanelProps) {
  const hasRange = startDate && estimatedEndDate;
  const hasMilestones = taskMilestones.length > 0;

  if (!hasRange && !hasMilestones) {
    return (
      <PanelSection label="Timeline">
        <div style={{ padding: '6px 12px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Add start/end dates and task due dates to see the timeline.
          </span>
        </div>
      </PanelSection>
    );
  }

  const rangeStart = startDate
    ? new Date(startDate)
    : hasMilestones
      ? new Date(taskMilestones[0].dueDate)
      : new Date();

  const rangeEnd = estimatedEndDate
    ? new Date(estimatedEndDate)
    : hasMilestones
      ? new Date(taskMilestones[taskMilestones.length - 1].dueDate)
      : new Date();

  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const today = new Date();
  const todayPct = totalMs > 0
    ? Math.max(0, Math.min(100, ((today.getTime() - rangeStart.getTime()) / totalMs) * 100))
    : 0;

  const positioned = taskMilestones.map((m) => {
    const ms = new Date(m.dueDate).getTime() - rangeStart.getTime();
    const pct = totalMs > 0 ? Math.max(0, Math.min(100, (ms / totalMs) * 100)) : 50;
    const overdue = m.status !== 'complete' && isOverdueDate(m.dueDate);
    const dotColor = overdue ? 'var(--red)' : (STATUS_DOT_COLORS[m.status] || 'var(--text-3)');
    return { ...m, pct, dotColor };
  });

  const todayStr = today.toISOString().split('T')[0];
  const nextTask = taskMilestones.find(
    (m) => m.status !== 'complete' && m.dueDate >= todayStr
  );

  return (
    <PanelSection label="Timeline">
      <div style={{ padding: '6px 12px 8px' }}>
        {/* Date labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-2)' }}>
            {formatShortDate(rangeStart.toISOString())}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-2)' }}>
            {formatShortDate(rangeEnd.toISOString())}
          </span>
        </div>

        {/* Timeline bar */}
        <div style={{ position: 'relative', height: 20, marginBottom: 8 }}>
          {/* Track */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 3,
              borderRadius: 2,
              background: 'var(--border)',
              transform: 'translateY(-50%)',
            }}
          />

          {/* Progress fill to today */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              height: 3,
              borderRadius: 2,
              width: `${todayPct}%`,
              background: 'var(--border-strong)',
              transform: 'translateY(-50%)',
            }}
          />

          {/* Today marker */}
          {todayPct > 0 && todayPct < 100 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 1.5,
                left: `${todayPct}%`,
                background: 'var(--blue)',
                transform: 'translateX(-50%)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--blue)',
                  color: 'var(--surface-1)',
                  fontSize: 7,
                  fontWeight: 700,
                  fontFamily: 'var(--font-cond)',
                  letterSpacing: '0.08em',
                  padding: '1px 3px',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                TODAY
              </div>
            </div>
          )}

          {/* Task dots */}
          {positioned.map((m) => (
            <div
              key={m.id}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${m.pct}%`,
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: m.dotColor,
                border: '2px solid var(--surface-1)',
                transform: 'translate(-50%, -50%)',
              }}
              title={`${m.name} — ${formatShortDate(m.dueDate)}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Done', color: 'var(--green)' },
            { label: 'Active', color: 'var(--blue)' },
            { label: 'Upcoming', color: 'var(--text-3)' },
            { label: 'Overdue', color: 'var(--red)' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-2)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>

        {/* Next task */}
        {nextTask && (
          <p style={{ fontSize: 11, color: 'var(--text-2)' }}>
            <span style={{ color: 'var(--text-3)' }}>Next:</span>{' '}
            {nextTask.name} — {formatShortDate(nextTask.dueDate)}
          </p>
        )}
      </div>
    </PanelSection>
  );
}
