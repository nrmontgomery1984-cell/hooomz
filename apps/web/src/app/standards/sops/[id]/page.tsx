'use client';

/**
 * SOP Detail Page — /standards/sops/:id
 *
 * Full SOP display with procedures, critical standards, and action bar.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  ArrowLeft,
  ChevronDown,
  Info,
  AlertTriangle,
  OctagonAlert,
  Lightbulb,
  FlaskConical,
  ClipboardCheck,
  ExternalLink,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useStandardSOP } from '@/lib/hooks/useStandardSOPs';
import type {
  SOPProcedure,
  SOPCriticalStandard,
  SOPCriticalStandardCategory,
  ContentTable,
  Callout,
  ProcedureCheckpoint,
  ProcedureTest,
} from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.standards;

const TRADE_STYLES: Record<string, { bg: string; text: string }> = {
  Flooring: { bg: '#FEF3C7', text: '#92400E' },
  Painting: { bg: '#DBEAFE', text: '#1E40AF' },
  'Finish Carpentry': { bg: '#FFEDD5', text: '#9A3412' },
  Doors: { bg: '#E0E7FF', text: '#3730A3' },
  Drywall: { bg: '#F3F4F6', text: '#374151' },
  Tile: { bg: '#CCFBF1', text: '#115E59' },
};

const CATEGORY_LABELS: Record<SOPCriticalStandardCategory, { label: string; color: string }> = {
  specification: { label: 'Spec', color: '#3B82F6' },
  technique: { label: 'Technique', color: '#8B5CF6' },
  'stop-condition': { label: 'STOP', color: '#EF4444' },
  quality: { label: 'Quality', color: '#10B981' },
  documentation: { label: 'Docs', color: '#6B7280' },
  'material-science': { label: 'Material', color: '#F59E0B' },
  'building-science': { label: 'Building', color: '#0EA5E9' },
  climate: { label: 'Climate', color: '#14B8A6' },
};

const CALLOUT_STYLES: Record<string, { bg: string; border: string; icon: typeof Info }> = {
  info: { bg: 'var(--surface-2)', border: '#3B82F6', icon: Info },
  warning: { bg: 'rgba(245,158,11,0.06)', border: '#F59E0B', icon: AlertTriangle },
  critical: { bg: 'rgba(239,68,68,0.06)', border: '#EF4444', icon: OctagonAlert },
  tip: { bg: 'rgba(16,185,129,0.06)', border: '#10B981', icon: Lightbulb },
  labs: { bg: 'rgba(124,58,237,0.06)', border: '#7C3AED', icon: FlaskConical },
};

// ============================================================================
// Stat Pill
// ============================================================================

function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 16px',
      minWidth: 72,
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{label}</span>
    </div>
  );
}

// ============================================================================
// Content Table
// ============================================================================

function ContentTableView({ table }: { table: ContentTable }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      {table.caption && (
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-3)',
          marginBottom: 4,
          fontFamily: 'var(--font-cond)',
          letterSpacing: '0.04em',
        }}>
          {table.caption}
        </div>
      )}
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {table.headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left',
                padding: '4px 8px',
                color: 'var(--text-3)',
                fontWeight: 600,
                fontSize: 11,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '6px 8px',
                  color: j === 0 ? 'var(--text)' : 'var(--text-2)',
                  fontWeight: j === 0 ? 500 : 400,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Callout Box
// ============================================================================

function CalloutBox({ callout }: { callout: Callout }) {
  const style = CALLOUT_STYLES[callout.type] ?? CALLOUT_STYLES.info;
  const Icon = style.icon;

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '8px 10px',
      background: style.bg,
      borderLeft: `3px solid ${style.border}`,
      borderRadius: 6,
      marginTop: 6,
    }}>
      <Icon size={14} style={{ color: style.border, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        {callout.title && (
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            {callout.title}
          </div>
        )}
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
          {callout.content}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Critical Standards Section
// ============================================================================

function CriticalStandardsSection({ standards }: { standards: SOPCriticalStandard[] }) {
  if (standards.length === 0) return null;

  // Group by category, stop-conditions first
  const sorted = [...standards].sort((a, b) => {
    if (a.category === 'stop-condition' && b.category !== 'stop-condition') return -1;
    if (b.category === 'stop-condition' && a.category !== 'stop-condition') return 1;
    return 0;
  });

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{
        fontFamily: 'var(--font-cond)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        marginBottom: 10,
      }}>
        Critical Standards
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((cs) => {
          const cat = CATEGORY_LABELS[cs.category];
          return (
            <div
              key={cs.code}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '6px 8px',
                background: cs.category === 'stop-condition' ? 'rgba(239,68,68,0.06)' : 'var(--surface-2)',
                borderRadius: 8,
                borderLeft: `3px solid ${cat.color}`,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-3)',
                whiteSpace: 'nowrap',
                marginTop: 1,
              }}>
                {cs.code}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>
                {cs.description}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 4,
                color: cat.color,
                background: `${cat.color}18`,
                whiteSpace: 'nowrap',
                marginTop: 1,
              }}>
                {cat.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Procedure Card
// ============================================================================

function ProcedureCard({ procedure }: { procedure: SOPProcedure }) {
  const [expanded, setExpanded] = useState(false);

  const steps = procedure.steps ?? [];
  const checkpoints = procedure.checkpoints ?? [];
  const tests = procedure.tests ?? [];
  const tables = procedure.tables ?? [];
  const callouts = procedure.callouts ?? [];
  const itemCount = steps.length + checkpoints.length + tests.length;

  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: 'var(--surface-1)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-3)',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 150ms ease',
            flexShrink: 0,
          }}
        />
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: COLOR,
          fontFamily: 'var(--font-mono)',
          marginRight: 4,
        }}>
          {procedure.order}.
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
          {procedure.title}
        </span>
        {itemCount > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {itemCount} items
          </span>
        )}
      </button>

      {expanded && (
        <div style={{ padding: '0 12px 12px', background: 'var(--surface-1)' }}>
          {/* Body text */}
          {procedure.body && (
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 8px' }}>
              {procedure.body}
            </p>
          )}

          {/* Tables */}
          {tables.map((t, i) => <ContentTableView key={i} table={t} />)}

          {/* Steps */}
          {steps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: COLOR,
                    fontWeight: 600,
                    minWidth: 18,
                    marginTop: 2,
                  }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Checkpoints */}
          {checkpoints.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-3)',
                marginBottom: 4,
                fontFamily: 'var(--font-cond)',
                letterSpacing: '0.04em',
              }}>
                Checkpoints
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Checkpoint</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: '#10B981', fontWeight: 600, fontSize: 11 }}>Acceptable</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: '#EF4444', fontWeight: 600, fontSize: 11 }}>Unacceptable</th>
                  </tr>
                </thead>
                <tbody>
                  {checkpoints.map((cp: ProcedureCheckpoint, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500, color: 'var(--text)' }}>{cp.checkpoint}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--text-2)' }}>{cp.acceptable}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--text-2)' }}>{cp.unacceptable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tests */}
          {tests.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-3)',
                marginBottom: 4,
                fontFamily: 'var(--font-cond)',
                letterSpacing: '0.04em',
              }}>
                Tests
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Test</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t: ProcedureTest, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500, color: 'var(--text)' }}>{t.test}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--text-2)' }}>{t.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Callouts */}
          {callouts.map((c, i) => <CalloutBox key={i} callout={c as Callout} />)}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function SOPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sopId = params.id as string;
  const { data: sop, isLoading } = useStandardSOP(sopId);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>SOP not found</p>
          <button
            onClick={() => router.push('/standards/sops')}
            style={{ marginTop: 12, fontSize: 13, color: COLOR, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back to SOPs
          </button>
        </div>
      </div>
    );
  }

  const trade = TRADE_STYLES[sop.trade] ?? { bg: '#F3F4F6', text: '#374151' };
  const stopConditions = sop.criticalStandards.filter((cs) => cs.category === 'stop-condition');

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            {/* Back + breadcrumb */}
            <button
              onClick={() => router.push('/standards/sops')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--text-3)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginBottom: 8,
              }}
            >
              <ArrowLeft size={14} />
              <span>SOPs</span>
            </button>

            {/* Code + Trade badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                {sop.code}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 9999,
                background: trade.bg,
                color: trade.text,
              }}>
                {sop.trade}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'var(--green-dim)',
                color: 'var(--green)',
              }}>
                {sop.status}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>v{sop.version}</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
              {sop.title}
            </h1>

            {/* Source TG link */}
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>From: {sop.sourceRef.moduleCode}</span>
              <ExternalLink size={10} />
            </div>
          </div>

          {/* Stats bar */}
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 pb-3">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              background: 'var(--surface-2)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}>
              <StatPill label="Procedures" value={sop.procedures.length} />
              <StatPill label="Standards" value={sop.criticalStandards.length} />
              <StatPill label="Stop" value={stopConditions.length} color={stopConditions.length > 0 ? '#EF4444' : undefined} />
              <StatPill label="Labs" value={sop.labsReferences.length} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Introduction */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
          }}>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
              {sop.introduction}
            </p>
          </div>

          {/* Learning Objectives */}
          {sop.learningObjectives.length > 0 && (
            <div style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{
                fontFamily: 'var(--font-cond)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                marginBottom: 8,
              }}>
                Learning Objectives
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sop.learningObjectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, color: COLOR, fontWeight: 600, marginTop: 2 }}>•</span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Standards */}
          <CriticalStandardsSection standards={sop.criticalStandards} />

          {/* Procedures */}
          <div>
            <div style={{
              fontFamily: 'var(--font-cond)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              marginBottom: 8,
            }}>
              Procedures
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sop.procedures
                .sort((a, b) => a.order - b.order)
                .map((proc) => (
                  <ProcedureCard key={proc.id} procedure={proc} />
                ))}
            </div>
          </div>

          {/* Labs References */}
          {sop.labsReferences.length > 0 && (
            <div style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{
                fontFamily: 'var(--font-cond)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                marginBottom: 8,
              }}>
                Labs References
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {sop.labsReferences.map((ref, i) => {
                  const slug = ref.replace(/\{\{LABS:(.+?)\}\}/, '$1');
                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(124,58,237,0.08)',
                        color: '#7C3AED',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {slug}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div style={{
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: 'var(--text-3)',
            flexWrap: 'wrap',
          }}>
            <span>Duration: {sop.metadata.estimatedDuration}</span>
            <span>Difficulty: {sop.metadata.difficulty}</span>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface-1)',
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          zIndex: 50,
        }}>
          <Link
            href={`/standards/sops/${sopId}/checklist`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              background: COLOR,
              color: '#fff',
              textDecoration: 'none',
              minHeight: 44,
            }}
          >
            <ClipboardCheck size={16} />
            Start Checklist
          </Link>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
