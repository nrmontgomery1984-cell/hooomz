'use client';

/**
 * Deploy Looped Blueprints Page (Build 3d)
 *
 * Shows pending isLooped blueprints and lets you deploy each to a specific
 * loop iteration (room). Uses the existing deployBlueprint() which already
 * accepts loopBindingLabel + loopIterationId.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Rocket, MapPin, Check, AlertCircle } from 'lucide-react';
import { usePendingBlueprints, useDeployBlueprint } from '@/lib/hooks/useTaskPipeline';
import { useLoopTree } from '@/lib/hooks/useLoopManagement';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useSkillRateConfig, useEstimatePreview } from '@/lib/hooks/useLabourEstimation';
import type { SopTaskBlueprint } from '@hooomz/shared-contracts';
import type { IterationTreeNode } from '@/lib/services/loopManagement.service';
import type { EstimateParams } from '@/lib/types/labourEstimation.types';

const FALLBACK_PROJECT_ID = 'project_demo_structure';

export default function DeployLoopedBlueprintsPage() {
  const searchParams = useSearchParams();
  const { projectId: crewProjectId } = useActiveCrew();
  const projectId = searchParams.get('projectId') || crewProjectId || FALLBACK_PROJECT_ID;

  const { data: pendingBlueprints = [], isLoading: bpLoading } = usePendingBlueprints(projectId);
  const { data: treeData, isLoading: treeLoading } = useLoopTree(projectId);
  const deployBlueprint = useDeployBlueprint();

  const isLoading = bpLoading || treeLoading;
  const loopedBlueprints = pendingBlueprints.filter((bp) => bp.isLooped);
  const hasStructure = treeData && treeData.tree.length > 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/structure" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Structure</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-center gap-2">
            <Rocket size={20} style={{ color: '#0F766E' }} />
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Deploy to Locations</h1>
          </div>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            Assign looped blueprints to specific rooms
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
            <p className="text-sm text-gray-400">Loading blueprints...</p>
          </div>
        ) : !hasStructure ? (
          <div className="bg-white rounded-xl p-6 text-center" style={{ border: '1px solid #E5E7EB' }}>
            <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#F59E0B' }} />
            <p className="text-sm font-medium mb-2" style={{ color: '#111827' }}>No building structure defined</p>
            <Link href="/labs/structure" className="text-xs hover:underline" style={{ color: '#0F766E' }}>
              Define floors and rooms first
            </Link>
          </div>
        ) : loopedBlueprints.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center" style={{ border: '1px solid #E5E7EB' }}>
            <Check size={32} className="mx-auto mb-3" style={{ color: '#10B981' }} />
            <p className="text-sm font-medium" style={{ color: '#111827' }}>All blueprints deployed</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              No pending looped blueprints to deploy
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: '#111827' }}>
                  {loopedBlueprints.length}
                </div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Pending looped blueprint{loopedBlueprints.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {loopedBlueprints.map((bp) => (
              <BlueprintDeployCard
                key={bp.id}
                blueprint={bp}
                tree={treeData.tree}
                onDeploy={(iterationId, label) => {
                  deployBlueprint.mutate({
                    blueprintId: bp.id,
                    loopBindingLabel: label,
                    loopIterationId: iterationId,
                  });
                }}
                isDeploying={deployBlueprint.isPending}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function BlueprintDeployCard({
  blueprint,
  tree,
  onDeploy,
  isDeploying,
}: {
  blueprint: SopTaskBlueprint;
  tree: IterationTreeNode[];
  onDeploy: (iterationId: string, label: string) => void;
  isDeploying: boolean;
}) {
  const [selectedIterationId, setSelectedIterationId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [skillLevel, setSkillLevel] = useState(blueprint.minSkillLevel ?? 0);
  const { data: config } = useSkillRateConfig();

  // Estimate preview params — uses the blueprint's estimatedHoursPerUnit as a proxy sell rate
  const estimateParams: EstimateParams | null = config && blueprint.totalUnits > 0 && blueprint.estimatedHoursPerUnit > 0
    ? {
        catalogueSellRate: blueprint.estimatedHoursPerUnit, // placeholder sell rate per unit
        quantity: blueprint.totalUnits,
        unit: 'EA',
        minSkillLevel: skillLevel,
      }
    : null;
  const { data: preview } = useEstimatePreview(estimateParams);

  // Flatten tree into selectable room iterations
  const roomOptions: { id: string; label: string }[] = [];
  for (const floor of tree) {
    if (floor.children.length === 0) {
      roomOptions.push({ id: floor.iteration.id, label: floor.iteration.name });
    }
    for (const room of floor.children) {
      roomOptions.push({
        id: room.iteration.id,
        label: `${floor.iteration.name} → ${room.iteration.name}`,
      });
    }
  }

  return (
    <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#F0FDFA' }}
        >
          <MapPin size={14} style={{ color: '#0F766E' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: '#111827' }}>
            {blueprint.name}
          </div>
          <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
            {blueprint.sopCode} · {blueprint.estimatedHoursPerUnit}h/unit × {blueprint.totalUnits} units
            {blueprint.loopContextLabel && (
              <span> · Loop: {blueprint.loopContextLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Skill level selector */}
      {config && (
        <div className="mb-3">
          <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>
            Minimum skill level:
          </label>
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(Number(e.target.value))}
            className="w-full text-sm px-3 py-2 rounded-lg appearance-none"
            style={{ border: '1px solid #D1D5DB', background: '#FFFFFF', outline: 'none' }}
          >
            {config.skillLevels.map((sl) => (
              <option key={sl.level} value={sl.level}>
                {sl.label} · ${sl.costRate}/hr
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Estimate preview */}
      {preview && (
        <div className="mb-3 rounded-lg p-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="text-[10px] font-medium mb-2" style={{ color: '#6B7280' }}>
            Estimate Preview
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: '#6B7280' }}>Sell Budget</span>
              <span className="font-medium" style={{ color: '#111827' }}>
                ${preview.sellBudget.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#6B7280' }}>
                Cost Budget <span className="text-[10px]">({Math.round(preview.marginApplied * 100)}% margin)</span>
              </span>
              <span className="font-medium" style={{ color: '#111827' }}>
                ${preview.costBudget.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#6B7280' }}>
                Budgeted Hours <span className="text-[10px]">({config?.skillLevels.find((s) => s.level === preview.optimalSkillLevel)?.label ?? `L${preview.optimalSkillLevel}`} · ${preview.optimalCostRate}/hr)</span>
              </span>
              <span className="font-medium" style={{ color: '#111827' }}>
                {preview.budgetedHours.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Location selector */}
      <div className="mb-3">
        <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>
          Deploy to location:
        </label>
        <select
          value={selectedIterationId || ''}
          onChange={(e) => {
            setSelectedIterationId(e.target.value || null);
            const option = roomOptions.find((o) => o.id === e.target.value);
            setSelectedLabel(option?.label || '');
          }}
          className="w-full text-sm px-3 py-2 rounded-lg appearance-none"
          style={{ border: '1px solid #D1D5DB', background: '#FFFFFF', outline: 'none' }}
        >
          <option value="">Select a room...</option>
          {roomOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Deploy button */}
      <button
        onClick={() => {
          if (selectedIterationId) onDeploy(selectedIterationId, selectedLabel);
        }}
        disabled={!selectedIterationId || isDeploying}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
        style={{
          background: selectedIterationId ? '#0F766E' : '#D1D5DB',
          minHeight: '44px',
          opacity: isDeploying ? 0.7 : 1,
        }}
      >
        {isDeploying ? 'Deploying...' : 'Deploy to Location'}
      </button>
    </div>
  );
}
