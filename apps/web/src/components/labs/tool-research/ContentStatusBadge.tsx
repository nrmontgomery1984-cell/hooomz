'use client';

import type { ContentPipelineStatus } from '@hooomz/shared-contracts';

const PIPELINE_STYLES: Record<ContentPipelineStatus, { bg: string; color: string; label: string }> = {
  planned: { bg: 'var(--border)', color: 'var(--muted)', label: 'Planned' },
  filmed: { bg: '#DBEAFE', color: 'var(--blue)', label: 'Filmed' },
  edited: { bg: '#FEF3C7', color: '#B45309', label: 'Edited' },
  published: { bg: '#D1FAE5', color: '#059669', label: 'Published' },
};

const TEAL = 'var(--accent)';

interface ContentStatusBadgeProps {
  status?: ContentPipelineStatus;
  onAdvance: () => void;
}

export function ContentStatusBadge({ status, onAdvance }: ContentStatusBadgeProps) {
  if (!status) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onAdvance(); }}
        style={{
          padding: '2px 6px',
          border: '1px dashed var(--border)',
          borderRadius: 10,
          background: 'transparent',
          color: 'var(--muted)',
          fontSize: 10,
          cursor: 'pointer',
          minHeight: 24,
        }}
        title="Set content status"
      >
        +
      </button>
    );
  }

  const style = PIPELINE_STYLES[status];
  const isPublished = status === 'published';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!isPublished) onAdvance();
      }}
      disabled={isPublished}
      style={{
        padding: '2px 8px',
        border: 'none',
        borderRadius: 10,
        background: style.bg,
        color: style.color,
        fontSize: 10,
        fontWeight: 600,
        cursor: isPublished ? 'default' : 'pointer',
        minHeight: 24,
        outline: isPublished ? 'none' : `1px solid transparent`,
        transition: 'outline 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isPublished) (e.currentTarget as HTMLElement).style.outline = `1px solid ${TEAL}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.outline = '1px solid transparent';
      }}
      title={isPublished ? 'Published' : `Click to advance to next stage`}
    >
      {style.label}
    </button>
  );
}
