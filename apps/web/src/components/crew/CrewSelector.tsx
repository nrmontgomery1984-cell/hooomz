'use client';

/**
 * Crew Selector Component (Build 3a → updated Build 3c)
 *
 * Shown when no active crew session exists.
 * Build 3c: reads crew members from IndexedDB, falls back to hardcoded list.
 * Shows tier badge and wage info. Mobile-first: 48px touch targets.
 */

import { useState } from 'react';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useActiveCrewMembers } from '@/lib/hooks/useCrewData';
import type { CrewMember, CrewTier } from '@hooomz/shared-contracts';

interface CrewMemberOption {
  id: string;
  name: string;
  role: string;
  tier?: CrewTier;
}

// Fallback for when IndexedDB hasn't been seeded yet
const FALLBACK_CREW: CrewMemberOption[] = [
  { id: 'crew_nathan', name: 'Nathan Montgomery', role: 'Owner / Supervisor', tier: 'master' },
  { id: 'crew_nishant', name: 'Nishant', role: 'Flooring Specialist', tier: 'learner' },
];

const TIER_LABELS: Record<CrewTier, string> = {
  learner: 'Learner',
  proven: 'Proven',
  lead: 'Lead',
  master: 'Master',
};

const TIER_COLORS: Record<CrewTier, { bg: string; text: string }> = {
  learner: { bg: '#FEF3C7', text: '#92400E' },
  proven: { bg: '#D1FAE5', text: '#065F46' },
  lead: { bg: '#DBEAFE', text: '#1E40AF' },
  master: { bg: '#F3E8FF', text: '#6B21A8' },
};

function crewMemberToOption(member: CrewMember): CrewMemberOption {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    tier: member.tier,
  };
}

export function CrewSelector() {
  const { startSession } = useActiveCrew();
  const { data: projectsResult } = useLocalProjects();
  const { data: dbCrewMembers, isLoading: crewLoading } = useActiveCrewMembers();
  const projects = projectsResult?.projects || [];

  // Use IndexedDB crew if available, otherwise fallback
  const crewMembers: CrewMemberOption[] = dbCrewMembers && dbCrewMembers.length > 0
    ? dbCrewMembers.map(crewMemberToOption)
    : FALLBACK_CREW;

  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  const selectedMember = crewMembers.find(m => m.id === selectedCrew);
  const hasProjects = projects.length > 0;
  const canStart = selectedCrew && (selectedProject || !hasProjects);

  const handleStart = async () => {
    if (!selectedMember) return;
    setIsStarting(true);
    try {
      const projectId = selectedProject || 'no_project';
      await startSession(selectedMember.id, selectedMember.name, projectId);
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsStarting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#F3F4F6' }}
    >
      <div className="w-full max-w-sm mx-4 bg-white rounded-xl shadow-lg p-6 overflow-visible">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Who&apos;s working today?
        </h2>
        <p className="text-xs text-gray-500 mb-5">Select your name to start</p>

        {/* Crew member selection */}
        <div className="space-y-2 mb-5">
          {crewLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
            </div>
          ) : (
            crewMembers.map((member) => {
              const tierColors = member.tier ? TIER_COLORS[member.tier] : null;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedCrew(member.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left"
                  style={{
                    minHeight: '56px',
                    borderColor: selectedCrew === member.id ? '#0F766E' : '#E5E7EB',
                    background: selectedCrew === member.id ? '#F0FDFA' : '#FFFFFF',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{
                      background: selectedCrew === member.id ? '#0F766E' : '#E5E7EB',
                      color: selectedCrew === member.id ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{member.role}</span>
                      {member.tier && tierColors && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: tierColors.bg, color: tierColors.text }}
                        >
                          {TIER_LABELS[member.tier]}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Project selector */}
        <div className="mb-5">
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">
            Project
          </label>
          {hasProjects ? (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              style={{ minHeight: '44px' }}
            >
              <option value="">Select project...</option>
              {projects.map((p: { id: string; title?: string; name?: string }) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name || p.id}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="w-full px-3 py-2.5 text-sm rounded-xl"
              style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#9CA3AF', minHeight: '44px' }}
            >
              No projects yet — you can create one after starting
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
          style={{ background: '#0F766E', minHeight: '48px' }}
        >
          {isStarting ? 'Starting...' : 'Start Day'}
        </button>
      </div>
    </div>
  );
}
