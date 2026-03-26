'use client';

/**
 * PassportCareSection — Care & Maintenance with Hooomz Labs branding.
 * Hardcoded care content per material type. Rendered after job history.
 * Matches property-passport-v1.html artifact.
 */

interface CareCard {
  title: string;
  items: string[];
  warning: string;
}

const CARE_CARDS: Record<string, CareCard> = {
  lvp: {
    title: 'LVP Flooring',
    items: [
      'Sweep or vacuum regularly with a soft-bristle attachment. Avoid beater bar attachments which can scratch the wear layer.',
      'Damp mop with a pH-neutral floor cleaner. Avoid soaking — standing water will work into seams over time.',
      'Use felt pads under all furniture legs. Avoid rubber-backed mats — they can discolour the surface.',
      'Maintain indoor humidity between 35–65% year-round. Extreme fluctuation causes expansion and contraction at seams.',
    ],
    warning: 'Do not use steam mops on LVP. High heat and moisture will permanently damage the wear layer and void manufacturer warranty.',
  },
  paint: {
    title: 'Painted Surfaces — Walls & Ceilings',
    items: [
      'For routine cleaning, wipe with a soft damp cloth. Avoid abrasive scrubbers which will dull the sheen and remove pigment.',
      'Touch-up paint is retained on file. Contact Hooomz Interiors for touch-up supply — colour matching after significant time may vary slightly.',
      'For scuffs, a clean melamine sponge (Magic Eraser) works well on eggshell finish without damaging the surface.',
    ],
    warning: 'Allow freshly painted surfaces 30 days to fully cure before washing. Early cleaning can lift the paint film even when dry to the touch.',
  },
  trim: {
    title: 'Trim & Millwork — MDF Baseboard & Casing',
    items: [
      'Wipe with a slightly damp cloth. MDF is moisture-sensitive at the core — avoid saturating the surface or base.',
      'Minor nicks and chips can be filled with lightweight spackle, sanded smooth, and touched up with semi-gloss trim paint.',
      'Check caulk joints at floor and wall annually. Recaulk any gaps to prevent moisture ingress behind the board.',
    ],
    warning: 'MDF trim is not suitable for high-moisture areas like bathrooms without a sealed, primed edge coat. Contact Hooomz if adding trim near a wet zone.',
  },
  tile: {
    title: 'Tile Surfaces',
    items: [
      'Clean with a pH-neutral tile cleaner. Avoid acidic cleaners (vinegar, lemon) on natural stone or unglazed porcelain.',
      'Seal grout lines annually to prevent staining and moisture penetration.',
      'Use silicone caulk (not grout) at all changes in plane — wall-to-floor, wall-to-tub, corner joints.',
    ],
    warning: 'Never use bleach-based cleaners on coloured grout. It will permanently lighten the grout within 2–3 applications.',
  },
};

// Map material names to care card keys
function detectCareTypes(materialNames: string[]): string[] {
  const types = new Set<string>();
  for (const name of materialNames) {
    const lower = name.toLowerCase();
    if (lower.includes('lvp') || lower.includes('vinyl') || lower.includes('flooring')) types.add('lvp');
    if (lower.includes('paint') || lower.includes('benjamin') || lower.includes('latex')) types.add('paint');
    if (lower.includes('trim') || lower.includes('baseboard') || lower.includes('casing') || lower.includes('millwork') || lower.includes('mdf')) types.add('trim');
    if (lower.includes('tile') || lower.includes('porcelain') || lower.includes('ceramic')) types.add('tile');
  }
  return Array.from(types);
}

interface PassportCareSectionProps {
  materialNames: string[];
}

export function PassportCareSection({ materialNames }: PassportCareSectionProps) {
  const careTypes = detectCareTypes(materialNames);
  if (careTypes.length === 0) return null;

  return (
    <div id="care" className="mt-12">
      {/* Labs Header */}
      <div className="flex items-center justify-between px-6 py-5 mb-6" style={{ background: 'var(--dark-nav)' }}>
        <span className="text-base font-semibold" style={{ color: '#fff' }}>
          Care &amp; Maintenance
        </span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
          <span
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}
          >
            Hooomz Labs — Recommended Care
          </span>
        </div>
      </div>

      {/* Care Cards */}
      {careTypes.map((type) => {
        const card = CARE_CARDS[type];
        if (!card) return null;
        return (
          <div key={type} className="mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{card.title}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--green)' }} />
                <span className="text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  Hooomz Labs
                </span>
              </div>
            </div>
            <div className="px-5 py-4">
              {card.items.map((item, i) => (
                <div key={i} className="flex gap-2.5 mb-2.5 last:mb-0">
                  <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[7px]" style={{ background: 'var(--accent)' }} />
                  <span className="text-[13px] leading-relaxed" style={{ color: 'var(--charcoal)' }}>{item}</span>
                </div>
              ))}
              <div className="mt-3 px-3.5 py-2.5 text-xs leading-relaxed" style={{ borderLeft: '3px solid var(--amber)', background: 'rgba(217,119,6,0.06)', color: 'var(--charcoal)' }}>
                <strong className="block text-[10px] uppercase tracking-[0.06em] mb-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                  Hooomz Labs — Note
                </strong>
                {card.warning}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
