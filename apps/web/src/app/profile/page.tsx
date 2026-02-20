'use client';

/**
 * Profile Page — User profile, crew, and business stats.
 *
 * Pulls real data from IndexedDB: project count, crew members, activity count.
 * Dense layout with monochrome base + teal accent.
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

const TIER_LABELS: Record<string, string> = {
  master: 'Master',
  lead: 'Lead',
  proven: 'Proven',
  learner: 'Learner',
};

const TIER_COLORS: Record<string, string> = {
  master: '#10B981',
  lead: '#3B82F6',
  proven: '#F59E0B',
  learner: '#9CA3AF',
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
  const [crew, setCrew] = useState<CrewMemberInfo[]>([]);
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
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header with avatar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
            style={{ background: '#0F766E' }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold" style={{ color: '#111827' }}>{user.name}</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{user.company}</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#D1D5DB' }}>Red Seal Journeyman Carpenter</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 mt-4 space-y-4">
        {/* Stats strip */}
        <div className="flex gap-2">
          <StatCard icon={Briefcase} label="Projects" value={projects.length} color="#3B82F6" />
          <StatCard icon={Users} label="Crew" value={crew.length} color="#0F766E" />
          <StatCard icon={Activity} label="Events" value={activityCount} color="#F59E0B" />
        </div>

        {/* View Mode (mobile access) */}
        <div
          className="rounded-xl p-3"
          style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: '#6B7280' }}
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
              color: '#374151',
              borderColor: '#E5E7EB',
              background: '#FFFFFF',
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
            style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>
                Completion Rate
              </span>
              <span className="text-[13px] font-bold" style={{ color: '#111827' }}>
                {projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex rounded-full overflow-hidden h-1.5" style={{ background: '#E5E7EB' }}>
              <div
                className="rounded-full"
                style={{
                  width: `${projects.length > 0 ? (completedProjects / projects.length) * 100 : 0}%`,
                  background: '#10B981',
                  minWidth: completedProjects > 0 ? '4px' : '0',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                {completedProjects} complete
              </span>
              <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                {projects.length - completedProjects} active
              </span>
            </div>
          </div>
        )}

        {/* Crew section */}
        {crew.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
              Crew Members
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              {crew.map((member, i) => {
                const tierColor = TIER_COLORS[member.tier] || '#9CA3AF';
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-3 py-2.5 min-h-[44px]"
                    style={{ borderBottom: i < crew.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                        style={{ background: tierColor }}
                      >
                        {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#111827' }}>
                          {member.name}
                        </p>
                        <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
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
                        <span className="text-[10px]" style={{ color: '#D1D5DB' }}>
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
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
            Quick Links
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}
          >
            <button
              onClick={() => router.push('/labs')}
              className="w-full flex items-center justify-between px-3 min-h-[44px] hover:bg-gray-50 transition-colors"
              style={{ borderBottom: '1px solid #F3F4F6' }}
            >
              <div className="flex items-center gap-2.5">
                <FlaskConical size={16} style={{ color: '#0F766E' }} />
                <span className="text-xs font-medium" style={{ color: '#111827' }}>Labs</span>
              </div>
              <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
            </button>
            <button
              onClick={() => router.push('/labs/seed')}
              className="w-full flex items-center justify-between px-3 min-h-[44px] hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={16} style={{ color: '#6B7280' }} />
                <span className="text-xs font-medium" style={{ color: '#111827' }}>Seed Data</span>
              </div>
              <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-2">
          <button
            className="w-full flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-medium transition-colors"
            style={{ color: '#9CA3AF' }}
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
      style={{ background: '#FFFFFF', borderLeft: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: '#6B7280' }} />
        <span className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: '#111827' }}>{value}</p>
    </div>
  );
}
