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
      <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading SOP...</p>
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>SOP not found: {paramId}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            {isSopCode ? 'Looked up by sopCode — have you seeded data at /labs/seed?' : 'Looked up by ID'}
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/labs/sops" className="text-sm hover:underline" style={{ color: 'var(--blue)' }}>
              Back to SOPs
            </Link>
            <Link href="/labs/seed" className="text-sm hover:underline" style={{ color: 'var(--blue)' }}>
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
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: 'var(--blue)' }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
            <Link href="/labs/sops" className="text-sm hover:underline" style={{ color: 'var(--blue)' }}>SOPs</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                <span className="font-mono mr-2" style={{ color: 'var(--text-3)' }}>{sop.sopCode}</span>
                {sop.title}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Version {sop.version} — {sop.status}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* SOP Metadata Card */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>SOP Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Trade Family</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{sop.tradeFamily}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Observation Mode</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{MODE_LABELS[sop.defaultObservationMode] || sop.defaultObservationMode}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Certification</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{sop.certificationLevel}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Effective Date</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{sop.effectiveDate}</span>
            </div>
            {sop.description && (
              <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="block mb-1" style={{ color: 'var(--text-2)' }}>Description</span>
                <p style={{ color: 'var(--text-2)' }}>{sop.description}</p>
              </div>
            )}
          </div>

          {/* Archive button */}
          {sop.status !== 'archived' && (
            <button
              onClick={handleArchive}
              disabled={archiveSop.isPending}
              className="mt-4 px-3 py-2 text-xs font-medium rounded-lg transition-colors hover-red"
              style={{ color: 'var(--red)', border: '1px solid var(--red-dim)', background: 'transparent', minHeight: '44px' }}
            >
              {archiveSop.isPending ? 'Archiving...' : 'Archive SOP'}
            </button>
          )}
        </div>

        {/* SCRIPT View Link */}
        <Link
          href={`/labs/sops/${sopId}/script`}
          className="block rounded-xl p-4 hover-surface transition-shadow"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', textDecoration: 'none' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>SCRIPT Phase View</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Organize checklist steps into Shield → Clear → Ready → Install → Punch → Turnover</p>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>→</span>
          </div>
        </Link>

        {/* Observation Summary */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Observation Config</h2>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span style={{ color: 'var(--text-2)' }}>Total Steps</span>
              <span className="ml-2 font-semibold" style={{ color: 'var(--text)' }}>{checklistItems.length}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-2)' }}>Observation Steps</span>
              <span className="ml-2 font-semibold" style={{ color: 'var(--blue)' }}>{observationItems.length}</span>
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Checklist Items</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 text-xs font-medium text-white rounded-lg"
              style={{ background: 'var(--blue)', minHeight: '36px' }}
            >
              + Add Step
            </button>
          </div>

          {checklistItems.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>No checklist items yet. Add your first step.</p>
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
        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover-surface"
        onClick={onEdit}
        role="button"
        tabIndex={0}
        style={{ border: '1px solid var(--border)', minHeight: '44px' }}
      >
        <span
          className="mt-0.5 w-5 text-right flex-shrink-0"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}
        >
          {item.stepNumber}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text)' }}>{item.title}</span>
            {item.isCritical && (
              <span className="text-xs font-medium" style={{ color: 'var(--red)' }}>CRITICAL</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{item.checklistType} / {item.category}</span>
            {item.generatesObservation && (
              <span
                className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded"
                style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
              >
                {item.triggerTiming === 'on_check' ? 'On-Check' : 'Batch'}
              </span>
            )}
            {item.requiresPhoto && (
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Photo req.</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg space-y-3" style={{ border: '2px solid var(--blue)', background: 'var(--blue-dim)' }}>
      <div className="flex items-center gap-2">
        <span
          className="w-5 text-right flex-shrink-0"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}
        >
          {item.stepNumber}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm rounded-lg"
          style={{
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-1)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
      </div>

      {/* Generates Observation toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '44px' }}>
          <input
            type="checkbox"
            checked={generatesObs}
            onChange={(e) => setGeneratesObs(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Generates Observation</span>
        </label>
      </div>

      {generatesObs && (
        <div className="space-y-2 pl-6">
          {/* Trigger Timing */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTriggerTiming('on_check')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                border: triggerTiming === 'on_check' ? '1px solid var(--blue)' : '1px solid var(--border)',
                background: triggerTiming === 'on_check' ? 'var(--blue-dim)' : 'transparent',
                color: triggerTiming === 'on_check' ? 'var(--blue)' : 'var(--text-2)',
                minHeight: '36px',
              }}
            >
              On-Check
            </button>
            <button
              type="button"
              onClick={() => setTriggerTiming('batch')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                border: triggerTiming === 'batch' ? '1px solid var(--blue)' : '1px solid var(--border)',
                background: triggerTiming === 'batch' ? 'var(--blue-dim)' : 'transparent',
                color: triggerTiming === 'batch' ? 'var(--blue)' : 'var(--text-2)',
                minHeight: '36px',
              }}
            >
              Batch
            </button>
          </div>

          {/* Knowledge Type */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-2)' }}>Knowledge Type</label>
            <select
              value={knowledgeType || ''}
              onChange={(e) => setKnowledgeType(e.target.value as KnowledgeType || null)}
              className="w-full px-2 py-1.5 text-xs rounded-lg"
              style={{ border: '1px solid var(--border-strong)', background: 'var(--surface-1)', color: 'var(--text)' }}
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
              className="w-4 h-4 rounded"
            />
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>Requires Photo</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
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
          style={{ background: 'var(--blue)', minHeight: '36px' }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium rounded-lg hover-surface"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border)', background: 'transparent', minHeight: '36px' }}
        >
          Cancel
        </button>
        <button
          onClick={onRemove}
          className="px-3 py-1.5 text-xs font-medium rounded-lg ml-auto hover-red"
          style={{ color: 'var(--red)', border: '1px solid var(--red-dim)', background: 'transparent', minHeight: '36px' }}
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
      scriptPhase: null,
    });
  };

  const inputStyle = {
    border: '1px solid var(--border-strong)',
    background: 'var(--surface-1)',
    color: 'var(--text)',
  };

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '2px solid var(--blue)', boxShadow: 'var(--shadow-card)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Add Checklist Step</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-2)' }}>Step Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Check substrate moisture level"
            className="w-full px-3 py-2.5 text-sm rounded-lg"
            style={{ ...inputStyle, minHeight: '44px' }}
            autoFocus
          />
        </div>

        {/* Type + Category */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-2)' }}>Type</label>
            <select
              value={checklistType}
              onChange={(e) => setChecklistType(e.target.value as ChecklistType)}
              className="w-full px-2 py-2 text-xs rounded-lg"
              style={{ ...inputStyle, minHeight: '36px' }}
            >
              {CHECKLIST_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-2)' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
              className="w-full px-2 py-2 text-xs rounded-lg"
              style={{ ...inputStyle, minHeight: '36px' }}
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
            <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>Critical</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '44px' }}>
            <input type="checkbox" checked={generatesObs} onChange={(e) => setGeneratesObs(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>Generates Observation</span>
          </label>
        </div>

        {/* Observation config (shown if generates observation) */}
        {generatesObs && (
          <div className="space-y-2 pl-4" style={{ borderLeft: '2px solid var(--blue)' }}>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTriggerTiming('on_check')}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={{
                  border: triggerTiming === 'on_check' ? '1px solid var(--blue)' : '1px solid var(--border)',
                  background: triggerTiming === 'on_check' ? 'var(--blue-dim)' : 'transparent',
                  color: triggerTiming === 'on_check' ? 'var(--blue)' : 'var(--text-2)',
                  minHeight: '36px',
                }}
              >
                On-Check
              </button>
              <button
                type="button"
                onClick={() => setTriggerTiming('batch')}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={{
                  border: triggerTiming === 'batch' ? '1px solid var(--blue)' : '1px solid var(--border)',
                  background: triggerTiming === 'batch' ? 'var(--blue-dim)' : 'transparent',
                  color: triggerTiming === 'batch' ? 'var(--blue)' : 'var(--text-2)',
                  minHeight: '36px',
                }}
              >
                Batch
              </button>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-2)' }}>Knowledge Type</label>
              <select
                value={knowledgeType || ''}
                onChange={(e) => setKnowledgeType(e.target.value as KnowledgeType || null)}
                className="w-full px-2 py-1.5 text-xs rounded-lg"
                style={inputStyle}
              >
                <option value="">None</option>
                {KNOWLEDGE_TYPES.map((kt) => (
                  <option key={kt.value} value={kt.value}>{kt.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: '36px' }}>
              <input type="checkbox" checked={requiresPhoto} onChange={(e) => setRequiresPhoto(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>Requires Photo</span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{ background: 'var(--blue)', minHeight: '44px' }}
          >
            {isPending ? 'Adding...' : 'Add Step'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg hover-surface"
            style={{ color: 'var(--text-2)', border: '1px solid var(--border)', background: 'transparent', minHeight: '44px' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
