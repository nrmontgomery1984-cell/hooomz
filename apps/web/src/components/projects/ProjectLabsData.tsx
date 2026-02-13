'use client';

/**
 * ProjectLabsData — Labs observation section for project detail page
 *
 * Collapsible section showing observations captured for this project.
 * Tap an observation to open detail in a BottomSheet.
 */

import { useState } from 'react';
import { ChevronDown, FlaskConical } from 'lucide-react';
import { useLabsObservationsByProject } from '@/lib/hooks/useLabsData';
import { ObservationCard } from '@/components/labs/ObservationCard';
import { ObservationDetailContent } from '@/components/labs/ObservationDetailContent';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { FieldObservation } from '@hooomz/shared-contracts';

interface ProjectLabsDataProps {
  projectId: string;
}

export function ProjectLabsData({ projectId }: ProjectLabsDataProps) {
  const { data: observations = [] } = useLabsObservationsByProject(projectId);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedObservation, setSelectedObservation] = useState<FieldObservation | null>(null);

  if (observations.length === 0) return null;

  return (
    <>
      <div
        className="rounded-xl overflow-hidden mt-4"
        style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-4 py-3 flex items-center gap-2 min-h-[48px]"
        >
          <FlaskConical size={16} style={{ color: '#0F766E' }} />
          <span className="text-sm font-semibold flex-1 text-left" style={{ color: '#111827' }}>
            Labs Data
          </span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: '#F0FDFA', color: '#0F766E' }}
          >
            {observations.length}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="transition-transform duration-200"
            style={{
              color: '#D1D5DB',
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          />
        </button>

        {/* Observation list */}
        {!isCollapsed && (
          <div className="px-3 pb-3 space-y-2">
            {observations.map((obs) => (
              <ObservationCard
                key={obs.id}
                observation={obs}
                onClick={() => setSelectedObservation(obs)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Observation detail sheet */}
      <BottomSheet
        isOpen={!!selectedObservation}
        onClose={() => setSelectedObservation(null)}
        title="Observation Detail"
      >
        {selectedObservation && (
          <ObservationDetailContent observation={selectedObservation} />
        )}
      </BottomSheet>
    </>
  );
}
