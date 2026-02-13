'use client';

import type { ToolResearchItem, ToolInventoryItem } from '@hooomz/shared-contracts';
import { ToolResearchCard } from './ToolResearchCard';

const NAVY = '#1B2A4A';
const TEAL = '#2A9D8F';
const GOLD = '#E9C46A';
const CORAL = '#E76F51';
const LIGHT_BG = '#F5F7FA';
const LIGHT_TEAL = '#E6F5F3';
const LIGHT_GOLD = '#FDF6E3';
const LIGHT_CORAL = '#FDEEEA';

const RETAILERS = ['Home Depot', 'Home Hardware', 'Kent', 'Rona', 'Canadian Tire'];
const RETAILER_BRANDS: Record<string, string> = {
  'Home Depot': 'Ryobi, RIDGID, Milwaukee, DeWalt, Makita, Bosch, Husky',
  'Home Hardware': 'DeWalt, Makita, Bosch, Benchmark',
  Kent: 'DeWalt, King Canada, Makita, Stanley',
  Rona: 'DeWalt, Bosch, Kobalt, Stanley',
  'Canadian Tire': 'Mastercraft, Maximum, DeWalt, some Milwaukee',
};

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

interface DashboardTabProps {
  onNav: (tabId: string) => void;
  researchItems: ToolResearchItem[];
  inventory: ToolInventoryItem[];
}

