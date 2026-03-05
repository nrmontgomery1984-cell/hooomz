# Hooomz OS Checkpoint — Material Selection, RoomScan, Layout & Trim Systems

Date: 2026-03-02
Status: Specified, ready for implementation
Target: March 2026 Home Show demo

## Summary

Four interconnected systems specified for the Quote stage workflow:

1. Material Selection Module (Block 2) — Customer-facing Good/Better/Best tier selection, feeds pricing into quote generation
2. RoomScan Integration (Block 3) — iPad LiDAR scan import via XML, provides room geometry
3. Layout Selector (Block 4) — Flooring pattern visualization, manual adjustment + waste optimization
4. Trim Cut Calculator (Block 5) — Window/door millwork cut lists with reveal gauge color coding

## Database Changes

IndexedDB v29 → v30

NEW STORES (7):
- catalogProducts, projectMaterialSelections (Block 2)
- roomScans, rooms (Block 3)
- flooringLayouts (Block 4)
- millworkAssemblyConfigs, trimCalculations (Block 5)

MODIFIED STORE (1):
- lineItems: Add source + source_id fields, cursor migration sets source='manual' on existing

## New Dependencies

- polygon-clipping ^0.15.7 (layout calculation)
- comlink ^4.4.1 (web worker RPC)
- No @types/* needed — both ship bundled types

## Key Decisions Logged

- Separate rooms store (not nested) for efficient FK lookup
- XML only for MVP; DXF deferred
- Opening fields: is_exterior, swing_direction, casing_sides (nullable, manual entry)
- Layout: persist summary only, recalculate tiles on render
- Trim: local config override + explicit "Save as default"
- Reveal gauge in localStorage, not IndexedDB
- Waste factor: stock plan if available, else config default (10%)
- Assembly config uses sentinel ID 'default'
- Quote quantity fallback: optimized → room area estimate → placeholder
- Quote line items grouped by source: material_selection / labour_estimation / manual

## Build Order

STANDING NOTE: Each phase that adds a repository or service must also update src/lib/services/index.ts (Services interface + initializeServices()).

PHASE 1 (Days 1-2): Foundation
- v30 migration, utils refactor, seed structure, CatalogProduct repo/service

PHASE 2 (Days 3-5): RoomScan
- XML parser, upload UI, floor plan Canvas
- DECISION REQUIRED before start: Lock room page routes (/production/jobs/[id]/rooms/[roomId]/*)

PHASE 3 (Days 6-8): Material Selection
- Catalog seed, selection UI, quote integration with grouped line items

PHASE 4 (Days 9-12): Layout Selector — HIGHEST RISK
- Calculator, web worker, Canvas, optimizer
- Day 9: Spike web worker + polygon-clipping early
- Day 11-12: Performance profiling (Canvas + worker) — do here, not Phase 6
- Day 12: Buffer day if needed

PHASE 5 (Days 13-16): Trim Cut Calculator
- Calculator, reveal context, assembly config, cut list UI, print output
- Add RevealGaugeContext to providers.tsx

PHASE 6 (Days 17-20): Integration + Polish
- End-to-end testing, IDB query profiling, mobile Safari testing, demo rehearsal

## High-Risk Items

1. Web Worker in Next.js 14 — test Turbopack (dev) AND Webpack (prod) early
2. polygon-clipping performance — profile with complex L-shaped room + 200 tiles
3. Canvas touch gestures — test on iPad Safari specifically
4. @react-pdf/renderer — verify inline background colors work

## Files Modified (Existing)

- StorageAdapter.ts — StoreNames enum
- IndexedDBAdapter.ts — v30, indexes, lineItems migration
- SyncEngine.ts — SYNCED_STORES
- src/lib/utils.ts → src/lib/utils/index.ts (refactor)
- src/lib/services/index.ts — every phase
- src/lib/repositories/lineitem.repository.ts — default source='manual'
- src/app/providers.tsx — RevealGaugeContext (Phase 5)
- src/app/sales/quotes/[id]/page.tsx — line item grouping
- Quote PDF component — grouped rendering
- Quote line item generation service — material selection source

## New Directories

- src/lib/parsers/roomscan/
- src/lib/calculators/
- src/lib/workers/
- src/lib/contexts/
- src/lib/data/seed/scans/
- src/components/floorplan/
- src/components/layout/
- src/components/trim/

## Activity Event Types (New)

- scan.uploaded, scan.deleted, room.updated
- material.selected, material.confirmed, material.status_changed
- layout.created, layout.adjusted, layout.optimized, layout.exported
- trim.calculated, trim.exported

## Seed Data

All seed records use SEED- prefix. Guarded by existing check. Explicit call only.

- catalog-products.seed.ts (SEED-PROD-xxx)
- sample-property.xml
- sample-scan.seed.ts (SEED-SCAN-xxx)
- sample-rooms.seed.ts (SEED-ROOM-xxx)
- sample-selections.seed.ts (SEED-SEL-xxx)
- sample-layout.seed.ts (SEED-LAYOUT-xxx)
- assembly-config.seed.ts (ID: 'default')
- reveal-gauges.seed.ts (localStorage, SEED-REVEAL-xxx)

## MVP Checklist

- [ ] RoomScan XML import + floor plan display
- [ ] Material Selection UI (Good/Better/Best)
- [ ] Layout Selector with optimize
- [ ] Trim Cut Calculator with reveal colors
- [ ] Selection → Quote integration
- [ ] Print-friendly cut list
- [ ] Demo seed data

## Open Items

- [ ] Lock room page routes before Phase 2 Day 3
- [ ] Test web worker dev + prod builds
- [ ] Profile polygon-clipping with complex geometry
- [ ] Verify @react-pdf/renderer background colors
- [ ] Test Canvas touch on iPad Safari

## Specification Reference

Full specs in conversation history, 2026-03-02:
- Block 1: Context acknowledgment
- Block 2: Material Selection Module
- Block 3: RoomScan Integration
- Block 4: Layout Selector
- Block 5a-d: Trim Cut Calculator
- Block 6a-d: Integration, Migration, Build Order, Checkpoint

---

End of checkpoint document.
