'use client';

/**
 * Building Structure Page (Build 3d)
 *
 * Tree view for defining floors/rooms per project.
 * "Standard Residential" template creates common layout with one tap.
 * Manages LoopContexts (floor/room types) and LoopIterations (specific instances).
 */

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Trash2, ChevronDown, ChevronRight, Home, Layers } from 'lucide-react';
import {
  useLoopTree,
  useApplyStandardResidentialTemplate,
  useCreateIteration,
  useDeleteIteration,
} from '@/lib/hooks/useLoopManagement';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import type { IterationTreeNode } from '@/lib/services/loopManagement.service';

const FALLBACK_PROJECT_ID = 'project_demo_structure';

export default function BuildingStructurePage() {
  const { services } = useServicesContext();
  const { projectId: crewProjectId } = useActiveCrew();
  const projectId = crewProjectId || FALLBACK_PROJECT_ID;

  const { data: treeData, isLoading } = useLoopTree(projectId);
  const applyTemplate = useApplyStandardResidentialTemplate();
  const createIteration = useCreateIteration();
  const deleteIteration = useDeleteIteration();

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const hasStructure = treeData && treeData.tree.length > 0;

  async function handleApplyTemplate() {
    applyTemplate.mutate({ projectId: projectId });
  }

  async function handleClearStructure() {
    if (!services) return;
    await services.loopManagement.clearAll();
    window.location.reload();
  }

  function handleAddIteration(parentIterationId: string | null, contextId: string) {
    if (!newName.trim()) return;
    createIteration.mutate({
      contextId,
      projectId: projectId,
      name: newName.trim(),
      parentIterationId: parentIterationId ?? undefined,
    });
    setNewName('');
    setAddingTo(null);
  }

  function handleDeleteIteration(iterationId: string) {
    deleteIteration.mutate(iterationId);
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>Labs</Link>
            <span className="text-xs text-[var(--muted)]">/</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>Building Structure</h1>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Define floors and rooms for task deployment
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            <p className="text-sm text-[var(--muted)]">Loading structure...</p>
          </div>
        ) : !hasStructure ? (
          /* Empty state — prompt to apply template */
          <div className="bg-white rounded-xl p-6 text-center" style={{ border: '1px solid var(--border)' }}>
            <Building2 size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--charcoal)' }}>No structure defined</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Define your building&apos;s floors and rooms to deploy looped tasks.
            </p>
            <button
              onClick={handleApplyTemplate}
              disabled={applyTemplate.isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: 'var(--accent)', minHeight: '48px', opacity: applyTemplate.isPending ? 0.7 : 1 }}
            >
              {applyTemplate.isPending ? 'Applying...' : (
                <span className="flex items-center justify-center gap-2">
                  <Home size={16} />
                  Apply Standard Residential Template
                </span>
              )}
            </button>
            <p className="text-[10px] mt-2" style={{ color: 'var(--muted)' }}>
              3 floors, 12 rooms — Main Floor, Upper Floor, Basement
            </p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--charcoal)' }}>
                    {treeData.tree.length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Floors</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--charcoal)' }}>
                    {treeData.tree.reduce((sum, node) => sum + node.children.length, 0)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Rooms</div>
                </div>
              </div>
            </div>

            {/* Tree view */}
            {treeData.tree.map((floorNode) => (
              <FloorNode
                key={floorNode.iteration.id}
                node={floorNode}
                addingTo={addingTo}
                newName={newName}
                onSetAddingTo={setAddingTo}
                onSetNewName={setNewName}
                onAddIteration={handleAddIteration}
                onDeleteIteration={handleDeleteIteration}
              />
            ))}

            {/* Add floor button */}
            {treeData.contexts.length > 0 && (
              <div>
                {addingTo === 'root' ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const floorCtx = treeData.contexts.find((c) => c.loop_type === 'floor');
                          if (floorCtx) handleAddIteration(null, floorCtx.id);
                        }
                        if (e.key === 'Escape') { setAddingTo(null); setNewName(''); }
                      }}
                      placeholder="Floor name..."
                      autoFocus
                      className="flex-1 text-sm px-3 py-2 rounded-lg"
                      style={{ border: '1px solid var(--border)', outline: 'none' }}
                    />
                    <button
                      onClick={() => {
                        const floorCtx = treeData.contexts.find((c) => c.loop_type === 'floor');
                        if (floorCtx) handleAddIteration(null, floorCtx.id);
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo('root')}
                    className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Plus size={14} /> Add Floor
                  </button>
                )}
              </div>
            )}

            {/* Clear structure */}
            <button
              onClick={handleClearStructure}
              className="w-full py-2 rounded-lg text-xs font-medium transition-opacity mt-4"
              style={{ color: 'var(--red)', border: '1px solid var(--red-bg)' }}
            >
              Clear & Re-apply Template
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FloorNode({
  node,
  addingTo,
  newName,
  onSetAddingTo,
  onSetNewName,
  onAddIteration,
  onDeleteIteration,
}: {
  node: IterationTreeNode;
  addingTo: string | null;
  newName: string;
  onSetAddingTo: (id: string | null) => void;
  onSetNewName: (name: string) => void;
  onAddIteration: (parentIterationId: string | null, contextId: string) => void;
  onDeleteIteration: (iterationId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const floor = node.iteration;
  const roomCount = node.children.length;

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Floor header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={16} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--muted)' }} />}
        <Layers size={16} style={{ color: 'var(--accent)' }} />
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{floor.name}</div>
          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{roomCount} room{roomCount !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteIteration(floor.id); }}
          className="p-1 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} style={{ color: 'var(--red)' }} />
        </button>
      </div>

      {/* Rooms list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--surface-2)' }}>
          {node.children.map((roomNode) => (
            <div
              key={roomNode.iteration.id}
              className="flex items-center gap-3 px-4 py-2 pl-10 hover:bg-[var(--surface)] transition-colors"
              style={{ borderBottom: '1px solid var(--surface)' }}
            >
              <Home size={14} style={{ color: 'var(--muted)' }} />
              <span className="flex-1 text-sm" style={{ color: 'var(--mid)' }}>
                {roomNode.iteration.name}
              </span>
              <button
                onClick={() => onDeleteIteration(roomNode.iteration.id)}
                className="p-1 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 size={12} style={{ color: 'var(--border)' }} />
              </button>
            </div>
          ))}

          {/* Add room inline */}
          {addingTo === floor.id ? (
            <div className="flex gap-2 px-4 py-2 pl-10">
              <input
                type="text"
                value={newName}
                onChange={(e) => onSetNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && node.context) {
                    // Rooms use the child context (location type), find it
                    const roomContextId = node.children[0]?.context?.id || node.context?.id;
                    if (roomContextId) onAddIteration(floor.id, roomContextId);
                  }
                  if (e.key === 'Escape') { onSetAddingTo(null); onSetNewName(''); }
                }}
                placeholder="Room name..."
                autoFocus
                className="flex-1 text-sm px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid var(--border)', outline: 'none' }}
              />
              <button
                onClick={() => {
                  const roomContextId = node.children[0]?.context?.id || node.context?.id;
                  if (roomContextId) onAddIteration(floor.id, roomContextId);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onSetAddingTo(floor.id); onSetNewName(''); }}
              className="flex items-center gap-2 text-xs font-medium px-4 py-2 pl-10 hover:bg-[var(--surface)] w-full transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              <Plus size={12} /> Add Room
            </button>
          )}
        </div>
      )}
    </div>
  );
}
