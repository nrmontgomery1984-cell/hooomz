'use client';

/**
 * SOP Detail/Edit Page — view SOP metadata, manage checklist items
 */

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useSop,
  useSopByCode,
  useSopChecklistItems,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useRemoveChecklistItem,
  useArchiveSop,
} from '@/lib/hooks/useLabsData';
import type {
  SopChecklistItemTemplate,
  KnowledgeType,
  ChecklistType,
  ChecklistCategory,
  TriggerTiming,
} from '@hooomz/shared-contracts';

const KNOWLEDGE_TYPES: { value: KnowledgeType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'technique', label: 'Technique' },
  { value: 'tool_method', label: 'Tool/Method' },
  { value: 'combination', label: 'Combination' },
  { value: 'timing', label: 'Timing' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'material', label: 'Material' },
  { value: 'environmental_rule', label: 'Environmental' },
  { value: 'specification', label: 'Specification' },
  { value: 'action', label: 'Action' },
];

const CHECKLIST_TYPES: { value: ChecklistType; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'daily', label: 'Daily' },
  { value: 'qc', label: 'QC' },
];

const CATEGORIES: { value: ChecklistCategory; label: string }[] = [
  { value: 'procedure', label: 'Procedure' },
  { value: 'quality', label: 'Quality' },
  { value: 'safety', label: 'Safety' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'documentation', label: 'Documentation' },
];

const MODE_LABELS: Record<string, string> = {
  minimal: 'Minimal — confirm/deviate only',
  standard: 'Standard — + optional notes & photo',
  detailed: 'Detailed — + required notes, photo & condition',
};

