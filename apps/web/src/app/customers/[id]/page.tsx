'use client';

/**
 * Customer Record — /customers/[id]
 *
 * Detail view for a single customer. 6-tab navigation: Overview, Properties, Jobs, Documents, Warranty, Notes.
 * Reads from customers_v2 + activity + properties stores. Does NOT touch legacy customers store.
 */

import { useState, useCallback } from 'react';
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
  Home,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCustomer, useUpdateCustomerV2, useAddCustomerNote } from '@/lib/hooks/useCustomersV2';
import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useQuotesByCustomer } from '@/lib/hooks/useQuotes';
import { useInvoicesByCustomer } from '@/lib/hooks/useInvoices';
import type { CustomerStatus, CustomerLeadSource, CustomerContactMethod, CustomerRecord, Property } from '@hooomz/shared-contracts';
import { JOB_STAGE_META } from '@hooomz/shared-contracts';
import { createProperty, getPropertiesByCustomer } from '@/lib/db/properties';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

const COLOR = SECTION_COLORS.customers;

type Tab = 'overview' | 'properties' | 'jobs' | 'documents' | 'notes' | 'warranty';

const TAB_LIST: { value: Tab; label: string; icon: typeof User }[] = [
  { value: 'overview', label: 'Overview', icon: User },
  { value: 'properties', label: 'Properties', icon: Home },
  { value: 'jobs', label: 'Jobs', icon: FolderOpen },
  { value: 'documents', label: 'Documents', icon: FileText },
  { value: 'warranty', label: 'Warranty', icon: Shield },
  { value: 'notes', label: 'Notes', icon: StickyNote },
];

