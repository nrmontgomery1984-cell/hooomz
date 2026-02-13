'use client';

/**
 * ExperimentCreateModal — Quick experiment creation form
 *
 * Minimal inputs: name, hypothesis, knowledge type, sample size.
 * Complex fields (variables, checkpoints) default to empty — edit on detail page.
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateExperiment } from '@/lib/hooks/useLabsData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import type { KnowledgeType } from '@hooomz/shared-contracts';

interface ExperimentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KNOWLEDGE_TYPE_OPTIONS: { value: KnowledgeType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'material', label: 'Material' },
  { value: 'technique', label: 'Technique' },
  { value: 'timing', label: 'Timing' },
  { value: 'tool_method', label: 'Tool/Method' },
  { value: 'combination', label: 'Combination' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'environmental_rule', label: 'Environmental' },
];

export function ExperimentCreateModal({ isOpen, onClose }: ExperimentCreateModalProps) {
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [knowledgeType, setKnowledgeType] = useState<KnowledgeType>('product');
  const [sampleSize, setSampleSize] = useState(5);
  const createExperiment = useCreateExperiment();
  const { crewMemberId } = useActiveCrew();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      await createExperiment.mutateAsync({
        title: title.trim(),
        hypothesis: hypothesis.trim() || undefined,
        knowledgeType,
        status: 'draft',
        testVariables: [],
        matchCriteria: {},
        requiredSampleSize: sampleSize,
        currentSampleCounts: {},
        checkpoints: [],
        designedBy: crewMemberId || 'unknown',
      });
      resetAndClose();
    } catch (err) {
      console.error('Failed to create experiment:', err);
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setHypothesis('');
    setKnowledgeType('product');
    setSampleSize(5);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={resetAndClose}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full"
        style={{ background: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold" style={{ color: '#111827' }}>
            New Experiment
          </h3>
          <button
            onClick={resetAndClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>
              Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LVP adhesive comparison"
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: '#F9FAFB', color: '#111827', border: '1px solid #E5E7EB' }}
              autoFocus
            />
          </div>

          {/* Hypothesis */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>
              Hypothesis (optional)
            </label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="What do you expect to find?"
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{ background: '#F9FAFB', color: '#111827', border: '1px solid #E5E7EB' }}
            />
          </div>

          {/* Knowledge Type */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>
              Category
            </label>
            <select
              value={knowledgeType}
              onChange={(e) => setKnowledgeType(e.target.value as KnowledgeType)}
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: '#F9FAFB', color: '#111827', border: '1px solid #E5E7EB' }}
            >
              {KNOWLEDGE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sample Size */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>
              Required samples
            </label>
            <input
              type="number"
              value={sampleSize}
              onChange={(e) => setSampleSize(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: '#F9FAFB', color: '#111827', border: '1px solid #E5E7EB' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={resetAndClose}
            className="flex-1 min-h-[48px] rounded-xl text-sm font-medium"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || createExperiment.isPending}
            className="flex-1 min-h-[48px] rounded-xl text-sm font-medium text-white disabled:opacity-50"
            style={{ background: '#0F766E' }}
          >
            {createExperiment.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
