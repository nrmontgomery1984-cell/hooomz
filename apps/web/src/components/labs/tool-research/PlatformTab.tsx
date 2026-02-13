'use client';

import { useState, useMemo } from 'react';
import type { ToolPlatform } from '@hooomz/shared-contracts';
import { SortableTable } from './SortableTable';
import { ScoreBar } from './ScoreBar';
import { RetailerDots } from './RetailerDots';
import { ToolResearchCard } from './ToolResearchCard';

const NAVY = '#1B2A4A';
const TEAL = '#2A9D8F';
const GOLD = '#E9C46A';
const CORAL = '#E76F51';
const LIGHT_BG = '#F5F7FA';
const LIGHT_TEAL = '#E6F5F3';
const LIGHT_GOLD = '#FDF6E3';
const LIGHT_CORAL = '#FDEEEA';

const SCORING_WEIGHTS = { breadth: 0.25, availability: 0.25, battery: 0.2, upgrade: 0.15, price: 0.15 };

function Badge({ text, color = TEAL }: { text: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        background: color + '22',
        color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

interface PlatformTabProps {
  platforms: ToolPlatform[];
}

export function PlatformTab({ platforms }: PlatformTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const scored = useMemo(() => {
    return platforms
      .map((p) => ({
        ...p,
        weighted: Object.entries(SCORING_WEIGHTS).reduce(
          (sum, [k, w]) => sum + (p.score[k as keyof typeof p.score] ?? 0) * w,
          0,
        ),
      }))
      .sort((a, b) => b.weighted - a.weighted);
  }, [platforms]);

  return (
    <>
      <ToolResearchCard
        title="EXP-002: CORDLESS PLATFORM SELECTION"
        accent="The highest-impact decision"
        color={TEAL}
      >
        <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
          Picking a cordless platform locks you into a battery ecosystem for 8+ tools. The goal is
          finding the best PLATFORM at budget price — broadest coverage, best local availability,
          credible upgrade path. Click any platform to expand details.
        </p>
      </ToolResearchCard>

      <ToolResearchCard
        title="WEIGHTED SCORING MATRIX"
        accent="Breadth 25% · Availability 25% · Battery 20% · Upgrade 15% · Price 15%"
      >
        <SortableTable
          columns={[
            { key: 'name', label: 'Platform', minW: 130 },
            { key: 'tier', label: 'Tier', nowrap: true },
            {
              key: 'retailerCount',
              label: 'Retailers',
              render: (_v, r) => <RetailerDots retailers={(r as typeof scored[number]).retailers} />,
            },
            {
              key: 'scoreBreadth',
              label: 'Breadth',
              render: (_v, r) => <ScoreBar value={(r as typeof scored[number]).score.breadth} />,
            },
            {
              key: 'scoreAvail',
              label: 'Availability',
              render: (_v, r) => <ScoreBar value={(r as typeof scored[number]).score.availability} />,
            },
            {
              key: 'scoreBattery',
              label: 'Battery',
              render: (_v, r) => (
                <ScoreBar value={(r as typeof scored[number]).score.battery} color={GOLD} />
              ),
            },
            {
              key: 'scoreUpgrade',
              label: 'Upgrade',
              render: (_v, r) => (
                <ScoreBar value={(r as typeof scored[number]).score.upgrade} color={CORAL} />
              ),
            },
            {
              key: 'scorePrice',
              label: 'Price',
              render: (_v, r) => (
                <ScoreBar value={(r as typeof scored[number]).score.price} color={NAVY} />
              ),
            },
            {
              key: 'weighted',
              label: 'TOTAL',
              render: (v) => (
                <strong style={{ color: TEAL, fontSize: 14 }}>
                  {(v as number).toFixed(1)}
                </strong>
              ),
            },
          ]}
          data={scored.map((p) => ({
            ...p,
            scoreBreadth: p.score.breadth,
            scoreAvail: p.score.availability,
            scoreBattery: p.score.battery,
            scoreUpgrade: p.score.upgrade,
            scorePrice: p.score.price,
          }))}
          defaultSort={8}
        />
      </ToolResearchCard>

      {scored.map((p) => (
        <div
          key={p.name}
          onClick={() => setExpanded(expanded === p.name ? null : p.name)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === 'Enter' && setExpanded(expanded === p.name ? null : p.name)
          }
          style={{
            background: 'white',
            borderRadius: 8,
            marginBottom: 8,
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: expanded === p.name ? `2px solid ${TEAL}` : '2px solid transparent',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: 44,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge
                text={p.tier}
                color={
                  p.tier === 'Budget' ? GOLD : p.tier === 'Professional' ? CORAL : TEAL
                }
              />
              <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
              <RetailerDots retailers={p.retailers} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEAL }}>{p.entryPrice}</span>
              <span style={{ fontSize: 11, color: '#888' }}>{p.platformSize}</span>
              <span style={{ fontSize: 16 }}>{expanded === p.name ? '\u25B2' : '\u25BC'}</span>
            </div>
          </div>
          {expanded === p.name && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #EEE' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginTop: 12,
                }}
              >
                {(
                  [
                    ['Key Kit', p.keyKit],
                    ['Battery Options', p.batteryOptions],
                    ['Motor Type', p.motorType],
                    ['Warranty', p.warranty],
                    ['Upgrade Path', p.upgradePath],
                    ['Retailers', p.retailers.join(', ')],
                  ] as [string, string][]
                ).map(([label, val], i) => (
                  <div
                    key={i}
                    style={{ padding: '8px 10px', background: LIGHT_BG, borderRadius: 6 }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: '#888',
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 12, color: NAVY }}>{val}</div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <div style={{ padding: 10, background: LIGHT_TEAL, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: TEAL, fontWeight: 600 }}>PROS</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{p.pros}</div>
                </div>
                <div style={{ padding: 10, background: LIGHT_CORAL, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: CORAL, fontWeight: 600 }}>CONS</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{p.cons}</div>
                </div>
                <div style={{ padding: 10, background: LIGHT_GOLD, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: '#B8860B', fontWeight: 600 }}>
                    LABS CONTENT ANGLE
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{p.labsAngle}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <ToolResearchCard title="DECISION FRAMEWORK" color={NAVY}>
        <div style={{ display: 'grid', gap: 8 }}>
          {(
            [
              [
                'Makita Daily Driver + Festool Precision',
                "Makita 18V LXT for cordless platform (drill, impact, recip, circ saw, oscillating). Festool for track saw, dust extraction, finish sanding. Best build quality per dollar meets best precision tools in the industry. This is how serious shops run.",
                LIGHT_TEAL,
              ],
              [
                'Pure Budget-First',
                'Ryobi 9-tool kit ($550) or RIDGID 4-tool ($348 + lifetime warranty). Most tools per dollar. Upgrade individually to Makita as budget allows',
                LIGHT_GOLD,
              ],
              [
                'Labs Content Maximization',
                "RIDGID lifetime warranty = unique content. 'Budget tools fail. RIDGID replaces free.' Nobody else has this story. Run RIDGID as budget baseline, Makita as mid-tier, Festool as reference standard — three-tier comparison content",
                LIGHT_CORAL,
              ],
              [
                'Makita All-In',
                'Makita 4-tool combo (~$579) as core kit. Available at HD, Home Hardware, and Kent. 325+ tools in ecosystem. Fastest charging batteries. 18Vx2=36V for heavy tools without new batteries. Strong trade credibility for Hooomz brand',
                LIGHT_BG,
              ],
              [
                'Wildcard: Dual Platform',
                'Makita 18V LXT for daily + Milwaukee M18 for specialty heavy tools (impact wrench, rotary hammer). Many contractors run two platforms. Batteries stay separate but you get best-in-class for each application',
                '#F3E8FF',
              ],
            ] as [string, string, string][]
          ).map(([title, desc, bg], i) => (
            <div key={i} style={{ padding: '10px 14px', background: bg, borderRadius: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{title}: </span>
              <span style={{ fontSize: 12, color: '#444' }}>{desc}</span>
            </div>
          ))}
        </div>
      </ToolResearchCard>
    </>
  );
}
