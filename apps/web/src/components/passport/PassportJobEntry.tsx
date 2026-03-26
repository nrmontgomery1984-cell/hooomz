'use client';

/**
 * PassportJobEntry — Single job card in the Passport history.
 * Shows scope, rooms, materials, trades, crew. No financial data.
 * Matches property-passport-v1.html artifact.
 */

export interface PassportMaterial {
  name: string;
  spec: string;
  room: string;
}

export interface PassportTrade {
  trade: string;
  description: string;
}

export interface PassportCrew {
  firstName: string;
  role: string;
}

interface PassportJobEntryProps {
  jobNumber: string;
  title: string;
  completedDate: string;
  scopeSummary: string;
  rooms: string[];
  materials: PassportMaterial[];
  trades: PassportTrade[];
  crew: PassportCrew[];
}

export function PassportJobEntry({
  jobNumber,
  title,
  completedDate,
  scopeSummary,
  rooms,
  materials,
  trades,
  crew,
}: PassportJobEntryProps) {
  return (
    <div className="mb-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', pageBreakInside: 'avoid' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ background: 'var(--dark-nav)' }}>
        <div>
          <div className="text-[11px] tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>
            {jobNumber}
          </div>
          <div className="text-[15px] font-semibold mt-0.5" style={{ color: '#fff' }}>
            {title}
          </div>
        </div>
        <div className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.45)' }}>
          Completed {completedDate}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Scope */}
        <p className="text-sm leading-relaxed mb-5 pb-5" style={{ color: 'var(--charcoal)', borderBottom: '1px solid var(--border)' }}>
          {scopeSummary}
        </p>

        {/* Rooms */}
        {rooms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {rooms.map((room) => (
              <span
                key={room}
                className="text-[10px] tracking-[0.06em] px-2.5 py-0.5"
                style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)' }}
              >
                {room}
              </span>
            ))}
          </div>
        )}

        {/* Materials */}
        {materials.length > 0 && (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Materials Installed
            </div>
            {materials.map((mat, i) => (
              <div
                key={i}
                className="px-4 py-3 mb-2"
                style={{ background: 'var(--bg)', borderLeft: '3px solid var(--blue)' }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--charcoal)' }}>{mat.name}</span>
                  <span className="text-[10px] tracking-[0.06em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{mat.room}</span>
                </div>
                <div className="text-[11px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                  {mat.spec}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trades */}
        {trades.length > 0 && (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Work Performed
            </div>
            {trades.map((t, i) => (
              <div
                key={i}
                className="flex gap-3 py-2.5"
                style={{ borderBottom: i < trades.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}
              >
                <span
                  className="text-[9px] tracking-[0.08em] px-2 py-0.5 flex-shrink-0 mt-0.5"
                  style={{ fontFamily: 'var(--font-mono)', background: 'var(--charcoal)', color: 'rgba(255,255,255,0.7)' }}
                >
                  {t.trade}
                </span>
                <span className="text-[13px] leading-relaxed" style={{ color: 'var(--charcoal)' }}>
                  {t.description}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Crew */}
        {crew.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Crew
            </div>
            <div className="flex flex-wrap gap-2">
              {crew.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
                    style={{ background: 'var(--charcoal)', color: 'rgba(255,255,255,0.8)' }}
                  >
                    {c.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--charcoal)' }}>{c.firstName}</div>
                    <div className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{c.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
