'use client';

/**
 * Settings — App configuration
 */

import { useState } from 'react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { Settings, Sun, Moon, Monitor, DollarSign, RefreshCw } from 'lucide-react';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import { useViewMode, VIEW_MODE_LABELS } from '@/lib/viewmode';
import { useSkillRateConfig, useUpdateSkillRateConfig, useRecalculateProjectEstimates } from '@/lib/hooks/useLabourEstimation';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
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
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ADMIN_COLOR }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                Settings
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>App configuration and preferences</p>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Theme */}
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="Appearance" />
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <button
                onClick={toggleDark}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  minHeight: 48,
                }}
              >
                {isDark ? <Moon size={18} style={{ color: 'var(--text-2)' }} /> : <Sun size={18} style={{ color: 'var(--text-2)' }} />}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Theme</span>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                    Currently: {isDark ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 4,
                  fontSize: 11, fontWeight: 600,
                  background: 'var(--blue-dim)', color: 'var(--blue)',
                  fontFamily: 'var(--font-cond)', letterSpacing: '0.04em',
                }}>
                  Toggle
                </div>
              </button>
            </div>
          </div>

          {/* View Mode */}
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="View Mode" />
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
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
                    minHeight: 44,
                  }}
                >
                  <Monitor size={16} style={{ color: viewMode === mode ? ADMIN_COLOR : 'var(--text-3)' }} />
                  <span style={{
                    fontSize: 13, fontWeight: viewMode === mode ? 600 : 500,
                    color: viewMode === mode ? 'var(--text)' : 'var(--text-2)',
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
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6, padding: '0 4px' }}>
              View mode controls which sections and features are visible. This is a development tool — not production auth.
            </p>
          </div>

          {/* Skill Rates & Margins */}
          <SkillRateSection />

          {/* App Info */}
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="About" />
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Settings size={14} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Hooomz OS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <InfoRow label="Version" value="Pre-release" />
                <InfoRow label="IndexedDB" value="v11 — 40 stores" />
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
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
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
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading config...</p>
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
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>

        {/* Default margin */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Default Margin</span>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Applied when no project/trade override exists</p>
            </div>
            {editingMargin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={marginInput}
                  onChange={(e) => setMarginInput(e.target.value)}
                  style={{ width: 60, padding: '4px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface-1)', color: 'var(--text)', textAlign: 'right' }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMarginSave(); if (e.key === 'Escape') setEditingMargin(false); }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>%</span>
                <button onClick={handleMarginSave} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'var(--text)', color: 'var(--surface-1)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
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
            <DollarSign size={14} style={{ color: 'var(--text-3)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Skill Levels</span>
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
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                    L{sl.level} — {sl.label}
                  </span>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{sl.description}</p>
                </div>
                {editingLevel === sl.level ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>$</span>
                    <input
                      type="number"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      style={{ width: 56, padding: '4px 6px', fontSize: 12, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface-1)', color: 'var(--text)', textAlign: 'right' }}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRateSave(sl.level); if (e.key === 'Escape') setEditingLevel(null); }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>/hr</span>
                    <button onClick={() => handleRateSave(sl.level)} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 600, background: 'var(--text)', color: 'var(--surface-1)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>OK</button>
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
                fontSize: 12, fontWeight: 600,
                background: 'var(--surface-3)', color: 'var(--text-2)',
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
      <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6, padding: '0 4px' }}>
        Cost rates are what you pay crew at each skill level. Margin is applied on top of cost to determine sell price.
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>{value}</span>
    </div>
  );
}
