'use client';

/**
 * Customer Record — /customers/[id]
 *
 * Detail view for a single customer. 4-tab navigation: Overview, Jobs, Documents, Notes.
 * Reads from customers_v2 + activity stores. Does NOT touch legacy customers store.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  ArrowLeft,
  Phone,
  Mail,
  Pencil,
  Save,
  X,
  FileText,
  FolderOpen,
  StickyNote,
  User,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useQuery } from '@tanstack/react-query';
import { useCustomer, useUpdateCustomerV2, useAddCustomerNote } from '@/lib/hooks/useCustomersV2';
import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useQuotesByCustomer } from '@/lib/hooks/useQuotes';
import { useInvoicesByCustomer } from '@/lib/hooks/useInvoices';
import type { CustomerStatus, CustomerLeadSource, CustomerContactMethod, CustomerRecord } from '@hooomz/shared-contracts';
import { JOB_STAGE_META } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.customers;

type Tab = 'overview' | 'jobs' | 'documents' | 'notes' | 'warranty';

const TAB_LIST: { value: Tab; label: string; icon: typeof User }[] = [
  { value: 'overview', label: 'Overview', icon: User },
  { value: 'jobs', label: 'Jobs', icon: FolderOpen },
  { value: 'documents', label: 'Documents', icon: FileText },
  { value: 'warranty', label: 'Warranty', icon: Shield },
  { value: 'notes', label: 'Notes', icon: StickyNote },
];

const STATUS_BADGE: Record<CustomerStatus, { bg: string; text: string; label: string }> = {
  lead: { bg: '#EFF6FF', text: '#3B82F6', label: 'Lead' },
  active: { bg: '#ECFDF5', text: '#10B981', label: 'Active' },
  past: { bg: '#F3F4F6', text: '#9CA3AF', label: 'Past' },
};

const SOURCE_LABELS: Record<CustomerLeadSource, string> = {
  ritchies_referral: 'Ritchies Referral',
  home_show: 'Home Show',
  website: 'Website',
  word_of_mouth: 'Word of Mouth',
  repeat: 'Repeat Customer',
  other: 'Other',
};

// ============================================================================
// Page
// ============================================================================

export default function CustomerRecordPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: customer, isLoading } = useCustomer(customerId);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Customer not found</p>
          <button
            onClick={() => router.push('/customers')}
            style={{ marginTop: 12, fontSize: 12, color: COLOR, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const badge = STATUS_BADGE[customer.status];

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            {/* Back + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => router.push('/customers')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fullName}
                  </h1>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '2px 6px', borderRadius: 4,
                    background: badge.bg, color: badge.text, flexShrink: 0,
                  }}>
                    {badge.label}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  {SOURCE_LABELS[customer.leadSource]}
                  {customer.propertyCity && ` · ${customer.propertyCity}`}
                </p>
              </div>
            </div>

            {/* Quick contact */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    minHeight: 32, padding: '0 12px', borderRadius: 'var(--radius)',
                    fontSize: 11, fontWeight: 600,
                    background: 'var(--bg)', color: 'var(--text)',
                    border: '1px solid var(--border)', textDecoration: 'none',
                  }}
                >
                  <Phone size={12} style={{ color: COLOR }} /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    minHeight: 32, padding: '0 12px', borderRadius: 'var(--radius)',
                    fontSize: 11, fontWeight: 600,
                    background: 'var(--bg)', color: 'var(--text)',
                    border: '1px solid var(--border)', textDecoration: 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  <Mail size={12} style={{ color: COLOR }} /> {customer.email}
                </a>
              )}
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 0, marginTop: 12, borderBottom: 'none' }}>
              {TAB_LIST.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      minHeight: 36, fontSize: 11, fontWeight: 600,
                      fontFamily: 'var(--font-cond)', letterSpacing: '0.04em',
                      color: isActive ? COLOR : 'var(--text-3)',
                      borderBottom: isActive ? `2px solid ${COLOR}` : '2px solid transparent',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottomStyle: 'solid',
                      borderBottomWidth: 2,
                      borderBottomColor: isActive ? COLOR : 'transparent',
                    }}
                  >
                    <Icon size={12} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 16 }}>
          {activeTab === 'overview' && <OverviewTab customerId={customerId} customer={customer} />}
          {activeTab === 'jobs' && <JobsTab jobIds={customer.jobIds} />}
          {activeTab === 'documents' && <DocumentsTab customerId={customerId} />}
          {activeTab === 'warranty' && <WarrantyTab jobIds={customer.jobIds} />}
          {activeTab === 'notes' && <NotesTab customerId={customerId} />}
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ customerId, customer }: { customerId: string; customer: CustomerRecord }) {
  const updateCustomer = useUpdateCustomerV2();
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState(customer.firstName);
  const [editLastName, setEditLastName] = useState(customer.lastName);
  const [editPhone, setEditPhone] = useState(customer.phone);
  const [editEmail, setEditEmail] = useState(customer.email);
  const [editAddress, setEditAddress] = useState(customer.propertyAddress);
  const [editCity, setEditCity] = useState(customer.propertyCity);
  const [editProvince, setEditProvince] = useState(customer.propertyProvince || '');
  const [editPostalCode, setEditPostalCode] = useState(customer.propertyPostalCode || '');
  const [editSource, setEditSource] = useState<CustomerLeadSource>(customer.leadSource);
  const [editStatus, setEditStatus] = useState<CustomerStatus>(customer.status);
  const [editNotes, setEditNotes] = useState(customer.notes);
  const [editContactMethod, setEditContactMethod] = useState<CustomerContactMethod | ''>(customer.preferredContactMethod || '');

  const handleStartEdit = () => {
    setEditFirstName(customer.firstName);
    setEditLastName(customer.lastName);
    setEditPhone(customer.phone);
    setEditEmail(customer.email);
    setEditAddress(customer.propertyAddress);
    setEditCity(customer.propertyCity);
    setEditProvince(customer.propertyProvince || '');
    setEditPostalCode(customer.propertyPostalCode || '');
    setEditSource(customer.leadSource);
    setEditStatus(customer.status);
    setEditNotes(customer.notes);
    setEditContactMethod(customer.preferredContactMethod || '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (updateCustomer.isPending) return;
    await updateCustomer.mutateAsync({
      id: customerId,
      data: {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        propertyAddress: editAddress.trim(),
        propertyCity: editCity.trim(),
        propertyProvince: editProvince.trim() || undefined,
        propertyPostalCode: editPostalCode.trim() || undefined,
        leadSource: editSource,
        status: editStatus,
        notes: editNotes.trim(),
        preferredContactMethod: editContactMethod || undefined,
      },
    });
    setEditing(false);
  };

  const inputStyle = {
    width: '100%',
    minHeight: 34,
    padding: '0 10px',
    borderRadius: 'var(--radius)',
    fontSize: 12,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Edit toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!editing ? (
          <button
            onClick={handleStartEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              minHeight: 30, padding: '0 12px', borderRadius: 'var(--radius)',
              fontSize: 11, fontWeight: 600,
              background: 'var(--bg)', color: COLOR,
              border: `1px solid ${COLOR}40`, cursor: 'pointer',
            }}
          >
            <Pencil size={11} /> Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                minHeight: 30, padding: '0 10px', borderRadius: 'var(--radius)',
                fontSize: 11, fontWeight: 600,
                background: 'var(--bg)', color: 'var(--text-2)',
                border: '1px solid var(--border)', cursor: 'pointer',
              }}
            >
              <X size={11} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateCustomer.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                minHeight: 30, padding: '0 12px', borderRadius: 'var(--radius)',
                fontSize: 11, fontWeight: 600,
                background: COLOR, color: '#FFFFFF',
                border: 'none', cursor: 'pointer',
                opacity: updateCustomer.isPending ? 0.6 : 1,
              }}
            >
              <Save size={11} /> {updateCustomer.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Contact Info Card */}
      <Card title="Contact Information">
        {editing ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <FieldLabel>First Name</FieldLabel>
                <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <FieldLabel>Preferred Contact</FieldLabel>
              <select value={editContactMethod} onChange={(e) => setEditContactMethod(e.target.value as CustomerContactMethod | '')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Not set</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            <DetailRow label="Phone" value={customer.phone || '—'} />
            <DetailRow label="Email" value={customer.email || '—'} />
            {customer.preferredContactMethod && (
              <DetailRow label="Preferred" value={customer.preferredContactMethod === 'phone' ? 'Phone' : customer.preferredContactMethod === 'email' ? 'Email' : 'Text'} />
            )}
          </div>
        )}
      </Card>

      {/* Property Card */}
      <Card title="Property">
        {editing ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <FieldLabel>Address</FieldLabel>
              <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <FieldLabel>City</FieldLabel>
                <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Province</FieldLabel>
                <input type="text" value={editProvince} onChange={(e) => setEditProvince(e.target.value)} placeholder="NB" style={inputStyle} />
              </div>
            </div>
            <div>
              <FieldLabel>Postal Code</FieldLabel>
              <input type="text" value={editPostalCode} onChange={(e) => setEditPostalCode(e.target.value)} placeholder="E1A 1A1" style={inputStyle} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            <DetailRow label="Address" value={customer.propertyAddress || '—'} />
            <DetailRow label="City" value={customer.propertyCity || '—'} />
            {customer.propertyProvince && <DetailRow label="Province" value={customer.propertyProvince} />}
            {customer.propertyPostalCode && <DetailRow label="Postal Code" value={customer.propertyPostalCode} />}
          </div>
        )}
      </Card>

      {/* Status + Source Card */}
      <Card title="Status & Source">
        {editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as CustomerStatus)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div>
              <FieldLabel>Lead Source</FieldLabel>
              <select value={editSource} onChange={(e) => setEditSource(e.target.value as CustomerLeadSource)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="home_show">Home Show</option>
                <option value="ritchies_referral">Ritchies Referral</option>
                <option value="website">Website</option>
                <option value="word_of_mouth">Word of Mouth</option>
                <option value="repeat">Repeat Customer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            <DetailRow label="Status" value={STATUS_BADGE[customer.status].label} />
            <DetailRow label="Lead Source" value={SOURCE_LABELS[customer.leadSource]} />
            <DetailRow label="Created" value={new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
            {customer.customerSince && (
              <DetailRow label="Customer Since" value={new Date(customer.customerSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
            )}
            {customer.tags && customer.tags.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Tags</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {customer.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                      background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Lifetime Value Card */}
      <LifetimeValueCard customerId={customerId} />

      {/* Notes Card */}
      <Card title="Notes">
        {editing ? (
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
            placeholder="Notes about this customer..."
            style={{ ...inputStyle, minHeight: 72, padding: '8px 10px', resize: 'vertical' }}
          />
        ) : (
          <p style={{ fontSize: 12, color: customer.notes ? 'var(--text)' : 'var(--text-3)', whiteSpace: 'pre-wrap' }}>
            {customer.notes || 'No notes yet'}
          </p>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// Lifetime Value Card (used in Overview)
// ============================================================================

function LifetimeValueCard({ customerId }: { customerId: string }) {
  const { data: invoices = [] } = useInvoicesByCustomer(customerId);

  if (invoices.length === 0) return null;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const fmt = (n: number) => `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card title="Lifetime Value">
      <div style={{ display: 'grid', gap: 6 }}>
        <DetailRow label="Total Paid" value={fmt(totalPaid)} />
        <DetailRow label="Total Invoiced" value={fmt(totalInvoiced)} />
        <DetailRow label="Invoices" value={String(invoices.length)} />
      </div>
    </Card>
  );
}

// ============================================================================
// Jobs Tab
// ============================================================================

function JobsTab({ jobIds }: { jobIds: string[] }) {
  const router = useRouter();
  const { services } = useServicesContext();

  const { data: projects = [] } = useQuery({
    queryKey: ['customer-jobs', ...jobIds],
    queryFn: async () => {
      if (!services) return [];
      const results = await Promise.all(
        jobIds.map((id) => services.projects.findById(id).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: jobIds.length > 0 && !!services,
  });

  if (jobIds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <FolderOpen size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>No linked jobs</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
          Jobs will appear here when this customer has active projects
        </p>
      </div>
    );
  }

  const STAGE_COLORS: Record<string, string> = {
    lead: '#9CA3AF', estimate: '#9CA3AF', consultation: '#3B82F6', quote: '#3B82F6',
    contract: '#3B82F6', shield: '#F59E0B', clear: '#F59E0B', ready: '#F59E0B',
    install: '#0F766E', punch: '#F59E0B', turnover: '#3B82F6', complete: '#10B981',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {jobIds.map((jobId) => {
        const project = projects.find((p) => p?.id === jobId);
        const name = project?.name || jobId;
        const stage = project?.jobStage;
        const stageMeta = stage ? JOB_STAGE_META[stage] : null;
        const stageColor = stage ? STAGE_COLORS[stage] || '#9CA3AF' : '#9CA3AF';
        const city = project?.address?.city;

        return (
          <button
            key={jobId}
            onClick={() => router.push(`/projects/${jobId}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 'var(--radius)',
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              width: '100%', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <FolderOpen size={14} style={{ color: COLOR, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
                {city && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{city}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {stageMeta && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '2px 6px', borderRadius: 4,
                  background: `${stageColor}18`, color: stageColor,
                }}>
                  {stageMeta.label}
                </span>
              )}
              <ChevronRight size={14} style={{ color: 'var(--border-strong, #d1d5db)' }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Documents Tab (placeholder)
// ============================================================================

function DocumentsTab({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { data: quotes = [] } = useQuotesByCustomer(customerId);
  const { data: invoices = [] } = useInvoicesByCustomer(customerId);

  const QUOTE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#F3F4F6', text: '#6B7280' },
    sent: { bg: '#DBEAFE', text: '#2563EB' },
    accepted: { bg: '#D1FAE5', text: '#059669' },
    declined: { bg: '#FEE2E2', text: '#DC2626' },
    expired: { bg: '#F3F4F6', text: '#9CA3AF' },
  };

  const INV_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#F3F4F6', text: '#6B7280' },
    sent: { bg: '#DBEAFE', text: '#2563EB' },
    viewed: { bg: '#DBEAFE', text: '#2563EB' },
    partial: { bg: '#FEF3C7', text: '#D97706' },
    paid: { bg: '#D1FAE5', text: '#059669' },
    overdue: { bg: '#FEE2E2', text: '#DC2626' },
    cancelled: { bg: '#F3F4F6', text: '#9CA3AF' },
  };

  if (quotes.length === 0 && invoices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <FileText size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>No documents yet</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
          Quotes and invoices will appear here
        </p>
      </div>
    );
  }

  const formatCurrency = (n: number) => `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quotes */}
      {quotes.length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
            Quotes ({quotes.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {quotes.map((q) => {
              const sc = QUOTE_STATUS_COLORS[q.status] || QUOTE_STATUS_COLORS.draft;
              return (
                <button
                  key={q.id}
                  onClick={() => router.push(`/sales/quotes`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: 'var(--surface-1)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <FileText size={13} style={{ color: COLOR, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatCurrency(q.totalAmount)}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 4, background: sc.bg, color: sc.text,
                    }}>
                      {q.status}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
                    {formatDate(q.createdAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
            Invoices ({invoices.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {invoices.map((inv) => {
              const sc = INV_STATUS_COLORS[inv.status] || INV_STATUS_COLORS.draft;
              return (
                <button
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: 'var(--surface-1)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <FileText size={13} style={{ color: COLOR, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
                      {inv.invoiceNumber}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 4, background: sc.bg, color: sc.text,
                    }}>
                      {inv.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: inv.balanceDue > 0 ? '#DC2626' : '#059669' }}>
                      {formatCurrency(inv.balanceDue)}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--border-strong, #d1d5db)' }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Warranty Tab
// ============================================================================

function WarrantyTab({ jobIds }: { jobIds: string[] }) {
  const { services } = useServicesContext();

  const { data: projects = [] } = useQuery({
    queryKey: ['customer-warranty', ...jobIds],
    queryFn: async () => {
      if (!services) return [];
      const results = await Promise.all(
        jobIds.map((id) => services.projects.findById(id).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: jobIds.length > 0 && !!services,
  });

  // Only show completed projects
  const completedProjects = projects.filter((p) => p?.status === 'complete' && p.dates?.actualEndDate);

  if (completedProjects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <Shield size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>No warranty coverage yet</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
          Warranty tracking begins when a project is completed
        </p>
      </div>
    );
  }

  const now = Date.now();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {completedProjects.map((project) => {
        if (!project) return null;
        const completionDate = new Date(project.dates.actualEndDate!);
        const expiryDate = new Date(completionDate.getTime() + ONE_YEAR_MS);
        const isActive = expiryDate.getTime() > now;
        const formatDate = (d: Date) => d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
          <div
            key={project.id}
            style={{
              padding: '12px 14px', borderRadius: 'var(--radius)',
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{project.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 4,
                background: isActive ? '#D1FAE518' : '#F3F4F6',
                color: isActive ? '#10B981' : '#9CA3AF',
              }}>
                {isActive ? 'Active' : 'Expired'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-3)' }}>Completed</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{formatDate(completionDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-3)' }}>Warranty Expires</span>
                <span style={{ color: isActive ? '#10B981' : '#9CA3AF', fontWeight: 500 }}>{formatDate(expiryDate)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Notes Tab
// ============================================================================

function NotesTab({ customerId }: { customerId: string }) {
  const addNote = useAddCustomerNote();
  const { data: activityData } = useLocalRecentActivity(20);
  const [noteText, setNoteText] = useState('');

  // Filter activity events for this customer
  const customerEvents = ((activityData?.events as unknown as Array<Record<string, unknown>>) ?? [])
    .filter((e) => e.entity_id === customerId && e.entity_type === 'customer_v2');

  const handleAddNote = () => {
    const text = noteText.trim();
    if (!text || addNote.isPending) return;
    addNote.mutate({ customerId, note: text });
    setNoteText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Add note input */}
      <div style={{
        padding: 12, borderRadius: 'var(--radius)',
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note about this customer..."
          rows={2}
          style={{
            width: '100%', minHeight: 56, padding: '8px 10px',
            borderRadius: 'var(--radius)', fontSize: 12,
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text)', outline: 'none', resize: 'vertical',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAddNote(); }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim() || addNote.isPending}
            style={{
              minHeight: 32, padding: '0 16px', borderRadius: 'var(--radius)',
              fontSize: 11, fontWeight: 600,
              background: COLOR, color: '#FFFFFF',
              border: 'none', cursor: noteText.trim() ? 'pointer' : 'default',
              opacity: noteText.trim() && !addNote.isPending ? 1 : 0.5,
            }}
          >
            {addNote.isPending ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes timeline */}
      {customerEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <StickyNote size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No notes yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {customerEvents.map((event, i) => (
            <div
              key={String(event.id || i)}
              style={{
                padding: '10px 12px', borderRadius: 'var(--radius)',
                background: 'var(--surface-1)', border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  {String(event.event_type || event.eventType || '').replace(/[._]/g, ' ')}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {formatRelativeTime(event.created_at || event.createdAt || event.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {String(event.summary || event.description || '')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Shared sub-components
// ============================================================================

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 'var(--radius)',
      background: 'var(--surface-1)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <p style={{
        fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--text-3)', marginBottom: 10,
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginBottom: 3 }}>
      {children}
    </label>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(ts: unknown): string {
  if (!ts) return '';
  const d = new Date(String(ts));
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}
