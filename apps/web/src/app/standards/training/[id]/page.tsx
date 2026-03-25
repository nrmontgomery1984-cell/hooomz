'use client';

/**
 * Training Guide Detail — /standards/training/[id]
 *
 * Read-only view of a single Training Guide with collapsible modules.
 * Displays learning objectives, critical standards, procedures, and Labs references.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, ChevronDown, AlertTriangle, Info, OctagonAlert, Lightbulb, FlaskConical } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import Link from 'next/link';
import { useTrainingGuide } from '@/lib/hooks/useTrainingGuides';
import { useStandardSOPs } from '@/lib/hooks/useStandardSOPs';
import type {
  TrainingGuideStatus,
  TrainingModule,
  Procedure,
  CriticalStandard,
  CriticalStandardCategory,
  ContentSection,
  SubSection,
  ContentTable,
  Callout,
} from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.standards;

const STATUS_STYLES: Record<TrainingGuideStatus, { bg: string; text: string }> = {
  active: { bg: 'var(--green-dim)', text: 'var(--green)' },
  draft: { bg: 'var(--amber-dim)', text: 'var(--amber)' },
  archived: { bg: 'var(--surface-3)', text: 'var(--muted)' },
};

const TRADE_STYLES: Record<string, { bg: string; text: string }> = {
  default: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
};

const CATEGORY_LABELS: Record<CriticalStandardCategory, { label: string; color: string }> = {
  specification: { label: 'Spec', color: 'var(--blue)' },
  technique: { label: 'Technique', color: 'var(--violet)' },
  'stop-condition': { label: 'STOP', color: 'var(--red)' },
  quality: { label: 'Quality', color: 'var(--green)' },
  documentation: { label: 'Docs', color: 'var(--muted)' },
  'material-science': { label: 'Material', color: 'var(--yellow)' },
  'building-science': { label: 'Building', color: '#0EA5E9' },
  climate: { label: 'Climate', color: 'var(--accent)' },
};

// ============================================================================
// Stat Pill
// ============================================================================

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 16px',
      minWidth: 72,
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</span>
    </div>
  );
}

// ============================================================================
// Critical Standards Table
// ============================================================================

function CriticalStandardsSection({ standards }: { standards: CriticalStandard[] }) {
  if (standards.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: 6,
      }}>
        Critical Standards
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {standards.map((cs) => {
          const cat = CATEGORY_LABELS[cs.category];
          return (
            <div
              key={cs.code}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '6px 8px',
                background: cs.category === 'stop-condition' ? 'var(--red-bg)' : 'var(--surface-2)',
                borderRadius: 8,
                borderLeft: `3px solid ${cat.color}`,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                marginTop: 1,
              }}>
                {cs.code}
              </span>
              <span style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.4, flex: 1 }}>
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
// Callout Styles
// ============================================================================

const CALLOUT_STYLES: Record<string, { bg: string; border: string; icon: typeof Info }> = {
  info: { bg: 'var(--surface-2)', border: 'var(--blue)', icon: Info },
  warning: { bg: 'var(--yellow-bg)', border: 'var(--yellow)', icon: AlertTriangle },
  critical: { bg: 'var(--red-bg)', border: 'var(--red)', icon: OctagonAlert },
  tip: { bg: 'var(--green-bg)', border: 'var(--green)', icon: Lightbulb },
  labs: { bg: 'rgba(124,58,237,0.06)', border: 'var(--violet)', icon: FlaskConical },
};

// ============================================================================
// ContentTableView — Renders a structured data table
// ============================================================================

function ContentTableView({ table }: { table: ContentTable }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      {table.caption && (
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--muted)',
          marginBottom: 4,
          fontFamily: 'var(--font-mono)',
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
                color: 'var(--muted)',
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
                  color: j === 0 ? 'var(--charcoal)' : 'var(--mid)',
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
// CalloutBox — Highlighted info/warning/critical box
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
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>
            {callout.title}
          </div>
        )}
        <div style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.5 }}>
          {callout.content}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SubSectionView — Renders a subsection with body, tables, callouts
// ============================================================================

function SubSectionView({ sub }: { sub: SubSection }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
        {sub.title}
      </div>
      {sub.body && (
        <p style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.6, margin: '0 0 4px' }}>
          {sub.body}
        </p>
      )}
      {sub.tables?.map((t, i) => <ContentTableView key={i} table={t} />)}
      {sub.callouts?.map((c, i) => <CalloutBox key={i} callout={c} />)}
    </div>
  );
}

// ============================================================================
// ContentSectionView — Renders a full content section with prose
// ============================================================================

function ContentSectionView({ section }: { section: ContentSection }) {
  const hasSubSections = section.subsections && section.subsections.length > 0;
  const isEnhanced = section.body || (hasSubSections && typeof section.subsections![0] === 'object' && 'body' in (section.subsections![0] as SubSection));

  return (
    <div style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{section.title}</div>
      {section.body && (
        <p style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.6, margin: '6px 0 0' }}>
          {section.body}
        </p>
      )}
      {section.tables?.map((t, i) => <ContentTableView key={i} table={t} />)}
      {section.callouts?.map((c, i) => <CalloutBox key={i} callout={c} />)}
      {hasSubSections && isEnhanced && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(section.subsections as SubSection[]).map((sub, j) => (
            <SubSectionView key={j} sub={sub} />
          ))}
        </div>
      )}
      {/* Fallback for legacy string[] subsections */}
      {hasSubSections && !isEnhanced && (
        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(section.subsections as unknown as string[]).map((sub, j) => (
            <span key={j} style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 4,
              background: 'var(--surface)',
              color: 'var(--mid)',
              border: '1px solid var(--border)',
            }}>
              {sub}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Procedure Section
// ============================================================================

function ProcedureItem({ procedure }: { procedure: Procedure }) {
  const [expanded, setExpanded] = useState(false);

  const hasSteps = procedure.steps && procedure.steps.length > 0;
  const hasCheckpoints = procedure.checkpoints && procedure.checkpoints.length > 0;
  const hasTests = procedure.tests && procedure.tests.length > 0;
  const hasChecks = procedure.checks && procedure.checks.length > 0;
  const itemCount = (procedure.steps?.length ?? 0) + (procedure.checkpoints?.length ?? 0)
    + (procedure.tests?.length ?? 0) + (procedure.checks?.length ?? 0);

  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          background: 'var(--surface)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <ChevronDown
          size={14}
          style={{
            color: 'var(--muted)',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 150ms ease',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', flex: 1 }}>
          {procedure.title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </button>

      <div style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: 'grid-template-rows 200ms ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px 12px', background: 'var(--surface)' }}>
            {/* Body — introductory prose */}
            {procedure.body && (
              <p style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.6, margin: '0 0 8px' }}>
                {procedure.body}
              </p>
            )}
            {/* Steps — numbered list */}
            {hasSteps && (
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {procedure.steps!.map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.5 }}>{step}</li>
                ))}
              </ol>
            )}

            {/* Checkpoints — table */}
            {hasCheckpoints && (
              <div style={{ overflowX: 'auto', marginTop: hasSteps ? 10 : 0 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Checkpoint</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--green)', fontWeight: 600, fontSize: 11 }}>Acceptable</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--red)', fontWeight: 600, fontSize: 11 }}>Unacceptable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedure.checkpoints!.map((cp, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', color: 'var(--charcoal)', fontWeight: 500 }}>{cp.checkpoint}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--mid)' }}>{cp.acceptable}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--mid)' }}>{cp.unacceptable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tests — table */}
            {hasTests && (
              <div style={{ overflowX: 'auto', marginTop: (hasSteps || hasCheckpoints) ? 10 : 0 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Test</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedure.tests!.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', color: 'var(--charcoal)', fontWeight: 500 }}>{t.test}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--mid)' }}>{t.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Checks — bullet list */}
            {hasChecks && (
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 3, marginTop: (hasSteps || hasCheckpoints || hasTests) ? 10 : 0 }}>
                {procedure.checks!.map((check, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.4 }}>{check}</li>
                ))}
              </ul>
            )}

            {/* Tables */}
            {procedure.tables && procedure.tables.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {procedure.tables.map((t, i) => <ContentTableView key={i} table={t} />)}
              </div>
            )}

            {/* Callouts */}
            {procedure.callouts && procedure.callouts.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {procedure.callouts.map((c, i) => <CalloutBox key={i} callout={c} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Module Card (Collapsible)
// ============================================================================

function ModuleCard({ mod, sopMap }: { mod: TrainingModule; sopMap: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);

  const hasSections = mod.content.sections && mod.content.sections.length > 0;
  const hasProcedures = mod.content.procedures && mod.content.procedures.length > 0;

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <ChevronDown
          size={16}
          style={{
            color: 'var(--muted)',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 150ms ease',
            flexShrink: 0,
          }}
        />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: COLOR,
          flexShrink: 0,
        }}>
          M{String(mod.order).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', flex: 1 }}>
          {mod.title}
        </span>
      </button>

      {/* Summary line — always visible */}
      <div style={{
        padding: '0 14px 10px 44px',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {mod.sopCodes.map((code) => {
          const sopId = sopMap[code];
          return sopId ? (
            <Link
              key={code}
              href={`/standards/sops/${sopId}`}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 4,
                background: `${COLOR}18`,
                color: COLOR,
                textDecoration: 'none',
              }}
            >
              {code} →
            </Link>
          ) : (
            <span
              key={code}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 4,
                background: 'var(--surface-2)',
                color: 'var(--mid)',
              }}
            >
              {code}
            </span>
          );
        })}
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {mod.learningObjectives.length} objectives
        </span>
        {mod.criticalStandards.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {mod.criticalStandards.length} standards
          </span>
        )}
      </div>

      {/* Expanded content */}
      <div style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: 'grid-template-rows 200ms ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 14px 14px 14px', borderTop: '1px solid var(--border)' }}>

            {/* Introduction */}
            {mod.content.introduction && (
              <p style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.6, margin: '12px 0 0' }}>
                {mod.content.introduction}
              </p>
            )}

            {/* Module-level callouts */}
            {mod.content.callouts && mod.content.callouts.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {mod.content.callouts.map((c, i) => <CalloutBox key={i} callout={c} />)}
              </div>
            )}

            {/* Learning Objectives */}
            <div style={{ marginTop: 12 }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 6,
              }}>
                Learning Objectives
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {mod.learningObjectives.map((obj, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.4 }}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Critical Standards */}
            <CriticalStandardsSection standards={mod.criticalStandards} />

            {/* Content Sections — enhanced with prose, tables, callouts */}
            {hasSections && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 6,
                }}>
                  Content Sections
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mod.content.sections!.map((section, i) => (
                    <ContentSectionView key={i} section={section} />
                  ))}
                </div>
              </div>
            )}

            {/* Content: Procedures */}
            {hasProcedures && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 6,
                }}>
                  Procedures
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mod.content.procedures!.map((proc, i) => (
                    <ProcedureItem key={i} procedure={proc} />
                  ))}
                </div>
              </div>
            )}

            {/* Labs References */}
            {mod.labsReferences.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 6,
                }}>
                  Labs References
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {mod.labsReferences.map((ref, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--violet-bg)',
                        color: 'var(--violet)',
                        border: '1px solid var(--violet-bg)',
                      }}
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function TrainingGuideDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: guide, isLoading } = useTrainingGuide(params?.id);
  const { data: allSops = [] } = useStandardSOPs();

  // Build code→id lookup for SOP links in ModuleCards
  const sopMap: Record<string, string> = {};
  for (const s of allSops) {
    sopMap[s.code] = s.id;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 12px', color: 'var(--muted)' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--mid)' }}>Training Guide Not Found</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            The requested training guide could not be found.
          </p>
          <button
            onClick={() => router.push('/standards/training')}
            style={{
              marginTop: 16,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--charcoal)',
              cursor: 'pointer',
            }}
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_STYLES[guide.status];
  const trade = TRADE_STYLES[guide.trade] ?? TRADE_STYLES.default;
  const sortedModules = [...guide.modules].sort((a, b) => a.order - b.order);

  const stats = {
    modules: guide.modules.length,
    sops: guide.modules.filter((m) => m.sopCodes.length > 0).length,
    standards: guide.modules.reduce((sum, m) => sum + m.criticalStandards.length, 0),
    labsRefs: guide.modules.reduce((sum, m) => sum + m.labsReferences.length, 0),
  };

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">

            {/* Back button */}
            <button
              onClick={() => router.push('/standards/training')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                color: 'var(--muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginBottom: 8,
              }}
            >
              <ArrowLeft size={14} />
              Training Guides
            </button>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>
                {guide.code}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>v{guide.version}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 9999,
                background: status.bg,
                color: status.text,
              }}>
                {guide.status}
              </span>
            </div>

            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)', marginTop: 4 }}>
              {guide.title}
            </h1>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 9999,
                background: trade.bg,
                color: trade.text,
              }}>
                {guide.trade}
              </span>
              {guide.effectiveDate && (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Effective: {guide.effectiveDate}
                </span>
              )}
            </div>

            {/* Stats bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginTop: 12,
              padding: '4px 0',
              borderTop: '1px solid var(--border)',
            }}>
              <StatPill label="Modules" value={stats.modules} />
              <StatPill label="SOPs" value={stats.sops} />
              <StatPill label="Standards" value={stats.standards} />
              <StatPill label="Labs Refs" value={stats.labsRefs} />
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedModules.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} sopMap={sopMap} />
            ))}
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
