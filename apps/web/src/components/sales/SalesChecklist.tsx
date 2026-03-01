'use client';

/**
 * SalesChecklist — Renders checklist templates for a consultation or quote.
 *
 * Shows grouped checklist items with progress indicators.
 * Toggles persist to IndexedDB via useSalesChecklist hook.
 */

import { useState } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { useSalesChecklist } from '@/lib/hooks/useSalesChecklist';
import type { ChecklistCompletions } from '@/lib/config/salesChecklists';

interface SalesChecklistProps {
  entityType: 'consultation' | 'quote';
  entityId: string;
  completions: ChecklistCompletions | undefined;
  /** Compact mode hides the item list, showing only progress. Default false. */
  compact?: boolean;
}

export function SalesChecklist({
  entityType,
  entityId,
  completions,
  compact = false,
}: SalesChecklistProps) {
  const { templates, toggle, getProgress, isPending } = useSalesChecklist(
    entityType,
    entityId,
    completions,
  );

  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(
    compact ? null : templates[0]?.id ?? null,
  );

  if (templates.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {templates.map((template) => {
        const { checked, total } = getProgress(template.id);
        const allDone = checked === total;
        const isExpanded = expandedTemplateId === template.id;

        return (
          <div key={template.id}>
            {/* Template header — always visible */}
            <button
              onClick={() =>
                setExpandedTemplateId(isExpanded ? null : template.id)
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                padding: '6px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  color: 'var(--text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-cond)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  flex: 1,
                }}
              >
                {template.label}
              </span>
              {/* Progress pill */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  color: allDone ? 'var(--green, #10b981)' : 'var(--text-3)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: allDone
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'var(--bg, #F9FAFB)',
                  flexShrink: 0,
                }}
              >
                {checked}/{total}
              </span>
            </button>

            {/* Expanded items */}
            {isExpanded && (
              <div style={{ paddingLeft: 18, paddingBottom: 4 }}>
                {template.items.map((item) => {
                  const isChecked = completions?.[item.key]?.checked ?? false;
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggle(item.key)}
                      disabled={isPending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        minHeight: 32,
                        padding: '4px 0',
                        background: 'none',
                        border: 'none',
                        cursor: isPending ? 'default' : 'pointer',
                        opacity: isPending ? 0.6 : 1,
                        textAlign: 'left',
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare
                          size={14}
                          style={{ color: 'var(--teal, #0F766E)', flexShrink: 0 }}
                          strokeWidth={2}
                        />
                      ) : (
                        <Square
                          size={14}
                          style={{ color: 'var(--text-3, #9CA3AF)', flexShrink: 0 }}
                          strokeWidth={1.5}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          color: isChecked
                            ? 'var(--text-3, #9CA3AF)'
                            : 'var(--text, #111827)',
                          textDecoration: isChecked ? 'line-through' : 'none',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
