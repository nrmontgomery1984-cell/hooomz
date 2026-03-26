'use client';

/**
 * Consultations — /sales/consultations
 *
 * Sales pipeline stage: site visits and discovery sessions.
 * Reads from consultations IndexedDB store.
 * Links out to /discovery/[projectId] for the existing discovery flow.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  ClipboardList,
  MapPin,
  ChevronRight,
  X,
  Search,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useConsultations, useCreateConsultation } from '@/lib/hooks/useConsultations';
import { useCustomers, useCustomerSearch } from '@/lib/hooks/useCustomersV2';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { SalesChecklist } from '@/components/sales/SalesChecklist';
import type { ConsultationStatus, CustomerRecord } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.sales;

const STATUS_TABS: { value: ConsultationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<ConsultationStatus, { bg: string; text: string; label: string; icon: typeof Calendar }> = {
  scheduled: { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Scheduled', icon: Calendar },
  completed: { bg: 'var(--green-bg)', text: 'var(--green)', label: 'Completed', icon: CheckCircle2 },
  cancelled: { bg: 'var(--surface-2)', text: 'var(--muted)', label: 'Cancelled', icon: XCircle },
};

// ============================================================================
// Page
// ============================================================================

export default function ConsultationsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | 'all'>('all');
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: allConsultations = [], isLoading } = useConsultations();
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

  const filteredConsultations = statusFilter === 'all'
    ? allConsultations
    : allConsultations.filter((c) => c.status === statusFilter);

  // Counts per status
  const counts = useMemo(() => {
    const c = { all: allConsultations.length, scheduled: 0, completed: 0, cancelled: 0 };
    for (const consult of allConsultations) {
      if (consult.status in c) c[consult.status as ConsultationStatus]++;
    }
    return c;
  }, [allConsultations]);

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
                  Consultations
                </h1>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Site visits and discovery sessions
              </p>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
              style={{ background: COLOR }}
              title="Schedule Consultation"
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 pb-3">
            <div style={{ display: 'flex', gap: 6 }}>
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

          {/* New Consultation Form */}
          {showNewForm && (
            <ScheduleConsultationForm
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
          {!isLoading && filteredConsultations.length === 0 && (
            <div style={{ marginTop: 48, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ClipboardList size={24} style={{ color: COLOR }} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>No consultations yet</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Consultations are booked from a lead or created when discovery is completed.
              </p>
            </div>
          )}

          {/* Consultation cards */}
          {!isLoading && filteredConsultations.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredConsultations.map((consult) => {
                const badge = STATUS_BADGE[consult.status];
                const BadgeIcon = badge.icon;
                const customer = customerMap.get(consult.customerId);
                const customerName = customer
                  ? `${customer.firstName} ${customer.lastName}`.trim()
                  : 'Unknown Customer';
                const projectName = projectNameMap.get(consult.projectId) || consult.projectId;

                return (
                  <div
                    key={consult.id}
                    style={{
                      padding: '12px 14px', borderRadius: 'var(--radius)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {/* Top row: customer + status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ minWidth: 0 }}>
                        <Link
                          href={`/customers/${consult.customerId}`}
                          style={{ fontSize: 13, fontWeight: 600, color: COLOR, textDecoration: 'none' }}
                        >
                          {customerName}
                        </Link>
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                          {projectName}
                        </p>
                      </div>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: 4,
                        background: badge.bg, color: badge.text, flexShrink: 0,
                      }}>
                        <BadgeIcon size={10} /> {badge.label}
                      </span>
                    </div>

                    {/* Date + address */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--mid)' }}>
                        <Calendar size={10} style={{ color: 'var(--muted)' }} />
                        {consult.scheduledDate
                          ? new Date(consult.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Date TBD'}
                      </span>
                      {customer?.propertyAddress && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--mid)' }}>
                          <MapPin size={10} style={{ color: 'var(--muted)' }} />
                          {customer.propertyAddress}{customer.propertyCity ? `, ${customer.propertyCity}` : ''}
                        </span>
                      )}
                      {consult.completedDate && (
                        <span style={{ fontSize: 10, color: 'var(--green)' }}>
                          Completed {new Date(consult.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Scope notes preview */}
                    {consult.scopeNotes && (
                      <p style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {consult.scopeNotes.length > 80 ? consult.scopeNotes.slice(0, 77) + '...' : consult.scopeNotes}
                      </p>
                    )}

                    {/* Sales Checklist */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <SalesChecklist
                        entityType="consultation"
                        entityId={consult.id}
                        completions={consult.checklistCompletions}
                      />
                    </div>

                    {/* Action link */}
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => router.push(`/discovery/${consult.projectId}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600, color: COLOR, fontFamily: 'var(--font-mono)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        }}
                      >
                        {consult.status === 'completed' ? 'View Discovery' : 'Open Discovery'} <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
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
// Schedule Consultation Form (inline)
// ============================================================================

interface ProjectLike {
  id: string;
  name?: string;
  customerId?: string;
}

function ScheduleConsultationForm({
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
  const createConsultation = useCreateConsultation();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scopeNotes, setScopeNotes] = useState('');

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
    // Projects linked to this customer via customerId
    return projects.filter((p) => p.customerId === selectedCustomerId || customer.jobIds.includes(p.id));
  }, [selectedCustomerId, customers, projects]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const canSubmit = !!selectedCustomerId && !!selectedProjectId;

  const handleSubmit = async () => {
    if (!canSubmit || createConsultation.isPending) return;
    await createConsultation.mutateAsync({
      customerId: selectedCustomerId!,
      projectId: selectedProjectId!,
      scheduledDate: scheduledDate || null,
      completedDate: null,
      sitePhotoIds: [],
      measurements: {},
      scopeNotes: scopeNotes.trim(),
      status: 'scheduled',
      discoveryDraftId: null,
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
          Schedule Consultation
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
              <button onClick={() => { setSelectedCustomerId(null); setSelectedProjectId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
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
                        borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)',
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

        {/* Project selector */}
        {selectedCustomerId && (
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Project *</label>
            {customerProjects.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--muted)', padding: '6px 0' }}>No projects linked to this customer yet</p>
            ) : (
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select project...</option>
                {customerProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.id}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Scheduled date */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Scheduled Date</label>
          <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={inputStyle} />
        </div>

        {/* Scope notes */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Scope Notes (optional)</label>
          <textarea
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            placeholder="What will be assessed during this consultation..."
            rows={2}
            style={{ ...inputStyle, minHeight: 56, padding: '8px 10px', resize: 'vertical' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onCancel} style={{ flex: 1, minHeight: 36, borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createConsultation.isPending}
          style={{ flex: 1, minHeight: 36, borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', background: COLOR, color: '#FFFFFF', border: 'none', cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit && !createConsultation.isPending ? 1 : 0.5 }}
        >
          {createConsultation.isPending ? 'Scheduling...' : 'Schedule'}
        </button>
      </div>
    </div>
  );
}
