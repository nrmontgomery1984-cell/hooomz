'use client';

/**
 * SourceLink — "Converted from estimate EST-XXX" lineage banner.
 * Matches quote-detail-v2.html artifact.
 */

import Link from 'next/link';

interface SourceLinkProps {
  projectId: string;
  estimateNumber?: string;
}

export function SourceLink({ projectId, estimateNumber }: SourceLinkProps) {
  const label = estimateNumber || projectId.slice(-6).toUpperCase();
  return (
    <Link
      href={`/estimates/${projectId}`}
      className="flex items-center justify-between px-4 py-3 mb-3 no-underline"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--blue)',
      }}
    >
      <span className="text-xs" style={{ color: 'var(--mid)' }}>
        Converted from estimate{' '}
        <strong
          className="text-[11px] font-medium"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
        >
          {label}
        </strong>
      </span>
      <span className="text-sm" style={{ color: 'var(--muted)' }}>→</span>
    </Link>
  );
}
