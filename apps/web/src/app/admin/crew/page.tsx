'use client';

/**
 * Crew Management — View, create, and edit crew members with full detail view
 */

import { useState, useMemo } from 'react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  UsersRound, ChevronRight, ChevronLeft, GraduationCap, Plus, X,
  Mail, Phone, AlertTriangle, Shield, Edit2, Check,
} from 'lucide-react';
import {
  useActiveCrewMembers, useTrainingRecords,
  useCreateCrewMember, useUpdateCrewMember,
  useArchiveCrewMember, useDeleteCrewMember,
} from '@/lib/hooks/useCrewData';
import { SECTION_COLORS } from '@/lib/viewmode';

const ADMIN_COLOR = SECTION_COLORS.admin;

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  learner: { label: 'Learner', color: 'var(--muted)' },
  proven: { label: 'Proven', color: 'var(--blue)' },
  lead: { label: 'Lead', color: 'var(--amber)' },
  master: { label: 'Master', color: 'var(--green)' },
};

const AUTH_ROLE_MAP: Record<string, { authRole: 'owner' | 'operator' | 'installer'; role: string }> = {
  owner: { authRole: 'owner', role: 'Owner' },
  operator: { authRole: 'operator', role: 'Operator' },
  installer: { authRole: 'installer', role: 'Installer' },
};

const TRADE_OPTIONS = ['Flooring', 'Paint', 'Trim', 'Tile', 'Drywall'];

const CERT_SUGGESTIONS = ['First Aid', 'Working at Heights', 'WHMIS', 'Fall Protection'];

type CertEntry = {
  name: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'pending';
};

type FormState = {
  name: string;
  authRole: 'owner' | 'operator' | 'installer' | '';
  tier: 'learner' | 'proven' | 'lead' | 'master';
  email: string;
  phone: string;
  wageRate: string;
  chargedRate: string;
  tradeSpecialties: string[];
  certifications: CertEntry[];
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
};

const emptyForm: FormState = {
  name: '',
  authRole: '',
  tier: 'learner',
  email: '',
  phone: '',
  wageRate: '',
  chargedRate: '',
  tradeSpecialties: [],
  certifications: [],
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
};

// ---------- Styles ----------

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 'var(--radius)',
  fontSize: 13,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--charcoal)',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 4,
  display: 'block',
};

// ---------- Sub-components ----------

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {title}
      </span>
    </div>
  );
}

function CertStatusBadge({ cert }: { cert: CertEntry }) {
  const now = new Date();
  let color = 'var(--green)';
  let label = 'Active';

  if (cert.status === 'expired') {
    color = 'var(--red, #EF4444)';
    label = 'Expired';
  } else if (cert.status === 'pending') {
    color = 'var(--amber, #F59E0B)';
    label = 'Pending';
  } else if (cert.expiresAt) {
    const expires = new Date(cert.expiresAt);
    const daysUntil = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil < 0) {
      color = 'var(--red, #EF4444)';
      label = 'Expired';
    } else if (daysUntil <= 30) {
      color = 'var(--amber, #F59E0B)';
      label = 'Expiring';
    }
  }

  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '2px 6px', borderRadius: 2,
      color, background: `${color}15`,
    }}>
      {label}
    </span>
  );
}

// ---------- Main Page ----------

