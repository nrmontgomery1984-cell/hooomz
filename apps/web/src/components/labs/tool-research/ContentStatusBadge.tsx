'use client';

import type { ContentPipelineStatus } from '@hooomz/shared-contracts';

const PIPELINE_STYLES: Record<ContentPipelineStatus, { bg: string; color: string; label: string }> = {
  planned: { bg: '#E5E7EB', color: '#6B7280', label: 'Planned' },
  filmed: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Filmed' },
  edited: { bg: '#FEF3C7', color: '#B45309', label: 'Edited' },
  published: { bg: '#D1FAE5', color: '#059669', label: 'Published' },
};

const TEAL = '#2A9D8F';

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
          border: '1px dashed #D1D5DB',
          borderRadius: 10,
          background: 'transparent',
          color: '#9CA3AF',
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
