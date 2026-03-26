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
  learner: { bg: 'var(--yellow-bg)', text: 'var(--yellow)' },
  proven: { bg: 'var(--green-bg)', text: 'var(--green)' },
  lead: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  master: { bg: 'var(--violet-bg)', text: 'var(--violet)' },
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
      style={{ background: 'var(--surface-2)' }}
    >
      <div className="w-full max-w-sm mx-4 bg-[var(--surface)] rounded-xl shadow-lg p-6 overflow-visible">
        <h2 className="text-lg font-semibold text-[var(--charcoal)] mb-1">
          Who&apos;s working today?
        </h2>
        <p className="text-xs text-[var(--muted)] mb-5">Select your name to start</p>

        {/* Crew member selection */}
        <div className="space-y-2 mb-5">
          {crewLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
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
                    borderColor: selectedCrew === member.id ? 'var(--accent)' : 'var(--border)',
                    background: selectedCrew === member.id ? 'var(--green-bg)' : '#fff',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{
                      background: selectedCrew === member.id ? 'var(--accent)' : 'var(--border)',
                      color: selectedCrew === member.id ? '#fff' : 'var(--muted)',
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--charcoal)]">{member.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">{member.role}</span>
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
          <label className="text-xs font-medium text-[var(--mid)] mb-1.5 block">
            Project
          </label>
          {hasProjects ? (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--surface)]"
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
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', minHeight: '44px' }}
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
          style={{ background: 'var(--accent)', minHeight: '48px' }}
        >
          {isStarting ? 'Starting...' : 'Start Day'}
        </button>
      </div>
    </div>
  );
}
