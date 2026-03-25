'use client';

/**
 * BrandHeader — Dark HOOOMZ wordmark bar for document pages.
 * Matches estimate-detail-v4.html artifact.
 */

interface BrandHeaderProps {
  docType: string;
  contactName?: string;
  contactInfo?: string;
}

export function BrandHeader({
  docType,
  contactName = 'Hooomz Interiors',
  contactInfo = 'Moncton, NB  |  info@hooomz.ca  |  (506) 555-0100',
}: BrandHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ background: 'var(--dark-nav)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-none">
          <span
            className="text-[22px] font-bold tracking-[0.04em]"
            style={{ fontFamily: 'var(--font-body)', color: '#fff' }}
          >
            H<span style={{ color: '#DC2626' }}>O</span>
            <span style={{ color: '#D97706' }}>O</span>
            <span style={{ color: '#16A34A' }}>O</span>MZ
          </span>
          <span
            className="text-[9px] font-medium uppercase tracking-[0.18em] mt-0.5"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
          >
            Interiors
          </span>
        </div>
        <div
          className="w-px h-5 mx-1"
          style={{ background: '#333' }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          {docType}
        </span>
      </div>

      <div className="text-right hidden sm:block">
        <div
          className="text-[11px] font-semibold"
          style={{ color: '#ccc' }}
        >
          {contactName}
        </div>
        <div
          className="text-[10px] mt-0.5 leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)', color: '#666' }}
        >
          {contactInfo}
        </div>
      </div>
    </div>
  );
}
