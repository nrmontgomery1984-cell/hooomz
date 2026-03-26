/**
 * Floor Plan Viewer Component
 * Wrapper that integrates InteractiveFloorPlan with ElementModal
 * Handles API calls for status changes, notes, and photos
 *
 * CRITICAL PATTERN: Elements don't store status — they get it from linked loop.
 * const status = loops.get(element.loop_id)?.status;
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  FloorPlan,
  FloorPlanElement,
  Loop,
  LoopStatus,
  ActivityEvent,
} from '../../types/database';
import { InteractiveFloorPlan } from './InteractiveFloorPlan';
import { ElementModal } from './ElementModal';
import {
  updateLoopStatus,
  getChildLoops,
} from '../../services/api/loops';
import {
  createActivityEvent,
  getLoopActivity,
} from '../../services/api/activity';
import { uploadPhoto } from '../../services/api/photos';

// ============================================================================
// TYPES
// ============================================================================

export interface FloorPlanViewerProps {
  /** Floor plan data with SVG content */
  floorPlan: FloorPlan;
  /** Floor plan elements (linked to loops) */
  elements: FloorPlanElement[];
  /** Project ID for fetching loops */
  projectId: string;
  /** Initial loops map (optional, will fetch if not provided) */
  initialLoops?: Map<string, Loop>;
  /** Current user ID for activity events */
  userId?: string;
  /** Show element labels */
  showLabels?: boolean;
  /** Filter by trades */
  tradeFilter?: string[];
  /** Filter by status */
  statusFilter?: LoopStatus[];
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FloorPlanViewer({
  floorPlan,
  elements,
  projectId,
  initialLoops,
  userId,
  showLabels = true,
  tradeFilter,
  statusFilter,
  className = '',
}: FloorPlanViewerProps) {
  // State
  const [loops, setLoops] = useState<Map<string, Loop>>(
    initialLoops || new Map()
  );
  const [selectedElement, setSelectedElement] = useState<FloorPlanElement | null>(
    null
  );
  const [selectedLoop, setSelectedLoop] = useState<Loop | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch loops if not provided
  useEffect(() => {
    if (!initialLoops) {
      fetchLoops();
    }
  }, [projectId, initialLoops]);

  const fetchLoops = useCallback(async () => {
    try {
      const childLoops = await getChildLoops(projectId);
      const loopMap = new Map<string, Loop>();
      childLoops.forEach((loop) => {
        loopMap.set(loop.id, loop);
      });
      setLoops(loopMap);
    } catch (error) {
      console.error('Failed to fetch loops:', error);
    }
  }, [projectId]);

  // Fetch activity when modal opens
  const fetchActivity = useCallback(async (loopId: string) => {
    try {
      const events = await getLoopActivity(loopId, 3);
      setRecentActivity(events);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      setRecentActivity([]);
    }
  }, []);

  // Handle element tap
  const handleElementTap = useCallback(
    (element: FloorPlanElement, loop: Loop) => {
      setSelectedElement(element);
      setSelectedLoop(loop);
      setIsModalOpen(true);
      fetchActivity(loop.id);
    },
    [fetchActivity]
  );

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedElement(null);
    setSelectedLoop(null);
    setRecentActivity([]);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback(
    async (loopId: string, status: LoopStatus) => {
      setIsUpdating(true);
      try {
        // Update loop status
        await updateLoopStatus(loopId, status);

        // Create activity event
        await createActivityEvent({
          event_type: 'loop.status_changed',
          loop_id: loopId,
          project_id: projectId,
          actor_id: userId || null,
          actor_type: userId ? 'user' : 'system',
          payload: {
            new_status: status,
            previous_status: selectedLoop?.status,
          },
          client_visible: true,
        });

        // Update local state
        setLoops((prev) => {
          const updated = new Map(prev);
          const loop = updated.get(loopId);
          if (loop) {
            updated.set(loopId, { ...loop, status });
          }
          return updated;
        });

        // Update selected loop
        setSelectedLoop((prev) => (prev ? { ...prev, status } : null));

        // Refresh activity
        fetchActivity(loopId);
      } catch (error) {
        console.error('Failed to update status:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [projectId, userId, selectedLoop, fetchActivity]
  );

  // Handle note add
  const handleAddNote = useCallback(
    async (loopId: string, note: string) => {
      try {
        await createActivityEvent({
          event_type: 'task.note_added',
          loop_id: loopId,
          project_id: projectId,
          actor_id: userId || null,
          actor_type: userId ? 'user' : 'system',
          payload: { note },
          client_visible: true,
        });

        // Refresh activity
        fetchActivity(loopId);
      } catch (error) {
        console.error('Failed to add note:', error);
      }
    },
    [projectId, userId, fetchActivity]
  );

  // Handle photo add
  const handleAddPhoto = useCallback(
    async (loopId: string, file: File, caption?: string) => {
      try {
        // Upload photo to storage
        const photoUrl = await uploadPhoto(file, projectId, loopId);

        // Create activity event
        await createActivityEvent({
          event_type: 'task.photo_added',
          loop_id: loopId,
          project_id: projectId,
          actor_id: userId || null,
          actor_type: userId ? 'user' : 'system',
          payload: {
            photo_url: photoUrl,
            caption: caption || null,
            filename: file.name,
          },
          client_visible: true,
        });

        // Refresh activity
        fetchActivity(loopId);
      } catch (error) {
        console.error('Failed to add photo:', error);
      }
    },
    [projectId, userId, fetchActivity]
  );

  // Memoize element for modal to prevent unnecessary re-renders
  const modalElement = useMemo(() => selectedElement, [selectedElement]);
  const modalLoop = useMemo(() => selectedLoop, [selectedLoop]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Interactive Floor Plan */}
      <InteractiveFloorPlan
        floorPlan={floorPlan}
        elements={elements}
        loops={loops}
        onElementTap={handleElementTap}
        showLabels={showLabels}
        tradeFilter={tradeFilter}
        statusFilter={statusFilter}
      />

      {/* Element Modal */}
      {modalElement && modalLoop && (
        <ElementModal
          isOpen={isModalOpen}
          element={modalElement}
          loop={modalLoop}
          recentActivity={recentActivity}
          onStatusChange={handleStatusChange}
          onAddNote={handleAddNote}
          onAddPhoto={handleAddPhoto}
          onClose={handleModalClose}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}

export default FloorPlanViewer;
