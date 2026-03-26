'use client';

/**
 * Per-Job Change Orders — /production/jobs/[id]/change-orders
 * Lists all COs for a specific job with create + detail actions.
 */

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, ChevronRight, FileText, Plus } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useChangeOrders, useProjectBudget } from '@/lib/hooks/useIntegrationData';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import type { ChangeOrderStatus } from '@hooomz/shared-contracts';
import { CO_INITIATOR_LABEL } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.production;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'var(--green)',
  pending_approval: 'var(--amber)',
  declined: 'var(--red)',
  draft: 'var(--muted)',
  cancelled: 'var(--muted)',
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending',
  approved: 'Approved',
  declined: 'Rejected',
  draft: 'Draft',
  cancelled: 'Void',
};

type StatusFilter = 'all' | ChangeOrderStatus;

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 99, flexShrink: 0,
        border: `1.5px solid ${active ? COLOR : 'var(--border)'}`,
        background: active ? `${COLOR}18` : 'var(--surface)',
        color: active ? COLOR : 'var(--muted)',
        fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {label}
    </button>
  );
}

export default function JobChangeOrdersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const dashboard = useDashboardData();

  const { data: changeOrders = [], isLoading } = useChangeOrders(projectId);
  const { data: budgetImpact } = useProjectBudget(projectId);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const projectName = useMemo(() => {
    for (const p of dashboard.activeProjects) {
      if (p.id === projectId) return p.name;
    }
    for (const p of dashboard.allProjects) {
      if (p.id === projectId) return (p as Record<string, unknown>).name as string || p.id.slice(0, 8);
    }
    return projectId.slice(0, 8);
  }, [dashboard.activeProjects, dashboard.allProjects, projectId]);

  const pendingCount = changeOrders.filter((co) => co.status === 'pending_approval').length;

  const filtered = useMemo(() => {
    let list = changeOrders;
    if (statusFilter !== 'all') list = list.filter((co) => co.status === statusFilter);
    return list.sort((a, b) => b.metadata.createdAt.localeCompare(a.metadata.createdAt));
  }, [changeOrders, statusFilter]);

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

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href={`/projects/${projectId}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                <ArrowLeft size={18} />
              </Link>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)' }}>Change Orders</h1>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{projectName}</p>
              </div>
              <Link
                href={`/production/jobs/${projectId}/change-orders/new`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 36, minHeight: 36, borderRadius: 8,
                  background: COLOR, color: '#fff', textDecoration: 'none',
                }}
              >
                <Plus size={16} />
              </Link>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: pendingCount > 0 ? 'var(--amber)' : 'var(--charcoal)' }}>{pendingCount}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pending</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{formatCurrency(budgetImpact?.approved ?? 0)}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approved</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{changeOrders.length}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 14 }}>

          {/* Status filters */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <Pill label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
              <Pill label={`Pending (${pendingCount})`} active={statusFilter === 'pending_approval'} onClick={() => setStatusFilter(statusFilter === 'pending_approval' ? 'all' : 'pending_approval')} />
              <Pill label="Approved" active={statusFilter === 'approved'} onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')} />
              <Pill label="Draft" active={statusFilter === 'draft'} onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')} />
              <Pill label="Rejected" active={statusFilter === 'declined'} onClick={() => setStatusFilter(statusFilter === 'declined' ? 'all' : 'declined')} />
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <FileText size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>No change orders yet.</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Tap + to create one.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((co) => {
                const statusColor = STATUS_COLORS[co.status] || 'var(--muted)';
                const deltaColor = co.costImpact > 0 ? 'var(--green)' : co.costImpact < 0 ? 'var(--red)' : 'var(--muted)';

                return (
                  <Link
                    key={co.id}
                    href={`/production/jobs/${projectId}/change-orders/${co.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 'var(--radius)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-card)', cursor: 'pointer', width: '100%',
                      textAlign: 'left', textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', flexShrink: 0 }}>{co.coNumber}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {co.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>{CO_INITIATOR_LABEL[co.initiatorType] || co.initiatorType}</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>·</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>{formatDate(co.metadata.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: `${statusColor}18`, color: statusColor }}>
                        {STATUS_LABELS[co.status] || co.status}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: deltaColor }}>
                        {co.costImpact >= 0 ? '+' : ''}{formatCurrency(co.costImpact)}
                      </span>
                      <ChevronRight size={14} style={{ color: 'var(--border)' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
