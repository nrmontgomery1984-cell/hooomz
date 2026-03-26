'use client';

/**
 * Quotes — /sales/quotes
 *
 * Sales pipeline stage: client-facing proposals with estimate breakdown.
 * Reads from quotes IndexedDB store.
 * Links to /sales/quotes/[id] for the full quote detail view.
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  X,
  Search,
  DollarSign,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useQuotes, useCreateQuote } from '@/lib/hooks/useQuotes';
import { useCustomers, useCustomerSearch } from '@/lib/hooks/useCustomersV2';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import type { QuoteStatus, CustomerRecord } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.sales;

type FilterTab = QuoteStatus | 'all';

const STATUS_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

const STATUS_BADGE: Record<QuoteStatus, { bg: string; text: string; label: string; icon: typeof FileText }> = {
  draft:    { bg: 'var(--surface-2)', text: 'var(--muted)', label: 'Draft',    icon: FileText },
  sent:     { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Sent',     icon: Send },
  viewed:   { bg: 'var(--yellow-bg)', text: 'var(--yellow)', label: 'Viewed',   icon: Eye },
  accepted: { bg: 'var(--green-bg)', text: 'var(--green)', label: 'Accepted', icon: CheckCircle2 },
  declined: { bg: 'var(--red-bg)', text: 'var(--red)', label: 'Declined', icon: XCircle },
  expired:  { bg: 'var(--surface-2)', text: 'var(--muted)', label: 'Expired',  icon: Clock },
};

// ============================================================================
// Page
// ============================================================================

export default function QuotesPage() {
  const [statusFilter, setStatusFilter] = useState<FilterTab>('all');
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: allQuotes = [], isLoading } = useQuotes();
  const { data: allCustomers = [] } = useCustomers();
  const { data: projectData } = useLocalProjects();
  const allProjects = projectData?.projects ?? [];

  // Build customer lookup
  const customerMap = useMemo(() => {
    const map = new Map<string, CustomerRecord>();
    for (const c of allCustomers) map.set(c.id, c);
    return map;
  }, [allCustomers]);

  // Build project name lookup
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allProjects) map.set(p.id, p.name || p.id);
    return map;
  }, [allProjects]);

  const filteredQuotes = statusFilter === 'all'
    ? allQuotes
    : allQuotes.filter((q) => q.status === statusFilter);

  // Counts per status
  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = {
      all: allQuotes.length, draft: 0, sent: 0, viewed: 0,
      accepted: 0, declined: 0, expired: 0,
    };
    for (const q of allQuotes) {
      if (q.status in c) c[q.status as QuoteStatus]++;
    }
    return c;
  }, [allQuotes]);

  // Summary strip totals
  const summaryStats = useMemo(() => {
    const active = allQuotes.filter((q) => q.status === 'draft' || q.status === 'sent' || q.status === 'viewed');
    const accepted = allQuotes.filter((q) => q.status === 'accepted');
    return {
      activeCount: active.length,
      activeTotal: active.reduce((sum, q) => sum + q.totalAmount, 0),
      acceptedCount: accepted.length,
      acceptedTotal: accepted.reduce((sum, q) => sum + q.totalAmount, 0),
      totalQuotes: allQuotes.length,
      totalValue: allQuotes.reduce((sum, q) => sum + q.totalAmount, 0),
    };
  }, [allQuotes]);

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                  Quotes
                </h1>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Client-facing proposals and video walkthroughs
              </p>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
              style={{ background: 'var(--green)' }}
              title="New Quote"
            >
              <Plus size={18} color="#fff" strokeWidth={2.5} />
            </button>
          </div>

          {/* Summary strip */}
          {allQuotes.length > 0 && (
            <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 pb-3">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <SummaryChip label="Active" count={summaryStats.activeCount} value={summaryStats.activeTotal} color={COLOR} />
                <SummaryChip label="Accepted" count={summaryStats.acceptedCount} value={summaryStats.acceptedTotal} color="var(--green)" />
                <SummaryChip label="Total" count={summaryStats.totalQuotes} value={summaryStats.totalValue} color="var(--mid)" />
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 pb-3">
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  style={{
                    minHeight: 30, padding: '0 12px',
                    borderRadius: 'var(--radius)', fontSize: 11,
                    fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                    background: statusFilter === tab.value ? COLOR : 'var(--bg)',
                    color: statusFilter === tab.value ? '#FFFFFF' : 'var(--muted)',
                    border: statusFilter === tab.value ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label} ({counts[tab.value]})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* New Quote Form */}
          {showNewForm && (
            <NewQuoteForm
              customers={allCustomers}
              projects={allProjects}
              onCreated={() => setShowNewForm(false)}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredQuotes.length === 0 && (
            <div style={{ marginTop: 48, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <FileText size={24} style={{ color: COLOR }} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>No quotes yet</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Create a quote from an existing estimate to send to your customer.
              </p>
            </div>
          )}

          {/* Quote cards */}
          {!isLoading && filteredQuotes.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredQuotes.map((quote) => {
                const badge = STATUS_BADGE[quote.status];
                const BadgeIcon = badge.icon;
                const customer = customerMap.get(quote.customerId);
                const customerName = customer
                  ? `${customer.firstName} ${customer.lastName}`.trim()
                  : 'Unknown Customer';
                const projectName = projectNameMap.get(quote.projectId) || quote.projectId;

                return (
                  <Link
                    key={quote.id}
                    href={`/sales/quotes/${quote.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      padding: '12px 14px', borderRadius: 'var(--radius)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-card)',
                    }}>
                      {/* Top row: customer + amount + status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: COLOR }}>
                            {customerName}
                          </span>
                          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                            {projectName}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono, monospace)' }}>
                            ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 4,
                            background: badge.bg, color: badge.text,
                          }}>
                            <BadgeIcon size={10} /> {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Timeline row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
                          <Clock size={10} />
                          Created {new Date(quote.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {quote.sentAt && (
                          <span style={{ fontSize: 10, color: 'var(--blue)' }}>
                            Sent {new Date(quote.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {quote.viewedAt && (
                          <span style={{ fontSize: 10, color: 'var(--yellow)' }}>
                            Viewed {new Date(quote.viewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {quote.respondedAt && (
                          <span style={{ fontSize: 10, color: quote.status === 'accepted' ? 'var(--green)' : 'var(--red)' }}>
                            {quote.status === 'accepted' ? 'Accepted' : 'Declined'} {new Date(quote.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {quote.expiresAt && quote.status !== 'accepted' && quote.status !== 'declined' && (
                          <span style={{ fontSize: 10, color: new Date(quote.expiresAt) < new Date() ? 'var(--red)' : 'var(--muted)' }}>
                            Expires {new Date(quote.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Cover notes preview */}
                      {quote.coverNotes && (
                        <p style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {quote.coverNotes.length > 80 ? quote.coverNotes.slice(0, 77) + '...' : quote.coverNotes}
                        </p>
                      )}

                      {/* Action arrow */}
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: COLOR }}>
                        View Quote <ChevronRight size={12} />
                      </div>
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

// ============================================================================
// Summary Chip
// ============================================================================

function SummaryChip({ label, count, value, color }: { label: string; count: number; value: number; color: string }) {
  return (
    <div style={{
      padding: '6px 12px', borderRadius: 'var(--radius)',
      background: 'var(--bg)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-mono, monospace)' }}>
        {count}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--mid)', fontFamily: 'var(--font-mono, monospace)' }}>
        ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

// ============================================================================
// New Quote Form (inline)
// ============================================================================

interface ProjectLike {
  id: string;
  name?: string;
  customerId?: string;
  status?: string;
}

function NewQuoteForm({
  customers,
  projects,
  onCreated,
  onCancel,
}: {
  customers: CustomerRecord[];
  projects: ProjectLike[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const createQuote = useCreateQuote();
  const { services } = useServicesContext();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [coverNotes, setCoverNotes] = useState('');
  const [estimateTotal, setEstimateTotal] = useState<number | null>(null);
  const [loadingTotal, setLoadingTotal] = useState(false);

  // Search customers
  const searchResults = useCustomerSearch(customerSearch);
  const customerOptions = customerSearch.trim()
    ? (searchResults.data ?? [])
    : customers.slice(0, 10);

  // Filter projects by selected customer
  const customerProjects = useMemo(() => {
    if (!selectedCustomerId) return [];
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return [];
    return projects.filter((p) => p.customerId === selectedCustomerId || customer.jobIds.includes(p.id));
  }, [selectedCustomerId, customers, projects]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Load estimate total when project is selected
  useEffect(() => {
    if (!selectedProjectId || !services) {
      setEstimateTotal(null);
      return;
    }
    let cancelled = false;
    setLoadingTotal(true);
    services.estimating.lineItems.calculateProjectTotals(selectedProjectId).then((totals) => {
      if (!cancelled) {
        setEstimateTotal(totals.totalCost);
        setLoadingTotal(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setEstimateTotal(0);
        setLoadingTotal(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedProjectId, services]);

  const canSubmit = !!selectedCustomerId && !!selectedProjectId && estimateTotal !== null;

  const handleSubmit = async () => {
    if (!canSubmit || createQuote.isPending) return;

    // Default expiry: 30 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);

    await createQuote.mutateAsync({
      customerId: selectedCustomerId!,
      projectId: selectedProjectId!,
      totalAmount: estimateTotal ?? 0,
      status: 'draft',
      sentAt: null,
      viewedAt: null,
      respondedAt: null,
      expiresAt: expiresAt || defaultExpiry.toISOString(),
      coverNotes: coverNotes.trim(),
      videoLink: '',
      declineReason: '',
    });
    onCreated();
  };

  const inputStyle = {
    width: '100%', minHeight: 34, padding: '0 10px',
    borderRadius: 'var(--radius)', fontSize: 12,
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--charcoal)', outline: 'none',
  };

  return (
    <div style={{
      marginTop: 12, padding: 16, borderRadius: 'var(--radius)',
      background: 'var(--surface)', border: `2px solid ${COLOR}40`,
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLOR }}>
          New Quote
        </span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>

        {/* Customer selector */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Customer *</label>
          {selectedCustomer ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 'var(--radius)', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)' }}>
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </span>
              <button onClick={() => { setSelectedCustomerId(null); setSelectedProjectId(null); setEstimateTotal(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  style={{ ...inputStyle, paddingLeft: 26 }}
                />
              </div>
              {customerOptions.length > 0 && (
                <div style={{ marginTop: 4, maxHeight: 120, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
                  {customerOptions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomerId(c.id); setCustomerSearch(''); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '6px 10px', fontSize: 12, color: 'var(--charcoal)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {c.firstName} {c.lastName}
                      {c.propertyCity && <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 10 }}>{c.propertyCity}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project/estimate selector */}
        {selectedCustomerId && (
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Estimate (Project) *</label>
            {customerProjects.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--muted)', padding: '6px 0' }}>No projects linked to this customer yet</p>
            ) : (
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select estimate/project...</option>
                {customerProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.id}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Estimate total preview */}
        {selectedProjectId && (
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <DollarSign size={14} style={{ color: COLOR }} />
            <div>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Quote Total (from estimate)</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono, monospace)' }}>
                {loadingTotal ? 'Loading...' : `$${(estimateTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
        )}

        {/* Expiry date */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Expires (default: 30 days)</label>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')} style={inputStyle} />
        </div>

        {/* Cover notes */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Cover Notes (optional)</label>
          <textarea
            value={coverNotes}
            onChange={(e) => setCoverNotes(e.target.value)}
            placeholder="Introduction message for the customer..."
            rows={2}
            style={{ ...inputStyle, minHeight: 56, padding: '8px 10px', resize: 'vertical' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onCancel} style={{ flex: 1, minHeight: 36, borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createQuote.isPending}
          style={{ flex: 1, minHeight: 36, borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, background: COLOR, color: '#FFFFFF', border: 'none', cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit && !createQuote.isPending ? 1 : 0.5 }}
        >
          {createQuote.isPending ? 'Creating...' : 'Create Draft'}
        </button>
      </div>
    </div>
  );
}
