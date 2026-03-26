'use client';

/**
 * Profile Page — User profile, crew, and business stats.
 *
 * Pulls real data from IndexedDB: project count, crew members, activity count.
 * Dense layout with monochrome base + accent.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight,
  Briefcase,
  Users,
  Activity,
  FlaskConical,
  Settings,
  LogOut,
} from 'lucide-react';
import { useLocalProjects, useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useViewMode, VIEW_MODE_LABELS } from '@/lib/viewmode';
import type { ViewMode } from '@/lib/viewmode';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

const TIER_LABELS: Record<string, string> = {
  master: 'Master',
  lead: 'Lead',
  proven: 'Proven',
  learner: 'Learner',
};

const TIER_COLORS: Record<string, string> = {
  master: 'var(--green)',
  lead: 'var(--blue)',
  proven: 'var(--yellow)',
  learner: 'var(--muted)',
};

interface CrewMemberInfo {
  id: string;
  name: string;
  role: string;
  tier: string;
  tradeSpecialties: string[];
  isActive: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: projectsResult } = useLocalProjects();
  const { data: activityData } = useLocalRecentActivity(100);
  const { services } = useServicesContext();
  const { signOut } = useAuth();
  const [crew, setCrew] = useState<CrewMemberInfo[]>([]);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); setPwStatus('error'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); setPwStatus('error'); return; }
    setPwStatus('saving');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPwError(error.message); setPwStatus('error'); }
    else { setPwStatus('success'); setNewPassword(''); setConfirmPassword(''); }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  const { viewMode, setViewMode } = useViewMode();

  const projects = projectsResult?.projects || [];
  const activityCount = activityData?.events?.length || 0;
  const completedProjects = projects.filter((p) => p.status === 'complete').length;

  // Load crew from IndexedDB
  useEffect(() => {
    if (!services) return;
    let cancelled = false;

    async function loadCrew() {
      try {
        const members = await services!.crew.findAll();
        if (!cancelled) {
          setCrew(
            members.map((m) => ({
              id: m.id || '',
              name: m.name || '',
              role: m.role || '',
              tier: m.tier || 'learner',
              tradeSpecialties: m.tradeSpecialties || [],
              isActive: m.isActive !== false,
            }))
          );
        }
      } catch {
        // Crew store may not exist yet
      }
    }

    loadCrew();
    return () => { cancelled = true; };
  }, [services]);

  const user = { name: 'Nathan Montgomery', company: 'Hooomz Interiors' };
  const initials = user.name.split(' ').map((n) => n[0]).join('');

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      {/* Header with avatar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
            style={{ background: 'var(--accent)' }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold" style={{ color: 'var(--charcoal)' }}>{user.name}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{user.company}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--border)' }}>Red Seal Journeyman Carpenter</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 mt-4 space-y-4">
        {/* Stats strip */}
        <div className="flex gap-2">
          <StatCard icon={Briefcase} label="Projects" value={projects.length} color="var(--blue)" />
          <StatCard icon={Users} label="Crew" value={crew.length} color="var(--accent)" />
          <StatCard icon={Activity} label="Events" value={activityCount} color="var(--yellow)" />
        </div>

        {/* View Mode (mobile access) */}
        <div
          className="rounded-xl p-3"
          style={{ background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--muted)' }}
            htmlFor="profile-view-mode"
          >
            View As
          </label>
          <select
            id="profile-view-mode"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg border"
            style={{
              color: 'var(--mid)',
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              minHeight: '44px',
            }}
          >
            {(Object.entries(VIEW_MODE_LABELS) as [ViewMode, string][]).map(([mode, label]) => (
              <option key={mode} value={mode}>{label}</option>
            ))}
          </select>
        </div>

        {/* Completion rate */}
        {projects.length > 0 && (
          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                Completion Rate
              </span>
              <span className="text-[13px] font-bold" style={{ color: 'var(--charcoal)' }}>
                {projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex rounded-full overflow-hidden h-1.5" style={{ background: 'var(--border)' }}>
              <div
                className="rounded-full"
                style={{
                  width: `${projects.length > 0 ? (completedProjects / projects.length) * 100 : 0}%`,
                  background: 'var(--green)',
                  minWidth: completedProjects > 0 ? '4px' : '0',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                {completedProjects} complete
              </span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                {projects.length - completedProjects} active
              </span>
            </div>
          </div>
        )}

        {/* Crew section */}
        {crew.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Crew Members
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              {crew.map((member, i) => {
                const tierColor = TIER_COLORS[member.tier] || 'var(--muted)';
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-3 py-2.5 min-h-[44px]"
                    style={{ borderBottom: i < crew.length - 1 ? '1px solid var(--surface-2)' : 'none' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                        style={{ background: tierColor }}
                      >
                        {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--charcoal)' }}>
                          {member.name}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase"
                        style={{ background: `${tierColor}15`, color: tierColor }}
                      >
                        {TIER_LABELS[member.tier] || member.tier}
                      </span>
                      {member.tradeSpecialties.length > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--border)' }}>
                          {member.tradeSpecialties.length} trade{member.tradeSpecialties.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
            Quick Links
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => router.push('/labs')}
              className="w-full flex items-center justify-between px-3 min-h-[44px] hover:bg-[var(--surface)] transition-colors"
              style={{ borderBottom: '1px solid var(--surface-2)' }}
            >
              <div className="flex items-center gap-2.5">
                <FlaskConical size={16} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--charcoal)' }}>Labs</span>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--border)' }} />
            </button>
            <button
              onClick={() => router.push('/labs/seed')}
              className="w-full flex items-center justify-between px-3 min-h-[44px] hover:bg-[var(--surface)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={16} style={{ color: 'var(--muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--charcoal)' }}>Seed Data</span>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--border)' }} />
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Change Password
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPwStatus('idle'); }}
              placeholder="New password (min 8 chars)"
              style={{ width: '100%', minHeight: 36, padding: '0 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPwStatus('idle'); }}
              placeholder="Confirm new password"
              style={{ width: '100%', minHeight: 36, padding: '0 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
            />
            {pwStatus === 'error' && (
              <p style={{ fontSize: 11, color: 'var(--red)' }}>{pwError}</p>
            )}
            {pwStatus === 'success' && (
              <p style={{ fontSize: 11, color: 'var(--green)' }}>Password updated.</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={pwStatus === 'saving' || !newPassword}
              style={{
                minHeight: 36, borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600,
                background: 'var(--accent)', color: '#fff', border: 'none',
                cursor: newPassword ? 'pointer' : 'default',
                opacity: newPassword && pwStatus !== 'saving' ? 1 : 0.5,
              }}
            >
              {pwStatus === 'saving' ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-medium transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex-1 rounded-xl p-3"
      style={{ background: 'var(--surface)', borderLeft: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: 'var(--muted)' }} />
        <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>{value}</p>
    </div>
  );
}
