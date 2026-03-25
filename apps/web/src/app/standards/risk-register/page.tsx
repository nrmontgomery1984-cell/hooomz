'use client';

/**
 * Risk Register — /standards/risk-register
 *
 * List page with severity filter tabs, Log Risk modal, and slide-in detail panel.
 * Matches Standards module visual patterns: inline styles, CSS variables,
 * underline tab filters, DM Mono labels.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  ShieldAlert,
  Search,
  Plus,
  X,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useStandardSOPs } from '@/lib/hooks/useStandardSOPs';
import {
  useRiskEntries,
  useCreateRiskEntry,
  useUpdateRiskEntry,
} from '@/lib/hooks/useRiskRegister';
import type { RiskEntry } from '@/lib/types/riskEntry';
import {
  RISK_SEVERITY_COLORS,
  RISK_STATUS_LABELS,
} from '@/lib/types/riskEntry';
import type { RiskSeverity, RiskStatus } from '@/lib/types/riskEntry';

const COLOR = SECTION_COLORS.standards;

// ============================================================================
// Constants
// ============================================================================

const TRADES = ['flooring', 'paint', 'trim', 'tile', 'drywall', 'general'] as const;
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = ['open', 'monitoring', 'resolved', 'escalated'] as const;
const CATEGORIES = ['quality', 'safety', 'schedule', 'material', 'customer', 'estimation'] as const;
const SOURCES = ['manual', 'change_order', 'checklist_failure', 'labs_observation'] as const;

type FilterDimension = 'trade' | 'severity' | 'status' | 'source';

// Status badge colors (inline since RISK_STATUS_LABELS is now plain strings)
const STATUS_BADGE_STYLES: Record<RiskStatus, { color: string; bg: string }> = {
  open: { color: 'var(--blue)', bg: 'rgba(59,130,246,0.12)' },
  monitoring: { color: 'var(--amber)', bg: 'var(--amber-dim)' },
  resolved: { color: 'var(--green)', bg: 'var(--green-dim)' },
  escalated: { color: 'var(--red)', bg: 'var(--red-bg)' },
};

// Severity badge bg colors
const SEVERITY_BG: Record<RiskSeverity, string> = {
  low: 'var(--surface-2)',
  medium: 'rgba(59,130,246,0.12)',
  high: 'var(--amber-dim)',
  critical: 'var(--red-bg)',
};

// ============================================================================
// Risk Card
// ============================================================================

function RiskCard({ entry, onClick }: { entry: RiskEntry; onClick: () => void }) {
  const severityColor = RISK_SEVERITY_COLORS[entry.severity];
  const statusLabel = RISK_STATUS_LABELS[entry.status];
  const statusBadge = STATUS_BADGE_STYLES[entry.status];

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${severityColor}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'box-shadow 150ms ease',
        minHeight: 44,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: SEVERITY_BG[entry.severity],
            color: severityColor,
            textTransform: 'uppercase',
          }}>
            {entry.severity}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
          }}>
            {entry.trade}
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 4,
          background: statusBadge.bg,
          color: statusBadge.color,
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.3, marginBottom: 8 }}>
        {entry.title}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {entry.source.replace(/_/g, ' ')}
        </span>
        {entry.linkedSopId && (
          <span style={{ fontSize: 11, color: COLOR, fontWeight: 500 }}>
            SOP linked
          </span>
        )}
        {entry.triggerCount > 1 && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: 9999,
            background: 'var(--surface-2)',
            color: 'var(--mid)',
          }}>
            {entry.triggerCount}x
          </span>
        )}
        {entry.sopFlaggedForReview && (
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--amber)' }}>
            SOP Flagged
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
          {entry.category}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// Log Risk Modal
// ============================================================================

function LogRiskModal({
  open,
  onClose,
  sops,
}: {
  open: boolean;
  onClose: () => void;
  sops: { id: string; code: string; title: string }[];
}) {
  const createMutation = useCreateRiskEntry();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trade, setTrade] = useState<RiskEntry['trade']>('general');
  const [severity, setSeverity] = useState<RiskEntry['severity']>('medium');
  const [category, setCategory] = useState<RiskEntry['category']>('quality');
  const [linkedSopId, setLinkedSopId] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setTrade('general');
    setSeverity('medium');
    setCategory('quality');
    setLinkedSopId('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        trade,
        severity,
        category,
        status: 'open',
        source: 'manual',
        triggerCount: 1,
        notes: notes.trim() || undefined,
        linkedSopId: linkedSopId || undefined,
        sopFlaggedForReview: !!linkedSopId,
        createdBy: 'crew_nathan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        jobsAffected: [],
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
    color: 'var(--charcoal)',
    outline: 'none',
    minHeight: 44,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 32,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
            Log Risk
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--muted)',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief risk title..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the risk..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Trade</label>
              <select value={trade} onChange={(e) => setTrade(e.target.value as RiskEntry['trade'])} style={selectStyle}>
                {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as RiskEntry['severity'])} style={selectStyle}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as RiskEntry['category'])} style={selectStyle}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Link to SOP (optional)</label>
            <select value={linkedSopId} onChange={(e) => setLinkedSopId(e.target.value)} style={selectStyle}>
              <option value="">None</option>
              {sops.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Modal footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--mid)',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || createMutation.isPending}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: (!title.trim() || !description.trim()) ? 'var(--surface-2)' : COLOR,
              color: (!title.trim() || !description.trim()) ? 'var(--muted)' : '#fff',
              cursor: (!title.trim() || !description.trim()) ? 'not-allowed' : 'pointer',
              minHeight: 44,
            }}
          >
            {createMutation.isPending ? 'Saving...' : 'Log Risk'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Detail Panel
// ============================================================================

function DetailPanel({
  entry,
  onClose,
  sops,
}: {
  entry: RiskEntry;
  onClose: () => void;
  sops: { id: string; code: string; title: string }[];
}) {
  const updateMutation = useUpdateRiskEntry();
  const severityColor = RISK_SEVERITY_COLORS[entry.severity];
  const statusLabel = RISK_STATUS_LABELS[entry.status];
  const statusBadge = STATUS_BADGE_STYLES[entry.status];
  const linkedSop = sops.find((s) => s.id === entry.linkedSopId);

  const handleResolveFlag = (decision: 'updated' | 'no_action' | 'deferred') => {
    updateMutation.mutate({
      id: entry.id,
      changes: {
        sopUpdateDecision: decision,
        sopFlaggedForReview: false,
        sopFlagResolvedAt: new Date().toISOString(),
        sopFlagResolvedBy: 'crew_nathan',
      },
    });
  };

  const handleStatusChange = (status: RiskEntry['status']) => {
    updateMutation.mutate({ id: entry.id, changes: { status } });
  };

  const fieldLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--muted)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 2,
  };

  const fieldValue: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--charcoal)',
    lineHeight: 1.5,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.3)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          height: '100vh',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          overflowY: 'auto',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        }}
      >
        {/* Panel header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--surface)',
          zIndex: 1,
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--muted)',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
                background: SEVERITY_BG[entry.severity],
                color: severityColor,
                textTransform: 'uppercase',
              }}>
                {entry.severity}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 4,
                background: statusBadge.bg,
                color: statusBadge.color,
              }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Panel body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)', margin: 0, lineHeight: 1.3 }}>
            {entry.title}
          </h2>

          <div>
            <div style={fieldLabel}>Description</div>
            <p style={{ ...fieldValue, margin: 0 }}>{entry.description}</p>
          </div>

          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={fieldLabel}>Trade</div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
              }}>
                {entry.trade}
              </span>
            </div>
            <div>
              <div style={fieldLabel}>Category</div>
              <div style={fieldValue}>{entry.category}</div>
            </div>
            <div>
              <div style={fieldLabel}>Source</div>
              <div style={fieldValue}>{entry.source.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <div style={fieldLabel}>Trigger Count</div>
              <div style={fieldValue}>{entry.triggerCount}</div>
            </div>
          </div>

          {/* Linked SOP */}
          {linkedSop && (
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={fieldLabel}>Linked SOP</div>
              <Link
                href={`/standards/sops/${linkedSop.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: COLOR,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{linkedSop.code}</span>
                {linkedSop.title}
                <ExternalLink size={11} style={{ flexShrink: 0 }} />
              </Link>
            </div>
          )}

          {/* Jobs affected */}
          {entry.jobsAffected && entry.jobsAffected.length > 0 && (
            <div>
              <div style={fieldLabel}>Jobs Affected</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {entry.jobsAffected.map((jobId) => (
                  <Link
                    key={jobId}
                    href={`/production/jobs/${jobId}`}
                    style={{ fontSize: 13, color: COLOR, textDecoration: 'none' }}
                  >
                    {jobId}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SOP Flag resolution */}
          {entry.sopFlaggedForReview && (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              borderLeft: '3px solid var(--amber)',
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} style={{ color: 'var(--amber)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
                  SOP Flagged for Review
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--mid)', margin: '0 0 10px', lineHeight: 1.5 }}>
                This risk entry has flagged the linked SOP for review. Choose a resolution:
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleResolveFlag('updated')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    background: COLOR,
                    color: '#fff',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Update SOP
                </button>
                <button
                  onClick={() => handleResolveFlag('no_action')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--mid)',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  No Action
                </button>
                <button
                  onClick={() => handleResolveFlag('deferred')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--amber)',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Defer
                </button>
              </div>
            </div>
          )}

          {/* Resolution info if already resolved */}
          {entry.sopUpdateDecision && (
            <div style={{
              background: 'var(--surface-2)',
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={fieldLabel}>SOP Review Decision</div>
              <div style={fieldValue}>
                {entry.sopUpdateDecision === 'updated' && 'SOP Updated'}
                {entry.sopUpdateDecision === 'no_action' && 'No Action Needed'}
                {entry.sopUpdateDecision === 'deferred' && 'Deferred'}
              </div>
              {entry.sopFlagResolvedAt && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  Resolved {new Date(entry.sopFlagResolvedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div>
              <div style={fieldLabel}>Notes</div>
              <p style={{ ...fieldValue, margin: 0 }}>{entry.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)' }}>
            <span>Created: {new Date(entry.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
          }}>
            {entry.status === 'open' && (
              <>
                <button
                  onClick={() => handleStatusChange('monitoring')}
                  style={{
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--amber)',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Monitor
                </button>
                <button
                  onClick={() => handleStatusChange('resolved')}
                  style={{
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--green)',
                    color: '#fff',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Resolve
                </button>
                <button
                  onClick={() => handleStatusChange('escalated')}
                  style={{
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: '1px solid var(--red)',
                    background: 'var(--red-bg)',
                    color: 'var(--red)',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Escalate
                </button>
              </>
            )}
            {entry.status === 'monitoring' && (
              <button
                onClick={() => handleStatusChange('resolved')}
                style={{
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--green)',
                  color: '#fff',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Resolve
              </button>
            )}
            {(entry.status === 'resolved' || entry.status === 'escalated') && (
              <button
                onClick={() => handleStatusChange('open')}
                style={{
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--mid)',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Filter Tabs
// ============================================================================

function FilterTabBar({
  active,
  onSelect,
}: {
  active: FilterDimension;
  onSelect: (dim: FilterDimension) => void;
}) {
  const tabs: { key: FilterDimension; label: string }[] = [
    { key: 'severity', label: 'Severity' },
    { key: 'trade', label: 'Trade' },
    { key: 'status', label: 'Status' },
    { key: 'source', label: 'Source' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderTop: '1px solid var(--border)',
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: active === tab.key ? COLOR : 'var(--muted)',
            background: 'none',
            border: 'none',
            borderBottom: active === tab.key ? `2px solid ${COLOR}` : '2px solid transparent',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function FilterValues({
  dimension,
  selected,
  onSelect,
  entries,
}: {
  dimension: FilterDimension;
  selected: string;
  onSelect: (val: string) => void;
  entries: RiskEntry[];
}) {
  let values: readonly string[] = [];
  switch (dimension) {
    case 'trade':
      values = TRADES;
      break;
    case 'severity':
      values = SEVERITIES;
      break;
    case 'status':
      values = STATUSES;
      break;
    case 'source':
      values = SOURCES;
      break;
  }

  const getCount = (val: string) =>
    entries.filter((e) => e[dimension as keyof RiskEntry] === val).length;

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
      <button
        onClick={() => onSelect('all')}
        style={{
          padding: '4px 12px',
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 9999,
          border: 'none',
          cursor: 'pointer',
          background: selected === 'all' ? COLOR : 'var(--surface-2)',
          color: selected === 'all' ? '#fff' : 'var(--mid)',
          whiteSpace: 'nowrap',
          minHeight: 32,
        }}
      >
        All ({entries.length})
      </button>
      {values.map((v) => {
        const count = getCount(v);
        return (
          <button
            key={v}
            onClick={() => onSelect(v)}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              background: selected === v ? COLOR : 'var(--surface-2)',
              color: selected === v ? '#fff' : 'var(--mid)',
              whiteSpace: 'nowrap',
              minHeight: 32,
            }}
          >
            {v.replace(/_/g, ' ')} ({count})
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function RiskRegisterPage() {
  const { data: entries = [], isLoading } = useRiskEntries();
  const { data: sops = [] } = useStandardSOPs();
  const [filterDim, setFilterDim] = useState<FilterDimension>('severity');
  const [filterValue, setFilterValue] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RiskEntry | null>(null);

  // Reset filter value when dimension changes
  useEffect(() => {
    setFilterValue('all');
  }, [filterDim]);

  // Keep selected entry in sync after mutations
  useEffect(() => {
    if (selectedEntry) {
      const updated = entries.find((e) => e.id === selectedEntry.id);
      if (updated) setSelectedEntry(updated);
    }
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const sopList = sops.map((s) => ({ id: s.id, code: s.code, title: s.title }));

  // Filter
  const filtered = entries
    .filter((e) => {
      if (filterValue === 'all') return true;
      return e[filterDim as keyof RiskEntry] === filterValue;
    })
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.trade.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const diff = (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const openCount = entries.filter((e) => e.status === 'open').length;
  const criticalCount = entries.filter((e) => e.severity === 'critical' && e.status === 'open').length;
  const flaggedCount = entries.filter((e) => e.sopFlaggedForReview).length;

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

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                  }}>
                    Standards
                  </span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)', marginTop: 4 }}>
                  Risk Register
                </h1>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  {openCount} open · {criticalCount} critical · {flaggedCount} SOPs flagged
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: 'none',
                  background: COLOR,
                  color: '#fff',
                  cursor: 'pointer',
                  minHeight: 44,
                  flexShrink: 0,
                }}
              >
                <Plus size={16} />
                Log Risk
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">
            <FilterTabBar active={filterDim} onSelect={setFilterDim} />
          </div>
        </div>

        {/* Filter values + search */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <FilterValues
              dimension={filterDim}
              selected={filterValue}
              onSelect={setFilterValue}
              entries={entries}
            />
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search risks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--charcoal)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--surface)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <ShieldAlert size={32} style={{ margin: '0 auto 12px', color: 'var(--muted)' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--mid)' }}>No Risks Found</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {search
                  ? 'Try adjusting your search.'
                  : entries.length === 0
                    ? 'Log your first risk to start building the register.'
                    : 'No risks match the current filter.'}
              </p>
              {entries.length === 0 && (
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    marginTop: 16,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 10,
                    border: 'none',
                    background: COLOR,
                    color: '#fff',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Log First Risk
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((entry) => (
                <RiskCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => setSelectedEntry(entry)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Risk Modal */}
      <LogRiskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sops={sopList}
      />

      {/* Detail Panel */}
      {selectedEntry && (
        <DetailPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          sops={sopList}
        />
      )}
    </PageErrorBoundary>
  );
}
