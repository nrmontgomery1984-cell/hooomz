'use client';

import { ToolResearchCard } from './ToolResearchCard';

const NAVY = '#1B2A4A';
const TEAL = '#2A9D8F';
const GOLD = '#E9C46A';
const LIGHT_BG = '#F5F7FA';

export function ShoppingPlanTab() {
  const stops = [
    {
      num: 1,
      store: 'Canadian Tire',
      time: '45 min',
      focus:
        'Mastercraft cordless kits + pricing, mitre saws (check clearance), hand tools, basic PPE',
      tips: 'Check flyer app first. Mastercraft drops 40-60% on sales. Triangle card = 4% back on CT brands',
    },
    {
      num: 2,
      store: 'Home Depot',
      time: '60 min',
      focus:
        'Ryobi, RIDGID, Milwaukee combo kits. DeWalt pricing. Husky hand tools (lifetime warranty). RIDGID shop vac',
      tips: "Check for 'buy kit, get free tool' promos. Milwaukee Heavy Duty Days. Ask about contractor pricing",
    },
    {
      num: 3,
      store: 'Kent',
      time: '30 min',
      focus: 'DeWalt and Makita kits. King Canada saws. Stanley hand tools',
      tips: 'Kent sometimes has NB contractor pricing. Check Makita 2-tool and 4-tool kits. Important for Ritchies relationship',
    },
    {
      num: 4,
      store: 'Home Hardware',
      time: '20 min',
      focus: 'DeWalt/Makita availability check. Hand tools. Any unique pricing',
      tips: "Smaller selection but may have sale items others don't. Quick stop",
    },
    {
      num: 5,
      store: "Mark's Work Wearhouse",
      time: '45 min',
      focus: 'BOOTS (winter + 3-season). Gloves. Socks. Knee pads if available',
      tips: "Go LAST — end of day when feet are swollen. Wear work socks. Walk 10+ min in each boot. Don't rush",
    },
    {
      num: 6,
      store: 'Rona',
      time: '15 min',
      focus: 'DeWalt pricing check. Any clearance deals',
      tips: 'Quick scan. May have DeWalt combo kits at competitive pricing',
    },
  ];

  return (
    <>
      <ToolResearchCard
        title="ONE-DAY SHOPPING ROUTE"
        accent="Print comparison matrices and bring to stores"
        color={TEAL}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {stops.map((s) => (
            <div
              key={s.num}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 140px 60px 1fr 1fr',
                gap: 12,
                alignItems: 'start',
                padding: '10px 12px',
                background: s.num % 2 === 0 ? LIGHT_BG : 'white',
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: TEAL,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {s.num}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.store}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{s.time}</div>
              <div style={{ fontSize: 12 }}>{s.focus}</div>
              <div style={{ fontSize: 11, color: TEAL, fontStyle: 'italic' }}>{s.tips}</div>
            </div>
          ))}
        </div>
      </ToolResearchCard>

      <ToolResearchCard title="SALE CALENDAR — WHEN TO BUY" color={NAVY}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(
            [
              [
                'Canadian Tire',
                'Boxing Week, Victoria Day, Father\'s Day, Labour Day. Mastercraft 40-60% off. Check Thursday flyers',
              ],
              [
                'Home Depot',
                'Milwaukee Heavy Duty Days (fall). Spring Black Friday. Buy kit + get free tool promos year-round',
              ],
              [
                'Kent',
                'Spring contractor events. Check for NB-specific pricing. Holiday sales',
              ],
              [
                'General',
                'March (pre-home show) is NOT sale season. Consider buying P1/P2 items during June-July sales',
              ],
            ] as [string, string][]
          ).map(([store, tips], i) => (
            <div key={i} style={{ padding: 10, background: LIGHT_BG, borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{store}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{tips}</div>
            </div>
          ))}
        </div>
      </ToolResearchCard>

      <ToolResearchCard title="PRE-SHOPPING CHECKLIST" color={GOLD}>
        <div style={{ display: 'grid', gap: 4 }}>
          {[
            'Print retailer comparison matrix from each experiment sheet (from the .xlsx workbook)',
            'Download Canadian Tire, Home Depot, and Kent apps — check current flyer prices',
            'Bring a tape measure and combination square (for checking saw fences in-store)',
            "Wear work socks to Mark's for boot fitting",
            'Bring a notepad or phone for recording prices per retailer per item',
            'Budget envelope or card limit set: P0 items = $1,800–2,500 max',
            'Take photos of every price tag — Labs documentation starts at the store',
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid #F0F0F0',
                minHeight: 44,
                alignItems: 'center',
              }}
            >
              <span style={{ color: TEAL, fontWeight: 700, fontSize: 16 }}>{'\u2610'}</span>
              <span style={{ fontSize: 12 }}>{item}</span>
            </div>
          ))}
        </div>
      </ToolResearchCard>
    </>
  );
}
