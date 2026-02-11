'use client';

/**
 * Location Filter Component (Build 3d)
 *
 * Dropdown filter for filtering tasks by loop iteration (location).
 * Shows floor → room hierarchy in the dropdown.
 * Used in task lists and project views to filter by location.
 */

import { MapPin } from 'lucide-react';
import { useLoopTree } from '@/lib/hooks/useLoopManagement';

interface LocationFilterProps {
  projectId: string;
  selectedIterationId: string | null;
  onSelect: (iterationId: string | null) => void;
}

export function LocationFilter({ projectId, selectedIterationId, onSelect }: LocationFilterProps) {
  const { data: treeData, isLoading } = useLoopTree(projectId);

  if (isLoading || !treeData || treeData.tree.length === 0) return null;

  // Flatten tree into selectable options with hierarchy labels
  const options: { id: string; label: string; depth: number }[] = [];
  for (const floor of treeData.tree) {
    options.push({ id: floor.iteration.id, label: floor.iteration.name, depth: 0 });
    for (const room of floor.children) {
      options.push({
        id: room.iteration.id,
        label: room.iteration.name,
        depth: 1,
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin size={14} style={{ color: '#6B7280' }} />
      <select
        value={selectedIterationId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="text-sm px-2 py-1.5 rounded-lg appearance-none"
        style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', outline: 'none', color: '#374151' }}
      >
        <option value="">All locations</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.depth > 0 ? `  ${opt.label}` : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
