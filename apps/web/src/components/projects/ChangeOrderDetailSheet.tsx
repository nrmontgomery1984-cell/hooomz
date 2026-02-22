'use client';

/**
 * ChangeOrderDetailSheet — View/manage a single Change Order
 * Shows info, line items, and status-dependent actions (submit, approve, decline, cancel)
 */

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  useChangeOrderWithLineItems,
  useAddChangeOrderLineItem,
  useSubmitForApproval,
  useApproveChangeOrder,
  useDeclineChangeOrder,
  useCancelChangeOrder,
  useRemoveChangeOrderLineItem,
} from '@/lib/hooks/useIntegrationData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useToast } from '@/components/ui/Toast';
import type { ChangeOrderStatus } from '@hooomz/shared-contracts';

interface ChangeOrderDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  changeOrderId: string;
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'var(--green, #10B981)',
  pending_approval: 'var(--amber, #F59E0B)',
  declined: 'var(--red, #EF4444)',
  draft: 'var(--text-3, #9CA3AF)',
  cancelled: 'var(--text-3, #9CA3AF)',
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'Approved',
  pending_approval: 'Pending Approval',
  declined: 'Declined',
  draft: 'Draft',
  cancelled: 'Cancelled',
};

const INITIATOR_LABELS: Record<string, string> = {
  client_request: 'Client Request',
  contractor_recommendation: 'Contractor Recommendation',
  site_condition: 'Site Condition',
  sub_trade: 'Sub-Trade',
};

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  borderRadius: 8,
  border: '1px solid var(--border, #E5E7EB)',
  background: 'var(--surface-1, #FFFFFF)',
  color: 'var(--text, #111827)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-3, #9CA3AF)',
  marginBottom: 2,
  fontFamily: 'var(--font-cond)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export function ChangeOrderDetailSheet({ isOpen, onClose, changeOrderId }: ChangeOrderDetailSheetProps) {
  const { data, isLoading } = useChangeOrderWithLineItems(changeOrderId);
  const addLineItem = useAddChangeOrderLineItem();
  const submitForApproval = useSubmitForApproval();
  const approveCO = useApproveChangeOrder();
  const declineCO = useDeclineChangeOrder();
  const cancelCO = useCancelChangeOrder();
  const removeLineItem = useRemoveChangeOrderLineItem();
  const { crewMemberId } = useActiveCrew();
  const { showToast } = useToast();

  // Line item form state
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [liDesc, setLiDesc] = useState('');
  const [liCategory, setLiCategory] = useState('');
  const [liHours, setLiHours] = useState('');
  const [liMaterialCost, setLiMaterialCost] = useState('');
  const [liLaborCost, setLiLaborCost] = useState('');

  // Decline state
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  if (!isOpen) return null;

  const co = data?.changeOrder;
  const lineItems = data?.lineItems ?? [];
  const status = co?.status as ChangeOrderStatus | undefined;
  const isDraft = status === 'draft';
  const isPending = status === 'pending_approval';

  const resetLineItemForm = () => {
    setLiDesc('');
    setLiCategory('');
    setLiHours('');
    setLiMaterialCost('');
    setLiLaborCost('');
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
      setShowDeclineForm(false);
      setDeclineReason('');
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

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={co ? `${co.coNumber} — ${co.title}` : 'Change Order'}>
      {isLoading || !co ? (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              color: STATUS_COLORS[co.status] || 'var(--text-3)',
              background: 'var(--surface-3, #F3F4F6)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[co.status] }} />
              {STATUS_LABELS[co.status] || co.status}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {INITIATOR_LABELS[co.initiatorType] || co.initiatorType}
            </span>
          </div>

          {/* Description */}
          {co.description && (
            <p style={{ fontSize: 12, color: 'var(--text-2, #6B7280)', lineHeight: 1.5 }}>
              {co.description}
            </p>
          )}

          {/* Cost + Schedule summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--surface-3, #F3F4F6)', borderRadius: 8, padding: '10px 12px' }}>
              <span style={labelStyle}>Cost Impact</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {fmt(co.costImpact)}
              </span>
            </div>
            <div style={{ background: 'var(--surface-3, #F3F4F6)', borderRadius: 8, padding: '10px 12px' }}>
              <span style={labelStyle}>Schedule Impact</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {co.scheduleImpactDays}d
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ ...labelStyle, marginBottom: 0 }}>
                Line Items ({lineItems.length})
              </span>
              {isDraft && !showAddLineItem && (
                <button
                  onClick={() => setShowAddLineItem(true)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#0F766E',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: 36,
                    padding: '0 8px',
                  }}
                >
                  + Add
                </button>
              )}
            </div>

            {lineItems.length === 0 && !showAddLineItem && (
              <p style={{ fontSize: 11, color: 'var(--text-3)', padding: '8px 0' }}>No line items yet</p>
            )}

            {lineItems.map((li) => (
              <div
                key={li.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border, #E5E7EB)',
                  minHeight: 36,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{li.description}</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{li.category}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{li.estimatedHours}h</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)' }}>{fmt(li.estimatedTotal)}</span>
                  </div>
                </div>
                {isDraft && (
                  <button
                    onClick={() => handleRemoveLineItem(li.id)}
                    style={{ minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red, #EF4444)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}

            {/* Add line item form */}
            {showAddLineItem && (
              <div style={{ marginTop: 8, padding: 12, borderRadius: 8, border: '1px solid var(--border, #E5E7EB)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" value={liDesc} onChange={(e) => setLiDesc(e.target.value)} placeholder="Description *" style={inputStyle} />
                <input type="text" value={liCategory} onChange={(e) => setLiCategory(e.target.value)} placeholder="Category (e.g. flooring)" style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input type="number" value={liHours} onChange={(e) => setLiHours(e.target.value)} placeholder="Hours" min="0" style={inputStyle} />
                  <input type="number" value={liMaterialCost} onChange={(e) => setLiMaterialCost(e.target.value)} placeholder="Material $" min="0" style={inputStyle} />
                  <input type="number" value={liLaborCost} onChange={(e) => setLiLaborCost(e.target.value)} placeholder="Labor $" min="0" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={resetLineItemForm} style={{ flex: 1, minHeight: 40, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLineItem}
                    disabled={!liDesc.trim() || addLineItem.isPending}
                    style={{
                      flex: 1, minHeight: 40, borderRadius: 6, border: 'none',
                      background: liDesc.trim() ? '#0F766E' : 'var(--border)',
                      color: liDesc.trim() ? '#FFFFFF' : 'var(--text-3)',
                      fontSize: 12, fontWeight: 600, cursor: liDesc.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {addLineItem.isPending ? 'Adding...' : 'Add Item'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isDraft && (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={handleCancel}
                disabled={cancelCO.isPending}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel CO
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitForApproval.isPending}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: 'none', background: '#0F766E', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {submitForApproval.isPending ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          )}

          {isPending && !showDeclineForm && (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowDeclineForm(true)}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: '1px solid var(--red, #EF4444)', background: 'transparent', color: 'var(--red, #EF4444)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Decline
              </button>
              <button
                onClick={handleApprove}
                disabled={approveCO.isPending}
                style={{ flex: 1, minHeight: 44, borderRadius: 8, border: 'none', background: 'var(--green, #10B981)', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
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
                <button onClick={() => { setShowDeclineForm(false); setDeclineReason(''); }} style={{ flex: 1, minHeight: 40, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Back
                </button>
                <button
                  onClick={handleDecline}
                  disabled={!declineReason.trim() || declineCO.isPending}
                  style={{
                    flex: 1, minHeight: 40, borderRadius: 6, border: 'none',
                    background: declineReason.trim() ? 'var(--red, #EF4444)' : 'var(--border)',
                    color: declineReason.trim() ? '#FFFFFF' : 'var(--text-3)',
                    fontSize: 12, fontWeight: 600, cursor: declineReason.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {declineCO.isPending ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}

          {co.status === 'declined' && co.declinedReason && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--red-dim, #FEF2F2)', border: '1px solid var(--red, #EF4444)', borderLeftWidth: 3 }}>
              <span style={{ ...labelStyle, color: 'var(--red, #EF4444)', marginBottom: 4 }}>Decline Reason</span>
              <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{co.declinedReason}</p>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
