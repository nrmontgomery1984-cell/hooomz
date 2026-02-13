'use client';

import { useState } from 'react';
import type { ToolInventoryItem } from '@hooomz/shared-contracts';
import { Modal } from '@/components/ui/Modal';

const CORAL = '#E76F51';

interface RetireModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ToolInventoryItem;
  ownedItems: ToolInventoryItem[];
  onConfirm: (reason?: string, replacedById?: string) => void;
  isPending?: boolean;
}

export function RetireModal({ isOpen, onClose, item, ownedItems, onConfirm, isPending }: RetireModalProps) {
  const [reason, setReason] = useState('');
  const [replacedById, setReplacedById] = useState('');

  const replacements = ownedItems.filter((i) => i.id !== item.id && i.status === 'Owned');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason || undefined, replacedById || undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Retire Tool" size="sm">
      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: 12,
            background: '#FDEEEA',
            borderRadius: 8,
            borderLeft: `3px solid ${CORAL}`,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{item.item}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {item.platform} {item.brand ? `\u2022 ${item.brand}` : ''}
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
            Reason for Retiring
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Worn out, upgraded, broken"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              fontSize: 13,
              minHeight: 44,
            }}
          />
        </label>

        {replacements.length > 0 && (
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
              Replaced By (optional)
            </span>
            <select
              value={replacedById}
              onChange={(e) => setReplacedById(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                minHeight: 44,
                background: 'white',
              }}
            >
              <option value="">None</option>
              {replacements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.item}
                </option>
              ))}
            </select>
          </label>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              background: 'white',
              fontSize: 13,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 6,
              background: CORAL,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            {isPending ? 'Retiring...' : 'Retire Tool'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
