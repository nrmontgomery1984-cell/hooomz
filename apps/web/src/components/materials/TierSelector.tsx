'use client';

/**
 * TierSelector — Good/Better/Best comparison for one trade in one room.
 * Loads tier comparison via React Query. Clicking a card fires selectMaterial.
 */

import { TierComparisonCard } from './TierComparisonCard';
import { useTierComparison, useSelectMaterial } from '@/lib/hooks/useMaterialSelections';
import type { ProductTrade, ProductTier } from '@/lib/types/catalogProduct.types';

interface TierSelectorProps {
  roomId: string;
  trade: ProductTrade;
  projectId: string;
  jobId: string;
}

export function TierSelector({ roomId, trade, projectId, jobId }: TierSelectorProps) {
  const { data: comparison, isLoading } = useTierComparison(roomId, trade);
  const selectMutation = useSelectMaterial();

  const handleSelect = (tier: ProductTier) => {
    if (!comparison) return;
    const option = comparison[tier];
    if (!option.product) return;
    selectMutation.mutate({ projectId, jobId, roomId, trade, productId: option.product.id });
  };

  if (isLoading || !comparison) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {(['good', 'better', 'best'] as const).map((t) => (
          <div
            key={t}
            style={{
              height: 160,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  const isMutating = selectMutation.isPending;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {(['good', 'better', 'best'] as const).map((tier) => (
        <TierComparisonCard
          key={tier}
          tier={tier}
          product={comparison[tier].product}
          totalPrice={comparison[tier].totalPrice}
          isSelected={comparison.selectedTier === tier}
          onSelect={() => handleSelect(tier)}
          disabled={isMutating}
        />
      ))}
    </div>
  );
}
