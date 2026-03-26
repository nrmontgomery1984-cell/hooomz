/**
 * Project View Page
 * Full project view with sphere, tabs (Floor Plan, Tasks, Activity)
 * Route: /project/:id
 */

import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sphere } from '../../components/sphere';
import { FloorPlanViewer } from '../../components/floor-plan';
import { ActivityFeed } from '../../components/activity';
import { MaterialTracker, FlooringSOP } from '../../components/flooring';
import { useProject } from '../../hooks/useProject';
import { useRealtimeProject } from '../../hooks/useRealtimeProject';
import { statusColors, statusLabels, STATUS_OPTIONS } from '../../components/ui/colors';
import type { Loop, LoopStatus, LoopType } from '../../types/database';
import { updateLoopStatus } from '../../services/api/loops';
import { createActivityEvent } from '../../services/api/activity';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'floorplan' | 'tasks' | 'materials' | 'sop' | 'activity';

// ============================================================================
// TASK LIST COMPONENT
// ============================================================================

interface TaskItemProps {
  loop: Loop;
  depth?: number;
  onStatusChange: (loopId: string, status: LoopStatus) => void;
  isUpdating?: boolean;
}

function TaskItem({ loop, depth = 0, onStatusChange, isUpdating }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = statusColors[loop.status];

  return (
    <div
      className={`
        border-b border-gray-100 last:border-b-0
        ${depth > 0 ? 'ml-4 border-l border-gray-200 pl-3' : ''}
      `}
    >
      <button
        className="w-full flex items-center gap-3 py-3 px-4 text-left hover:bg-gray-50 transition-colors min-h-[56px]"
        onClick={() => setExpanded(!expanded)}
        disabled={isUpdating}
      >
        {/* Status indicator */}
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
        />

        {/* Name and cost code */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium truncate">{loop.name}</p>
          {loop.cost_code && (
            <p className="text-xs text-gray-500 font-mono">{loop.cost_code}</p>
          )}
        </div>

        {/* Type badge */}
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          {loop.type}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">
            Status: <span className="font-medium">{statusLabels[loop.status]}</span>
          </p>

          {/* Status change buttons */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(loop.id, value);
                }}
                disabled={loop.status === value || isUpdating}
                className={`
                  px-3 py-2 text-sm rounded-lg font-medium transition-colors
                  min-h-[44px]
                  ${
                    loop.status === value
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TasksTabProps {
  loops: Loop[];
  onStatusChange: (loopId: string, status: LoopStatus) => void;
  isUpdating?: boolean;
}

function TasksTab({ loops, onStatusChange, isUpdating }: TasksTabProps) {
  // Group loops by type for display
  const groupedLoops = useMemo(() => {
    const groups: Record<LoopType, Loop[]> = {
      portfolio: [],
      project: [],
      floor: [],
      room: [],
      zone: [],
      trade: [],
      phase: [],
      task: [],
      checklist_item: [],
    };

    loops.forEach((loop) => {
      if (groups[loop.type]) {
        groups[loop.type].push(loop);
      }
    });

    return groups;
  }, [loops]);

  // Only show non-empty groups
  const displayGroups = useMemo(() => {
    return Object.entries(groupedLoops).filter(
      ([type, items]) => items.length > 0 && type !== 'project' && type !== 'portfolio'
    );
  }, [groupedLoops]);

  if (loops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <span className="text-4xl mb-3">📋</span>
        <p>No tasks yet</p>
        <p className="text-sm mt-1">Import a project to see tasks here</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {displayGroups.map(([type, items]) => (
        <div key={type}>
          {/* Group header */}
          <div className="bg-gray-100 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {type.replace('_', ' ')}s ({items.length})
            </h3>
          </div>

          {/* Items */}
          <div className="bg-white">
            {items.map((loop) => (
              <TaskItem
                key={loop.id}
                loop={loop}
                onStatusChange={onStatusChange}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('floorplan');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch project data
  const {
    project,
    loops,
    loopsMap,
    floorPlan,
    floorPlanElements,
    activity,
    isLoading,
    error,
    refetch,
    updateLoopLocally,
    addActivityLocally,
  } = useProject(id);

  // Real-time subscriptions
  useRealtimeProject({
    projectId: id,
    enabled: !!id,
    onLoopUpdate: updateLoopLocally,
    onActivityInsert: addActivityLocally,
  });

  // Handle status change from tasks tab
  const handleTaskStatusChange = useCallback(
    async (loopId: string, status: LoopStatus) => {
      if (!id) return;

      setIsUpdating(true);
      try {
        const loop = loopsMap.get(loopId);
        const previousStatus = loop?.status;

        // Optimistic update
        if (loop) {
          updateLoopLocally({ ...loop, status });
        }

        // API calls
        await updateLoopStatus(loopId, status);
        await createActivityEvent({
          event_type: 'loop.status_changed',
          loop_id: loopId,
          project_id: id,
          actor_id: null,
          actor_type: 'user',
          payload: {
            new_status: status,
            previous_status: previousStatus,
            name: loop?.name,
          },
          client_visible: true,
        });
      } catch (err) {
        console.error('Failed to update status:', err);
        // Refetch on error to restore state
        refetch();
      } finally {
        setIsUpdating(false);
      }
    },
    [id, loopsMap, updateLoopLocally, refetch]
  );

  // Tabs configuration
  const tabs: { id: TabType; label: string }[] = [
    { id: 'floorplan', label: 'Floor Plan' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'materials', label: 'Materials' },
    { id: 'sop', label: 'SOP' },
    { id: 'activity', label: 'Activity' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <h2 className="font-semibold text-lg mb-2">Error loading project</h2>
          <p>{error.message}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No project found
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-700">
          <h2 className="font-semibold text-lg mb-2">Project not found</h2>
          <p>The project with ID "{id}" could not be found.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 min-h-[44px]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to dashboard"
          >
            <span className="text-xl">&larr;</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {project.name}
            </h1>
            {project.cost_code && (
              <p className="text-xs text-gray-500 font-mono">{project.cost_code}</p>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Refresh"
          >
            <span className="text-xl">&#x21bb;</span>
          </button>
        </div>
      </header>

      {/* Project Sphere */}
      <div className="bg-white py-6 flex justify-center">
        <Sphere
          score={project.health_score}
          size={120}
          status={project.status}
          label={project.status.replace('_', ' ')}
          showScore={true}
        />
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-10">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 text-center font-medium transition-colors
                min-h-[48px]
                ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <main className="flex-1 flex flex-col">
        {/* Floor Plan Tab */}
        {activeTab === 'floorplan' && (
          <div className="flex-1 bg-gray-100">
            {floorPlan ? (
              <FloorPlanViewer
                floorPlan={floorPlan}
                elements={floorPlanElements}
                projectId={project.id}
                initialLoops={loopsMap}
                showLabels={true}
                className="h-[calc(100vh-280px)]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <span className="text-4xl mb-3">🗺️</span>
                <p className="font-medium">No floor plan available</p>
                <p className="text-sm mt-1">Import an SVG floor plan to see it here</p>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="flex-1 bg-white overflow-y-auto">
            <TasksTab
              loops={loops}
              onStatusChange={handleTaskStatusChange}
              isUpdating={isUpdating}
            />
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="flex-1 bg-white p-4 overflow-y-auto">
            <MaterialTracker
              projectId={project.id}
              onMaterialChange={refetch}
            />
          </div>
        )}

        {/* SOP Tab */}
        {activeTab === 'sop' && (
          <div className="flex-1 bg-white p-4 overflow-y-auto">
            <FlooringSOP />
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="flex-1 bg-white p-4 overflow-y-auto">
            <ActivityFeed
              events={activity}
              isLoading={false}
              emptyMessage="No activity yet. Changes will appear here."
            />
          </div>
        )}
      </main>
    </div>
  );
}