export default function SOPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paramId = params.id as string;

  // The param could be an IndexedDB UUID or a sopCode like "HI-SOP-FL-004"
  // Try both lookups; use whichever succeeds
  const { data: sopById, isLoading: byIdLoading } = useSop(paramId);
  const isSopCode = paramId.startsWith('HI-SOP-');
  const { data: sopByCode, isLoading: byCodeLoading } = useSopByCode(isSopCode ? paramId : '');
  const sop = sopById ?? sopByCode ?? null;
  const sopId = sop?.id || paramId;
  // Loading if the relevant query is still loading
  const sopLoading = isSopCode ? (byIdLoading || byCodeLoading) : byIdLoading;

  const { data: checklistItems = [], isLoading: itemsLoading } = useSopChecklistItems(sopId);
  const addItem = useAddChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const removeItem = useRemoveChecklistItem();
  const archiveSop = useArchiveSop();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  if (sopLoading || itemsLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading SOP...</p>
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500">SOP not found: {paramId}</p>
          <p className="text-xs text-gray-400 mt-1">
            {isSopCode ? 'Looked up by sopCode — have you seeded data at /labs/seed?' : 'Looked up by ID'}
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/labs/sops" className="text-sm text-teal-700 hover:underline">
              Back to SOPs
            </Link>
            <Link href="/labs/seed" className="text-sm text-teal-700 hover:underline">
              Seed Data
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleArchive = async () => {
    await archiveSop.mutateAsync(sopId);
    router.push('/labs/sops');
  };

  const observationItems = checklistItems.filter((i) => i.generatesObservation);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/sops" className="text-sm text-teal-700 hover:underline">SOPs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>
                <span className="font-mono text-gray-500 mr-2">{sop.sopCode}</span>
                {sop.title}
              </h1>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Version {sop.version} — {sop.status}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* SOP Metadata Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">SOP Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Trade Family</span>
              <span className="font-medium text-gray-900">{sop.tradeFamily}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Observation Mode</span>
              <span className="font-medium text-gray-900">{MODE_LABELS[sop.defaultObservationMode] || sop.defaultObservationMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Certification</span>
              <span className="font-medium text-gray-900">{sop.certificationLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Effective Date</span>
              <span className="font-medium text-gray-900">{sop.effectiveDate}</span>
            </div>
            {sop.description && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-500 block mb-1">Description</span>
                <p className="text-gray-700">{sop.description}</p>
              </div>
            )}
          </div>

          {/* Archive button */}
          {sop.status !== 'archived' && (
            <button
              onClick={handleArchive}
              disabled={archiveSop.isPending}
              className="mt-4 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              style={{ minHeight: '44px' }}
            >
              {archiveSop.isPending ? 'Archiving...' : 'Archive SOP'}
            </button>
          )}
        </div>

        {/* Observation Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Observation Config</h2>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Steps</span>
              <span className="ml-2 font-semibold text-gray-900">{checklistItems.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Observation Steps</span>
              <span className="ml-2 font-semibold text-teal-700">{observationItems.length}</span>
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Checklist Items</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 text-xs font-medium text-white rounded-lg"
              style={{ background: '#0F766E', minHeight: '36px' }}
            >
              + Add Step
            </button>
          </div>

          {checklistItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No checklist items yet. Add your first step.</p>
          ) : (
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingItemId === item.id}
                  onEdit={() => setEditingItemId(item.id)}
                  onCancel={() => setEditingItemId(null)}
                  onSave={async (changes) => {
                    await updateItem.mutateAsync({ itemId: item.id, changes, sopId });
                    setEditingItemId(null);
                  }}
                  onRemove={async () => {
                    await removeItem.mutateAsync({ itemId: item.id, sopId });
                  }}
                  isSaving={updateItem.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <AddChecklistItemForm
            sopId={sopId}
            onAdd={async (data) => {
              await addItem.mutateAsync({ sopId, item: data });
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
            isPending={addItem.isPending}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Checklist Item Row
// ============================================================================

function ChecklistItemRow({
  item,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onRemove,
  isSaving,
}: {
  item: SopChecklistItemTemplate;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (changes: Partial<Omit<SopChecklistItemTemplate, 'id' | 'metadata' | 'sopId'>>) => Promise<void>;
  onRemove: () => Promise<void>;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(item.title);
  const [generatesObs, setGeneratesObs] = useState(item.generatesObservation);
  const [triggerTiming, setTriggerTiming] = useState<TriggerTiming>(item.triggerTiming);
  const [requiresPhoto, setRequiresPhoto] = useState(item.requiresPhoto);
  const [knowledgeType, setKnowledgeType] = useState(item.observationKnowledgeType);

  if (!isEditing) {
    return (
      <div
        className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onEdit}
        role="button"
        tabIndex={0}
        style={{ minHeight: '44px' }}
      >
        <span className="text-xs font-mono text-gray-400 mt-0.5 w-5 text-right flex-shrink-0">
          {item.stepNumber}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">{item.title}</span>
            {item.isCritical && (
              <span className="text-xs text-red-600 font-medium">CRITICAL</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-400">{item.checklistType} / {item.category}</span>
            {item.generatesObservation && (
              <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-teal-50 text-teal-700">
                {item.triggerTiming === 'on_check' ? 'On-Check' : 'Batch'}
              </span>
            )}
            {item.requiresPhoto && (
              <span className="text-xs text-gray-400">Photo req.</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border-2 border-teal-200 bg-teal-50/30 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-400 w-5 text-right flex-shrink-0">
          {item.stepNumber}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      {/* Generates Observation toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '44px' }}>
          <input
            type="checkbox"
            checked={generatesObs}
            onChange={(e) => setGeneratesObs(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded"
          />
          <span className="text-xs font-medium text-gray-700">Generates Observation</span>
        </label>
      </div>

      {generatesObs && (
        <div className="space-y-2 pl-6">
          {/* Trigger Timing */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTriggerTiming('on_check')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                triggerTiming === 'on_check'
                  ? 'border-teal-600 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600'
              }`}
              style={{ minHeight: '36px' }}
            >
              On-Check
            </button>
            <button
              type="button"
              onClick={() => setTriggerTiming('batch')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                triggerTiming === 'batch'
                  ? 'border-teal-600 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600'
              }`}
              style={{ minHeight: '36px' }}
            >
              Batch
            </button>
          </div>

          {/* Knowledge Type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Knowledge Type</label>
            <select
              value={knowledgeType || ''}
              onChange={(e) => setKnowledgeType(e.target.value as KnowledgeType || null)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
            >
              <option value="">None</option>
              {KNOWLEDGE_TYPES.map((kt) => (
                <option key={kt.value} value={kt.value}>{kt.label}</option>
              ))}
            </select>
          </div>

          {/* Requires Photo */}
          <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '36px' }}>
            <input
              type="checkbox"
              checked={requiresPhoto}
              onChange={(e) => setRequiresPhoto(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <span className="text-xs text-gray-700">Requires Photo</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => onSave({
            title,
            generatesObservation: generatesObs,
            triggerTiming,
            requiresPhoto,
            observationKnowledgeType: generatesObs ? knowledgeType : null,
          })}
          disabled={isSaving || !title.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
          style={{ background: '#0F766E', minHeight: '36px' }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
          style={{ minHeight: '36px' }}
        >
          Cancel
        </button>
        <button
          onClick={onRemove}
          className="px-3 py-1.5 text-xs font-medium text-red-600 rounded-lg border border-red-200 hover:bg-red-50 ml-auto"
          style={{ minHeight: '36px' }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Add Checklist Item Form
// ============================================================================

function AddChecklistItemForm({
  onAdd,
  onCancel,
  isPending,
}: {
  sopId: string;
  onAdd: (data: Omit<SopChecklistItemTemplate, 'id' | 'metadata' | 'sopId' | 'stepNumber'>) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [checklistType, setChecklistType] = useState<ChecklistType>('activity');
  const [category, setCategory] = useState<ChecklistCategory>('procedure');
  const [isCritical, setIsCritical] = useState(false);
  const [generatesObs, setGeneratesObs] = useState(false);
  const [triggerTiming, setTriggerTiming] = useState<TriggerTiming>('batch');
  const [knowledgeType, setKnowledgeType] = useState<KnowledgeType | null>(null);
  const [requiresPhoto, setRequiresPhoto] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAdd({
      title: title.trim(),
      description: null,
      checklistType,
      category,
      isCritical,
      generatesObservation: generatesObs,
      observationKnowledgeType: generatesObs ? knowledgeType : null,
      requiresPhoto,
      hasTimingFollowup: null,
      triggerTiming,
      defaultProductId: null,
      defaultTechniqueId: null,
      defaultToolId: null,
    });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-teal-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Checklist Step</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Step Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Check substrate moisture level"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            style={{ minHeight: '44px' }}
            autoFocus
          />
        </div>

        {/* Type + Category */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select
              value={checklistType}
              onChange={(e) => setChecklistType(e.target.value as ChecklistType)}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg"
              style={{ minHeight: '36px' }}
            >
              {CHECKLIST_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg"
              style={{ minHeight: '36px' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '44px' }}>
            <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
            <span className="text-xs text-gray-700">Critical</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '44px' }}>
            <input type="checkbox" checked={generatesObs} onChange={(e) => setGeneratesObs(e.target.checked)} className="w-4 h-4 text-teal-600 rounded" />
            <span className="text-xs text-gray-700">Generates Observation</span>
          </label>
        </div>

        {/* Observation config (shown if generates observation) */}
        {generatesObs && (
          <div className="space-y-2 pl-4 border-l-2 border-teal-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTriggerTiming('on_check')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  triggerTiming === 'on_check' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'
                }`}
                style={{ minHeight: '36px' }}
              >
                On-Check
              </button>
              <button
                type="button"
                onClick={() => setTriggerTiming('batch')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  triggerTiming === 'batch' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'
                }`}
                style={{ minHeight: '36px' }}
              >
                Batch
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Knowledge Type</label>
              <select
                value={knowledgeType || ''}
                onChange={(e) => setKnowledgeType(e.target.value as KnowledgeType || null)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
              >
                <option value="">None</option>
                {KNOWLEDGE_TYPES.map((kt) => (
                  <option key={kt.value} value={kt.value}>{kt.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '36px' }}>
              <input type="checkbox" checked={requiresPhoto} onChange={(e) => setRequiresPhoto(e.target.checked)} className="w-4 h-4 text-teal-600 rounded" />
              <span className="text-xs text-gray-700">Requires Photo</span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{ background: '#0F766E', minHeight: '44px' }}
          >
            {isPending ? 'Adding...' : 'Add Step'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
            style={{ minHeight: '44px' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
