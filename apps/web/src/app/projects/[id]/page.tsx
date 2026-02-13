'use client';

/**
 * Project Detail Page — Redesigned
 *
 * Orchestrates: health card, sticky filter pills, collapsible rooms,
 * rich task cards with SOP/budget/training integration.
 * Health score rolls up from task completion.
 */

import { useMemo, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ChevronLeft, MapPin } from 'lucide-react';
import {
  useLocalProject,
  useLocalTasks,
  useUndoCompleteTask,
  useUpdateTaskDescription,
  useToggleLabsFlag,
} from '@/lib/hooks/useLocalData';
import { useCompleteTaskWithBatchCheck } from '@/lib/hooks/useCompleteTaskWithBatchCheck';
import { usePendingBatchItems, useConfirmBatchItem, useSkipBatchItem, useConfirmAllBatch } from '@/lib/hooks/useLabsData';
import { useProjectBudgets, useProjectBudgetSummary, useCrewTrainingRecords } from '@/lib/hooks/useCrewData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { BatchConfirmModal, QuickCapturePrompt } from '@/components/labs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SOPSheetContent } from '@/components/sop/SOPSheetContent';
import { KnowledgeSheetContent } from '@/components/labs/KnowledgeSheetContent';
import { ProjectHealthCard } from '@/components/projects/ProjectHealthCard';
import { ProjectFilterBar, type ProjectFilterValues } from '@/components/projects/ProjectFilterBar';
import { RoomSection } from '@/components/projects/RoomSection';
import { TaskCard } from '@/components/projects/TaskCard';
import { ProjectLabsData } from '@/components/projects/ProjectLabsData';
import { enrichTask, type EnrichedTask } from '@/lib/utils/taskParsing';
import type { TaskBudget, TrainingRecord } from '@hooomz/shared-contracts';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const { data: project, isLoading: projectLoading } = useLocalProject(projectId);
  const { data: taskData, isLoading: tasksLoading } = useLocalTasks(projectId);
  const { completeTask: completeTaskFn, isPending: isCompleting, hasPendingBatch, batchTaskId, clearBatch } = useCompleteTaskWithBatchCheck();
  const undoTask = useUndoCompleteTask();
  const updateDescription = useUpdateTaskDescription();

  // Batch modal hooks
  const { data: pendingBatchItems = [] } = usePendingBatchItems(batchTaskId || '');
  const confirmBatchItem = useConfirmBatchItem();
  const skipBatchItem = useSkipBatchItem();
  const confirmAllBatch = useConfirmAllBatch();

  // Crew + budget + training
  const { crewMemberId, crewMemberName } = useActiveCrew();
  const { data: budgets } = useProjectBudgets(projectId);
  const { data: budgetSummary } = useProjectBudgetSummary(projectId);
  const { data: trainingRecords } = useCrewTrainingRecords(crewMemberId);

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------
  const [filters, setFilters] = useState<ProjectFilterValues>({
    tradeCode: null,
    stageCode: null,
    room: null,
  });
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [sopSheetId, setSopSheetId] = useState<string | null>(null);
  const [knowledgeSheetId, setKnowledgeSheetId] = useState<string | null>(null);
  const [quickCaptureTask, setQuickCaptureTask] = useState<EnrichedTask | null>(null);

  // Labs flag toggle
  const toggleLabsFlag = useToggleLabsFlag();

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const tasks = useMemo(() => taskData?.tasks || [], [taskData]);

  const enrichedTasks: EnrichedTask[] = useMemo(
    () => tasks.map((t) => enrichTask(t)),
    [tasks],
  );

  // Apply filters
  const filteredTasks = useMemo(() => {
    return enrichedTasks.filter((t) => {
      if (filters.tradeCode && t.tradeCode !== filters.tradeCode) return false;
      if (filters.stageCode && t.stageCode !== filters.stageCode) return false;
      if (filters.room && t.room !== filters.room) return false;
      return true;
    });
  }, [enrichedTasks, filters]);

  // Group by room
  const tasksByRoom = useMemo(() => {
    const groups: Record<string, EnrichedTask[]> = {};
    for (const task of filteredTasks) {
      if (!groups[task.room]) groups[task.room] = [];
      groups[task.room].push(task);
    }
    return groups;
  }, [filteredTasks]);

  const roomNames = Object.keys(tasksByRoom).sort();

  // Budget lookup map: taskId → budget
  const budgetMap = useMemo(() => {
    const map = new Map<string, TaskBudget>();
    if (budgets) {
      for (const b of budgets) {
        map.set(b.taskId, b);
      }
    }
    return map;
  }, [budgets]);

  // Training lookup map: sopId → training record
  const trainingMap = useMemo(() => {
    const map = new Map<string, TrainingRecord>();
    if (trainingRecords) {
      for (const r of trainingRecords) {
        map.set(r.sopId, r);
      }
    }
    return map;
  }, [trainingRecords]);

  // Stats (from all tasks, not filtered)
  const totalTasks = enrichedTasks.length;
  const completedTasks = enrichedTasks.filter((t) => t.status === 'complete').length;
  const healthScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCompleteTask = useCallback(async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      await completeTaskFn(projectId, taskId);
      // Queue this task for QuickCapture after batch modal closes
      const completed = enrichedTasks.find((t) => t.id === taskId);
      if (completed) setQuickCaptureTask(completed);
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  }, [completeTaskFn, projectId, enrichedTasks]);

  const handleUndoTask = useCallback(async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      await undoTask.mutateAsync({ projectId, taskId });
    } catch (err) {
      console.error('Failed to undo task:', err);
    }
  }, [undoTask, projectId]);

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTaskId((prev) => prev === taskId ? null : taskId);
  }, []);

  const handleToggleRoom = useCallback((room: string) => {
    setCollapsedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(room)) {
        next.delete(room);
      } else {
        next.add(room);
      }
      return next;
    });
  }, []);

  const handleOpenSOP = useCallback((sopId: string) => {
    setSopSheetId(sopId);
    setKnowledgeSheetId(null);
  }, []);

  const handleOpenKnowledge = useCallback((sourceId: string) => {
    setKnowledgeSheetId(sourceId);
  }, []);

  const handleSaveNote = useCallback(async (taskId: string, newDescription: string) => {
    try {
      await updateDescription.mutateAsync({ projectId, taskId, description: newDescription });
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  }, [projectId, updateDescription]);

  const handleToggleLabsFlag = useCallback(async (taskId: string, flagged: boolean) => {
    try {
      await toggleLabsFlag.mutateAsync({ projectId, taskId, flagged });
    } catch (err) {
      console.error('Failed to toggle labs flag:', err);
    }
  }, [toggleLabsFlag, projectId]);

  const handleOpenLabsCapture = useCallback((taskId: string) => {
    const task = enrichedTasks.find((t) => t.id === taskId);
    if (task) setQuickCaptureTask(task);
  }, [enrichedTasks]);

  // Show QuickCapture only when batch modal is not showing
  const showQuickCapture = quickCaptureTask !== null && !hasPendingBatch;

  // ---------------------------------------------------------------------------
  // Loading / not found
  // ---------------------------------------------------------------------------
  const isLoading = projectLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p style={{ color: '#6B7280' }}>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <p className="text-lg font-medium mb-2" style={{ color: '#111827' }}>Project not found</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm font-medium min-h-[48px]"
            style={{ color: '#0F766E' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const addressDisplay = project.address
    ? `${project.address.street}, ${project.address.city}`
    : '';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageErrorBoundary>
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-20"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <ChevronLeft size={24} style={{ color: '#6B7280' }} strokeWidth={1.5} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate" style={{ color: '#111827' }}>
              {project.name}
            </h1>
            {addressDisplay && (
              <div className="flex items-center gap-1">
                <MapPin size={12} style={{ color: '#9CA3AF' }} strokeWidth={1.5} />
                <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{addressDisplay}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Health Card */}
        <ProjectHealthCard
          healthScore={healthScore}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          roomCount={roomNames.length}
          budgetSummary={budgetSummary || null}
        />

        {/* Sticky Filter Bar */}
        <div
          className="sticky top-[57px] z-10 py-3 -mx-4 px-4"
          style={{ background: '#F3F4F6' }}
        >
          <ProjectFilterBar
            tasks={enrichedTasks}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Room Sections */}
        <div className="space-y-4 mt-2">
          {roomNames.map((room) => {
            const roomTasks = tasksByRoom[room];
            const roomComplete = roomTasks.filter((t) => t.status === 'complete').length;

            return (
              <RoomSection
                key={room}
                roomName={room}
                completedCount={roomComplete}
                totalCount={roomTasks.length}
                isCollapsed={collapsedRooms.has(room)}
                onToggleCollapse={() => handleToggleRoom(room)}
              >
                {roomTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isExpanded={expandedTaskId === task.id}
                    onToggleExpand={() => handleToggleExpand(task.id)}
                    budget={budgetMap.get(task.id) || null}
                    trainingRecord={task.resolvedSopId ? trainingMap.get(task.resolvedSopId) || null : null}
                    crewMemberId={crewMemberId}
                    crewMemberName={crewMemberName}
                    onComplete={handleCompleteTask}
                    onUndo={handleUndoTask}
                    onSaveNote={handleSaveNote}
                    isCompleting={isCompleting}
                    isUndoing={undoTask.isPending}
                    onOpenSOP={handleOpenSOP}
                    onOpenKnowledge={handleOpenKnowledge}
                    onToggleLabsFlag={handleToggleLabsFlag}
                    onOpenLabsCapture={handleOpenLabsCapture}
                  />
                ))}
              </RoomSection>
            );
          })}

          {/* Labs Data Section */}
          <ProjectLabsData projectId={projectId} />

          {totalTasks === 0 && (
            <div className="text-center py-8">
              <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>No tasks yet</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Use Quick Add (+) to add tasks</p>
            </div>
          )}

          {totalTasks > 0 && filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>No tasks match filters</p>
              <button
                onClick={() => setFilters({ tradeCode: null, stageCode: null, room: null })}
                className="text-xs font-medium"
                style={{ color: '#0F766E' }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Batch Confirm Modal */}
      {hasPendingBatch && batchTaskId && (
        <BatchConfirmModal
          isOpen={true}
          pendingItems={pendingBatchItems}
          onConfirmItem={async (pendingBatchId, overrides) => { await confirmBatchItem.mutateAsync({ pendingBatchId, overrides }); }}
          onSkipItem={async (pendingBatchId) => { await skipBatchItem.mutateAsync(pendingBatchId); }}
          onConfirmAll={async () => { await confirmAllBatch.mutateAsync(batchTaskId); }}
          onClose={clearBatch}
        />
      )}

      {/* Quick Capture Prompt — appears after batch modal closes */}
      {showQuickCapture && quickCaptureTask && (
        <QuickCapturePrompt
          isOpen={true}
          onClose={() => setQuickCaptureTask(null)}
          taskContext={{
            taskId: quickCaptureTask.id,
            taskName: quickCaptureTask.taskName,
            room: quickCaptureTask.room,
            projectId,
            sopCode: quickCaptureTask.sopCode,
            tradeCode: quickCaptureTask.tradeCode ?? undefined,
            labsFlagged: quickCaptureTask.labsFlagged,
          }}
          crewMemberId={crewMemberId || ''}
        />
      )}

      {/* SOP Sheet */}
      <BottomSheet
        isOpen={!!sopSheetId && !knowledgeSheetId}
        onClose={() => setSopSheetId(null)}
        title="SOP Reference"
      >
        {sopSheetId && (
          <SOPSheetContent
            sopId={sopSheetId}
            onOpenKnowledge={handleOpenKnowledge}
          />
        )}
      </BottomSheet>

      {/* Knowledge Sheet */}
      <BottomSheet
        isOpen={!!knowledgeSheetId}
        onClose={() => setKnowledgeSheetId(null)}
        title="Lab Evidence"
      >
        {knowledgeSheetId && <KnowledgeSheetContent knowledgeId={knowledgeSheetId} />}
      </BottomSheet>
    </div>
    </PageErrorBoundary>
  );
}
