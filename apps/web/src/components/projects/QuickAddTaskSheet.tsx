'use client';

/**
 * QuickAddTaskSheet — Bottom sheet for manually adding a task to a project.
 *
 * Fields: Title (required), Room, Stage, Trade.
 * Creates task with workSource='uncaptured'. Title/description formatted
 * for enrichTask() parsing: "Title — Room" + "StageName · TradeName".
 */

import { useState, useEffect } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCreateTask } from '@/lib/hooks/useCreateTask';
import { useToast } from '@/components/ui/Toast';
import { STAGE_CODES, TRADE_CODES, ROOM_LOCATIONS } from '@/lib/types/intake.types';

const STAGE_OPTIONS = Object.entries(STAGE_CODES).map(([code, meta]) => ({
  code,
  name: meta.name,
  order: meta.order,
})).sort((a, b) => a.order - b.order);

const TRADE_OPTIONS = Object.entries(TRADE_CODES).map(([code, meta]) => ({
  code,
  name: meta.name,
  order: meta.order,
})).sort((a, b) => a.order - b.order);

const ROOM_OPTIONS = Object.entries(ROOM_LOCATIONS).map(([, meta]) => meta.name);

interface QuickAddTaskSheetProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddTaskSheet({ projectId, isOpen, onClose }: QuickAddTaskSheetProps) {
  const createTask = useCreateTask();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('General');
  const [stageName, setStageName] = useState('Finish');
  const [tradeName, setTradeName] = useState('Flooring');
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setRoom('General');
      setStageName('Finish');
      setTradeName('Flooring');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Task title is required.');
      return;
    }
    try {
      await createTask.mutateAsync({
        projectId,
        title: trimmed,
        room,
        stageName,
        tradeName,
      });
      showToast({ message: `Task added: ${trimmed}`, variant: 'success', duration: 2000 });
      onClose();
    } catch {
      setError('Failed to save — try again.');
    }
  };

  // Preview of what enrichTask will parse
  const preview = title.trim()
    ? `${stageName} · ${tradeName} → ${title.trim()}${room !== 'General' ? ` — ${room}` : ''}`
    : '';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add Task">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Title */}
        <label>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>
            Task Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="e.g. Install casing at bedroom door"
            autoFocus
            style={{
              width: '100%', minHeight: 44, padding: '0 12px',
              fontFamily: 'var(--font)', fontSize: 13, color: '#111827',
              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
              outline: 'none',
            }}
          />
          {error && (
            <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{error}</span>
          )}
        </label>

        {/* Room */}
        <label>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>
            Room
          </span>
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            style={{
              width: '100%', minHeight: 44, padding: '0 12px',
              fontFamily: 'var(--font)', fontSize: 13, color: '#111827',
              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
              outline: 'none', appearance: 'auto',
            }}
          >
            {ROOM_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        {/* Stage + Trade row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>
              Stage
            </span>
            <select
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              style={{
                width: '100%', minHeight: 44, padding: '0 12px',
                fontFamily: 'var(--font)', fontSize: 13, color: '#111827',
                background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
                outline: 'none', appearance: 'auto',
              }}
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.code} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>
              Trade
            </span>
            <select
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              style={{
                width: '100%', minHeight: 44, padding: '0 12px',
                fontFamily: 'var(--font)', fontSize: 13, color: '#111827',
                background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
                outline: 'none', appearance: 'auto',
              }}
            >
              {TRADE_OPTIONS.map((t) => (
                <option key={t.code} value={t.name}>{t.name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Preview */}
        {preview && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9CA3AF', padding: '6px 10px', background: '#F9FAFB', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={createTask.isPending}
          style={{
            width: '100%', minHeight: 44,
            fontFamily: 'var(--font-cond)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
            color: '#FFFFFF', background: '#0F766E', borderRadius: 8,
            border: 'none', cursor: createTask.isPending ? 'not-allowed' : 'pointer',
            opacity: createTask.isPending ? 0.6 : 1,
          }}
        >
          {createTask.isPending ? 'SAVING…' : 'ADD TASK'}
        </button>

      </div>
    </BottomSheet>
  );
}
