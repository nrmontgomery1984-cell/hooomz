'use client';

/**
 * Settings — App configuration
 */

import { useState, useEffect, useCallback } from 'react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { Settings, Sun, Moon, Monitor, DollarSign, RefreshCw } from 'lucide-react';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import { useViewMode, VIEW_MODE_LABELS } from '@/lib/viewmode';
import { useSkillRateConfig, useUpdateSkillRateConfig, useRecalculateProjectEstimates } from '@/lib/hooks/useLabourEstimation';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { supabase } from '@/lib/supabase/client';
import type { ViewMode } from '@/lib/viewmode';
import type { SkillLevel } from '@/lib/types/labourEstimation.types';
import { SECTION_COLORS } from '@/lib/viewmode';

const ADMIN_COLOR = SECTION_COLORS.admin;
const VIEW_MODES: ViewMode[] = ['manager', 'operator', 'installer', 'homeowner'];

export default function SettingsPage() {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { viewMode, setViewMode } = useViewMode();

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ADMIN_COLOR }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                Settings
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>App configuration and preferences</p>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Theme */}
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="Appearance" />
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <button
                onClick={toggleDark}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  minHeight: 48, fontFamily: 'var(--font-mono)',
                }}
              >
                {isDark ? <Moon size={18} style={{ color: 'var(--mid)' }} /> : <Sun size={18} style={{ color: 'var(--mid)' }} />}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>Theme</span>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                    Currently: {isDark ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 4,
                  fontSize: 11, fontWeight: 600,
                  background: 'var(--blue-bg)', color: 'var(--blue)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                }}>
                  Toggle
                </div>
              </button>
            </div>
          </div>

          {/* View Mode — DEV ONLY */}
          {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="View Mode" />
            <div style={{
              border: '2px solid var(--amber, #D97706)',
              background: 'rgba(217,119,6,0.04)',
              padding: 0,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: 'rgba(217,119,6,0.1)',
                borderBottom: '1px solid rgba(217,119,6,0.2)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--amber, #D97706)',
                }}>
                  ⚠ DEV TOOL — Not visible in production builds
                </span>
              </div>
              <div style={{ background: 'var(--surface)' }}>
                {VIEW_MODES.map((mode, i) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '12px 16px',
                      background: viewMode === mode ? `${ADMIN_COLOR}10` : 'none',
                      border: 'none', cursor: 'pointer',
                      borderBottom: i < VIEW_MODES.length - 1 ? '1px solid var(--border)' : 'none',
                      minHeight: 44, fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <Monitor size={16} style={{ color: viewMode === mode ? ADMIN_COLOR : 'var(--muted)' }} />
                    <span style={{
                      fontSize: 13, fontWeight: viewMode === mode ? 600 : 500,
                      color: viewMode === mode ? 'var(--charcoal)' : 'var(--mid)',
                      flex: 1, textAlign: 'left',
                    }}>
                      {VIEW_MODE_LABELS[mode]}
                    </span>
                    {viewMode === mode && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: ADMIN_COLOR,
                      }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Skill Rates & Margins */}
          <SkillRateSection />

          {/* Role Permissions */}
          <RolePermissionsSection />

          {/* App Info */}
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="About" />
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Settings size={14} style={{ color: 'var(--muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>Hooomz OS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <InfoRow label="Version" value="Pre-release" />
                <IdbInfoRow />
                <InfoRow label="Storage" value="Offline-first" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {title}
      </span>
    </div>
  );
}

function SkillRateSection() {
  const { data: config, isLoading } = useSkillRateConfig();
  const updateConfig = useUpdateSkillRateConfig();
  const recalculate = useRecalculateProjectEstimates();
  const { projectId } = useActiveCrew();

  const [editingMargin, setEditingMargin] = useState(false);
  const [marginInput, setMarginInput] = useState('');
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [rateInput, setRateInput] = useState('');

  if (isLoading || !config) {
    return (
      <div style={{ marginTop: 16 }}>
        <SectionHeader title="Skill Rates & Margins" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading config...</p>
        </div>
      </div>
    );
  }

  const handleMarginSave = () => {
    const val = parseFloat(marginInput);
    if (!isNaN(val) && val > 0 && val < 100) {
      updateConfig.mutate({ marginTargets: { ...config.marginTargets, default: val / 100 } });
    }
    setEditingMargin(false);
  };

  const handleRateSave = (level: number) => {
    const val = parseFloat(rateInput);
    if (!isNaN(val) && val > 0) {
      const updated: SkillLevel[] = config.skillLevels.map((sl) =>
        sl.level === level ? { ...sl, costRate: val } : sl
      );
      updateConfig.mutate({ skillLevels: updated });
    }
    setEditingLevel(null);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <SectionHeader title="Skill Rates & Margins" />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>

        {/* Default margin */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>Default Margin</span>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Applied when no project/trade override exists</p>
            </div>
            {editingMargin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={marginInput}
                  onChange={(e) => setMarginInput(e.target.value)}
                  style={{ width: 60, padding: '4px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', color: 'var(--charcoal)', textAlign: 'right' }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMarginSave(); if (e.key === 'Escape') setEditingMargin(false); }}
                />
                <span style={{ fontSize: 13, color: 'var(--mid)' }}>%</span>
                <button onClick={handleMarginSave} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'var(--charcoal)', color: 'var(--surface)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingMargin(true); setMarginInput(String(Math.round(config.marginTargets.default * 100))); }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: ADMIN_COLOR, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {Math.round(config.marginTargets.default * 100)}%
              </button>
            )}
          </div>
        </div>

        {/* Skill levels table */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <DollarSign size={14} style={{ color: 'var(--muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>Skill Levels</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {config.skillLevels.map((sl, i) => (
              <div
                key={sl.level}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < config.skillLevels.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)' }}>
                    L{sl.level} — {sl.label}
                  </span>
                  <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{sl.description}</p>
                </div>
                {editingLevel === sl.level ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--mid)' }}>$</span>
                    <input
                      type="number"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      style={{ width: 56, padding: '4px 6px', fontSize: 12, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', color: 'var(--charcoal)', textAlign: 'right' }}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRateSave(sl.level); if (e.key === 'Escape') setEditingLevel(null); }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>/hr</span>
                    <button onClick={() => handleRateSave(sl.level)} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'var(--charcoal)', color: 'var(--surface)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>OK</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingLevel(sl.level); setRateInput(String(sl.costRate)); }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: ADMIN_COLOR, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ${sl.costRate}/hr
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recalculate button */}
        {projectId && (
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={() => recalculate.mutate(projectId)}
              disabled={recalculate.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '10px 16px', minHeight: 44,
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                background: 'var(--surface-3)', color: 'var(--mid)',
                border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer',
                opacity: recalculate.isPending ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} style={{ animation: recalculate.isPending ? 'spin 0.7s linear infinite' : 'none' }} />
              {recalculate.isPending ? 'Recalculating...' : 'Recalculate All Open Estimates'}
            </button>
          </div>
        )}
      </div>
      <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, padding: '0 4px' }}>
        Cost rates are what you pay crew at each skill level. Margin is applied on top of cost to determine sell price.
      </p>
    </div>
  );
}

const ROLES = ['owner', 'operator', 'installer', 'homeowner'] as const;
const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'design', label: 'Design' },
  { key: 'script', label: 'Script' },
  { key: 'sales', label: 'Sales' },
  { key: 'leads', label: 'Leads' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'estimates', label: 'Estimates' },
  { key: 'site_visits', label: 'Site Visits' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'production', label: 'Production' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'materials', label: 'Materials' },
  { key: 'punch_lists', label: 'Punch Lists' },
  { key: 'activity', label: 'Activity' },
  { key: 'finance', label: 'Finance' },
  { key: 'cost_items', label: 'Cost Items' },
  { key: 'standards', label: 'Standards' },
  { key: 'labs', label: 'Labs' },
  { key: 'customers', label: 'Customers' },
  { key: 'settings', label: 'Settings' },
  { key: 'admin', label: 'Admin' },
];

interface PermRow {
  id: string;
  role: string;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

function RolePermissionsSection() {
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('owner');

  const loadPerms = useCallback(async () => {
    const { data } = await supabase
      .from('role_permissions')
      .select('id, role, module, can_view, can_edit, can_delete')
      .order('module');
    if (data) setPerms(data as PermRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadPerms(); }, [loadPerms]);

  const togglePerm = async (role: string, module: string, field: 'can_view' | 'can_edit' | 'can_delete') => {
    const row = perms.find((p) => p.role === role && p.module === module);
    if (!row) return;

    const newVal = !row[field];
    const key = `${role}-${module}-${field}`;
    setSaving(key);

    // If turning off can_view, also turn off can_edit and can_delete
    const updates: Partial<PermRow> = { [field]: newVal };
    if (field === 'can_view' && !newVal) {
      updates.can_edit = false;
      updates.can_delete = false;
    }
    // If turning on can_edit or can_delete, also turn on can_view
    if ((field === 'can_edit' || field === 'can_delete') && newVal) {
      updates.can_view = true;
    }

    await supabase.from('role_permissions').update(updates).eq('id', row.id);

    setPerms((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, ...updates } : p))
    );
    setSaving(null);
  };

  if (loading) {
    return (
      <div style={{ marginTop: 16 }}>
        <SectionHeader title="Role Permissions" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading permissions...</p>
        </div>
      </div>
    );
  }

  const rolePerms = perms.filter((p) => p.role === selectedRole);

  return (
    <div style={{ marginTop: 16 }}>
      <SectionHeader title="Role Permissions" />

      {/* Role tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '1px solid var(--border)' }}>
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            style={{
              padding: '8px 14px',
              fontSize: 11,
              fontWeight: selectedRole === role ? 700 : 500,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: selectedRole === role ? ADMIN_COLOR : 'var(--muted)',
              background: 'none',
              border: 'none',
              borderBottom: selectedRole === role ? `2px solid ${ADMIN_COLOR}` : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Permissions grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2, var(--surface))',
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Module</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>View</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Edit</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Delete</span>
        </div>

        {MODULES.map((mod, i) => {
          const row = rolePerms.find((p) => p.module === mod.key);
          return (
            <div
              key={mod.key}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px',
                padding: '10px 16px',
                alignItems: 'center',
                borderBottom: i < MODULES.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--charcoal)' }}>
                {mod.label}
              </span>
              {(['can_view', 'can_edit', 'can_delete'] as const).map((field) => {
                const isOn = row?.[field] ?? false;
                const isSaving = saving === `${selectedRole}-${mod.key}-${field}`;
                return (
                  <div key={field} style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => togglePerm(selectedRole, mod.key, field)}
                      disabled={isSaving}
                      style={{
                        width: 32,
                        height: 20,
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        background: isOn ? 'var(--green)' : 'var(--border, #ddd)',
                        transition: 'background 0.2s',
                        opacity: isSaving ? 0.5 : 1,
                      }}
                    >
                      <div style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: 2,
                        left: isOn ? 14 : 2,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, padding: '0 4px' }}>
        Controls which modules each role can access. Turning off View also disables Edit and Delete.
      </p>
    </div>
  );
}

function IdbInfoRow() {
  const [info, setInfo] = useState<string>('…');

  useEffect(() => {
    // Open the known IDB database to read version + store count
    const dbName = 'hooomz';
    const req = indexedDB.open(dbName);
    req.onsuccess = () => {
      const db = req.result;
      setInfo(`v${db.version} — ${db.objectStoreNames.length} stores`);
      db.close();
    };
    req.onerror = () => {
      setInfo('unavailable');
    };
    // If this triggers an upgrade (no DB exists), close immediately
    req.onupgradeneeded = () => {
      req.transaction?.abort();
    };
  }, []);

  return <InfoRow label="IndexedDB" value={info} />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mid)' }}>{value}</span>
    </div>
  );
}
