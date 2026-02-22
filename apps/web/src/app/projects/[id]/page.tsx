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
import { ChevronLeft, MapPin, ArrowRight, Trash2 } from 'lucide-react';
import {
  useLocalProject,
  useLocalCustomer,
  useLocalTasks,
  useLocalProjectActivity,
  useUndoCompleteTask,
  useUpdateTaskDescription,
  useToggleLabsFlag,
  useDeleteLocalProject,
} from '@/lib/hooks/useLocalData';
import { useCompleteTaskWithBatchCheck } from '@/lib/hooks/useCompleteTaskWithBatchCheck';
import { usePendingBatchItems, useConfirmBatchItem, useSkipBatchItem, useConfirmAllBatch } from '@/lib/hooks/useLabsData';
import { useProjectBudgets, useProjectBudgetSummary, useCrewTrainingRecords, useActiveCrewMembers, useTrainingRecords } from '@/lib/hooks/useCrewData';
import { useChangeOrders, useProjectBudget } from '@/lib/hooks/useIntegrationData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { isOverdue } from '@hooomz/shared-contracts';
import Link from 'next/link';
import { SimpleActivityFeed } from '@/components/activity';
import { BatchConfirmModal, QuickCapturePrompt } from '@/components/labs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SOPSheetContent } from '@/components/sop/SOPSheetContent';
import { KnowledgeSheetContent } from '@/components/labs/KnowledgeSheetContent';
import type { ProjectFilterValues, ProjectGroupMode } from '@/components/projects/ProjectFilterBar';
import { TaskCard } from '@/components/projects/TaskCard';
import { ProjectLabsData } from '@/components/projects/ProjectLabsData';
import { enrichTask, type EnrichedTask } from '@/lib/utils/taskParsing';
import { BudgetPanel } from '@/components/projects/BudgetPanel';
import { RiskAttentionPanel } from '@/components/projects/RiskAttentionPanel';
import { TimelinePanel } from '@/components/projects/TimelinePanel';
import { CrewTrainingPanel } from '@/components/projects/CrewTrainingPanel';
import { ChangeOrderPanel } from '@/components/projects/ChangeOrderPanel';
import { CreateChangeOrderSheet } from '@/components/projects/CreateChangeOrderSheet';
import { ChangeOrderDetailSheet } from '@/components/projects/ChangeOrderDetailSheet';
import { ScriptPipeline } from '@/components/projects/ScriptPipeline';
import { LoopRow } from '@/components/loops/LoopRow';
import type { LoopStatus } from '@/components/loops/LoopRow';
import type { TaskBudget, TrainingRecord } from '@hooomz/shared-contracts';
import { useEffectiveCatalog } from '@/lib/hooks/useCostCatalog';
import {
  getTradeDisplayName,
  getStageDisplayName,
  getTradeOrder,
  getStageOrder,
} from '@/lib/utils/axisMapping';

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

  // Client
  const { data: customer } = useLocalCustomer(project?.clientId);

  // Activity
  const { data: activityData } = useLocalProjectActivity(projectId, 10);

  // Crew + budget + training
  const { crewMemberId, crewMemberName } = useActiveCrew();
  const { data: budgets } = useProjectBudgets(projectId);
  const { data: budgetSummary } = useProjectBudgetSummary(projectId);
  const { data: trainingRecords } = useCrewTrainingRecords(crewMemberId);

  // Cost catalog (for materials breakdown on tasks)
  const catalog = useEffectiveCatalog();

  // Dashboard panel data
  const { data: changeOrders = [] } = useChangeOrders(projectId);
  const { data: coBudgetImpact } = useProjectBudget(projectId);
  const { data: allCrewMembers = [] } = useActiveCrewMembers();
  const { data: allTrainingRecords = [] } = useTrainingRecords();

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------
  const [filters, setFilters] = useState<ProjectFilterValues>({
    tradeCode: null,
    stageCode: null,
    room: null,
  });
  const [groupMode, setGroupMode] = useState<ProjectGroupMode>('location');
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [sopSheetId, setSopSheetId] = useState<string | null>(null);
  const [knowledgeSheetId, setKnowledgeSheetId] = useState<string | null>(null);
  const [quickCaptureTask, setQuickCaptureTask] = useState<EnrichedTask | null>(null);
  const [showCreateCO, setShowCreateCO] = useState(false);
  const [selectedCOId, setSelectedCOId] = useState<string | null>(null);

  // Labs flag toggle
  const toggleLabsFlag = useToggleLabsFlag();

  // Delete project
  const deleteProject = useDeleteLocalProject();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Group by selected axis
  const taskGroups = useMemo(() => {
    const groups = new Map<string, EnrichedTask[]>();
    for (const task of filteredTasks) {
      const key = groupMode === 'location' ? task.room
        : groupMode === 'category' ? (task.tradeCode || 'OH')
        : (task.stageCode || 'ST-FN');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }
    // Sort groups
    const sorted = Array.from(groups.entries()).sort(([a], [b]) => {
      if (groupMode === 'category') return getTradeOrder(a) - getTradeOrder(b);
      if (groupMode === 'stage') return getStageOrder(a) - getStageOrder(b);
      return a.localeCompare(b);
    });
    // Sort tasks within each group by sortOrder (construction sequence)
    for (const [, tasks] of sorted) {
      tasks.sort((a, b) => (a.sortOrder ?? 99999) - (b.sortOrder ?? 99999));
    }
    return sorted;
  }, [filteredTasks, groupMode]);

  // Backwards compat: roomNames for health card
  const roomNames = useMemo(() => {
    const rooms = new Set<string>();
    for (const t of filteredTasks) rooms.add(t.room);
    return Array.from(rooms).sort();
  }, [filteredTasks]);

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
  // Dashboard panel derivations
  // ---------------------------------------------------------------------------

  // Over-budget tasks (for RiskAttentionPanel)
  const overBudgetItems = useMemo(() => {
    if (!budgets) return [];
    return budgets
      .filter(b => b.status === 'over_budget')
      .map(b => {
        const task = enrichedTasks.find(t => t.id === b.taskId);
        return {
          taskId: b.taskId,
          taskName: task?.taskName || b.taskId,
          actualHours: b.actualHours,
          budgetedHours: b.budgetedHours,
        };
      });
  }, [budgets, enrichedTasks]);

  // Blocked tasks
  const blockedItems = useMemo(() => {
    return enrichedTasks
      .filter(t => t.status === 'blocked')
      .map(t => ({ id: t.id, taskName: t.taskName, room: t.room }));
  }, [enrichedTasks]);

  // Overdue tasks
  const overdueItems = useMemo(() => {
    return tasks
      .filter(t => t.dueDate && isOverdue(t.dueDate) && t.status !== 'complete')
      .map(t => {
        const enriched = enrichedTasks.find(e => e.id === t.id);
        return {
          id: t.id,
          taskName: enriched?.taskName || t.title,
          dueDate: t.dueDate!,
        };
      });
  }, [tasks, enrichedTasks]);

  // Pending change orders (for RiskAttentionPanel)
  const pendingCOs = useMemo(() => {
    return changeOrders
      .filter(co => co.status === 'pending_approval')
      .map(co => ({ coNumber: co.coNumber, title: co.title, costImpact: co.costImpact }));
  }, [changeOrders]);

  // Training gaps (for RiskAttentionPanel)
  const projectSopCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const t of enrichedTasks) {
      if (t.sopCode) codes.add(t.sopCode);
    }
    return Array.from(codes);
  }, [enrichedTasks]);

  const trainingGaps = useMemo(() => {
    const gaps: Array<{ sopCode: string; crewName: string }> = [];
    for (const member of allCrewMembers) {
      for (const code of projectSopCodes) {
        const hasCert = allTrainingRecords.some(
          r => r.crewMemberId === member.id && r.sopCode === code && r.status === 'certified'
        );
        if (!hasCert) {
          gaps.push({ sopCode: code, crewName: member.name });
        }
      }
    }
    return gaps;
  }, [allCrewMembers, allTrainingRecords, projectSopCodes]);

  // Task milestones (for TimelinePanel)
  const taskMilestones = useMemo(() => {
    return tasks
      .filter(t => t.dueDate)
      .map(t => {
        const enriched = enrichedTasks.find(e => e.id === t.id);
        return {
          id: t.id,
          name: enriched?.taskName || t.title,
          dueDate: t.dueDate!,
          status: t.status,
          room: enriched?.room || 'General',
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks, enrichedTasks]);

  // ---------------------------------------------------------------------------
  // New layout derived values
  // ---------------------------------------------------------------------------

  // Budget hours for header bar
  const totalBudgetedHours = useMemo(() => (budgets || []).reduce((s, b) => s + (b.budgetedHours || 0), 0), [budgets]);
  const totalActualHours   = useMemo(() => (budgets || []).reduce((s, b) => s + (b.actualHours   || 0), 0), [budgets]);

  // Task status → LoopStatus
  function taskStatusToLoopStatus(status: string): LoopStatus {
    if (status === 'complete')   return 'green';
    if (status === 'blocked')    return 'red';
    if (status === 'in_progress') return 'blue';
    return 'grey';
  }

  // Worst-child LoopStatus roll-up
  function worstLoopStatus(statuses: LoopStatus[]): LoopStatus {
    if (statuses.includes('red'))   return 'red';
    if (statuses.includes('amber')) return 'amber';
    if (statuses.includes('blue'))  return 'blue';
    if (statuses.length > 0 && statuses.every((s) => s === 'green')) return 'green';
    return 'grey';
  }

  // SCRIPT stage mapping from existing stage codes
  const STAGE_CODE_TO_SCRIPT: Record<string, 'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'transition'> = {
    'ST-DM': 'shield',
    'ST-PR': 'ready',
    'ST-FN': 'install',
    'ST-PL': 'punch',
    'ST-CL': 'transition',
    'OH':    'clear',
  };

  const scriptStages = useMemo(() => {
    const stageKeys: Array<'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'transition'> = ['shield', 'clear', 'ready', 'install', 'punch', 'transition'];
    const stageLabels: Record<string, string> = { shield: 'Shield', clear: 'Clear', ready: 'Ready', install: 'Install', punch: 'Punch', transition: 'Transition' };
    const grouped: Record<string, { completed: number; total: number }> = {};
    stageKeys.forEach((k) => { grouped[k] = { completed: 0, total: 0 }; });

    for (const t of enrichedTasks) {
      const mapped = t.stageCode ? (STAGE_CODE_TO_SCRIPT[t.stageCode] ?? 'clear') : 'clear';
      grouped[mapped].total++;
      if (t.status === 'complete') grouped[mapped].completed++;
    }

    return stageKeys.map((key) => {
      const { completed, total } = grouped[key];
      let status: 'done' | 'active' | 'warn' | 'fail' | 'idle' = 'idle';
      if (total === 0) status = 'idle';
      else if (completed === total) status = 'done';
      else if (enrichedTasks.some((t) => (STAGE_CODE_TO_SCRIPT[t.stageCode ?? ''] ?? 'clear') === key && t.status === 'blocked')) status = 'fail';
      else if (enrichedTasks.some((t) => (STAGE_CODE_TO_SCRIPT[t.stageCode ?? ''] ?? 'clear') === key && t.status === 'in_progress')) status = 'active';
      else if (completed > 0) status = 'warn';
      return { key, label: stageLabels[key], status, completed, total };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedTasks]);

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
            className="text-sm font-medium min-h-[44px]"
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
      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Loading project…</p>
          </div>
        </div>
      )}

      {/* ── Not found ── */}
      {!isLoading && !project && (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Project not found</p>
            <button onClick={() => router.push('/')} style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44 }}>
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      {!isLoading && project && (() => {
        const fmtCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
        const budgetPct = project.budget.estimatedCost > 0
          ? Math.round((project.budget.actualCost / project.budget.estimatedCost) * 100)
          : 0;
        const labourPct = totalBudgetedHours > 0
          ? Math.round((totalActualHours / totalBudgetedHours) * 100)
          : 0;

        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

            {/* ── Slim header ── */}
            <div style={{ height: 64, background: 'var(--surface-1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', flexShrink: 0, zIndex: 20 }}>
              {/* Back */}
              <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', display: 'flex', alignItems: 'center', minHeight: 44 }}>
                <ChevronLeft size={16} strokeWidth={2} />
              </button>

              {/* Name + address */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-cond)', fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {project.name}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                  {addressDisplay && <span style={{ fontSize: 11, color: 'var(--text-2)' }}><MapPin size={10} strokeWidth={1.5} style={{ display: 'inline', marginRight: 2 }} />{addressDisplay}</span>}
                  {customer && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{customer.firstName} {customer.lastName}</span>}
                  {project.dates.startDate && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{project.dates.startDate}{project.dates.estimatedEndDate ? ` → ${project.dates.estimatedEndDate}` : ''}</span>}
                </div>
              </div>

              {/* Status pill */}
              <div style={{ background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', flexShrink: 0 }}>
                {project.status}
              </div>

              {/* Budget items */}
              <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center' }}>
                <HeaderBudgetItem label="Material" value={fmtCurrency(project.budget.actualCost)} total={fmtCurrency(project.budget.estimatedCost)} pct={budgetPct} />
                <HeaderBudgetItem label="Labour" value={`${Math.round(totalActualHours)}h`} total={`${Math.round(totalBudgetedHours)}h`} pct={labourPct} />
                <HeaderBudgetItem label="Progress" value={`${healthScore}%`} total="100%" pct={healthScore} forceGreen />
              </div>

              {/* Delete */}
              <button onClick={() => setShowDeleteConfirm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', display: 'flex', alignItems: 'center', minHeight: 44 }} title="Delete project">
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>

            {/* ── SCRIPT Pipeline ── */}
            <ScriptPipeline
              stages={scriptStages}
              blockerCount={blockedItems.length}
              decisionCount={pendingCOs.length}
              roomCount={roomNames.length}
              onSiteCount={crewMemberName ? 1 : 0}
            />

            {/* ── Three-column layout ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '42fr 33fr 25fr', flex: 1, overflow: 'hidden' }}>

              {/* ── Col 1 — Loops (42%) ── */}
              <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                {/* Sticky filter tabs */}
                <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0, padding: '0 12px' }}>
                  {(['location', 'category', 'stage'] as const).map((mode) => {
                    const label = mode === 'location' ? 'Location' : mode === 'category' ? 'Trade' : 'Stage';
                    const isActive = groupMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setGroupMode(mode)}
                        style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: isActive ? 'var(--blue)' : 'var(--text-3)', background: 'none', border: 'none', borderBottom: isActive ? '2px solid var(--blue)' : '2px solid transparent', padding: '8px 10px', cursor: 'pointer', transition: 'color 0.15s' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Loop tree */}
                {taskGroups.map(([groupKey, groupTasks]) => {
                  const completedCount = groupTasks.filter((t) => t.status === 'complete').length;
                  const groupStatuses = groupTasks.map((t) => taskStatusToLoopStatus(t.status));
                  const groupStatus = worstLoopStatus(groupStatuses);
                  const groupPct = groupTasks.length > 0 ? Math.round((completedCount / groupTasks.length) * 100) : 0;

                  const groupLabel = groupMode === 'location' ? groupKey
                    : groupMode === 'category' ? getTradeDisplayName(groupKey)
                    : getStageDisplayName(groupKey);

                  const isExpanded = !collapsedRooms.has(groupKey);

                  return (
                    <div key={groupKey}>
                      <LoopRow
                        name={groupLabel}
                        depth={0}
                        status={groupStatus}
                        pct={groupPct}
                        hasChildren
                        isExpanded={isExpanded}
                        onToggle={() => handleToggleRoom(groupKey)}
                      />
                      {isExpanded && groupTasks.map((task) => (
                        <div key={task.id}>
                          <LoopRow
                            name={task.taskName}
                            subLabel={task.room !== groupKey ? task.room : undefined}
                            depth={1}
                            status={taskStatusToLoopStatus(task.status)}
                            pct={task.status === 'complete' ? 100 : task.status === 'in_progress' ? 50 : 0}
                            tradeBadge={task.tradeCode || undefined}
                            isComplete={task.status === 'complete'}
                            isBlocked={task.status === 'blocked'}
                            onClick={() => handleToggleExpand(task.id)}
                          />
                          {expandedTaskId === task.id && (
                            <div style={{ padding: '0 8px 8px 8px', background: 'var(--surface-2)' }}>
                              <TaskCard
                                task={task}
                                isExpanded
                                onToggleExpand={() => handleToggleExpand(task.id)}
                                budget={budgetMap.get(task.id) || null}
                                trainingRecord={task.resolvedSopId ? trainingMap.get(task.resolvedSopId) || null : null}
                                catalog={catalog}
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
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {totalTasks === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>No tasks yet</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Use Quick Add (+) to add tasks</p>
                  </div>
                )}
                {totalTasks > 0 && filteredTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>No tasks match filters</p>
                    <button onClick={() => setFilters({ tradeCode: null, stageCode: null, room: null })} style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Clear filters
                    </button>
                  </div>
                )}
              </div>

              {/* ── Col 2 — Budget + Activity (33%) ── */}
              <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                <BudgetPanel
                  projectId={projectId}
                  budgetSummary={budgetSummary || null}
                  estimatedCost={project.budget.estimatedCost}
                  actualCost={project.budget.actualCost}
                  budgets={budgets || []}
                />
                <TimelinePanel
                  startDate={project.dates.startDate}
                  estimatedEndDate={project.dates.estimatedEndDate}
                  taskMilestones={taskMilestones}
                />
                {/* Activity */}
                <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Activity Log</span>
                    <Link href={`/activity?project=${projectId}`} style={{ fontFamily: 'var(--font-cond)', fontSize: 8, fontWeight: 600, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
                      View All <ArrowRight size={8} />
                    </Link>
                  </div>
                  {(!activityData || activityData.events.length === 0) ? (
                    <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>No activity yet</p>
                  ) : (
                    <SimpleActivityFeed events={activityData.events as any} maxItems={10} />
                  )}
                </div>
              </div>

              {/* ── Col 3 — Flags + Crew (25%) ── */}
              <div style={{ overflowY: 'auto' }}>
                <RiskAttentionPanel
                  overBudgetTasks={overBudgetItems}
                  blockedTasks={blockedItems}
                  overdueTasks={overdueItems}
                  pendingChangeOrders={pendingCOs}
                  trainingGaps={trainingGaps}
                />
                <ChangeOrderPanel
                  changeOrders={changeOrders}
                  budgetImpact={coBudgetImpact || null}
                  onCreateCO={() => setShowCreateCO(true)}
                  onSelectCO={(id) => setSelectedCOId(id)}
                />
                <CrewTrainingPanel
                  crewMembers={allCrewMembers}
                  trainingRecords={allTrainingRecords}
                  projectSopCodes={projectSopCodes}
                />
                <ProjectLabsData projectId={projectId} />
              </div>
            </div>

            {/* ── Delete confirmation ── */}
            {showDeleteConfirm && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                <div style={{ background: 'var(--surface-1)', borderRadius: 8, padding: 20, maxWidth: 360, width: '90%', boxShadow: 'var(--shadow-panel)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Delete project?</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16 }}>
                    This will permanently delete <strong>{project.name}</strong> and all its tasks, line items, and activity. This cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, minHeight: 40, borderRadius: 4, fontSize: 12, fontWeight: 500, background: 'var(--surface-3)', color: 'var(--text)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    <button
                      onClick={async () => { await deleteProject.mutateAsync(projectId); router.push('/'); }}
                      disabled={deleteProject.isPending}
                      style={{ flex: 1, minHeight: 40, borderRadius: 4, fontSize: 12, fontWeight: 500, background: 'var(--red)', color: 'white', border: 'none', cursor: 'pointer', opacity: deleteProject.isPending ? 0.6 : 1 }}
                    >
                      {deleteProject.isPending ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Batch Confirm Modal ── */}
            {hasPendingBatch && batchTaskId && (
              <BatchConfirmModal
                isOpen
                pendingItems={pendingBatchItems}
                onConfirmItem={async (id, overrides) => { await confirmBatchItem.mutateAsync({ pendingBatchId: id, overrides }); }}
                onSkipItem={async (id) => { await skipBatchItem.mutateAsync(id); }}
                onConfirmAll={async () => { await confirmAllBatch.mutateAsync(batchTaskId); }}
                onClose={clearBatch}
              />
            )}

            {/* ── Quick Capture Prompt ── */}
            {showQuickCapture && quickCaptureTask && (
              <QuickCapturePrompt
                isOpen
                onClose={() => setQuickCaptureTask(null)}
                taskContext={{ taskId: quickCaptureTask.id, taskName: quickCaptureTask.taskName, room: quickCaptureTask.room, projectId, sopCode: quickCaptureTask.sopCode, tradeCode: quickCaptureTask.tradeCode ?? undefined, labsFlagged: quickCaptureTask.labsFlagged }}
                crewMemberId={crewMemberId || ''}
              />
            )}

            {/* ── SOP Sheet ── */}
            <BottomSheet isOpen={!!sopSheetId && !knowledgeSheetId} onClose={() => setSopSheetId(null)} title="SOP Reference">
              {sopSheetId && <SOPSheetContent sopId={sopSheetId} onOpenKnowledge={handleOpenKnowledge} />}
            </BottomSheet>

            {/* ── Knowledge Sheet ── */}
            <BottomSheet isOpen={!!knowledgeSheetId} onClose={() => setKnowledgeSheetId(null)} title="Lab Evidence">
              {knowledgeSheetId && <KnowledgeSheetContent knowledgeId={knowledgeSheetId} />}
            </BottomSheet>

            {/* ── Create Change Order Sheet ── */}
            <CreateChangeOrderSheet
              isOpen={showCreateCO}
              onClose={() => setShowCreateCO(false)}
              projectId={projectId}
            />

            {/* ── Change Order Detail Sheet ── */}
            <ChangeOrderDetailSheet
              isOpen={!!selectedCOId}
              onClose={() => setSelectedCOId(null)}
              changeOrderId={selectedCOId || ''}
            />

          </div>
        );
      })()}
    </PageErrorBoundary>
  );
}

// ── Header budget item sub-component ──
function HeaderBudgetItem({ label, value, total, pct, forceGreen }: { label: string; value: string; total: string; pct: number; forceGreen?: boolean }) {
  const barColor = forceGreen ? 'var(--green)' : pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--green)';
  const valueColor = forceGreen ? 'var(--green)' : pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--text-2)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 72 }}>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', lineHeight: 1 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: valueColor, lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-2)', lineHeight: 1 }}>/ {total}</span>
      </div>
      <div style={{ width: 90, height: 3, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 1, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
