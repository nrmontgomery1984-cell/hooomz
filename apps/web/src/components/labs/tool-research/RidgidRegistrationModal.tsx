'use client';

import { useState } from 'react';
import type { ToolInventoryItem } from '@hooomz/shared-contracts';
import { Modal } from '@/components/ui/Modal';

const CORAL = '#E76F51';
const TEAL = '#2A9D8F';

interface RidgidRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ToolInventoryItem;
  onConfirm: (registrationDate: string) => void;
  isPending?: boolean;
}

export function RidgidRegistrationModal({ isOpen, onClose, item, onConfirm, isPending }: RidgidRegistrationModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(date);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register RIDGID Tool" size="sm">
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
            RIDGID Lifetime Service Agreement
          </div>
        </div>

        <div
          style={{
            padding: 10,
            background: '#FFF3E0',
            borderRadius: 6,
            fontSize: 12,
            color: '#E65100',
            marginBottom: 16,
          }}
        >
          Register within 90 days of purchase at ridgid.com for Lifetime Service Agreement: FREE
          parts, FREE service, FOR LIFE.
        </div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
            Registration Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
              background: TEAL,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            {isPending ? 'Registering...' : 'Confirm Registration'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