const STATUS_BADGE: Record<CustomerStatus, { bg: string; text: string; label: string }> = {
  lead: { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Lead' },
  active: { bg: 'var(--green-bg)', text: 'var(--green)', label: 'Active' },
  past: { bg: 'var(--surface-2)', text: 'var(--muted)', label: 'Past' },
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
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>Customer not found</p>
          <button
            onClick={() => router.push('/customers')}
            style={{ marginTop: 12, fontSize: 12, color: COLOR, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
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
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            {/* Back + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => router.push('/customers')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
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
                    background: 'var(--bg)', color: 'var(--charcoal)',
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
                    background: 'var(--bg)', color: 'var(--charcoal)',
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
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                      color: isActive ? COLOR : 'var(--muted)',
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
          {activeTab === 'properties' && <PropertiesTab customerId={customerId} />}
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
  const [editSource, setEditSource] = useState<CustomerLeadSource>(customer.leadSource);
  const [editStatus, setEditStatus] = useState<CustomerStatus>(customer.status);
  const [editNotes, setEditNotes] = useState(customer.notes);
  const [editContactMethod, setEditContactMethod] = useState<CustomerContactMethod | ''>(customer.preferredContactMethod || '');

  const handleStartEdit = () => {
    setEditFirstName(customer.firstName);
    setEditLastName(customer.lastName);
    setEditPhone(customer.phone);
    setEditEmail(customer.email);
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
    color: 'var(--charcoal)',
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
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
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
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                background: 'var(--bg)', color: 'var(--mid)',
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
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
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
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Tags</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {customer.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                      background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)',
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
          <p style={{ fontSize: 12, color: customer.notes ? 'var(--charcoal)' : 'var(--muted)', whiteSpace: 'pre-wrap' }}>
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
// Properties Tab
// ============================================================================

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  'multi-unit': 'Multi-Unit',
  commercial: 'Commercial',
};

function PropertiesTab({ customerId }: { customerId: string }) {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', customerId],
    queryFn: async () => {
      if (!services) return [];
      return getPropertiesByCustomer(services.storage, customerId);
    },
    enabled: !!services,
  });

  const handleCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['properties', customerId] });
    setShowForm(false);
    setSuccessMessage('Property added');
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [queryClient, customerId]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
      </div>
    );
  }

  // Empty state
  if (properties.length === 0 && !showForm) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <Home size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>No properties yet.</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
          Add a property to start tracking projects and building a Passport for this home.
        </p>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 16, minHeight: 34, padding: '0 16px',
            borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            background: 'var(--green)', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Add Property
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header row with Add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              minHeight: 30, padding: '0 12px', borderRadius: 'var(--radius)',
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
              background: 'var(--bg)', color: 'var(--green)',
              border: '1px solid var(--green-dim)', cursor: 'pointer',
            }}
          >
            <Plus size={11} /> Add Property
          </button>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 'var(--radius)',
          background: 'var(--green-bg)', border: '1px solid #A7F3D0',
        }}>
          <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)' }}>{successMessage}</span>
        </div>
      )}

      {/* Add Property Form */}
      {showForm && (
        <AddPropertyForm
          customerId={customerId}
          userId={user?.id}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Property cards */}
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

// ── Add Property Form ──

function AddPropertyForm({
  customerId,
  userId,
  onCreated,
  onCancel,
}: {
  customerId: string;
  userId?: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { services } = useServicesContext();

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Moncton');
  const [province, setProvince] = useState('NB');
  const [postalCode, setPostalCode] = useState('');
  const [propertyType, setPropertyType] = useState<'residential' | 'multi-unit' | 'commercial'>('residential');
  const [yearBuilt, setYearBuilt] = useState('');
  const [sqftTotal, setSqftTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 34,
    padding: '0 10px',
    borderRadius: 'var(--radius)',
    fontSize: 12,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--charcoal)',
    outline: 'none',
  };

  const handleSubmit = async () => {
    if (submitting || !services) return;

    // Validate required fields
    if (!addressLine1.trim()) { setError('Street address is required'); return; }
    if (!city.trim()) { setError('City is required'); return; }
    if (!province.trim()) { setError('Province is required'); return; }
    if (!postalCode.trim()) { setError('Postal code is required'); return; }

    setError(null);
    setSubmitting(true);

    try {
      // Resolve org_id from team_members
      let orgId = '';
      if (userId) {
        const { data } = await supabase
          .from('team_members')
          .select('organization_id')
          .eq('user_id', userId)
          .limit(1)
          .single();
        orgId = data?.organization_id || '';
      }

      await createProperty(services.storage, {
        customer_id: customerId,
        org_id: orgId,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || undefined,
        city: city.trim(),
        province: province.trim(),
        postal_code: postalCode.trim(),
        property_type: propertyType,
        year_built: yearBuilt ? parseInt(yearBuilt, 10) : undefined,
        sqft_total: sqftTotal ? parseInt(sqftTotal, 10) : undefined,
        notes: notes.trim() || undefined,
      });

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="New Property">
      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          <FieldLabel>Street Address *</FieldLabel>
          <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="142 Elmwood Dr" style={inputStyle} />
        </div>
        <div>
          <FieldLabel>Unit / Suite</FieldLabel>
          <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Apt 2B" style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <FieldLabel>City *</FieldLabel>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Province *</FieldLabel>
            <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <FieldLabel>Postal Code *</FieldLabel>
            <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="E1C 5N2" style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Property Type *</FieldLabel>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as typeof propertyType)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="residential">Residential</option>
              <option value="multi-unit">Multi-Unit</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <FieldLabel>Year Built</FieldLabel>
            <input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="1985" style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Total Sqft</FieldLabel>
            <input type="number" value={sqftTotal} onChange={(e) => setSqftTotal(e.target.value)} placeholder="1200" style={inputStyle} />
          </div>
        </div>
        <div>
          <FieldLabel>Notes</FieldLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Corner lot, detached garage, etc."
            style={{ ...inputStyle, minHeight: 56, padding: '8px 10px', resize: 'vertical' }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 11, color: 'var(--red)', margin: 0 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
          <button
            onClick={onCancel}
            style={{
              minHeight: 30, padding: '0 10px', borderRadius: 'var(--radius)',
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
              background: 'var(--bg)', color: 'var(--mid)',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              minHeight: 30, padding: '0 12px', borderRadius: 'var(--radius)',
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
              background: 'var(--green)', color: '#fff',
              border: 'none', cursor: 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <Save size={11} /> {submitting ? 'Saving...' : 'Save Property'}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Property Card ──

function PropertyCard({ property }: { property: Property }) {
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type] || property.property_type;
  const addressParts = [property.address_line_1];
  if (property.address_line_2) addressParts.push(property.address_line_2);
  addressParts.push(`${property.city}, ${property.province} ${property.postal_code}`);

  const createdDate = new Date(property.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 'var(--radius)',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${COLOR}`,
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Home size={14} style={{ color: COLOR, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)' }}>
            {property.address_line_1}
          </span>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '2px 6px', borderRadius: 4, flexShrink: 0,
          background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)',
        }}>
          {typeLabel}
        </span>
      </div>

      {/* Address */}
      <div style={{ fontSize: 11, color: 'var(--mid)', marginBottom: 8, lineHeight: 1.5 }}>
        {property.address_line_2 && <div>{property.address_line_2}</div>}
        <div>{property.city}, {property.province} {property.postal_code}</div>
      </div>

      {/* Details row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        {property.year_built && (
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Built</span>
            <span style={{ fontSize: 11, color: 'var(--charcoal)', fontWeight: 500, marginLeft: 4 }}>{property.year_built}</span>
          </div>
        )}
        {property.sqft_total && (
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Sqft</span>
            <span style={{ fontSize: 11, color: 'var(--charcoal)', fontWeight: 500, marginLeft: 4 }}>{property.sqft_total.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Added {createdDate}</span>
        <button
          onClick={() => console.log('Edit property:', property.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            minHeight: 26, padding: '0 10px', borderRadius: 'var(--radius)',
            fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
            background: 'none', color: COLOR,
            border: `1px solid ${COLOR}40`, cursor: 'pointer',
          }}
        >
          <Pencil size={10} /> Edit
        </button>
      </div>
    </div>
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
        <FolderOpen size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>No linked jobs</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          Jobs will appear here when this customer has active projects
        </p>
      </div>
    );
  }

  const STAGE_COLORS: Record<string, string> = {
    lead: 'var(--muted)', estimate: 'var(--muted)', consultation: 'var(--blue)', quote: 'var(--blue)',
    contract: 'var(--blue)', shield: 'var(--yellow)', clear: 'var(--yellow)', ready: 'var(--yellow)',
    install: 'var(--accent)', punch: 'var(--yellow)', turnover: 'var(--blue)', complete: 'var(--green)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {jobIds.map((jobId) => {
        const project = projects.find((p) => p?.id === jobId);
        const name = project?.name || jobId;
        const stage = project?.jobStage;
        const stageMeta = stage ? JOB_STAGE_META[stage] : null;
        const stageColor = stage ? STAGE_COLORS[stage] || 'var(--muted)' : 'var(--muted)';
        const city = project?.address?.city;

        return (
          <button
            key={jobId}
            onClick={() => router.push(`/projects/${jobId}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 'var(--radius)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              width: '100%', textAlign: 'left', fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <FolderOpen size={14} style={{ color: COLOR, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
                {city && (
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{city}</span>
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
    draft: { bg: 'var(--surface-2)', text: 'var(--mid)' },
    sent: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
    accepted: { bg: 'var(--green-bg)', text: 'var(--green)' },
    declined: { bg: 'var(--red-bg)', text: 'var(--red)' },
    expired: { bg: 'var(--surface-2)', text: 'var(--muted)' },
  };

  const INV_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'var(--surface-2)', text: 'var(--mid)' },
    sent: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
    viewed: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
    partial: { bg: 'var(--yellow-bg)', text: 'var(--yellow)' },
    paid: { bg: 'var(--green-bg)', text: 'var(--green)' },
    overdue: { bg: 'var(--red-bg)', text: 'var(--red)' },
    cancelled: { bg: 'var(--surface-2)', text: 'var(--muted)' },
  };

  if (quotes.length === 0 && invoices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <FileText size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>No documents yet</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
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
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
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
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                    width: '100%', textAlign: 'left', fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <FileText size={13} style={{ color: COLOR, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatCurrency(q.totalAmount)}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 4, background: sc.bg, color: sc.text,
                    }}>
                      {q.status}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
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
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
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
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                    width: '100%', textAlign: 'left', fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <FileText size={13} style={{ color: COLOR, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--charcoal)' }}>
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
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: inv.balanceDue > 0 ? 'var(--red)' : 'var(--green)' }}>
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
        <Shield size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>No warranty coverage yet</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
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
              background: 'var(--surface)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)' }}>{project.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 4,
                background: isActive ? '#D1FAE518' : 'var(--surface-2)',
                color: isActive ? 'var(--green)' : 'var(--muted)',
              }}>
                {isActive ? 'Active' : 'Expired'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--muted)' }}>Completed</span>
                <span style={{ color: 'var(--charcoal)', fontWeight: 500 }}>{formatDate(completionDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--muted)' }}>Warranty Expires</span>
                <span style={{ color: isActive ? 'var(--green)' : 'var(--muted)', fontWeight: 500 }}>{formatDate(expiryDate)}</span>
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
        background: 'var(--surface)', border: '1px solid var(--border)',
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
            color: 'var(--charcoal)', outline: 'none', resize: 'vertical',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAddNote(); }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim() || addNote.isPending}
            style={{
              minHeight: 32, padding: '0 16px', borderRadius: 'var(--radius)',
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
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
          <StickyNote size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>No notes yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {customerEvents.map((event, i) => (
            <div
              key={String(event.id || i)}
              style={{
                padding: '10px 12px', borderRadius: 'var(--radius)',
                background: 'var(--surface)', border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {String(event.event_type || event.eventType || '').replace(/[._]/g, ' ')}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {formatRelativeTime(event.created_at || event.createdAt || event.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--charcoal)', whiteSpace: 'pre-wrap' }}>
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
      background: 'var(--surface)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--muted)', marginBottom: 10,
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
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>
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
