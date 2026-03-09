# Phase 3 Build Log — Material Selection

Date: 2026-03-02
Status: COMPLETE
Typecheck: 0 errors

---

## Files Created

| File | Lines | Notes |
|------|-------|-------|
| `src/lib/types/materialSelection.types.ts` | 68 | ProjectMaterialSelection, SelectionStatus, RoomSelectionSummary, TierComparison, TradeSelectionRow |
| `src/lib/repositories/materialSelection.repository.ts` | 102 | Standalone repo — PROJECT_MATERIAL_SELECTIONS store; upsertForRoomTrade prevents duplicate selections per room/trade |
| `src/lib/services/materialSelection.service.ts` | 230 | MaterialSelectionService — selectMaterial, confirmSelection, updateStatus, getTierComparison, getRoomSummary, getProjectSummary; activity logging on all mutations |
| `src/lib/hooks/useMaterialSelections.ts` | 175 | useRoomSelections, useProjectSelections, useRoomSelectionSummary, useTierComparison, useSelectMaterial, useConfirmSelection, useUpdateSelectionStatus, useDeleteMaterialSelection |
| `src/components/materials/TierComparisonCard.tsx` | 115 | Single G/B/B tier card, inline styles, selected state with accent border + check |
| `src/components/materials/TierSelector.tsx` | 60 | Loads tier comparison via useTierComparison, fires selectMaterial mutation on click |
| `src/components/materials/TradeSelectionPanel.tsx` | 110 | Collapsible panel per trade — shows existing selection in header, TierSelector in body |
| `src/components/materials/RoomMaterialsSummary.tsx` | 140 | Sticky sidebar — trade breakdown, total, confirm-all button |
| `src/components/materials/index.ts` | 4 | Barrel export |
| `src/app/production/jobs/[id]/rooms/[roomId]/materials/page.tsx` | 140 | Materials page — 2-col layout (panels + sticky summary), 4 active trades |

## Files Modified

| File | Change |
|------|--------|
| `src/lib/services/index.ts` | +MaterialSelectionRepository, MaterialSelectionService imports; +`materialSelection` to Services interface + initializeServices(); +MaterialSelectionService to re-exports |
| `src/lib/services/ServicesContext.tsx` | +`useMaterialSelectionService()` hook |
| `src/lib/hooks/useLocalData.ts` | +`materialSelections` query key namespace (byProject, byRoom, roomSummary, tierComparison) |

## Routes Created

| Route | Notes |
|-------|-------|
| `/production/jobs/[id]/rooms/[roomId]/materials` | Material selection — 4 trades, G/B/B cards, sticky summary |

## Architecture Notes

### Quantity Calculation Logic

| Trade | Formula | Unit |
|-------|---------|------|
| flooring | room.polygon.area_sqmm / 92903 | sqft |
| tile | room.polygon.area_sqmm / 92903 | sqft |
| paint | (perimeter_lf × ceiling_ft × 0.85 / coverage) × coats | gallon |
| trim | room.polygon.perimeter_mm / 304.8 | lf |
| drywall | ceil(wallArea / 32) | each |

Paint coverage parsed from spec string (e.g., '350-400 sqft/gal' → 350). Default: 400.

### Data Flow

```
useTierComparison(roomId, trade)
  → MaterialSelectionService.getTierComparison()
    → CatalogProductRepository.getTieredOptions(trade)   [G/B/B products]
    → RoomRepository.findById(roomId)                    [for quantity calc]
    → materialSelectionRepo.findByRoomAndTrade()         [for selectedTier]
  → TierComparison { good, better, best, selectedTier }

useSelectMaterial().mutate({projectId, jobId, roomId, trade, productId})
  → MaterialSelectionService.selectMaterial()
    → catalogRepo.findById(productId)                    [product details]
    → roomRepo.findById(roomId)                          [room dimensions]
    → calculateQuantity() + waste factor
    → selectionRepo.upsertForRoomTrade()                 [prevents duplicates]
    → activity.create('material.selected')
  → invalidates: byRoom, byProject, roomSummary, tierComparison keys
```

### Naming / Adaptation Notes

| Spec name | Actual name | Reason |
|-----------|-------------|--------|
| `TradeType` | `ProductTrade` | Actual type name in catalogProduct.types.ts |
| `adapter.put()`, `adapter.getByIndex()` | `storage.set()`, `storage.query()` | Actual StorageAdapter interface |
| `generateId('matsel')` from `@/lib/utils/ids` | Inline `matsel_${Date.now()}_${random}` | No ids utility exists |
| `BaseRepository` pattern | Standalone repo | Matches Phase 1/2 pattern |
| `CatalogProductService` + `RoomService` constructor args | `CatalogProductRepository` + `RoomRepository` | Services don't inject other services |
| `CardContent/CardHeader` sub-components | Inline styles | Card.tsx has no sub-components |
| Hook pattern: useState/useCallback | React Query useQuery/useMutation | Matches all existing hooks |
| Import `@/contexts/ServicesContext` | `@/lib/services/ServicesContext` | Correct path |

## Deferred Items

- **Quote integration (spec section 6)**: Generating line items from selections → deferred to Phase 6 (Quote stage). Requires reading existing LineItem/Quote service structure.
- **Sample selections seed (spec section 7)**: Seeds need existing room IDs which aren't available at boot time. Can be added later as a dev fixture for testing.

## Typecheck

```
npx tsc --noEmit → 0 errors
```

## Ready for Phase 4

Phase 4: Flooring Layout (plank layout calculator, material sizing).