export function DashboardTab({ onNav, researchItems, inventory }: DashboardTabProps) {
  // Purchase progress
  const totalResearch = researchItems.length;
  const purchased = researchItems.filter((i) => i.purchased).length;
  const remaining = totalResearch - purchased;
  const totalSpent = inventory
    .filter((i) => i.pricePaid != null)
    .reduce((s, i) => s + (i.pricePaid ?? 0), 0);
  const purchasePercent = totalResearch > 0 ? Math.round((purchased / totalResearch) * 100) : 0;

  // Inventory summary
  const ownedCount = inventory.filter((i) => i.status === 'Owned').length;
  const platformGroups = inventory.reduce<Record<string, number>>((acc, i) => {
    acc[i.platform] = (acc[i.platform] || 0) + 1;
    return acc;
  }, {});

  // RIDGID registration
  const ridgidItems = inventory.filter((i) => i.platform === 'RIDGID 18V');
  const unregisteredRidgid = ridgidItems.filter((i) => !i.ridgidRegistered).length;

  const experiments = [
    {
      id: '002',
      name: 'Cordless Platform Selection',
      items: '6 platforms',
      budget: '$200–700',
      priority: 'P0',
      approach:
        'Pick ONE battery ecosystem. Visit all 5 retailers, compare breadth/price/availability',
      color: TEAL,
    },
    {
      id: '003',
      name: 'Corded Saws + Track Saws',
      items: '14 options',
      budget: '$130–2,200',
      priority: 'P0–P1',
      approach:
        'No platform lock-in. Track saw (Makita/Festool) may replace table saw for finish work',
      color: GOLD,
    },
    {
      id: '004',
      name: 'Fastening Systems',
      items: '7 options',
      budget: '$130–400',
      priority: 'P0–P2',
      approach: 'Cordless vs pneumatic first. Makita 18V nailers on same platform',
      color: CORAL,
    },
    {
      id: '005',
      name: 'Measuring & Layout',
      items: '7 options',
      budget: '$50–350',
      priority: 'P0–P3',
      approach: 'Independent purchases. Laser level is the big decision',
      color: TEAL,
    },
    {
      id: '007',
      name: 'PPE & Safety Gear',
      items: '12 items',
      budget: '$350–550',
      priority: 'P0–P2',
      approach: "Fit first. Try everything on. Add Mark's as a stop",
      color: CORAL,
    },
    {
      id: '008',
      name: 'Lab Instruments',
      items: '10 items',
      budget: '$400–700',
      priority: 'P0–P2',
      approach: 'Split: in-store (CT/HD) vs online (specialty)',
      color: NAVY,
    },
    {
      id: '009',
      name: 'Site Management',
      items: '10 items',
      budget: '$200–750',
      priority: 'P0–P2',
      approach:
        'Two tiers: budget wet/dry vac for rough + Festool extractor for finish work',
      color: GOLD,
    },
  ];

  return (
    <>
      {/* Purchase Progress */}
      <ToolResearchCard title="PURCHASE PROGRESS" color={TEAL}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            { label: 'Total Items', value: String(totalResearch), colorVal: NAVY, bg: LIGHT_BG },
            { label: 'Purchased', value: String(purchased), colorVal: '#2E7D32', bg: '#E8F5E9' },
            { label: 'Remaining', value: String(remaining), colorVal: '#E65100', bg: '#FFF3E0' },
            { label: 'Total Spent', value: `$${totalSpent}`, colorVal: TEAL, bg: LIGHT_TEAL },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                background: s.bg,
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, color: s.colorVal, fontWeight: 600, textTransform: 'uppercase' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginTop: 2 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ background: '#E5E7EB', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div
            style={{
              width: `${purchasePercent}%`,
              height: '100%',
              background: TEAL,
              borderRadius: 6,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {purchasePercent}% complete
        </div>
      </ToolResearchCard>

      {/* RIDGID Registration Warning */}
      {unregisteredRidgid > 0 && (
        <div
          onClick={() => onNav('inv')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNav('inv')}
          style={{
            padding: '12px 16px',
            background: LIGHT_CORAL,
            borderRadius: 8,
            borderLeft: `3px solid ${CORAL}`,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>&#9888;</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: CORAL }}>
              {unregisteredRidgid} RIDGID tool{unregisteredRidgid > 1 ? 's' : ''} need registration
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Register within 90 days at ridgid.com for Lifetime Service Agreement
            </div>
          </div>
          <span style={{ fontSize: 12, color: CORAL, fontWeight: 600 }}>View Inventory &rarr;</span>
        </div>
      )}

      {/* Inventory Summary */}
      <ToolResearchCard title="INVENTORY SUMMARY" color={NAVY}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ padding: '12px 14px', background: LIGHT_BG, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: NAVY, fontWeight: 600, textTransform: 'uppercase' }}>
              Total Inventory
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginTop: 2 }}>
              {inventory.length}
            </div>
          </div>
          <div style={{ padding: '12px 14px', background: '#E8F5E9', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#2E7D32', fontWeight: 600, textTransform: 'uppercase' }}>
              Owned
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginTop: 2 }}>
              {ownedCount}
            </div>
          </div>
        </div>
        {Object.keys(platformGroups).length > 0 && (
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
              By Platform
            </div>
            {Object.entries(platformGroups).map(([platform, count]) => (
              <div
                key={platform}
                onClick={() => onNav('inv')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNav('inv')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: LIGHT_BG,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#E2E8F0'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = LIGHT_BG; }}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>{platform}</span>
                <span style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>{count} &rarr;</span>
              </div>
            ))}
          </div>
        )}
      </ToolResearchCard>

      {/* Retailer Reference */}
      <ToolResearchCard title="RETAILER REFERENCE" color={TEAL}>
        <div style={{ display: 'grid', gap: 8 }}>
          {RETAILERS.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                padding: '6px 0',
                borderBottom: '1px solid #F0F0F0',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, minWidth: 130 }}>{r}</span>
              <span style={{ fontSize: 12, color: '#666' }}>{RETAILER_BRANDS[r]}</span>
            </div>
          ))}
        </div>
      </ToolResearchCard>

      {/* Experiment Index */}
      <ToolResearchCard title="EXPERIMENT INDEX" accent="Click any row to view details">
        <div style={{ display: 'grid', gap: 8 }}>
          {experiments.map((exp) => (
            <div
              key={exp.id}
              onClick={() => onNav(exp.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNav(exp.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 80px 100px 1fr',
                gap: 12,
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                border: '1px solid #EEE',
                transition: 'all 0.15s',
                background: 'white',
                minHeight: 44,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = LIGHT_BG;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'white';
              }}
            >
              <Badge text={`EXP-${exp.id}`} color={exp.color} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>{exp.name}</span>
              <span style={{ fontSize: 12, color: '#888' }}>{exp.items}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: TEAL }}>{exp.budget}</span>
              <span style={{ fontSize: 11, color: '#888' }}>{exp.approach}</span>
            </div>
          ))}
        </div>
      </ToolResearchCard>

      {/* Budget Summary */}
      <ToolResearchCard title="BUDGET SUMMARY" color={NAVY}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div
            style={{
              padding: 16,
              background: LIGHT_TEAL,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>P0 LAUNCH ESSENTIALS</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>$1,800–2,500</div>
          </div>
          <div
            style={{
              padding: 16,
              background: LIGHT_GOLD,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#B8860B', fontWeight: 600 }}>
              FULL BUY (ALL PRIORITIES)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>$2,500–4,300</div>
          </div>
          <div
            style={{
              padding: 16,
              background: totalSpent > 0 ? '#E8F5E9' : LIGHT_BG,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: totalSpent > 0 ? '#2E7D32' : '#888', fontWeight: 600 }}>
              SPENT SO FAR
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>
              ${totalSpent.toLocaleString()}
            </div>
          </div>
        </div>
      </ToolResearchCard>
    </>
  );
}
