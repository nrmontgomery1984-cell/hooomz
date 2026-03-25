'use client';

import { useState } from 'react';
import type { ToolResearchItem } from '@hooomz/shared-contracts';
import { Modal } from '@/components/ui/Modal';

const TEAL = 'var(--accent)';
const NAVY = 'var(--charcoal)';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ToolResearchItem;
  onConfirm: (date: string, price: number, retailer: string) => void;
  isPending?: boolean;
}

export function PurchaseModal({ isOpen, onClose, item, onConfirm, isPending }: PurchaseModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState(item.priceNum ?? 0);
  const [retailer, setRetailer] = useState(item.retailer ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(date, price, retailer);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark as Purchased" size="sm">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              padding: 12,
              background: 'var(--accent-bg)',
              borderRadius: 8,
              borderLeft: `3px solid ${TEAL}`,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{item.item}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {item.category} {item.priority ? `\u2022 ${item.priority}` : ''}
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
              Purchase Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 13,
                minHeight: 44,
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
              Price Paid (CAD)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 13,
                minHeight: 44,
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
              Retailer
            </span>
            <input
              type="text"
              value={retailer}
              onChange={(e) => setRetailer(e.target.value)}
              placeholder="e.g. Home Depot, Kent, Canadian Tire"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 13,
                minHeight: 44,
              }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--surface)',
              fontSize: 13,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !retailer.trim()}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 6,
              background: TEAL,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending || !retailer.trim() ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            {isPending ? 'Saving...' : 'Confirm Purchase'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
