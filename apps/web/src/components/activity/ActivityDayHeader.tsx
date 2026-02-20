'use client';

/**
 * ActivityDayHeader
 *
 * Sticky header for day groups in the activity feed.
 * Shows "Today", "Yesterday", weekday name, or date.
 */

interface ActivityDayHeaderProps {
  label: string;
  isSticky?: boolean;
}

export function ActivityDayHeader({ label, isSticky = true }: ActivityDayHeaderProps) {
  const isSpecial = label === 'Today' || label === 'Yesterday';

  return (
    <div
      style={{
        position: isSticky ? 'sticky' : undefined,
        top: isSticky ? 0 : undefined,
        zIndex: isSticky ? 10 : undefined,
        padding: '4px 12px',
        background: 'var(--surface-2)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isSpecial ? 'var(--blue)' : 'var(--text-3)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * ActivityDayGroup — a day group containing a header and its events.
 */
interface ActivityDayGroupProps {
  label: string;
  children: React.ReactNode;
  isSticky?: boolean;
}

export function ActivityDayGroup({
  label,
  children,
  isSticky = true,
}: ActivityDayGroupProps) {
  return (
    <section aria-label={`Activity from ${label}`}>
      <ActivityDayHeader label={label} isSticky={isSticky} />
      <div>{children}</div>
    </section>
  );
}
