'use client';

/**
 * TierComparisonCard — single Good/Better/Best option card.
 * Shows product name, specs preview, price per unit, and total installed price.
 * Clicking selects this tier. Selected state shown with blue border.
 */

import { Check } from 'lucide-react';
import type { CatalogProduct, ProductTier } from '@/lib/types/catalogProduct.types';

const TIER_META: Record<ProductTier, { label: string; accent: string; bg: string }> = {
  good: {
    label: 'Good',
    accent: 'var(--muted)',
    bg: 'rgba(107,114,128,0.06)',
  },
  better: {
    label: 'Better',
    accent: 'var(--blue)',
    bg: 'var(--blue-bg)',
  },
  best: {
    label: 'Best',
    accent: 'var(--yellow)',
    bg: 'var(--yellow-bg)',
  },
};

interface TierComparisonCardProps {
  tier: ProductTier;
  product: CatalogProduct | null;
  totalPrice: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function TierComparisonCard({
  tier,
  product,
  totalPrice,
  isSelected,
  onSelect,
  disabled = false,
}: TierComparisonCardProps) {
  const meta = TIER_META[tier];

  if (!product) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 140,
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        Not available
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      style={{
        all: 'unset',
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        background: isSelected ? meta.bg : 'var(--surface)',
        border: `2px solid ${isSelected ? meta.accent : 'var(--border)'}`,
        borderRadius: 12,
        padding: 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Tier badge + selected check */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: meta.accent,
          }}
        >
          {meta.label}
        </span>
        {isSelected && (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: meta.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={12} color="#fff" />
          </span>
        )}
      </div>

      {/* Product name */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4, lineHeight: 1.3 }}>
        {product.name}
      </div>

      {/* Description */}
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.4 }}>
        {product.description}
      </div>

      {/* Specs preview (up to 2) */}
      {Object.keys(product.specs).length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {Object.entries(product.specs)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key} style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                <span style={{ textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}:
                </span>{' '}
                <span style={{ fontWeight: 600 }}>{String(value)}</span>
              </div>
            ))}
        </div>
      )}

      {/* Price footer */}
      <div
        style={{
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          ${product.unitPrice.toFixed(2)}/{product.unit}
        </span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--charcoal)' }}>
            ${totalPrice.toFixed(0)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>incl. waste</div>
        </div>
      </div>
    </button>
  );
}
