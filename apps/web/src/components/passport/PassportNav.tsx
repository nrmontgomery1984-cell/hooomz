'use client';

/**
 * PassportNav — Sticky nav bar with anchor links and Print button.
 * Matches property-passport-v1.html artifact.
 */

interface PassportNavProps {
  showPublish?: boolean;
  onPublish?: () => void;
  isPublishing?: boolean;
}

export function PassportNav({ showPublish, onPublish, isPublishing }: PassportNavProps) {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center gap-0 px-12 print:hidden"
      style={{ background: 'var(--dark-nav)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <a
        href="#history"
        className="text-[11px] uppercase tracking-[0.06em] py-3.5 px-5 no-underline"
        style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', borderBottom: '2px solid transparent' }}
        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderBottomColor = 'var(--green)'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
      >
        Job History
      </a>
      <a
        href="#care"
        className="text-[11px] uppercase tracking-[0.06em] py-3.5 px-5 no-underline"
        style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', borderBottom: '2px solid transparent' }}
        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderBottomColor = 'var(--green)'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
      >
        Care &amp; Maintenance
      </a>
      <div className="ml-auto flex gap-2 py-2">
        <button
          onClick={() => window.print()}
          className="text-[11px] uppercase tracking-[0.06em] px-4 py-2"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
          }}
        >
          Print / Save PDF
        </button>
        {showPublish && onPublish && (
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="text-[11px] uppercase tracking-[0.06em] px-4 py-2 text-white"
            style={{
              fontFamily: 'var(--font-mono)',
              background: isPublishing ? 'var(--muted)' : 'var(--green)',
              border: 'none',
              cursor: isPublishing ? 'default' : 'pointer',
            }}
          >
            {isPublishing ? 'Publishing...' : 'Publish to Portal'}
          </button>
        )}
      </div>
    </nav>
  );
}
