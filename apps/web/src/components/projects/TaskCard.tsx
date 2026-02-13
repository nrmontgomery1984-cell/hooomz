'use client';

/**
 * Task Card — Rich task display with SOP, budget, training integration
 *
 * Collapsed: status icon, title, stage/trade subtitle, badge row
 * Expanded: SOP checklist, budget detail, training status, notes, actions
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Circle,
  Clock,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  StickyNote,
  ExternalLink,
  GraduationCap,
  Timer,
  FlaskConical,
} from 'lucide-react';
import { TRADE_CODES } from '@/lib/types/intake.types';
import { SOPChecklist } from '@/components/sop/SOPChecklist';
import type { EnrichedTask } from '@/lib/utils/taskParsing';

// =============================================================================
// Types
// =============================================================================

interface TaskBudget {
  taskId: string;
  budgetedHours: number;
  actualHours: number;
  efficiency: number | null;
  status: string;
}

interface TrainingRecord {
  id: string;
  crewMemberId: string;
  sopId: string;
  sopCode: string;
  status: 'in_progress' | 'review_ready' | 'certified';
  supervisedCompletions: { completedAt: string }[];
}

interface TaskCardProps {
  task: EnrichedTask;
  isExpanded: boolean;
  onToggleExpand: () => void;
  budget?: TaskBudget | null;
  trainingRecord?: TrainingRecord | null;
  crewMemberId: string | null;
  crewMemberName: string | null;
  onComplete: (e: React.MouseEvent, taskId: string) => void;
  onUndo: (e: React.MouseEvent, taskId: string) => void;
  onSaveNote: (taskId: string, newDescription: string) => void;
  isCompleting: boolean;
  isUndoing: boolean;
  onOpenSOP?: (sopId: string) => void;
  onOpenKnowledge?: (sourceId: string) => void;
  onToggleLabsFlag?: (taskId: string, flagged: boolean) => void;
  onOpenLabsCapture?: (taskId: string) => void;
}

// =============================================================================
// Helper: Budget color
// =============================================================================

function getBudgetColor(efficiency: number | null, actualHours: number, budgetedHours: number): string {
  if (budgetedHours === 0) return '#9CA3AF';
  const ratio = efficiency ?? (actualHours / budgetedHours);
  if (ratio > 1.0) return '#EF4444';
  if (ratio > 0.85) return '#F59E0B';
  return '#10B981';
}

// =============================================================================
// Component
// =============================================================================

export function TaskCard({
  task,
  isExpanded,
  onToggleExpand,
  budget,
  trainingRecord,
  crewMemberId,
  crewMemberName,
  onComplete,
  onUndo,
  onSaveNote,
  isCompleting,
  isUndoing,
  onOpenSOP,
  onOpenKnowledge,
  onToggleLabsFlag,
  onOpenLabsCapture,
}: TaskCardProps) {
  const isComplete = task.status === 'complete';
  const isInProgress = task.status === 'in_progress';

  const [editingNote, setEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const tradeMeta = task.tradeCode
    ? TRADE_CODES[task.tradeCode as keyof typeof TRADE_CODES]
    : null;

  // Note editing
  const handleStartNote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(true);
    setNoteInput(task.userNotes);
  }, [task.userNotes]);

  const handleSaveNote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Rebuild description: stage/trade line + sopId line + user note
    const lines = (task.description || '').split('\n');
    const stageTradePattern = /^(Demolition|Prime & Prep|Finish|Punch List|Closeout) · .+/;
    const stageTradePrefix = stageTradePattern.test(lines[0]) ? lines[0] : '';
    const sopIdLine = lines.find((l) => l.startsWith('sopId:')) || '';
    const parts = [stageTradePrefix, sopIdLine, noteInput.trim()].filter(Boolean);
    onSaveNote(task.id, parts.join('\n'));
    setEditingNote(false);
    setNoteInput('');
  }, [noteInput, task.id, task.description, onSaveNote]);

  const handleCancelNote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(false);
    setNoteInput('');
  }, []);

  // Training display
  const requiredSupervised = 3;
  const completedSupervised = trainingRecord?.supervisedCompletions?.length ?? 0;

  return (
    <div style={{ borderBottom: '1px solid #F3F4F6' }}>
      {/* Collapsed Row — div instead of button so nested <Link> works */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(); } }}
        className="w-full px-4 py-3 flex items-start gap-3 text-left cursor-pointer"
        style={{ minHeight: '56px' }}
      >
        {/* Status icon */}
        <div
          onClick={(e) => isComplete ? onUndo(e, task.id) : onComplete(e, task.id)}
          className="flex-shrink-0 mt-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
        >
          {isComplete ? (
            <CheckCircle2 size={20} style={{ color: '#10B981' }} strokeWidth={2} />
          ) : isInProgress ? (
            <Clock size={20} style={{ color: '#3B82F6' }} strokeWidth={1.5} />
          ) : (
            <Circle size={20} style={{ color: '#D1D5DB' }} strokeWidth={1.5} />
          )}
        </div>

        {/* Title + subtitle + badges */}
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium block"
            style={{
              color: isComplete ? '#9CA3AF' : '#111827',
              textDecoration: isComplete ? 'line-through' : 'none',
            }}
          >
            {task.taskName}
          </span>

          {/* Stage · Trade subtitle */}
          {(task.stageName || task.tradeName) && (
            <span className="text-[11px] block mt-0.5" style={{ color: '#9CA3AF' }}>
              {[task.stageName, task.tradeName].filter(Boolean).join(' · ')}
            </span>
          )}

          {/* Badge row */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {/* Trade badge */}
            {tradeMeta && (
              <span
                className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: '#F3F4F6', color: '#374151' }}
              >
                {tradeMeta.icon} {task.tradeCode}
              </span>
            )}

            {/* SOP badge — opens sheet or links to detail page */}
            {task.resolvedSopId && (
              onOpenSOP ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenSOP(task.resolvedSopId!); }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: '#F0FDFA', color: '#0F766E' }}
                >
                  SOP <ExternalLink size={8} />
                </button>
              ) : (
                <Link
                  href={`/labs/sops/${task.resolvedSopId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: '#F0FDFA', color: '#0F766E' }}
                >
                  SOP <ExternalLink size={8} />
                </Link>
              )
            )}

            {/* Budget badge */}
            {budget && budget.budgetedHours > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: getBudgetColor(budget.efficiency, budget.actualHours, budget.budgetedHours) + '15',
                  color: getBudgetColor(budget.efficiency, budget.actualHours, budget.budgetedHours),
                }}
              >
                <Timer size={8} />
                {budget.actualHours.toFixed(1)}/{budget.budgetedHours.toFixed(0)}h
              </span>
            )}

            {/* Training badge */}
            {trainingRecord && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: trainingRecord.status === 'certified' ? '#D1FAE5' : '#FEF3C7',
                  color: trainingRecord.status === 'certified' ? '#065F46' : '#92400E',
                }}
              >
                <GraduationCap size={8} />
                {trainingRecord.status === 'certified'
                  ? '✓'
                  : `${completedSupervised}/${requiredSupervised}`}
              </span>
            )}

            {/* Labs flag badge */}
            {task.labsFlagged && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: '#F0FDFA', color: '#0F766E' }}
              >
                <FlaskConical size={8} />
                Labs
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className="flex-shrink-0 mt-1 transition-transform duration-200"
          style={{
            color: '#D1D5DB',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 ml-[40px] space-y-3" style={{ borderTop: '1px solid #F3F4F6' }}>
          {/* User notes */}
          {task.userNotes && !editingNote && (
            <div className="pt-2">
              <p className="text-[11px] font-medium mb-1" style={{ color: '#6B7280' }}>Notes</p>
              <p className="text-sm" style={{ color: '#374151' }}>{task.userNotes}</p>
            </div>
          )}

          {/* SOP Checklist */}
          {task.resolvedSopId && (
            <div className="pt-1">
              <SOPChecklist
                taskId={task.id}
                sopId={task.resolvedSopId}
                onOpenSOP={onOpenSOP}
                onOpenKnowledge={onOpenKnowledge}
              />
              {onOpenSOP ? (
                <button
                  onClick={() => onOpenSOP(task.resolvedSopId!)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium mt-2 hover:underline"
                  style={{ color: '#0F766E' }}
                >
                  View full SOP <ExternalLink size={10} />
                </button>
              ) : (
                <Link
                  href={`/labs/sops/${task.resolvedSopId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium mt-2 hover:underline"
                  style={{ color: '#0F766E' }}
                >
                  View full SOP <ExternalLink size={10} />
                </Link>
              )}
            </div>
          )}

          {/* Budget detail */}
          {budget && budget.budgetedHours > 0 && (
            <div
              className="rounded-lg p-3"
              style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
            >
              <p className="text-[11px] font-medium mb-1.5" style={{ color: '#6B7280' }}>Budget</p>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span style={{ color: '#374151' }}>
                  Budgeted: {budget.budgetedHours.toFixed(1)}h
                </span>
                <span style={{ color: '#374151' }}>
                  Actual: {budget.actualHours.toFixed(1)}h
                </span>
                {budget.efficiency !== null && (
                  <span
                    className="font-medium"
                    style={{ color: getBudgetColor(budget.efficiency, budget.actualHours, budget.budgetedHours) }}
                  >
                    {Math.round(budget.efficiency * 100)}%
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: '#E5E7EB' }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min((budget.actualHours / budget.budgetedHours) * 100, 100)}%`,
                    background: getBudgetColor(budget.efficiency, budget.actualHours, budget.budgetedHours),
                  }}
                />
              </div>
            </div>
          )}

          {/* Training status */}
          {trainingRecord && crewMemberId && (
            <div
              className="rounded-lg p-3"
              style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
            >
              <p className="text-[11px] font-medium mb-1" style={{ color: '#6B7280' }}>
                Training — {crewMemberName || 'Crew'}
              </p>
              <div className="flex items-center gap-3 text-xs" style={{ color: '#374151' }}>
                <span>{completedSupervised}/{requiredSupervised} supervised</span>
                <span>·</span>
                <span
                  className="font-medium"
                  style={{
                    color: trainingRecord.status === 'certified' ? '#10B981'
                      : trainingRecord.status === 'review_ready' ? '#3B82F6'
                      : '#F59E0B',
                  }}
                >
                  {trainingRecord.status === 'certified' ? 'Certified'
                    : trainingRecord.status === 'review_ready' ? 'Review Ready'
                    : 'In Progress'}
                </span>
              </div>
              <Link
                href={`/labs/training/${crewMemberId}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium mt-2 hover:underline"
                style={{ color: '#0F766E' }}
              >
                View training <ExternalLink size={10} />
              </Link>
            </div>
          )}

          {/* Note editing */}
          {editingNote && (
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] font-medium mb-1" style={{ color: '#6B7280' }}>
                {task.userNotes ? 'Edit note' : 'Add a note'}
              </p>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Type a note..."
                className="w-full text-sm rounded-lg p-3 resize-none focus:outline-none"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  minHeight: '72px',
                }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveNote}
                  className="text-xs font-medium px-4 min-h-[36px] rounded-lg text-white"
                  style={{ background: '#374151' }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelNote}
                  className="text-xs font-medium px-4 min-h-[36px] rounded-lg"
                  style={{ color: '#6B7280' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!editingNote && (
            <div className="flex gap-2 pt-1 flex-wrap">
              {isComplete ? (
                <button
                  onClick={(e) => onUndo(e, task.id)}
                  disabled={isUndoing}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[36px] rounded-lg transition-colors"
                  style={{ color: '#6B7280', background: '#F3F4F6' }}
                >
                  <RotateCcw size={14} strokeWidth={1.5} />
                  Undo
                </button>
              ) : (
                <button
                  onClick={(e) => onComplete(e, task.id)}
                  disabled={isCompleting}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[36px] rounded-lg text-white transition-colors"
                  style={{ background: '#10B981' }}
                >
                  <CheckCircle2 size={14} strokeWidth={1.5} />
                  Complete
                </button>
              )}

              <button
                onClick={handleStartNote}
                className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[36px] rounded-lg transition-colors"
                style={{ color: '#6B7280', background: '#F3F4F6' }}
              >
                <StickyNote size={14} strokeWidth={1.5} />
                {task.userNotes ? 'Edit Note' : 'Add Note'}
              </button>

              {/* Labs action: capture (complete) or flag (incomplete) */}
              {isComplete && onOpenLabsCapture && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenLabsCapture(task.id); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[36px] rounded-lg transition-colors"
                  style={{ color: '#0F766E', background: '#F0FDFA' }}
                >
                  <FlaskConical size={14} strokeWidth={1.5} />
                  Labs Note
                </button>
              )}
              {!isComplete && onToggleLabsFlag && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLabsFlag(task.id, !task.labsFlagged); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[36px] rounded-lg transition-colors"
                  style={{
                    color: task.labsFlagged ? '#0F766E' : '#6B7280',
                    background: task.labsFlagged ? '#F0FDFA' : '#F3F4F6',
                  }}
                >
                  <FlaskConical size={14} strokeWidth={1.5} />
                  {task.labsFlagged ? 'Flagged' : 'Flag for Labs'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