export default function CrewPage() {
  const { data: crewMembers = [], isLoading: crewLoading } = useActiveCrewMembers();
  const { data: trainingRecords = [], isLoading: trLoading } = useTrainingRecords();
  const createCrew = useCreateCrewMember();
  const updateCrew = useUpdateCrewMember();
  const archiveCrew = useArchiveCrewMember();
  const deleteCrew = useDeleteCrewMember();

  const [showForm, setShowForm] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormState>({ ...emptyForm });

  const isLoading = crewLoading || trLoading;

  const selectedCrew = useMemo(
    () => crewMembers.find((c) => c.id === selectedCrewId) ?? null,
    [crewMembers, selectedCrewId],
  );

  // ---- Form helpers ----

  const resetForm = () => setForm({ ...emptyForm });

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleWageChange = (val: string) => {
    setField('wageRate', val);
    const wage = parseFloat(val);
    if (!isNaN(wage)) {
      setField('chargedRate', (wage * 1.5).toFixed(2));
    }
  };

  const toggleTrade = (trade: string) => {
    setForm((prev) => ({
      ...prev,
      tradeSpecialties: prev.tradeSpecialties.includes(trade)
        ? prev.tradeSpecialties.filter((t) => t !== trade)
        : [...prev.tradeSpecialties, trade],
    }));
  };

  const addCert = () => {
    setForm((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', expiresAt: '', status: 'active' as const }],
    }));
  };

  const updateCert = (idx: number, field: keyof CertEntry, val: string) => {
    setForm((prev) => {
      const certs = [...prev.certifications];
      certs[idx] = { ...certs[idx], [field]: val };
      return { ...prev, certifications: certs };
    });
  };

  const removeCert = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx),
    }));
  };

  const formToPayload = () => {
    const mapping = AUTH_ROLE_MAP[form.authRole as string];
    if (!mapping) return null;
    const wage = parseFloat(form.wageRate) || 0;
    const charged = parseFloat(form.chargedRate) || wage * 1.5;

    const emergencyContact = form.emergencyContactName.trim()
      ? { name: form.emergencyContactName.trim(), relationship: form.emergencyContactRelationship.trim(), phone: form.emergencyContactPhone.trim() }
      : undefined;

    const structuredCertifications = form.certifications
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        expiresAt: c.expiresAt || undefined,
        status: c.status,
      }));

    return {
      name: form.name.trim(),
      role: mapping.role,
      authRole: mapping.authRole,
      tier: form.tier,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      tradeSpecialties: form.tradeSpecialties,
      wageRate: wage,
      chargedRate: charged,
      emergencyContact,
      structuredCertifications: structuredCertifications.length > 0 ? structuredCertifications : undefined,
    };
  };

  const handleCreate = async () => {
    const payload = formToPayload();
    if (!payload) return;
    await createCrew.mutateAsync(payload);
    resetForm();
    setShowForm(false);
  };

  const handleUpdate = async () => {
    if (!selectedCrewId) return;
    const payload = formToPayload();
    if (!payload) return;
    await updateCrew.mutateAsync({ id: selectedCrewId, data: payload });
    setEditMode(false);
  };

  const populateFormFromCrew = (crew: NonNullable<typeof selectedCrew>) => {
    const resolvedAuthRole: FormState['authRole'] = crew.authRole || (
      crew.role?.toLowerCase() === 'owner' ? 'owner'
      : crew.role?.toLowerCase() === 'operator' ? 'operator'
      : 'installer'
    );

    const ec = crew.emergencyContact;
    const sc = crew.structuredCertifications;

    setForm({
      name: crew.name || '',
      authRole: resolvedAuthRole,
      tier: crew.tier || 'learner',
      email: crew.email || '',
      phone: crew.phone || '',
      wageRate: crew.wageRate?.toString() || '',
      chargedRate: crew.chargedRate?.toString() || '',
      tradeSpecialties: crew.tradeSpecialties || [],
      certifications: sc?.map((c) => ({ name: c.name, expiresAt: c.expiresAt || '', status: c.status })) || [],
      emergencyContactName: ec?.name || '',
      emergencyContactRelationship: ec?.relationship || '',
      emergencyContactPhone: ec?.phone || '',
    });
  };

  const openDetail = (crewId: string) => {
    setSelectedCrewId(crewId);
    setEditMode(false);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
    setSelectedCrewId(null);
    setEditMode(false);
  };

  const backToList = () => {
    setSelectedCrewId(null);
    setEditMode(false);
  };

  const startEdit = () => {
    if (selectedCrew) {
      populateFormFromCrew(selectedCrew);
      setEditMode(true);
    }
  };

  // ---- Loading ----

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: ADMIN_COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // ---- Detail / Edit View ----

  if (selectedCrewId && selectedCrew) {
    const records = trainingRecords.filter((t) => t.crewMemberId === selectedCrew.id);
    const certified = records.filter((t) => t.status === 'certified').length;
    const tier = TIER_LABELS[selectedCrew.tier] || TIER_LABELS.learner;
    const initials = selectedCrew.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const ec = selectedCrew.emergencyContact;
    const sc = selectedCrew.structuredCertifications;

    if (editMode) {
      return (
        <PageErrorBoundary>
          <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
            <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setEditMode(false)} style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ChevronLeft size={18} style={{ color: 'var(--charcoal)' }} />
                  </button>
                  <div>
                    <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                      Edit Member
                    </h1>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{selectedCrew.name}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 12 }}>
              <CrewForm
                form={form}
                setField={setField}
                handleWageChange={handleWageChange}
                toggleTrade={toggleTrade}
                addCert={addCert}
                updateCert={updateCert}
                removeCert={removeCert}
                onSubmit={handleUpdate}
                onCancel={() => setEditMode(false)}
                isPending={updateCrew.isPending}
                submitLabel="Save Changes"
                pendingLabel="Saving..."
              />
            </div>
          </div>
        </PageErrorBoundary>
      );
    }

    // Read-only detail view
    return (
      <PageErrorBoundary>
        <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
          {/* Header */}
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={backToList} style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <ChevronLeft size={18} style={{ color: 'var(--charcoal)' }} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ADMIN_COLOR }} />
                    <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                      Crew Member
                    </h1>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Admin / Crew / {selectedCrew.name}</p>
                </div>
              </div>
              <button onClick={startEdit} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl" style={{ background: ADMIN_COLOR }}>
                <Edit2 size={16} color="#FFFFFF" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

            {/* Profile Card */}
            <div style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: ADMIN_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)' }}>{selectedCrew.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--mid)' }}>{selectedCrew.role || 'Installer'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 2, color: tier.color, background: `${tier.color}15` }}>
                      {tier.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(selectedCrew.email || selectedCrew.phone) && (
              <div style={{ marginTop: 16 }}>
                <SectionHeader title="Contact" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {selectedCrew.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: selectedCrew.phone ? '1px solid var(--border)' : 'none', minHeight: 48 }}>
                      <Mail size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--charcoal)' }}>{selectedCrew.email}</span>
                    </div>
                  )}
                  {selectedCrew.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', minHeight: 48 }}>
                      <Phone size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--charcoal)' }}>{selectedCrew.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compensation */}
            {(selectedCrew.wageRate > 0 || selectedCrew.chargedRate > 0) && (
              <div style={{ marginTop: 16 }}>
                <SectionHeader title="Compensation" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={{ ...labelStyle, marginBottom: 2 }}>Wage Rate</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)' }}>
                        ${selectedCrew.wageRate.toFixed(2)}/hr
                      </span>
                    </div>
                    <div>
                      <span style={{ ...labelStyle, marginBottom: 2 }}>Charged Rate</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)' }}>
                        ${selectedCrew.chargedRate.toFixed(2)}/hr
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Specialties */}
            {selectedCrew.tradeSpecialties && selectedCrew.tradeSpecialties.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <SectionHeader title="Trade Specialties" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedCrew.tradeSpecialties.map((trade) => (
                      <span key={trade} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 4, background: `${ADMIN_COLOR}15`, color: ADMIN_COLOR }}>
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {sc && sc.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <SectionHeader title="Certifications" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {sc.map((cert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < sc.length - 1 ? '1px solid var(--border)' : 'none', minHeight: 48 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Shield size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{cert.name}</div>
                          {cert.expiresAt && (
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                              Expires: {new Date(cert.expiresAt).toLocaleDateString('en-CA')}
                            </div>
                          )}
                        </div>
                      </div>
                      <CertStatusBadge cert={cert} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIME & HOURS */}
            {/**
             * Placeholder data until timeclock service is wired.
             * All values are static. Wire to timeclock entries queryable
             * by crew member ID in a future sprint.
             */}
            <div style={{ marginTop: 16, marginBottom: 20 }}>
              <SectionHeader title="Time & Hours" />

              {/* Stat row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                marginBottom: 12,
              }}>
                {[
                  { label: 'This week', value: '32.2h', sub: '26.4h install' },
                  { label: 'This month', value: '118h', sub: '94h install' },
                  { label: 'Indirect', value: '18%', sub: 'of total hours' },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    padding: '10px 12px',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      color: 'var(--muted)',
                      marginBottom: 5,
                    }}>{stat.label}</div>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      color: 'var(--charcoal)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>{stat.value}</div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                      marginTop: 2,
                    }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Indirect breakdown */}
              <div style={{
                padding: '8px 12px',
                background: 'rgba(217,119,6,0.05)',
                border: '1px solid rgba(217,119,6,0.15)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--yellow)',
                    marginBottom: 2,
                  }}>Indirect this week</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--muted)',
                  }}>Travel 1.8h · Setup 0.6h · Clean 0.9h · Mat Run 0.4h</div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--yellow)',
                }}>3.7h</div>
              </div>

              {/* Jobs this week */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: 'var(--muted)',
                marginBottom: 8,
              }}>Jobs this week</div>

              {[
                { job: '14 Hillside Crescent', hours: '17.2h', indirect: '1.8h', variance: '+1.7h', over: true },
                { job: '88 Pine Street', hours: '15.0h', indirect: '1.9h', variance: '\u22120.4h', over: false },
              ].map((entry, i, arr) => (
                <div key={entry.job} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 52px 52px 60px',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 8,
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--charcoal)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{entry.job}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--charcoal)',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{entry.hours}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--yellow)',
                    textAlign: 'right',
                  }}>{entry.indirect}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: entry.over ? 'var(--red)' : 'var(--green)',
                    textAlign: 'right',
                  }}>{entry.variance}</div>
                </div>
              ))}

              {/* Column labels */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 52px 52px 60px',
                gap: 8,
                marginTop: 4,
              }}>
                <div/>
                {['Hours', 'Indirect', 'Variance'].map((label) => (
                  <div key={label} style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 7,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--muted)',
                    textAlign: 'right',
                  }}>{label}</div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            {ec && ec.name && (
              <div style={{ marginTop: 16 }}>
                <SectionHeader title="Emergency Contact" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={14} style={{ color: 'var(--amber, #F59E0B)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{ec.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {ec.relationship}{ec.phone ? ` \u2014 ${ec.phone}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions — Archive / Delete */}
            <div style={{ marginTop: 16 }}>
              <SectionHeader title="Actions" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    const ok = window.confirm(`Archive "${selectedCrew.name}"? They will be hidden from active crew lists but their data is kept.`);
                    if (!ok) return;
                    await archiveCrew.mutateAsync(selectedCrew.id);
                    backToList();
                  }}
                  disabled={archiveCrew.isPending}
                  style={{
                    flex: 1, minHeight: 44, borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                    background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {archiveCrew.isPending ? 'Archiving...' : 'Archive Member'}
                </button>
                <button
                  onClick={async () => {
                    const ok = window.confirm(`Permanently delete "${selectedCrew.name}"? This cannot be undone.`);
                    if (!ok) return;
                    await deleteCrew.mutateAsync(selectedCrew.id);
                    backToList();
                  }}
                  disabled={deleteCrew.isPending}
                  style={{
                    flex: 1, minHeight: 44, borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                    background: 'var(--red, #DC2626)', color: '#FFFFFF', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', opacity: deleteCrew.isPending ? 0.5 : 1,
                  }}
                >
                  {deleteCrew.isPending ? 'Deleting...' : 'Delete Member'}
                </button>
              </div>
            </div>

            {/* Training Progress */}
            <div style={{ marginTop: 16 }}>
              <SectionHeader title="Training Progress" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {records.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <GraduationCap size={18} style={{ color: 'var(--muted)', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>No training records yet</p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
                          {certified} of {records.length} certified
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: records.length > 0 ? 'var(--green)' : 'var(--muted)' }}>
                          {records.length > 0 ? Math.round((certified / records.length) * 100) : 0}%
                        </span>
                      </div>
                      <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--border)' }}>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--green)', width: `${records.length > 0 ? (certified / records.length) * 100 : 0}%`, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                    {records.map((rec, i) => (
                      <div key={rec.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < records.length - 1 ? '1px solid var(--border)' : 'none', minHeight: 44 }}>
                        <span style={{ fontSize: 12, color: 'var(--charcoal)' }}>{rec.sopId}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 2,
                          color: rec.status === 'certified' ? 'var(--green)' : rec.status === 'in_progress' ? 'var(--blue)' : 'var(--muted)',
                          background: rec.status === 'certified' ? 'var(--green)15' : rec.status === 'in_progress' ? 'var(--blue)15' : 'var(--muted)15',
                        }}>
                          {rec.status}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // ---- List View ----

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ADMIN_COLOR }} />
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                  Crew Management
                </h1>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Team members and certifications</p>
            </div>
            <button
              onClick={() => showForm ? setShowForm(false) : openCreate()}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
              style={{ background: ADMIN_COLOR }}
            >
              {showForm ? <X size={18} color="#FFFFFF" strokeWidth={2.5} /> : <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Add Crew Form */}
        {showForm && (
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 12 }}>
            <CrewForm
              form={form}
              setField={setField}
              handleWageChange={handleWageChange}
              toggleTrade={toggleTrade}
              addCert={addCert}
              updateCert={updateCert}
              removeCert={removeCert}
              onSubmit={handleCreate}
              onCancel={() => { resetForm(); setShowForm(false); }}
              isPending={createCrew.isPending}
              submitLabel="Create"
              pendingLabel="Creating..."
            />
          </div>
        )}

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Crew List */}
          <div style={{ marginTop: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {crewMembers.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <UsersRound size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>No crew members found</p>
                </div>
              ) : (
                crewMembers.map((crew, i) => {
                  const records = trainingRecords.filter((t) => t.crewMemberId === crew.id);
                  const certified = records.filter((t) => t.status === 'certified').length;
                  const tier = TIER_LABELS[crew.tier] || TIER_LABELS.learner;
                  const initials = crew.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <button
                      key={crew.id}
                      onClick={() => openDetail(crew.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderBottom: i < crewMembers.length - 1 ? '1px solid var(--border)' : 'none',
                        textDecoration: 'none',
                        minHeight: 56,
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        borderBottomStyle: i < crewMembers.length - 1 ? 'solid' : 'none',
                        borderBottomWidth: i < crewMembers.length - 1 ? 1 : 0,
                        borderBottomColor: 'var(--border)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: ADMIN_COLOR,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'white',
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{crew.name}</span>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '1px 5px', borderRadius: 2,
                            color: tier.color,
                            background: `${tier.color}15`,
                          }}>
                            {tier.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <GraduationCap size={11} style={{ color: 'var(--muted)' }} />
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {certified}/{records.length} certifications
                          </span>
                          {crew.wageRate > 0 && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginLeft: 8 }}>
                              ${crew.wageRate}/hr
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ---------- Crew Form Component ----------

function CrewForm({
  form,
  setField,
  handleWageChange,
  toggleTrade,
  addCert,
  updateCert,
  removeCert,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  pendingLabel,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  handleWageChange: (val: string) => void;
  toggleTrade: (trade: string) => void;
  addCert: () => void;
  updateCert: (idx: number, field: keyof CertEntry, val: string) => void;
  removeCert: (idx: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  const canSubmit = form.name.trim() && form.authRole && !isPending;

  return (
    <div style={{ padding: 16, borderRadius: 'var(--radius)', background: 'var(--surface)', border: `2px solid ${ADMIN_COLOR}40`, boxShadow: 'var(--shadow-card)' }}>

      {/* Basic Info */}
      <SectionHeader title="Basic Info" />
      <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input
            type="text" value={form.name} onChange={(e) => setField('name', e.target.value)}
            placeholder="e.g. John Smith"
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Role *</label>
            <select
              value={form.authRole} onChange={(e) => setField('authRole', e.target.value as FormState['authRole'])}
              style={inputStyle}
            >
              <option value="">Select role</option>
              <option value="owner">Owner</option>
              <option value="operator">Operator</option>
              <option value="installer">Installer</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tier *</label>
            <select
              value={form.tier} onChange={(e) => setField('tier', e.target.value as FormState['tier'])}
              style={inputStyle}
            >
              <option value="learner">Learner</option>
              <option value="proven">Proven</option>
              <option value="lead">Lead</option>
              <option value="master">Master</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
              placeholder="email@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)}
              placeholder="(506) 555-0123"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Compensation */}
      <SectionHeader title="Compensation" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Wage Rate ($/hr)</label>
          <input
            type="number" value={form.wageRate} onChange={(e) => handleWageChange(e.target.value)}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Charged Rate ($/hr)</label>
          <input
            type="number" value={form.chargedRate} onChange={(e) => setField('chargedRate', e.target.value)}
            placeholder="Auto: wage x 1.5"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Trade Specialties */}
      <SectionHeader title="Trade Specialties" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {TRADE_OPTIONS.map((trade) => {
          const active = form.tradeSpecialties.includes(trade);
          return (
            <button
              key={trade}
              type="button"
              onClick={() => toggleTrade(trade)}
              style={{
                minHeight: 44,
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${active ? ADMIN_COLOR : 'var(--border)'}`,
                background: active ? `${ADMIN_COLOR}15` : 'var(--bg)',
                color: active ? ADMIN_COLOR : 'var(--mid)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {active && <Check size={12} />}
              {trade}
            </button>
          );
        })}
      </div>

      {/* Certifications */}
      <SectionHeader title="Certifications" />
      <div style={{ marginBottom: 16 }}>
        {form.certifications.map((cert, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
            <div>
              {idx === 0 && <label style={labelStyle}>Name</label>}
              <input
                type="text"
                value={cert.name}
                onChange={(e) => updateCert(idx, 'name', e.target.value)}
                placeholder="e.g. First Aid"
                list="cert-suggestions"
                style={inputStyle}
              />
            </div>
            <div>
              {idx === 0 && <label style={labelStyle}>Expiry</label>}
              <input
                type="date"
                value={cert.expiresAt}
                onChange={(e) => updateCert(idx, 'expiresAt', e.target.value)}
                style={{ ...inputStyle, width: 140 }}
              />
            </div>
            <div>
              {idx === 0 && <label style={labelStyle}>Status</label>}
              <select
                value={cert.status}
                onChange={(e) => updateCert(idx, 'status', e.target.value)}
                style={{ ...inputStyle, width: 100 }}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => removeCert(idx)}
              style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <datalist id="cert-suggestions">
          {CERT_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
        <button
          type="button"
          onClick={addCert}
          style={{
            minHeight: 44,
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            fontSize: 12,
            fontWeight: 600,
            border: `1px dashed var(--border)`,
            background: 'var(--bg)',
            color: 'var(--mid)',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
          }}
        >
          + Add Certification
        </button>
      </div>

      {/* Emergency Contact */}
      <SectionHeader title="Emergency Contact" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input
            type="text" value={form.emergencyContactName} onChange={(e) => setField('emergencyContactName', e.target.value)}
            placeholder="Contact name"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Relationship</label>
          <input
            type="text" value={form.emergencyContactRelationship} onChange={(e) => setField('emergencyContactRelationship', e.target.value)}
            placeholder="e.g. Spouse"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel" value={form.emergencyContactPhone} onChange={(e) => setField('emergencyContactPhone', e.target.value)}
            placeholder="(506) 555-0123"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, minHeight: 44, borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{ flex: 1, minHeight: 44, borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, background: ADMIN_COLOR, color: '#FFFFFF', border: 'none', cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.5, fontFamily: 'inherit' }}
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}
