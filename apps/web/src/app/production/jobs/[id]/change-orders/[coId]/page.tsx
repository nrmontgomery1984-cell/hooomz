'use client';

/**
 * Change Order Detail — /production/jobs/[id]/change-orders/[coId]
 * Full-page view of a single CO with line items, status actions, and PDF download.
 */

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import {
  useChangeOrderWithLineItems,
  useAddChangeOrderLineItem,
  useSubmitForApproval,
  useApproveChangeOrder,
  useDeclineChangeOrder,
  useCancelChangeOrder,
  useRemoveChangeOrderLineItem,
} from '@/lib/hooks/useIntegrationData';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useToast } from '@/components/ui/Toast';
import type { ChangeOrderStatus } from '@hooomz/shared-contracts';
import { CO_INITIATOR_LABEL } from '@hooomz/shared-contracts';

const ChangeOrderPDF = dynamic(() => import('@/components/change-orders/ChangeOrderPDF').then((m) => m.ChangeOrderPDF), { ssr: false });

const COLOR = SECTION_COLORS.production;

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'var(--green)',
  pending_approval: 'var(--amber)',
  declined: 'var(--red)',
  draft: 'var(--muted)',
  cancelled: 'var(--muted)',
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  declined: 'Rejected',
  draft: 'Draft',
  cancelled: 'Void',
};

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
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: 2,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export default function ChangeOrderDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const coId = params.coId as string;
  const dashboard = useDashboardData();

  const { data, isLoading } = useChangeOrderWithLineItems(coId);
  const addLineItem = useAddChangeOrderLineItem();
  const submitForApproval = useSubmitForApproval();
  const approveCO = useApproveChangeOrder();
  const declineCO = useDeclineChangeOrder();
  const cancelCO = useCancelChangeOrder();
  const removeLineItem = useRemoveChangeOrderLineItem();
  const { crewMemberId } = useActiveCrew();
  const { showToast } = useToast();

  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [liDesc, setLiDesc] = useState('');
  const [liCategory, setLiCategory] = useState('');
  const [liHours, setLiHours] = useState('');
  const [liMaterialCost, setLiMaterialCost] = useState('');
  const [liLaborCost, setLiLaborCost] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showPDF, setShowPDF] = useState(false);

  const projectName = useMemo(() => {
    for (const p of dashboard.activeProjects) {
      if (p.id === projectId) return p.name;
    }
    return projectId.slice(0, 8);
  }, [dashboard.activeProjects, projectId]);

  const co = data?.changeOrder;
  const lineItems = data?.lineItems ?? [];
  const status = co?.status as ChangeOrderStatus | undefined;
  const isDraft = status === 'draft';
  const isPending = status === 'pending_approval';

  const resetLineItemForm = () => {
    setLiDesc(''); setLiCategory(''); setLiHours(''); setLiMaterialCost(''); setLiLaborCost('');
    setShowAddLineItem(false);
  };

  const handleAddLineItem = async () => {
    if (!liDesc.trim() || !co) return;
    const materialCost = parseFloat(liMaterialCost) || 0;
    const laborCost = parseFloat(liLaborCost) || 0;
    try {
      await addLineItem.mutateAsync({
        changeOrderId: co.id,
        lineItem: {
          description: liDesc.trim(),
          sopCode: null,
          category: liCategory.trim() || 'general',
          estimatedHours: parseFloat(liHours) || 0,
          estimatedMaterialCost: materialCost,
          estimatedLaborCost: laborCost,
          estimatedTotal: materialCost + laborCost,
          generatesTaskTemplates: true,
        },
      });
      showToast({ message: 'Line item added', variant: 'success', duration: 2000 });
      resetLineItemForm();
    } catch {
      showToast({ message: 'Failed to add line item', variant: 'error', duration: 3000 });
    }
  };

  const handleSubmit = async () => {
    if (!co) return;
    try {
      await submitForApproval.mutateAsync(co.id);
      showToast({ message: `${co.coNumber} submitted for approval`, variant: 'success', duration: 3000 });
    } catch {
      showToast({ message: 'Failed to submit', variant: 'error', duration: 3000 });
    }
  };

  const handleApprove = async () => {
    if (!co) return;
    try {
      await approveCO.mutateAsync({ id: co.id, approvedBy: crewMemberId || 'nathan' });
      showToast({ message: `${co.coNumber} approved`, variant: 'success', duration: 3000 });
    } catch {
      showToast({ message: 'Failed to approve', variant: 'error', duration: 3000 });
    }
  };

  const handleDecline = async () => {
    if (!co || !declineReason.trim()) return;
    try {
      await declineCO.mutateAsync({ id: co.id, reason: declineReason.trim() });
      showToast({ message: `${co.coNumber} declined`, variant: 'success', duration: 3000 });
      setShowDeclineForm(false); setDeclineReason('');
    } catch {
      showToast({ message: 'Failed to decline', variant: 'error', duration: 3000 });
    }
  };

  const handleCancel = async () => {
    if (!co) return;
    try {
      await cancelCO.mutateAsync(co.id);
      showToast({ message: `${co.coNumber} cancelled`, variant: 'success', duration: 3000 });
    } catch {
      showToast({ message: 'Failed to cancel', variant: 'error', duration: 3000 });
    }
  };

  const handleRemoveLineItem = async (lineItemId: string) => {
    if (!co) return;
    try {
      await removeLineItem.mutateAsync({ changeOrderId: co.id, lineItemId });
    } catch {
      showToast({ message: 'Failed to remove line item', variant: 'error', duration: 3000 });
    }
  };

  if (isLoading || dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!co) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>Change order not found.</p>
          <Link href={`/production/jobs/${projectId}/change-orders`} style={{ fontSize: 11, color: COLOR, marginTop: 8, display: 'inline-block' }}>Back to list</Link>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[co.status] || 'var(--muted)';

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
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{co.coNumber}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    padding: '2px 6px', borderRadius: 4,
                    background: `${statusColor}18`, color: statusColor,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {STATUS_LABELS[co.status] || co.status}
                  </span>
                </div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{co.title}</h1>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{projectName} · {formatDate(co.metadata.createdAt)}</p>
              </div>
              <button
                onClick={() => setShowPDF(true)}
                style={{ minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--mid)' }}
                title="Download PDF"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 16 }}>

          {/* Description */}
          {co.description && (
            <p style={{ fontSize: 12, color: 'var(--mid)', lineHeight: 1.5, marginBottom: 16 }}>{co.description}</p>
          )}

          {/* Cost + Schedule + Initiator summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <span style={labelStyle}>Cost Impact</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: co.costImpact > 0 ? 'var(--green)' : co.costImpact < 0 ? 'var(--red)' : 'var(--charcoal)' }}>
                {co.costImpact >= 0 ? '+' : ''}{fmt(co.costImpact)}
              </span>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <span style={labelStyle}>Schedule</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>
                {co.scheduleImpactDays}d
              </span>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <span style={labelStyle}>Initiated By</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--charcoal)' }}>
                {CO_INITIATOR_LABEL[co.initiatorType] || co.initiatorType}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                Line Items ({lineItems.length})
              </span>
              {isDraft && !showAddLineItem && (
                <button
                  onClick={() => setShowAddLineItem(true)}
                  style={{ fontSize: 11, fontWeight: 600, color: COLOR, background: 'none', border: 'none', cursor: 'pointer', minHeight: 36, padding: '0 8px' }}
                >
                  + Add
                </button>
              )}
            </div>

            {lineItems.length === 0 && !showAddLineItem && (
              <div style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>No line items yet</p>
              </div>
            )}

            {lineItems.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {lineItems.map((li, idx) => (
                  <div
                    key={li.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderBottom: idx < lineItems.length - 1 ? '1px solid var(--border)' : 'none',
                      minHeight: 40,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--charcoal)', fontWeight: 500 }}>{li.description}</span>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{li.category}</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{li.estimatedHours}h</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)' }}>{fmt(li.estimatedTotal)}</span>
                      </div>
                    </div>
                    {isDraft && (
                      <button
                        onClick={() => handleRemoveLineItem(li.id)}
                        style={{ minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add line item form */}
            {showAddLineItem && (
              <div style={{ marginTop: 8, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" value={liDesc} onChange={(e) => setLiDesc(e.target.value)} placeholder="Description *" style={inputStyle} />
                <input type="text" value={liCategory} onChange={(e) => setLiCategory(e.target.value)} placeholder="Category (e.g. flooring)" style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input type="number" value={liHours} onChange={(e) => setLiHours(e.target.value)} placeholder="Hours" min="0" style={inputStyle} />
                  <input type="number" value={liMaterialCost} onChange={(e) => setLiMaterialCost(e.target.value)} placeholder="Material $" min="0" style={inputStyle} />
                  <input type="number" value={liLaborCost} onChange={(e) => setLiLaborCost(e.target.value)} placeholder="Labor $" min="0" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={resetLineItemForm} style={{ flex: 1, minHeight: 40, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLineItem}
                    disabled={!liDesc.trim() || addLineItem.isPending}
                    style={{
                      flex: 1, minHeight: 40, borderRadius: 6, border: 'none',
                      background: liDesc.trim() ? COLOR : 'var(--border)',
                      color: liDesc.trim() ? '#FFFFFF' : 'var(--muted)',
                      fontSize: 12, fontWeight: 600, cursor: liDesc.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {addLineItem.isPending ? 'Adding...' : 'Add Item'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Decline reason (if declined) */}
          {co.status === 'declined' && co.declinedReason && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--red)', borderLeftWidth: 3, marginBottom: 20 }}>
              <span style={{ ...labelStyle, color: 'var(--red)', marginBottom: 4 }}>Decline Reason</span>
              <p style={{ fontSize: 12, color: 'var(--charcoal)', lineHeight: 1.4 }}>{co.declinedReason}</p>
            </div>
          )}

          {/* Approval info */}
          {co.status === 'approved' && co.approvedAt && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--green)', borderLeftWidth: 3, marginBottom: 20 }}>
              <span style={{ ...labelStyle, color: 'var(--green)', marginBottom: 4 }}>Approved</span>
              <p style={{ fontSize: 12, color: 'var(--charcoal)', lineHeight: 1.4 }}>
                {co.approvedBy ? `By ${co.approvedBy} on ` : ''}{formatDate(co.approvedAt)}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {isDraft && (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={handleCancel}
                disabled={cancelCO.isPending}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--mid)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel CO
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitForApproval.isPending}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: 'none', background: COLOR, color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {submitForApproval.isPending ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          )}

          {isPending && !showDeclineForm && (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowDeclineForm(true)}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Decline
              </button>
              <button
                onClick={handleApprove}
                disabled={approveCO.isPending}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: 'none', background: 'var(--green)', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {approveCO.isPending ? 'Approving...' : 'Approve'}
              </button>
            </div>
          )}

          {isPending && showDeclineForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining..."
                rows={2}
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowDeclineForm(false); setDeclineReason(''); }} style={{ flex: 1, minHeight: 40, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Back
                </button>
                <button
                  onClick={handleDecline}
                  disabled={!declineReason.trim() || declineCO.isPending}
                  style={{
                    flex: 1, minHeight: 40, borderRadius: 6, border: 'none',
                    background: declineReason.trim() ? 'var(--red)' : 'var(--border)',
                    color: declineReason.trim() ? '#FFFFFF' : 'var(--muted)',
                    fontSize: 12, fontWeight: 600, cursor: declineReason.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {declineCO.isPending ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PDF modal */}
        {showPDF && (
          <div
            onClick={() => setShowPDF(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--surface)', borderRadius: 12,
                padding: 24, maxWidth: 400, width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>Download PDF</h3>
              <ChangeOrderPDF
                changeOrder={co}
                lineItems={lineItems}
                projectName={projectName}
              />
              <button
                onClick={() => setShowPDF(false)}
                style={{ marginTop: 12, width: '100%', minHeight: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </PageErrorBoundary>
  );
}
