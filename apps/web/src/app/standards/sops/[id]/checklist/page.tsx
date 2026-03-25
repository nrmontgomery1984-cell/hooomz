'use client';

/**
 * SOP Checklist Page — /standards/sops/:id/checklist
 *
 * Interactive digital checklist form for completing an SOP.
 */

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, Check, AlertTriangle, Camera } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useStandardSOP } from '@/lib/hooks/useStandardSOPs';
import { useServicesContext } from '@/lib/services/ServicesContext';
import type {
  ChecklistSubmission,
  ChecklistSection,
  ChecklistField,
  ChecklistValue,
} from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.standards;

function generateId() {
  return crypto.randomUUID();
}

// ============================================================================
// Field Renderers
// ============================================================================

function CheckboxFieldView({
  field,
  value,
  onChange,
}: {
  field: ChecklistField;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const isLinked = !!field.linkedStandard;

  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: value
          ? 'var(--green-bg)'
          : isLinked
            ? 'var(--red-bg)'
            : 'var(--surface)',
        border: `1px solid ${value ? 'var(--green)' : isLinked ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: `2px solid ${value ? 'var(--green)' : 'var(--border)'}`,
        background: value ? 'var(--green)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {value && <Check size={14} style={{ color: '#fff' }} />}
      </div>
      <span style={{ fontSize: 13, color: 'var(--charcoal)', flex: 1, lineHeight: 1.4 }}>
        {field.label}
      </span>
      {isLinked && (
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--red)',
          padding: '1px 6px',
          borderRadius: 4,
          background: 'var(--red-bg)',
          whiteSpace: 'nowrap',
        }}>
          STOP
        </span>
      )}
      {field.required && !value && (
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Required</span>
      )}
    </button>
  );
}

function TextFieldView({
  field,
  value,
  onChange,
}: {
  field: ChecklistField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--mid)' }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter notes..."
        rows={3}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: 13,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--charcoal)',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

function NumberFieldView({
  field,
  value,
  onChange,
}: {
  field: ChecklistField;
  value: string;
  onChange: (v: string) => void;
}) {
  const num = parseFloat(value);
  const min = field.validation?.min;
  const max = field.validation?.max;
  const outOfRange = !isNaN(num) && ((min !== undefined && num < min) || (max !== undefined && num > max));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--mid)' }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 120,
            padding: '6px 10px',
            fontSize: 13,
            borderRadius: 8,
            border: `1px solid ${outOfRange ? 'var(--red)' : 'var(--border)'}`,
            background: outOfRange ? 'var(--red-bg)' : 'var(--surface)',
            color: 'var(--charcoal)',
            outline: 'none',
          }}
        />
        {field.unit && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{field.unit}</span>}
        {outOfRange && (
          <span style={{ fontSize: 11, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} /> Out of range
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Checklist Section
// ============================================================================

function ChecklistSectionView({
  section,
  values,
  onValueChange,
}: {
  section: ChecklistSection;
  values: Record<string, ChecklistValue>;
  onValueChange: (fieldId: string, value: string | number | boolean) => void;
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: 10,
      }}>
        {section.title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {section.fields.map((field) => {
          const val = values[field.id];
          if (field.type === 'checkbox') {
            return (
              <CheckboxFieldView
                key={field.id}
                field={field}
                value={!!val?.value}
                onChange={(v) => onValueChange(field.id, v)}
              />
            );
          }
          if (field.type === 'text') {
            return (
              <TextFieldView
                key={field.id}
                field={field}
                value={(val?.value as string) ?? ''}
                onChange={(v) => onValueChange(field.id, v)}
              />
            );
          }
          if (field.type === 'number') {
            return (
              <NumberFieldView
                key={field.id}
                field={field}
                value={val?.value !== undefined ? String(val.value) : ''}
                onChange={(v) => onValueChange(field.id, v)}
              />
            );
          }
          if (field.type === 'photo') {
            return (
              <div key={field.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                border: '1px dashed var(--border)',
                borderRadius: 8,
                color: 'var(--muted)',
                fontSize: 13,
              }}>
                <Camera size={16} />
                <span>{field.label}</span>
                <span style={{ fontSize: 11, marginLeft: 'auto' }}>Coming soon</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const sopId = params.id as string;
  const { data: sop, isLoading: sopLoading } = useStandardSOP(sopId);
  const { services } = useServicesContext();

  const [values, setValues] = useState<Record<string, ChecklistValue>>({});
  const [notes] = useState('');
  const [saving, setSaving] = useState(false);
  const [submissionId] = useState(() => generateId());

  const handleValueChange = useCallback((fieldId: string, value: string | number | boolean) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: {
        fieldId,
        value,
        passedValidation: true, // TODO: validate against field rules
      },
    }));
  }, []);

  const buildSubmission = useCallback((): ChecklistSubmission | null => {
    if (!sop) return null;
    return {
      id: submissionId,
      sopId: sop.id,
      sopCode: sop.code,
      projectId: '', // TODO: project selector
      technicianId: 'nathan',
      technicianName: 'Nathan Montgomery',
      submittedAt: new Date().toISOString(),
      values,
      photos: [],
      notes,
      status: 'draft',
      allPassed: true,
    };
  }, [sop, submissionId, values, notes]);

  const handleSaveDraft = useCallback(async () => {
    const submission = buildSubmission();
    if (!submission || !services) return;
    setSaving(true);
    try {
      await services.checklists.saveDraft(submission);
      router.push(`/standards/sops/${sopId}`);
    } finally {
      setSaving(false);
    }
  }, [buildSubmission, services, router, sopId]);

  const handleSubmit = useCallback(async () => {
    const submission = buildSubmission();
    if (!submission || !services || !sop) return;

    // Check required fields
    const allSections = sop.checklist.sections;
    const requiredFields = allSections.flatMap((s) => s.fields.filter((f) => f.required));
    const missing = requiredFields.filter((f) => {
      const val = values[f.id];
      if (f.type === 'checkbox') return !val?.value;
      if (f.type === 'text' || f.type === 'number') return !val?.value && val?.value !== 0;
      return false;
    });

    if (missing.length > 0) {
      alert(`${missing.length} required field(s) not completed.`);
      return;
    }

    setSaving(true);
    try {
      await services.checklists.submit(submission);
      router.push(`/standards/sops/${sopId}`);
    } finally {
      setSaving(false);
    }
  }, [buildSubmission, services, sop, values, router, sopId]);

  if (sopLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--mid)' }}>SOP not found</p>
      </div>
    );
  }

  // Count completed
  const allCheckboxes = sop.checklist.sections.flatMap((s) =>
    s.fields.filter((f) => f.type === 'checkbox')
  );
  const completedCount = allCheckboxes.filter((f) => !!values[f.id]?.value).length;
  const totalCheckboxes = allCheckboxes.length;

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <button
              onClick={() => router.push(`/standards/sops/${sopId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginBottom: 8,
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to SOP</span>
            </button>

            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)' }}>
              {sop.code} Checklist
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              {sop.title}
            </p>

            {/* Progress bar */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: 'var(--surface-2)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: totalCheckboxes > 0 ? `${(completedCount / totalCheckboxes) * 100}%` : '0%',
                  height: '100%',
                  background: COLOR,
                  borderRadius: 3,
                  transition: 'width 200ms ease',
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mid)' }}>
                {completedCount}/{totalCheckboxes}
              </span>
            </div>
          </div>

          {/* Auto-populated info */}
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 pb-3">
            <div style={{
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--muted)',
              background: 'var(--surface-2)',
              borderRadius: 8,
              padding: '8px 12px',
            }}>
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Technician: Nathan Montgomery</span>
            </div>
          </div>
        </div>

        {/* Checklist Sections */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sop.checklist.sections.map((section) => (
            <ChecklistSectionView
              key={section.id}
              section={section}
              values={values}
              onValueChange={handleValueChange}
            />
          ))}
        </div>

        {/* Action Bar */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          zIndex: 50,
        }}>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              background: 'var(--surface-2)',
              color: 'var(--mid)',
              border: '1px solid var(--border)',
              cursor: saving ? 'not-allowed' : 'pointer',
              minHeight: 44,
              opacity: saving ? 0.6 : 1,
            }}
          >
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              background: COLOR,
              color: '#fff',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              minHeight: 44,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Check size={16} />
            Complete Checklist
          </button>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
