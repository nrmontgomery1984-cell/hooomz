'use client';

/**
 * PurchaseOrdersTab — Operator PO review tab.
 * Shows POs grouped by WO with line items, approve/flag for retroactive.
 * Matches hooomz-expense-tracker.html artifact (operator view, POs panel).
 */

import { useState, useMemo } from 'react';
import {
  useJobPurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useVendors,
} from '@/lib/hooks/useExpenseTracker';
import type { PurchaseOrder, POLineItem } from '@/lib/repositories/purchaseOrder.repository';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PurchaseOrdersTabProps {
  jobId: string;
  defaultWoId?: string;
}

export function PurchaseOrdersTab({ jobId, defaultWoId }: PurchaseOrdersTabProps) {
  const { data: pos = [] } = useJobPurchaseOrders(jobId);
  const { data: vendors = [] } = useVendors();
  const updatePO = useUpdatePurchaseOrder();
  const createPO = useCreatePurchaseOrder();

  const vendorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of vendors) m.set(v.id, v.name);
    return m;
  }, [vendors]);

  // Group by WO
  const woGroups = useMemo(() => {
    const map = new Map<string, PurchaseOrder[]>();
    for (const po of pos) {
      const key = po.woId || 'unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(po);
    }
    return Array.from(map.entries()).map(([woId, items]) => ({
      woId,
      items,
      count: items.length,
    }));
  }, [pos]);

  // Create PO modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createWoId, setCreateWoId] = useState(defaultWoId || '');
  const [createVendorId, setCreateVendorId] = useState('');
  const [createStatus, setCreateStatus] = useState<'pre-authorized' | 'retroactive'>('pre-authorized');
  const [createLines, setCreateLines] = useState<POLineItem[]>([{ description: '', qty: 1, unit: 'ea', unitCost: 0 }]);
  const createTotal = createLines.reduce((s, l) => s + l.qty * l.unitCost, 0);

  const handleApprove = async (po: PurchaseOrder) => {
    await updatePO.mutateAsync({
      id: po.id,
      data: { approvalStatus: 'approved', approvedBy: 'nathan', approvedAt: new Date().toISOString() },
    });
  };

  const handleFlag = async (po: PurchaseOrder) => {
    await updatePO.mutateAsync({ id: po.id, data: { approvalStatus: 'flagged' } });
  };

  const addLine = () => setCreateLines([...createLines, { description: '', qty: 1, unit: 'ea', unitCost: 0 }]);
  const removeLine = (idx: number) => setCreateLines(createLines.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof POLineItem, value: string | number) => {
    const next = [...createLines];
    next[idx] = { ...next[idx], [field]: value };
    setCreateLines(next);
  };

  const handleCreatePO = async () => {
    if (!createVendorId || createLines.length === 0) return;
    await createPO.mutateAsync({
      jobId,
      woId: createWoId,
      vendorId: createVendorId,
      status: createStatus,
      lineItems: createLines,
      total: createTotal,
      receiptUploaded: false,
      createdBy: 'nathan',
    });
    setShowCreate(false);
    setCreateLines([{ description: '', qty: 1, unit: 'ea', unitCost: 0 }]);
    setCreateVendorId('');
  };

  return (
    <div className="space-y-7">
      {woGroups.map((group) => (
        <div key={group.woId}>
          <div className="flex items-center justify-between px-4 py-2.5 mb-0.5" style={{ background: 'var(--dark-nav)' }}>
            <div className="text-[10px] tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>
              {group.woId}
            </div>
            <div className="text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
              {group.count} PO{group.count !== 1 ? 's' : ''}
            </div>
          </div>

          {group.items.map((po) => (
            <div key={po.id} className="px-4 py-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none' }}>
              {/* PO header */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div>
                  <span
                    className="text-[10px] tracking-[0.08em] px-2 py-0.5 inline-block mb-1"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)', background: 'rgba(74,127,165,0.1)', border: '1px solid rgba(74,127,165,0.2)' }}
                  >
                    {po.id}
                  </span>
                  <div className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
                    {vendorMap.get(po.vendorId) || po.vendorId}
                  </div>
                </div>
                <span
                  className="text-[9px] font-medium tracking-[0.06em] uppercase px-2 py-1 flex-shrink-0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: po.status === 'pre-authorized' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)',
                    color: po.status === 'pre-authorized' ? 'var(--green)' : 'var(--amber)',
                    border: `1px solid ${po.status === 'pre-authorized' ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.2)'}`,
                  }}
                >
                  {po.status === 'pre-authorized' ? 'Pre-Authorized' : 'Retroactive' + (po.approvalStatus === 'pending' ? ' — Pending Review' : '')}
                </span>
              </div>

              {/* Line items */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div className="grid gap-2 text-[9px] uppercase tracking-[0.08em] mb-1" style={{ gridTemplateColumns: '1fr 60px 80px 80px 90px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  <div>Description</div><div>Qty</div><div>Unit</div><div>Unit Cost</div><div className="text-right">Total</div>
                </div>
                {po.lineItems.map((li, i) => (
                  <div key={i} className="grid gap-2 text-xs py-1" style={{ gridTemplateColumns: '1fr 60px 80px 80px 90px', color: 'var(--warm-mid, var(--charcoal))', borderBottom: i < po.lineItems.length - 1 ? '1px solid rgba(224,220,215,0.5)' : 'none' }}>
                    <div>{li.description}</div>
                    <div>{li.qty}</div>
                    <div>{li.unit}</div>
                    <div>{fmt(li.unitCost)}</div>
                    <div className="text-right font-medium" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(li.qty * li.unitCost)}</div>
                  </div>
                ))}
              </div>

              {/* PO total + actions */}
              <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>PO Total</div>
                <div className="flex items-center gap-3">
                  <div className="text-base font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>
                    {fmt(po.total)}
                  </div>
                  {po.status === 'retroactive' && po.approvalStatus === 'pending' && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApprove(po)}
                        className="px-3.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.06em]"
                        style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleFlag(po)}
                        className="px-3.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.06em]"
                        style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; }}
                      >
                        Flag
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add PO */}
          <button
            onClick={() => { setCreateWoId(group.woId); setShowCreate(true); }}
            className="w-full flex items-center gap-2 px-4 py-3 mt-2 text-[10px] font-medium uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-mono)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--muted)' }}
          >
            + Create Purchase Order
          </button>
        </div>
      ))}

      {woGroups.length === 0 && (
        <div className="text-center py-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>No purchase orders for this job yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 text-[10px] font-medium uppercase tracking-[0.08em] px-4 py-2"
            style={{ fontFamily: 'var(--font-mono)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--muted)' }}
          >
            + Create Purchase Order
          </button>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-5" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold" style={{ color: 'var(--charcoal)' }}>Create Purchase Order</span>
              <button onClick={() => setShowCreate(false)} className="text-sm" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Vendor</label>
                <select value={createVendorId} onChange={(e) => setCreateVendorId(e.target.value)} className="w-full h-10 px-3 text-sm" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}>
                  <option value="">Select vendor...</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Status</label>
                <div className="flex gap-2">
                  {(['pre-authorized', 'retroactive'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setCreateStatus(s)}
                      className="flex-1 h-10 text-[10px] font-medium uppercase tracking-[0.04em]"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        background: createStatus === s ? 'var(--charcoal)' : 'var(--surface)',
                        color: createStatus === s ? '#fff' : 'var(--muted)',
                        border: `1px solid ${createStatus === s ? 'var(--charcoal)' : 'var(--border)'}`,
                      }}
                    >
                      {s === 'pre-authorized' ? 'Pre-Authorized' : 'Retroactive'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Line Items</label>
                {createLines.map((li, i) => (
                  <div key={i} className="grid gap-2 mb-2" style={{ gridTemplateColumns: '1fr 60px 60px 80px 28px' }}>
                    <input type="text" value={li.description} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="Description" className="h-8 px-2 text-xs" style={{ border: '1px solid var(--border)', outline: 'none' }} />
                    <input type="number" value={li.qty || ''} onChange={(e) => updateLine(i, 'qty', Number(e.target.value))} placeholder="Qty" className="h-8 px-2 text-xs text-right" style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', outline: 'none' }} />
                    <input type="text" value={li.unit} onChange={(e) => updateLine(i, 'unit', e.target.value)} placeholder="Unit" className="h-8 px-2 text-xs" style={{ border: '1px solid var(--border)', outline: 'none' }} />
                    <input type="number" value={li.unitCost || ''} onChange={(e) => updateLine(i, 'unitCost', Number(e.target.value))} placeholder="$/unit" step="0.01" className="h-8 px-2 text-xs text-right" style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', outline: 'none' }} />
                    <button onClick={() => removeLine(i)} className="h-8 text-xs" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}>×</button>
                  </div>
                ))}
                <button onClick={addLine} className="text-[10px] font-medium px-3 py-1.5" style={{ fontFamily: 'var(--font-mono)', border: '1px dashed var(--border)', background: 'none', color: 'var(--blue)' }}>+ Add Line</button>
                <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>Total</span>
                  <span className="text-base font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{fmt(createTotal)}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 h-10 text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Cancel</button>
                <button onClick={handleCreatePO} disabled={!createVendorId || createPO.isPending} className="flex-1 h-10 text-[11px] font-medium text-white" style={{ fontFamily: 'var(--font-mono)', background: 'var(--charcoal)', border: 'none', opacity: createVendorId ? 1 : 0.5 }}>
                  {createPO.isPending ? 'Creating...' : 'Create PO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
