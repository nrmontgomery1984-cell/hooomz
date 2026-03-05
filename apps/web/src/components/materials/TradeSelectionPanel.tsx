'use client';

/**
 * TradeSelectionPanel — collapsible panel for one trade in the room materials page.
 * Header shows current selection summary; expanded body shows TierSelector.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, PaintBucket, Ruler, Grid2x2, Blocks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TierSelector } from './TierSelector';
import type { ProductTrade } from '@/lib/types/catalogProduct.types';
import type { ProjectMaterialSelection } from '@/lib/types/materialSelection.types';

const TRADE_META: Record<ProductTrade, { label: string; Icon: LucideIcon }> = {
  flooring: { label: 'Flooring', Icon: Layers },
  paint: { label: 'Paint', Icon: PaintBucket },
  trim: { label: 'Trim & Millwork', Icon: Ruler },
  tile: { label: 'Tile', Icon: Grid2x2 },
  drywall: { label: 'Drywall', Icon: Blocks },
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  ordered: '#3B82F6',
  delivered: '#6B7280',
};

interface TradeSelectionPanelProps {
  trade: ProductTrade;
  roomId: string;
  projectId: string;
  jobId: string;
  existingSelection: ProjectMaterialSelection | null;
}

export function TradeSelectionPanel({
  trade,
  roomId,
  projectId,
  jobId,
  existingSelection,
}: TradeSelectionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!existingSelection);
  const meta = TRADE_META[trade];
  const { Icon } = meta;

  const hasSelection = !!existingSelection;
  const statusColor = existingSelection ? (STATUS_COLORS[existingSelection.status] ?? '#9CA3AF') : undefined;

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: `1px solid ${hasSelection && existingSelection.status === 'confirmed' ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          all: 'unset',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box',
          padding: '14px 16px',
          cursor: 'pointer',
          gap: 12,
        }}
      >
        <Icon size={18} color="var(--text-3)" />

        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{meta.label}</div>
          {hasSelection && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {existingSelection.productName}{' '}
              <span style={{ fontWeight: 600 }}>
                · ${existingSelection.totalPrice.toFixed(0)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasSelection ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: statusColor,
                background: `${statusColor}18`,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {existingSelection.status}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Not selected</span>
          )}
          {isExpanded ? (
            <ChevronUp size={16} color="var(--text-3)" />
          ) : (
            <ChevronDown size={16} color="var(--text-3)" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            padding: '0 16px 16px',
            borderTop: '1px solid var(--border)',
            paddingTop: 16,
          }}
        >
          <TierSelector
            roomId={roomId}
            trade={trade}
            projectId={projectId}
            jobId={jobId}
          />
        </div>
      )}
    </div>
  );
}
