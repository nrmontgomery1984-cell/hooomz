'use client';

/**
 * Change Orders — Master list at /production/change-orders
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import type { ChangeOrder, ChangeOrderStatus, ChangeOrderInitiatorType } from '@hooomz/shared-contracts';
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

const ROW_OPACITY: Record<string, number> = {
  pending_approval: 1.0,
  draft: 0.85,
  approved: 0.75,
  declined: 0.6,
  cancelled: 0.4,
};

type StatusFilter = 'all' | ChangeOrderStatus;
type InitiatorFilter = 'all' | ChangeOrderInitiatorType;

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

export default function ChangeOrdersPage() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  const dashboard = useDashboardData();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [initiatorFilter, setInitiatorFilter] = useState<InitiatorFilter>('all');

  // Load all COs from storage
  const { data: allCOs = [], isLoading } = useQuery({
    queryKey: ['integration', 'changeOrders', 'all'],
    queryFn: async () => {
      return services!.storage.getAll<ChangeOrder>('changeOrders');
    },
    enabled: !servicesLoading && !!services,
    staleTime: 10_000,
  });

  // Build project name map
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of dashboard.allProjects) {
      map.set(p.id, (p as Record<string, unknown>).name as string || p.id.slice(0, 8));
    }
    for (const p of dashboard.activeProjects) {
      map.set(p.id, p.name);
    }
    return map;
  }, [dashboard.allProjects, dashboard.activeProjects]);

  // Stats
  const pendingCount = allCOs.filter((co) => co.status === 'pending_approval').length;
  const approvedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return allCOs
      .filter((co) => co.status === 'approved' && co.approvedAt && co.approvedAt >= monthStart)
      .reduce((sum, co) => sum + co.costImpact, 0);
  }, [allCOs]);

  // Filter
  const filtered = useMemo(() => {
    let list = allCOs;
    if (statusFilter !== 'all') list = list.filter((co) => co.status === statusFilter);
    if (initiatorFilter !== 'all') list = list.filter((co) => co.initiatorType === initiatorFilter);
    return list.sort((a, b) => b.metadata.createdAt.localeCompare(a.metadata.createdAt));
  }, [allCOs, statusFilter, initiatorFilter]);

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
                href="/production"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                <ArrowLeft size={18} />
              </Link>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)' }}>Change Orders</h1>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Out-of-scope work discovered during Clear phase</p>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: pendingCount > 0 ? 'var(--amber)' : 'var(--charcoal)' }}>{pendingCount}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pending</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{formatCurrency(approvedThisMonth)}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approved this month</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{allCOs.length}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total COs</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 14 }}>

          {/* Status filters */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>Status</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <Pill label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
              <Pill label={`Pending (${pendingCount})`} active={statusFilter === 'pending_approval'} onClick={() => setStatusFilter(statusFilter === 'pending_approval' ? 'all' : 'pending_approval')} />
              <Pill label="Approved" active={statusFilter === 'approved'} onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')} />
              <Pill label="Draft" active={statusFilter === 'draft'} onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')} />
              <Pill label="Rejected" active={statusFilter === 'declined'} onClick={() => setStatusFilter(statusFilter === 'declined' ? 'all' : 'declined')} />
            </div>
          </div>

          {/* Initiator filters */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>Initiated By</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <Pill label="All" active={initiatorFilter === 'all'} onClick={() => setInitiatorFilter('all')} />
              {(['client_request', 'contractor_recommendation', 'sub_trade', 'site_condition'] as ChangeOrderInitiatorType[]).map((type) => (
                <Pill key={type} label={CO_INITIATOR_LABEL[type]} active={initiatorFilter === type} onClick={() => setInitiatorFilter(initiatorFilter === type ? 'all' : type)} />
              ))}
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <FileText size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>No change orders yet.</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Change orders will appear here when created on a job.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((co) => {
                const statusColor = STATUS_COLORS[co.status] || 'var(--muted)';
                const opacity = ROW_OPACITY[co.status] ?? 1;
                const deltaColor = co.costImpact > 0 ? 'var(--green)' : co.costImpact < 0 ? 'var(--red)' : 'var(--muted)';
                const projectName = projectNameMap.get(co.projectId) || 'Unknown Job';

                return (
                  <Link
                    key={co.id}
                    href={`/production/jobs/${co.projectId}/change-orders/${co.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 'var(--radius)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-card)', cursor: 'pointer', width: '100%',
                      textAlign: 'left', textDecoration: 'none', opacity,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', flexShrink: 0 }}>{co.coNumber}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {co.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>{projectName}</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>·</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>{formatDate(co.metadata.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: `${statusColor}18`, color: statusColor }}>
                        {CO_INITIATOR_LABEL[co.initiatorType] || co.initiatorType}
                      </span>
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
