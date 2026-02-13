'use client';

import { useState } from 'react';
import type { ToolInventoryItem, MaintenanceEntry } from '@hooomz/shared-contracts';
import { Modal } from '@/components/ui/Modal';
import { useAddMaintenanceEntry } from '@/lib/hooks/useLabsData';

const TEAL = '#2A9D8F';
const NAVY = '#1B2A4A';

interface MaintenanceLogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ToolInventoryItem;
}

export function MaintenanceLog({ isOpen, onClose, item }: MaintenanceLogProps) {
  const addEntry = useAddMaintenanceEntry();
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const entries = [...(item.maintenanceLog ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim()) return;
    const entry: MaintenanceEntry = {
      date,
      action: action.trim(),
      notes: notes.trim() || undefined,
    };
    addEntry.mutate(
      { id: item.id, entry },
      {
        onSuccess: () => {
          setAction('');
          setNotes('');
          setDate(new Date().toISOString().slice(0, 10));
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Maintenance: ${item.item}`} size="md">
      {/* Add entry form */}
      <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8 }}>
          <label>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 2 }}>
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                fontSize: 12,
                minHeight: 36,
              }}
            />
          </label>
          <label>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 2 }}>
              Action
            </span>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Cleaned, Blade replaced, Calibrated"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                fontSize: 12,
                minHeight: 36,
              }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 2 }}>
              Notes (optional)
            </span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                fontSize: 12,
                minHeight: 36,
              }}
            />
          </label>
          <button
            type="submit"
            disabled={!action.trim() || addEntry.isPending}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 4,
              background: TEAL,
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: action.trim() ? 'pointer' : 'not-allowed',
              opacity: action.trim() ? 1 : 0.5,
              minHeight: 36,
              whiteSpace: 'nowrap',
            }}
          >
            Add Entry
          </button>
        </div>
      </form>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 13 }}>
          No maintenance entries yet
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {entries.map((entry, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                background: i % 2 === 0 ? '#F9FAFB' : 'white',
                borderRadius: 6,
                border: '1px solid #F3F4F6',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: NAVY }}>{entry.action}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{entry.date}</span>
              </div>
              {entry.notes && (
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{entry.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
