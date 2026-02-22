'use client';

/**
 * CreateChangeOrderSheet — Bottom sheet form for creating a new Change Order (draft status)
 */

import { useState, useCallback } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ProjectSelector } from '@/components/activity/ProjectSelector';
import { useCreateChangeOrder } from '@/lib/hooks/useIntegrationData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useToast } from '@/components/ui/Toast';
import type { ChangeOrder, ChangeOrderInitiatorType } from '@hooomz/shared-contracts';

interface CreateChangeOrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selected project (skip selector when opening from project page) */
  projectId?: string;
  onCreated?: (co: ChangeOrder) => void;
}

const INITIATOR_OPTIONS: { value: ChangeOrderInitiatorType; label: string }[] = [
  { value: 'client_request', label: 'Client Request' },
  { value: 'contractor_recommendation', label: 'Contractor Recommendation' },
  { value: 'site_condition', label: 'Site Condition' },
  { value: 'sub_trade', label: 'Sub-Trade' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  borderRadius: 8,
  border: '1px solid var(--border, #E5E7EB)',
  background: 'var(--surface-1, #FFFFFF)',
  color: 'var(--text, #111827)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-2, #6B7280)',
  marginBottom: 4,
  fontFamily: 'var(--font-cond)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export function CreateChangeOrderSheet({ isOpen, onClose, projectId, onCreated }: CreateChangeOrderSheetProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId ?? null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initiatorType, setInitiatorType] = useState<ChangeOrderInitiatorType>('client_request');
  const [costImpact, setCostImpact] = useState('');
  const [scheduleImpactDays, setScheduleImpactDays] = useState('0');

  const createCO = useCreateChangeOrder();
  const { crewMemberId, crewMemberName } = useActiveCrew();
  const { showToast } = useToast();

  const resetAndClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setInitiatorType('client_request');
    setCostImpact('');
    setScheduleImpactDays('0');
    if (!projectId) setSelectedProjectId(null);
    onClose();
  }, [onClose, projectId]);

  const canSubmit = !!title.trim() && !!selectedProjectId && !createCO.isPending;

  const handleCreate = async () => {
    if (!canSubmit || !selectedProjectId) return;

    try {
      const result = await createCO.mutateAsync({
        projectId: selectedProjectId,
        title: title.trim(),
        description: description.trim(),
        initiatorType,
        initiatedBy: crewMemberName || 'Nathan',
        costImpact: parseFloat(costImpact) || 0,
        scheduleImpactDays: parseInt(scheduleImpactDays) || 0,
        createdBy: crewMemberId || 'nathan',
      });

      showToast({ message: `${result.coNumber} created`, variant: 'success', duration: 3000 });
      onCreated?.(result);
      resetAndClose();
    } catch {
      showToast({ message: 'Failed to create change order', variant: 'error', duration: 4000 });
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={resetAndClose} title="New Change Order">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Project selector (hidden if pre-selected) */}
        {!projectId && (
          <div>
            <label style={labelStyle}>Project</label>
            <ProjectSelector value={selectedProjectId} onChange={setSelectedProjectId} />
          </div>
        )}

        {/* Title */}
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Additional tile work in bathroom"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about the change..."
            rows={3}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
        </div>

        {/* Initiator Type */}
        <div>
          <label style={labelStyle}>Reason</label>
          <select
            value={initiatorType}
            onChange={(e) => setInitiatorType(e.target.value as ChangeOrderInitiatorType)}
            style={inputStyle}
          >
            {INITIATOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Cost + Schedule row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Cost Impact (CAD)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-3, #9CA3AF)' }}>$</span>
              <input
                type="number"
                value={costImpact}
                onChange={(e) => setCostImpact(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                style={{ ...inputStyle, paddingLeft: 24 }}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Schedule Impact (days)</label>
            <input
              type="number"
              value={scheduleImpactDays}
              onChange={(e) => setScheduleImpactDays(e.target.value)}
              placeholder="0"
              min="0"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={resetAndClose}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 8,
              border: '1px solid var(--border, #E5E7EB)',
              background: 'transparent',
              color: 'var(--text-2, #6B7280)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 8,
              border: 'none',
              background: canSubmit ? '#0F766E' : 'var(--border, #E5E7EB)',
              color: canSubmit ? '#FFFFFF' : 'var(--text-3, #9CA3AF)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {createCO.isPending ? 'Creating...' : 'Create Draft'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
