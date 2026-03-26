'use client';

/**
 * PassportCover — Full-height cover page for the Property Passport.
 * Shows wordmark, property photo, address, homeowner, dates.
 * Matches property-passport-v1.html artifact.
 */

interface PassportCoverProps {
  address: string;
  city: string;
  homeownerName: string;
  propertyType?: string;
  jobCount: number;
  firstJobDate?: string;
  lastUpdated?: string;
  photoUrl?: string;
}

export function PassportCover({
  address,
  city,
  homeownerName,
  propertyType = 'Single Family — Interior',
  jobCount,
  firstJobDate,
  lastUpdated,
  photoUrl,
}: PassportCoverProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', pageBreakAfter: 'always' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-12 py-6" style={{ background: 'var(--dark-nav)' }}>
        <span className="text-[22px] font-semibold tracking-tight" style={{ color: '#fff' }}>
          Hoo<span
            className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[13px] font-bold"
            style={{ border: '2.5px solid var(--green)', color: '#fff' }}
          >O</span>mz
        </span>
        <div className="text-right text-[10px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.45)' }}>
          Hooomz Interiors<br />
          Moncton, NB &nbsp;|&nbsp; info@hooomz.ca
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-12 pt-16 pb-12">
        <div
          className="text-[11px] font-medium uppercase tracking-[0.12em] mb-8"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
        >
          Property Passport
        </div>

        {/* Photo */}
        <div
          className="w-full flex items-center justify-center mb-10"
          style={{ height: 320, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="flex flex-col items-center gap-2.5" style={{ color: 'var(--muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-[11px] tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)' }}>
                Property photo not uploaded
              </span>
            </div>
          )}
        </div>

        {/* Property info */}
        <div className="mb-auto">
          <div className="text-4xl font-bold leading-tight tracking-tight mb-2" style={{ color: 'var(--charcoal)' }}>
            {address}<br />{city}
          </div>
          <div className="flex gap-6 mt-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Homeowner</span>
              <span className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>{homeownerName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Property Type</span>
              <span className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>{propertyType}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Jobs Completed</span>
              <span className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>{jobCount}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-12 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
            Maintained by Hooomz Interiors
          </span>
          <div className="text-right text-[10px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            {firstJobDate && <>First job: {firstJobDate}<br /></>}
            {lastUpdated && <>Last updated: {lastUpdated}</>}
          </div>
        </div>
      </div>
    </div>
  );
}
