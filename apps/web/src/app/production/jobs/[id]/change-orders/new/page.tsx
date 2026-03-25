'use client';

/**
 * New Change Order — /production/jobs/[id]/change-orders/new
 * Full-page form for creating a CO on a specific job.
 */

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useCreateChangeOrder } from '@/lib/hooks/useIntegrationData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useToast } from '@/components/ui/Toast';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import type { ChangeOrderInitiatorType } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.production;

const INITIATOR_OPTIONS: { value: ChangeOrderInitiatorType; label: string }[] = [
  { value: 'client_request', label: 'Client Request' },
  { value: 'contractor_recommendation', label: 'Contractor Recommendation' },
  { value: 'site_condition', label: 'Site Condition' },
  { value: 'sub_trade', label: 'Sub-Trade' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--charcoal)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--mid)',
  marginBottom: 4,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export default function NewChangeOrderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dashboard = useDashboardData();
  const createCO = useCreateChangeOrder();
  const { crewMemberId, crewMemberName } = useActiveCrew();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initiatorType, setInitiatorType] = useState<ChangeOrderInitiatorType>('client_request');
  const [costImpact, setCostImpact] = useState('');
  const [scheduleImpactDays, setScheduleImpactDays] = useState('0');

  const projectName = useMemo(() => {
    for (const p of dashboard.activeProjects) {
      if (p.id === projectId) return p.name;
    }
    return projectId.slice(0, 8);
  }, [dashboard.activeProjects, projectId]);

  const canSubmit = !!title.trim() && !createCO.isPending;

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;

    try {
      const result = await createCO.mutateAsync({
        projectId,
        title: title.trim(),
        description: description.trim(),
        initiatorType,
        initiatedBy: crewMemberName || 'Nathan',
        costImpact: parseFloat(costImpact) || 0,
        scheduleImpactDays: parseInt(scheduleImpactDays) || 0,
        createdBy: crewMemberId || 'nathan',
      });

      showToast({ message: `${result.coNumber} created`, variant: 'success', duration: 3000 });
      router.push(`/production/jobs/${projectId}/change-orders/${result.id}`);
    } catch {
      showToast({ message: 'Failed to create change order', variant: 'error', duration: 4000 });
    }
  }, [canSubmit, createCO, projectId, title, description, initiatorType, crewMemberName, costImpact, scheduleImpactDays, crewMemberId, showToast, router]);

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href={`/production/jobs/${projectId}/change-orders`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                <ArrowLeft size={18} />
              </Link>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)' }}>New Change Order</h1>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{projectName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Title */}
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Additional tile work in bathroom"
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about the change..."
                rows={3}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>

            {/* Initiator Type */}
            <div>
              <label style={labelStyle}>Reason</label>
              <select
                value={initiatorType}
                onChange={(e) => setInitiatorType(e.target.value as ChangeOrderInitiatorType)}
                style={inputStyle}
              >
                {INITIATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Cost + Schedule row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Cost Impact (CAD)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted)' }}>$</span>
                  <input
                    type="number"
                    value={costImpact}
                    onChange={(e) => setCostImpact(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    style={{ ...inputStyle, paddingLeft: 24 }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Schedule Impact (days)</label>
                <input
                  type="number"
                  value={scheduleImpactDays}
                  onChange={(e) => setScheduleImpactDays(e.target.value)}
                  placeholder="0"
                  min="0"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link
                href={`/production/jobs/${projectId}/change-orders`}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--mid)',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                Cancel
              </Link>
              <button
                onClick={handleCreate}
                disabled={!canSubmit}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 8, border: 'none',
                  background: canSubmit ? COLOR : 'var(--border)',
                  color: canSubmit ? '#FFFFFF' : 'var(--muted)',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {createCO.isPending ? 'Creating...' : 'Create Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
