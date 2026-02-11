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
      className={`${isSticky ? 'sticky top-0 z-10' : ''} py-2 -mx-1 px-1`}
      style={{ background: 'rgba(243,244,246,0.95)', backdropFilter: 'blur(4px)' }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: isSpecial ? '#0F766E' : '#9CA3AF' }}
      >
        {label}
      </h3>
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
