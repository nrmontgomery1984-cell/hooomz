'use client';

/**
 * QuickCapturePrompt — Post-task observation capture
 *
 * Appears after task completion (after BatchConfirmModal if applicable).
 * State machine: category_select → note_form → close.
 * "Skip" is always the easiest option — never nagging.
 */

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StarRating } from './StarRating';
import { useCreateObservation } from '@/lib/hooks/useLabsData';
import type { KnowledgeType } from '@hooomz/shared-contracts';
import { Camera, FlaskConical } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface QuickCaptureTaskContext {
  taskId: string;
  taskName: string;
  room: string;
  projectId: string;
  sopCode?: string;
  tradeCode?: string;
  materialDescription?: string;
  labsFlagged?: boolean;
}

interface QuickCapturePromptProps {
  isOpen: boolean;
  onClose: () => void;
  taskContext: QuickCaptureTaskContext;
  crewMemberId: string;
}

type CaptureStep = 'category_select' | 'note_form';

interface CategoryOption {
  id: string;
  label: string;
  knowledgeType: KnowledgeType;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'product_feedback', label: 'Product feedback', knowledgeType: 'product' },
  { id: 'technique_note', label: 'Technique note', knowledgeType: 'technique' },
  { id: 'time_estimate', label: 'Time was off', knowledgeType: 'timing' },
  { id: 'customer_comment', label: 'Customer comment', knowledgeType: 'procedure' },
];

// ============================================================================
// Component
// ============================================================================

export function QuickCapturePrompt({
  isOpen,
  onClose,
  taskContext,
  crewMemberId,
}: QuickCapturePromptProps) {
  const [step, setStep] = useState<CaptureStep>('category_select');
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const createObservation = useCreateObservation();

  const handleSelectCategory = (category: CategoryOption) => {
    setSelectedCategory(category);
    setStep('note_form');
  };

  const handleSkip = () => {
    resetAndClose();
  };

  const handleCancel = () => {
    setStep('category_select');
    setSelectedCategory(null);
    setNotes('');
    setRating(0);
  };

  const handleSave = async () => {
    if (!selectedCategory || !notes.trim()) return;

    try {
      await createObservation.mutateAsync({
        projectId: taskContext.projectId,
        taskId: taskContext.taskId,
        knowledgeType: selectedCategory.knowledgeType,
        crewMemberId,
        captureMethod: 'manual',
        notes: notes.trim(),
        quality: rating > 0 ? (rating as 1 | 2 | 3 | 4 | 5) : undefined,
        trade: taskContext.tradeCode,
        locationId: taskContext.room,
      });
      resetAndClose();
    } catch (err) {
      console.error('Failed to save observation:', err);
    }
  };

  const resetAndClose = () => {
    setStep('category_select');
    setSelectedCategory(null);
    setNotes('');
    setRating(0);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={resetAndClose} title="Quick Capture">
      {step === 'category_select' && (
        <CategorySelectView
          onSelect={handleSelectCategory}
          onSkip={handleSkip}
          showSkip={!taskContext.labsFlagged}
        />
      )}
      {step === 'note_form' && selectedCategory && (
        <NoteFormView
          category={selectedCategory}
          taskContext={taskContext}
          notes={notes}
          onNotesChange={setNotes}
          rating={rating}
          onRatingChange={setRating}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={createObservation.isPending}
        />
      )}
    </BottomSheet>
  );
}

// ============================================================================
// Sub-views
// ============================================================================

function CategorySelectView({
  onSelect,
  onSkip,
  showSkip,
}: {
  onSelect: (category: CategoryOption) => void;
  onSkip: () => void;
  showSkip: boolean;
}) {
  return (
    <div className="px-1 pb-2">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={18} style={{ color: '#0F766E' }} />
        <p className="text-sm font-medium" style={{ color: '#111827' }}>
          Anything worth noting for Labs?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="min-h-[48px] px-3 py-3 rounded-xl text-sm font-medium text-left transition-colors"
            style={{
              background: '#F3F4F6',
              color: '#374151',
              border: '1px solid #E5E7EB',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {showSkip && (
        <button
          onClick={onSkip}
          className="w-full min-h-[52px] rounded-xl text-sm font-medium transition-colors"
          style={{
            background: '#FFFFFF',
            color: '#9CA3AF',
            border: '1px solid #E5E7EB',
          }}
        >
          Skip — nothing to report
        </button>
      )}
    </div>
  );
}

function NoteFormView({
  category,
  taskContext,
  notes,
  onNotesChange,
  rating,
  onRatingChange,
  onSave,
  onCancel,
  isSaving,
}: {
  category: CategoryOption;
  taskContext: QuickCaptureTaskContext;
  notes: string;
  onNotesChange: (v: string) => void;
  rating: number;
  onRatingChange: (v: number) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="px-1 pb-2">
      {/* Context header */}
      <div className="mb-3">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
          style={{ background: '#F0FDFA', color: '#0F766E' }}
        >
          {category.label}
        </span>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          {taskContext.taskName}
          {taskContext.room !== 'General' ? ` — ${taskContext.room}` : ''}
        </p>
        {taskContext.materialDescription && (
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {taskContext.materialDescription}
          </p>
        )}
      </div>

      {/* Note */}
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="What did you notice?"
        rows={3}
        className="w-full rounded-xl px-4 py-3 text-sm resize-none"
        style={{
          background: '#F9FAFB',
          color: '#111827',
          border: '1px solid #E5E7EB',
        }}
        autoFocus
      />

      {/* Rating (optional) */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Quality rating (optional)
        </p>
        <StarRating value={rating} onChange={onRatingChange} size={20} />
      </div>

      {/* Photo placeholder */}
      <button
        type="button"
        disabled
        className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
        style={{ color: '#D1D5DB' }}
      >
        <Camera size={14} />
        Add photo (coming soon)
      </button>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 min-h-[48px] rounded-xl text-sm font-medium"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          Back
        </button>
        <button
          onClick={onSave}
          disabled={!notes.trim() || isSaving}
          className="flex-1 min-h-[48px] rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ background: '#0F766E', color: '#FFFFFF' }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
