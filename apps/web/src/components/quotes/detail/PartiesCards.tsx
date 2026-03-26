'use client';

/**
 * PartiesCards — Two-column "Prepared For" / "Prepared By" cards.
 * Matches quote-detail-v2.html artifact.
 */

interface PartyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  company?: string;
}

interface PartiesCardsProps {
  preparedFor?: PartyInfo;
  preparedBy?: PartyInfo;
}

function PartyCard({ label, party }: { label: string; party?: PartyInfo }) {
  if (!party) return null;
  return (
    <div
      className="px-4 py-3.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        {label}
      </div>
      <div className="text-sm font-semibold mb-1" style={{ color: 'var(--charcoal)' }}>
        {party.name}
      </div>
      <div className="text-xs leading-relaxed" style={{ color: 'var(--mid)' }}>
        {party.company && <>{party.company}<br /></>}
        {party.address && <>{party.address}<br /></>}
        {party.phone && <>{party.phone}<br /></>}
        {party.email}
      </div>
    </div>
  );
}

export function PartiesCards({ preparedFor, preparedBy }: PartiesCardsProps) {
  if (!preparedFor && !preparedBy) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
      <PartyCard label="Prepared For" party={preparedFor} />
      <PartyCard label="Prepared By" party={preparedBy} />
    </div>
  );
}
