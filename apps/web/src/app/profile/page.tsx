'use client';

/**
 * Profile Page — User profile and settings
 *
 * Design language: monochrome base + teal accent, inline styles,
 * mobile-first with 48px touch targets.
 */

import { useRouter } from 'next/navigation';
import { User, ChevronRight, Briefcase, Clock, FlaskConical, Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  // TODO: Replace with real hooks (useUser, useEstimateAccuracy)
  const user = { name: 'Nathan Montgomery', company: 'Hooomz Interiors' };
  const stats = {
    projectsCompleted: 47,
    hoursLogged: 2340,
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#F3F4F6' }}
          >
            <User size={28} style={{ color: '#6B7280' }} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>{user.name}</h1>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{user.company}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-4"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={14} style={{ color: '#6B7280' }} />
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Projects</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#111827' }}>{stats.projectsCompleted}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} style={{ color: '#6B7280' }} />
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Hours Logged</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#111827' }}>{stats.hoursLogged.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          <button
            onClick={() => router.push('/labs')}
            className="w-full flex items-center justify-between px-4 min-h-[48px]"
            style={{ borderBottom: '1px solid #F3F4F6' }}
          >
            <div className="flex items-center gap-3">
              <FlaskConical size={16} style={{ color: '#0F766E' }} />
              <span className="text-sm font-medium" style={{ color: '#111827' }}>Labs</span>
            </div>
            <ChevronRight size={16} style={{ color: '#D1D5DB' }} />
          </button>
          <button
            onClick={() => router.push('/labs/seed')}
            className="w-full flex items-center justify-between px-4 min-h-[48px]"
            style={{ borderBottom: '1px solid #F3F4F6' }}
          >
            <div className="flex items-center gap-3">
              <Settings size={16} style={{ color: '#6B7280' }} />
              <span className="text-sm font-medium" style={{ color: '#111827' }}>Seed Data</span>
            </div>
            <ChevronRight size={16} style={{ color: '#D1D5DB' }} />
          </button>
        </div>

        {/* Sign Out */}
        <button
          className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl text-sm font-medium"
          style={{ color: '#EF4444', background: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
