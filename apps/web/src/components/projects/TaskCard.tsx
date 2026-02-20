'use client';

/**
 * Task Card — Rich task display with SOP, budget, training integration
 *
 * Collapsed: status icon, title, stage/trade subtitle, badge row
 * Expanded: SOP checklist, budget detail, training status, notes, actions
 */

import { useState, useCallback, useMemo } from 'react';
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
  Package,
  Check,
  Wrench,
} from 'lucide-react';
import { TRADE_CODES } from '@/lib/types/intake.types';
import { SOPChecklist } from '@/components/sop/SOPChecklist';
import type { EnrichedTask } from '@/lib/utils/taskParsing';
import type { CostCatalog } from '@/lib/types/costCatalog.types';
import { resolveTaskBreakdown } from '@/lib/utils/lineItemMaterials';

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
  catalog?: CostCatalog | null;
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
// Helper: Budget style (color + background)
// =============================================================================

function getBudgetStyle(efficiency: number | null, actualHours: number, budgetedHours: number): { color: string; bg: string } {
  if (budgetedHours === 0) return { color: 'var(--text-3)', bg: 'var(--surface-3)' };
  const ratio = efficiency ?? (actualHours / budgetedHours);
  if (ratio > 1.0) return { color: 'var(--red)',   bg: 'var(--red-dim)'   };
  if (ratio > 0.85) return { color: 'var(--amber)', bg: 'var(--amber-dim)' };
  return { color: 'var(--green)', bg: 'var(--green-dim)' };
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
  catalog,
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
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Collapsed Row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(); } }}
        className="w-full px-3 py-2.5 flex items-start gap-2.5 text-left cursor-pointer"
        style={{ minHeight: '44px' }}
      >
        {/* Status icon */}
        <div
          onClick={(e) => isComplete ? onUndo(e, task.id) : onComplete(e, task.id)}
          className="flex-shrink-0 mt-0.5 min-w-[24px] min-h-[24px] flex items-center justify-center"
        >
          {isComplete ? (
            <CheckCircle2 size={18} style={{ color: 'var(--green)' }} strokeWidth={2} />
          ) : isInProgress ? (
            <Clock size={18} style={{ color: 'var(--blue)' }} strokeWidth={1.5} />
          ) : (
            <Circle size={18} style={{ color: 'var(--border)' }} strokeWidth={1.5} />
          )}
        </div>

        {/* Title + subtitle + badges */}
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium block"
            style={{
              color: isComplete ? 'var(--text-3)' : 'var(--text)',
              textDecoration: isComplete ? 'line-through' : 'none',
            }}
          >
            {task.taskName}
          </span>

          {/* Stage · Trade subtitle */}
          {(task.stageName || task.tradeName) && (
            <span className="text-[11px] block mt-0.5" style={{ color: 'var(--text-3)' }}>
              {[task.stageName, task.tradeName].filter(Boolean).join(' · ')}
            </span>
          )}

          {/* Badge row */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {/* Trade badge */}
            {tradeMeta && (
              <span
                className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
              >
                {tradeMeta.icon} {task.tradeCode}
              </span>
            )}

            {/* SOP badge */}
            {task.resolvedSopId && (
              onOpenSOP ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenSOP(task.resolvedSopId!); }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
                >
                  SOP <ExternalLink size={8} />
                </button>
              ) : (
                <Link
                  href={`/labs/sops/${task.resolvedSopId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
                >
                  SOP <ExternalLink size={8} />
                </Link>
              )
            )}

            {/* Budget badge */}
            {budget && budget.budgetedHours > 0 && (() => {
              const bStyle = getBudgetStyle(budget.efficiency, budget.actualHours, budget.budgetedHours);
              return (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: bStyle.bg, color: bStyle.color }}
                >
                  <Timer size={8} />
                  {budget.actualHours.toFixed(1)}/{budget.budgetedHours.toFixed(0)}h
                </span>
              );
            })()}

            {/* Training badge */}
            {trainingRecord && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: trainingRecord.status === 'certified' ? 'var(--green-dim)' : 'var(--amber-dim)',
                  color: trainingRecord.status === 'certified' ? 'var(--green)' : 'var(--amber)',
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
                style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
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
            color: 'var(--border-strong)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 ml-[34px] space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          {/* User notes */}
          {task.userNotes && !editingNote && (
            <div className="pt-2">
              <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-2)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{task.userNotes}</p>
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
                  style={{ color: 'var(--blue)' }}
                >
                  View full SOP <ExternalLink size={10} />
                </button>
              ) : (
                <Link
                  href={`/labs/sops/${task.resolvedSopId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium mt-2 hover:underline"
                  style={{ color: 'var(--blue)' }}
                >
                  View full SOP <ExternalLink size={10} />
                </Link>
              )}
            </div>
          )}

          {/* Materials & Tools */}
          {catalog && (
            <TaskMaterialsSection
              taskName={task.taskName}
              sopCode={task.sopCode}
              catalog={catalog}
            />
          )}

          {/* Budget detail */}
          {budget && budget.budgetedHours > 0 && (() => {
            const bStyle = getBudgetStyle(budget.efficiency, budget.actualHours, budget.budgetedHours);
            return (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
                <p className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Budget</p>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-2)' }}>Budgeted: {budget.budgetedHours.toFixed(1)}h</span>
                  <span style={{ color: 'var(--text-2)' }}>Actual: {budget.actualHours.toFixed(1)}h</span>
                  {budget.efficiency !== null && (
                    <span className="font-medium" style={{ color: bStyle.color }}>
                      {Math.round(budget.efficiency * 100)}%
                    </span>
                  )}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min((budget.actualHours / budget.budgetedHours) * 100, 100)}%`,
                      height: '100%',
                      background: bStyle.color,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Training status */}
          {trainingRecord && crewMemberId && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
              <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                Training — {crewMemberName || 'Crew'}
              </p>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
                <span>{completedSupervised}/{requiredSupervised} supervised</span>
                <span>·</span>
                <span
                  className="font-medium"
                  style={{
                    color: trainingRecord.status === 'certified' ? 'var(--green)'
                      : trainingRecord.status === 'review_ready' ? 'var(--blue)'
                      : 'var(--amber)',
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
                style={{ color: 'var(--blue)' }}
              >
                View training <ExternalLink size={10} />
              </Link>
            </div>
          )}

          {/* Note editing */}
          {editingNote && (
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                {task.userNotes ? 'Edit note' : 'Add a note'}
              </p>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Type a note..."
                className="w-full text-sm rounded-lg p-3 resize-none focus:outline-none"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  minHeight: '72px',
                }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveNote}
                  className="text-xs font-medium px-4 min-h-[32px] rounded-lg"
                  style={{ background: 'var(--text)', color: 'var(--surface-1)', border: 'none', cursor: 'pointer' }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelNote}
                  className="text-xs font-medium px-4 min-h-[32px] rounded-lg"
                  style={{ color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer' }}
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
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[32px] rounded-lg transition-colors"
                  style={{ color: 'var(--text-2)', background: 'var(--surface-3)', border: 'none', cursor: 'pointer' }}
                >
                  <RotateCcw size={14} strokeWidth={1.5} />
                  Undo
                </button>
              ) : (
                <button
                  onClick={(e) => onComplete(e, task.id)}
                  disabled={isCompleting}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[32px] rounded-lg transition-colors"
                  style={{ background: 'var(--green)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                >
                  <CheckCircle2 size={14} strokeWidth={1.5} />
                  Complete
                </button>
              )}

              <button
                onClick={handleStartNote}
                className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[32px] rounded-lg transition-colors"
                style={{ color: 'var(--text-2)', background: 'var(--surface-3)', border: 'none', cursor: 'pointer' }}
              >
                <StickyNote size={14} strokeWidth={1.5} />
                {task.userNotes ? 'Edit Note' : 'Add Note'}
              </button>

              {/* Labs action: capture (complete) or flag (incomplete) */}
              {isComplete && onOpenLabsCapture && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenLabsCapture(task.id); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[32px] rounded-lg transition-colors"
                  style={{ color: 'var(--blue)', background: 'var(--blue-dim)', border: 'none', cursor: 'pointer' }}
                >
                  <FlaskConical size={14} strokeWidth={1.5} />
                  Labs Note
                </button>
              )}
              {!isComplete && onToggleLabsFlag && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLabsFlag(task.id, !task.labsFlagged); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 min-h-[32px] rounded-lg transition-colors"
                  style={{
                    color: task.labsFlagged ? 'var(--blue)' : 'var(--text-2)',
                    background: task.labsFlagged ? 'var(--blue-dim)' : 'var(--surface-3)',
                    border: 'none',
                    cursor: 'pointer',
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

// =============================================================================
// Materials & Tools — simplified materials list + tools checklist
// =============================================================================

function TaskMaterialsSection({
  taskName,
  sopCode,
  catalog,
}: {
  taskName: string;
  sopCode: string | undefined;
  catalog: CostCatalog;
}) {
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());
  const [checkedTools, setCheckedTools] = useState<Set<number>>(new Set());

  const breakdown = useMemo(() => {
    return resolveTaskBreakdown(taskName, sopCode, catalog);
  }, [taskName, sopCode, catalog]);

  if (!breakdown) return null;

  const toggleMat = (idx: number) => {
    setCheckedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleTool = (idx: number) => {
    setCheckedTools((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      {/* Materials list */}
      {breakdown.materials.length > 0 && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMaterialsOpen(!materialsOpen); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left"
            style={{ minHeight: '36px', background: 'none', cursor: 'pointer' }}
          >
            <Package size={12} style={{ color: 'var(--amber)' }} />
            <span className="text-[11px] font-medium flex-1" style={{ color: 'var(--text-2)' }}>
              Materials
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
              {breakdown.materials.length}
            </span>
            <ChevronDown
              size={12}
              className="transition-transform"
              style={{ color: 'var(--text-3)', transform: materialsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {materialsOpen && (
            <div className="px-3 pb-2 space-y-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
              {breakdown.materials.map((mat, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); toggleMat(idx); }}
                  className="w-full flex items-center gap-2 py-1 text-left"
                  style={{ minHeight: '32px', background: 'none', cursor: 'pointer' }}
                >
                  <div
                    className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: checkedMaterials.has(idx) ? 'var(--blue)' : 'var(--border)',
                      background: checkedMaterials.has(idx) ? 'var(--blue)' : 'transparent',
                    }}
                  >
                    {checkedMaterials.has(idx) && <Check size={10} style={{ color: '#FFFFFF' }} />}
                  </div>
                  <span
                    className="text-[11px] font-medium flex-1 truncate"
                    style={{
                      color: checkedMaterials.has(idx) ? 'var(--text-3)' : 'var(--text)',
                      textDecoration: checkedMaterials.has(idx) ? 'line-through' : 'none',
                    }}
                  >
                    {mat.name}
                  </span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-2)' }}>
                    {mat.quantityNeeded} {mat.unit}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tools checklist */}
      {breakdown.tools.length > 0 && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setToolsOpen(!toolsOpen); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left"
            style={{ minHeight: '36px', background: 'none', cursor: 'pointer' }}
          >
            <Wrench size={12} style={{ color: 'var(--text-2)' }} />
            <span className="text-[11px] font-medium flex-1" style={{ color: 'var(--text-2)' }}>
              Tools
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
              {breakdown.tools.length}
            </span>
            <ChevronDown
              size={12}
              className="transition-transform"
              style={{ color: 'var(--text-3)', transform: toolsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {toolsOpen && (
            <div className="px-3 pb-2 space-y-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
              {breakdown.tools.map((tool, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); toggleTool(idx); }}
                  className="w-full flex items-center gap-2 py-1 text-left"
                  style={{ minHeight: '32px', background: 'none', cursor: 'pointer' }}
                >
                  <div
                    className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: checkedTools.has(idx) ? 'var(--blue)' : 'var(--border)',
                      background: checkedTools.has(idx) ? 'var(--blue)' : 'transparent',
                    }}
                  >
                    {checkedTools.has(idx) && <Check size={10} style={{ color: '#FFFFFF' }} />}
                  </div>
                  <span
                    className="text-[11px] truncate"
                    style={{
                      color: checkedTools.has(idx) ? 'var(--text-3)' : 'var(--text)',
                      textDecoration: checkedTools.has(idx) ? 'line-through' : 'none',
                    }}
                  >
                    {tool}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
