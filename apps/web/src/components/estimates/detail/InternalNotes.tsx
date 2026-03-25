'use client';

/**
 * InternalNotes — Accent left-border notes section (not visible to homeowner).
 * Matches estimate-detail-v4.html artifact.
 */

interface InternalNotesProps {
  notes: string;
  isEditing?: boolean;
  onNotesChange?: (value: string) => void;
}

export function InternalNotes({ notes, isEditing = false, onNotesChange }: InternalNotesProps) {
  return (
    <div
      className="mb-3 px-4 py-3.5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
      }}
    >
      <div
        className="text-[9px] font-medium uppercase tracking-[0.1em] mb-1.5"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        Internal Notes — not visible to homeowner
      </div>
      {isEditing ? (
        <textarea
          className="w-full text-xs leading-relaxed p-2 resize-y"
          style={{
            fontFamily: 'var(--font-body)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--mid)',
            minHeight: '60px',
            lineHeight: 1.5,
          }}
          value={notes}
          onChange={(e) => onNotesChange?.(e.target.value)}
        />
      ) : (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--mid)' }}>
          {notes || 'No internal notes.'}
        </p>
      )}
    </div>
  );
}
