'use client';

import { useState, useRef, useEffect } from 'react';

const TEAL = '#2A9D8F';

interface InlineEditCellProps {
  value: string | number | null | undefined;
  onSave: (newValue: string) => void;
  type?: 'text' | 'number';
}

export function InlineEditCell({ value, onSave, type = 'text' }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(value != null ? String(value) : '');
    setEditing(true);
  };

  const save = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== String(value ?? '')) {
      onSave(trimmed);
    }
  };

  const cancel = () => {
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') cancel();
        }}
        style={{
          width: '100%',
          minHeight: 32,
          padding: '4px 8px',
          border: `1.5px solid ${TEAL}`,
          borderRadius: 4,
          fontSize: 13,
          outline: 'none',
          background: '#F0FDFA',
        }}
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && startEdit()}
      style={{
        cursor: 'pointer',
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 4px',
        borderRadius: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = '#F0FDFA';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <span style={{ flex: 1 }}>{value != null ? String(value) : '\u2014'}</span>
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke={TEAL}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.4, flexShrink: 0 }}
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </div>
  );
}
