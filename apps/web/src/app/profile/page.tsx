'use client';

/**
 * Profile Page — User profile and settings
 *
 * Design language: monochrome base + teal accent, inline styles,
 * mobile-first with 48px touch targets.
 */

import { useRouter } from 'next/navigation';
import { ChevronRight, Briefcase, Clock, FlaskConical, Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  // TODO: Replace with real hooks (useUser, useEstimateAccuracy)
  const user = { name: 'Nathan Montgomery', company: 'Hooomz Interiors' };
  const initials = user.name.split(' ').map((n) => n[0]).join('');
  const stats = {
    projectsCompleted: 47,
    hoursLogged: 2340,
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header with avatar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold text-white"
            style={{ background: '#0F766E' }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#111827' }}>{user.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{user.company}</p>
            <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>Red Seal Journeyman Carpenter</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div
            className="rounded-xl p-4 md:p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
            style={{ background: '#FFFFFF', borderLeft: '4px solid #3B82F6', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={14} style={{ color: '#6B7280' }} />
              <span className="text-[13px] font-medium" style={{ color: '#6B7280' }}>Projects</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#111827' }}>{stats.projectsCompleted}</p>
          </div>
          <div
            className="rounded-xl p-4 md:p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
            style={{ background: '#FFFFFF', borderLeft: '4px solid #10B981', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} style={{ color: '#6B7280' }} />
              <span className="text-[13px] font-medium" style={{ color: '#6B7280' }}>Hours Logged</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#111827' }}>{stats.hoursLogged.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
            Quick Links
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}
          >
            <button
              onClick={() => router.push('/labs')}
              className="w-full flex items-center justify-between px-4 min-h-[52px] hover:bg-gray-50 transition-colors"
              style={{ borderBottom: '1px solid #F3F4F6' }}
            >
              <div className="flex items-center gap-3">
                <FlaskConical size={18} style={{ color: '#0F766E' }} />
                <span className="text-sm font-medium" style={{ color: '#111827' }}>Labs</span>
              </div>
              <ChevronRight size={16} style={{ color: '#D1D5DB' }} />
            </button>
            <button
              onClick={() => router.push('/labs/seed')}
              className="w-full flex items-center justify-between px-4 min-h-[52px] hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={18} style={{ color: '#6B7280' }} />
                <span className="text-sm font-medium" style={{ color: '#111827' }}>Seed Data</span>
              </div>
              <ChevronRight size={16} style={{ color: '#D1D5DB' }} />
            </button>
          </div>
        </div>

        {/* Sign Out — text button at bottom */}
        <div className="pt-4">
          <button
            className="w-full flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium transition-colors"
            style={{ color: '#9CA3AF' }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
