'use client';

/**
 * CustomerListView — Shared customer list component.
 *
 * Used by:
 *   /customers          — all statuses, customers color
 *   /sales/customers    — default filter="lead", sales color
 *   /production/customers — default filter="active", production color
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  X,
  Users,
} from 'lucide-react';
import { useCustomers, useCustomerSearch, useCreateCustomerV2 } from '@/lib/hooks/useCustomersV2';
import type { CustomerStatus, CustomerLeadSource, HouseholdMember } from '@hooomz/shared-contracts';

// ============================================================================
// Props
// ============================================================================

export interface CustomerListViewProps {
  /** Section accent color */
  color: string;
  /** Page title */
  title: string;
  /** Subtitle text */
  subtitle: string;
  /** Default status filter. If set, hides filter tabs */
  defaultFilter?: CustomerStatus;
  /** Whether to show the filter tabs */
  showFilterTabs?: boolean;
  /** Whether to show the + New Customer button */
  showNewButton?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_TABS: { value: CustomerStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lead', label: 'Leads' },
  { value: 'active', label: 'Active' },
  { value: 'past', label: 'Past' },
];

const STATUS_BADGE: Record<CustomerStatus, { bg: string; text: string; label: string }> = {
  lead: { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Lead' },
  active: { bg: 'var(--green-bg)', text: 'var(--green)', label: 'Active' },
  past: { bg: 'var(--surface-2)', text: 'var(--muted)', label: 'Past' },
};

const SOURCE_LABELS: Record<CustomerLeadSource, string> = {
  ritchies_referral: 'Ritchies',
  home_show: 'Home Show',
  website: 'Website',
  word_of_mouth: 'Word of Mouth',
  repeat: 'Repeat',
  other: 'Other',
};

// ============================================================================
// Component
// ============================================================================

export function CustomerListView({
  color,
  title,
  subtitle,
  defaultFilter,
  showFilterTabs = true,
  showNewButton = true,
}: CustomerListViewProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>(defaultFilter ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const createCustomer = useCreateCustomerV2();

  const effectiveFilter = statusFilter === 'all' ? undefined : statusFilter;
  const allCustomers = useCustomers(effectiveFilter);
  const searchResults = useCustomerSearch(searchQuery);

  const isSearching = searchQuery.trim().length > 0;
  const customers = isSearching ? (searchResults.data ?? []) : (allCustomers.data ?? []);
  const isLoading = isSearching ? searchResults.isLoading : allCustomers.isLoading;

  // Apply filter on search results (search bypasses status)
  const filteredCustomers = statusFilter === 'all'
    ? customers
    : customers.filter((c) => c.status === statusFilter);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                {title}
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} · {subtitle}
            </p>
          </div>
          {showNewButton && (
            <button
              onClick={() => setShowNewForm(true)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
              style={{ background: color }}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 pb-3">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, address..."
              style={{
                width: '100%', minHeight: 36, paddingLeft: 32,
                paddingRight: searchQuery ? 32 : 12,
                borderRadius: 'var(--radius)', fontSize: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--charcoal)', outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs (hidden when a default filter is locked) */}
        {showFilterTabs && (
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
                    background: statusFilter === tab.value ? color : 'var(--bg)',
                    color: statusFilter === tab.value ? '#FFFFFF' : 'var(--muted)',
                    border: statusFilter === tab.value ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

        {/* New Customer Form */}
        {showNewForm && (
          <NewCustomerInlineForm
            color={color}
            onCreated={(id) => {
              setShowNewForm(false);
              router.push(`/customers/${id}`);
            }}
            onCancel={() => setShowNewForm(false)}
            isCreating={createCustomer.isPending}
            onCreate={createCustomer.mutateAsync}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredCustomers.length === 0 && (
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Users size={24} style={{ color }} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>
              {isSearching ? 'No customers found' : 'No customers yet'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              {isSearching ? 'Try a different search term' : 'Create your first customer record'}
            </p>
          </div>
        )}

        {/* Customer cards */}
        {!isLoading && filteredCustomers.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredCustomers.map((customer) => {
              const badge = STATUS_BADGE[customer.status];
              const fullName = `${customer.firstName} ${customer.lastName}`.trim();
              return (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  style={{
                    display: 'block', padding: '12px 14px',
                    borderRadius: 'var(--radius)', background: 'var(--surface)',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
                    textDecoration: 'none', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: badge.bg, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: badge.text }}>
                          {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fullName}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                            padding: '1px 6px', borderRadius: 4,
                            background: badge.bg, color: badge.text,
                          }}>
                            {badge.label}
                          </span>
                          {customer.leadSource && customer.leadSource !== 'other' && (
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                              {SOURCE_LABELS[customer.leadSource]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    {customer.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--mid)' }}>
                        <Phone size={10} style={{ color: 'var(--muted)' }} /> {customer.phone}
                      </span>
                    )}
                    {customer.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Mail size={10} style={{ color: 'var(--muted)' }} /> {customer.email}
                      </span>
                    )}
                    {customer.propertyCity && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--mid)' }}>
                        <MapPin size={10} style={{ color: 'var(--muted)' }} /> {customer.propertyCity}
                      </span>
                    )}
                  </div>

                  {customer.jobIds.length > 0 && (
                    <p style={{ marginTop: 6, fontSize: 10, color: 'var(--muted)' }}>
                      {customer.jobIds.length} job{customer.jobIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// New Customer Inline Form
// ============================================================================

function NewCustomerInlineForm({
  color,
  onCreated,
  onCancel,
  isCreating,
  onCreate,
}: {
  color: string;
  onCreated: (id: string) => void;
  onCancel: () => void;
  isCreating: boolean;
  onCreate: (data: {
    firstName: string; lastName: string; email: string; phone: string;
    propertyAddress: string; propertyCity: string; leadSource: CustomerLeadSource;
    notes: string; status: CustomerStatus; jobIds: string[];
    household_members: HouseholdMember[];
  }) => Promise<{ id: string }>;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [leadSource, setLeadSource] = useState<CustomerLeadSource>('other');

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || isCreating) return;
    const result = await onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      propertyAddress: '',
      propertyCity: propertyCity.trim(),
      leadSource,
      notes: '',
      status: 'lead',
      jobIds: [],
      household_members: [],
    });
    onCreated(result.id);
  };

  const inputStyle = {
    width: '100%', minHeight: 34, padding: '0 10px',
    borderRadius: 'var(--radius)', fontSize: 12,
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--charcoal)', outline: 'none',
  };

  return (
    <div style={{
      marginTop: 12, padding: 14, borderRadius: 'var(--radius)',
      background: 'var(--surface)', border: `2px solid ${color}40`,
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
          Quick Add Customer
        </span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name *" style={inputStyle} />
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name *" style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="text" value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} placeholder="City" style={inputStyle} />
          <select value={leadSource} onChange={(e) => setLeadSource(e.target.value as CustomerLeadSource)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="home_show">Home Show</option>
            <option value="ritchies_referral">Ritchies</option>
            <option value="website">Website</option>
            <option value="word_of_mouth">Word of Mouth</option>
            <option value="repeat">Repeat</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, minHeight: 34, borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit || isCreating} style={{ flex: 1, minHeight: 34, borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, background: color, color: '#FFFFFF', border: 'none', cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit && !isCreating ? 1 : 0.5 }}>
          {isCreating ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  );
}
