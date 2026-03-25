'use client';

/**
 * GeneralTerms — Editable list of legal/general terms.
 * Matches quote-detail-v2.html artifact.
 */

import { useState, useCallback } from 'react';

const DEFAULT_TERMS = [
  'All materials and workmanship guaranteed for 2 years from completion.',
  'Payment schedule as outlined above. Late payments subject to 1.5% monthly interest.',
  'Changes to scope require written change order with adjusted pricing.',
  'Hooomz Interiors carries $2M general liability insurance.',
];

interface GeneralTermsProps {
  terms?: string[];
  onUpdate?: (terms: string[]) => void;
  isEditable?: boolean;
}

export function GeneralTerms({
  terms,
  onUpdate,
  isEditable = false,
}: GeneralTermsProps) {
  const displayTerms = terms && terms.length > 0 ? terms : DEFAULT_TERMS;
  const [isEditing, setIsEditing] = useState(false);
  const [editTerms, setEditTerms] = useState<string[]>(displayTerms);

  const startEdit = useCallback(() => {
    setEditTerms([...displayTerms]);
    setIsEditing(true);
  }, [displayTerms]);

  const saveTerms = useCallback(() => {
    const cleaned = editTerms.filter((t) => t.trim().length > 0);
    onUpdate?.(cleaned);
    setIsEditing(false);
  }, [editTerms, onUpdate]);

  const updateTerm = useCallback((idx: number, value: string) => {
    setEditTerms((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);

  const removeTerm = useCallback((idx: number) => {
    setEditTerms((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addTerm = useCallback(() => {
    setEditTerms((prev) => [...prev, '']);
  }, []);

  return (
    <div
      className="px-4 py-4 mb-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div
          className="text-[9px] font-medium uppercase tracking-[0.12em]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          General Terms
        </div>
        {isEditable && !isEditing && (
          <button
            onClick={startEdit}
            className="text-[10px] font-medium tracking-[0.04em] px-3 py-1"
            style={{
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--mid)',
            }}
          >
            Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        <ul className="flex flex-col gap-1.5" style={{ listStyle: 'none' }}>
          {displayTerms.map((term, i) => (
            <li
              key={i}
              className="text-[11px] leading-relaxed pl-3 relative"
              style={{ color: 'var(--mid)' }}
            >
              <span
                className="absolute left-0 top-[7px] w-1 h-1 rounded-full"
                style={{ background: 'var(--border)' }}
              />
              {term}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-1.5">
          {editTerms.map((term, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <textarea
                className="flex-1 text-[11px] leading-relaxed p-1.5 resize-none"
                style={{
                  fontFamily: 'var(--font-body)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--mid)',
                  minHeight: '32px',
                }}
                value={term}
                onChange={(e) => updateTerm(i, e.target.value)}
                rows={1}
              />
              <button
                onClick={() => removeTerm(i)}
                className="w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-1"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={addTerm}
              className="text-[10px] font-medium tracking-[0.04em] px-3 py-1.5"
              style={{
                fontFamily: 'var(--font-mono)',
                border: '1px dashed var(--border)',
                background: 'none',
                color: 'var(--blue)',
              }}
            >
              + Add Term
            </button>
            <button
              onClick={saveTerms}
              className="text-[10px] font-medium tracking-[0.04em] px-3.5 py-1.5 text-white ml-auto"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'var(--green)',
                border: '1px solid var(--green)',
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
