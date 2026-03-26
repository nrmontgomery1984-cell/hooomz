/**
 * migrateCatalogProducts — One-time migration utility (v33)
 *
 * The old `catalogProducts` store (CatalogProduct type, Block 2 Material
 * Selection) is a different data model from the new `materialRecords` store.
 * After v33 the `catalogProducts` store is archived: no new writes happen,
 * but existing records are preserved for the Material Selection / Layout /
 * Trim modules that reference them.
 *
 * This utility:
 *   1. Reads all records from `catalogProducts`
 *   2. Logs the count so you can verify what was there before migration
 *   3. Does NOT delete or modify `catalogProducts` records
 *   4. Does NOT attempt to map CatalogProduct → MaterialRecord (different schemas)
 *
 * Run once after upgrading to DB v33. Safe to call multiple times (idempotent).
 *
 * Usage (in a dev utility page or browser console):
 *   import { migrateCatalogProducts } from '@/lib/seed/migrateCatalogProducts';
 *   await migrateCatalogProducts(storage);
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { COST_ITEMS_SEED } from './costItems.seed';
import { MATERIAL_RECORDS_SEED } from './materialRecords.seed';

export interface MigrationResult {
  /** Number of CatalogProduct records found in the archived store */
  catalogProductsCount: number;
  /** Number of CostItem records written to costItems store */
  costItemsWritten: number;
  /** Number of MaterialRecord records written to materialRecords store */
  materialRecordsWritten: number;
  /** Whether seed data was already present (skipped re-seed) */
  skipped: boolean;
}

/**
 * Run the v33 catalogue migration.
 * Seeds costItems and materialRecords stores if they are empty.
 * Counts (but does not modify) existing catalogProducts records.
 */
export async function migrateCatalogProducts(
  storage: StorageAdapter
): Promise<MigrationResult> {
  // 1. Count existing catalogProducts (archived store — do not modify)
  const existingCatalogProducts = await storage.getAll(StoreNames.CATALOG_PRODUCTS);
  const catalogProductsCount = existingCatalogProducts.length;
  console.log(
    `[v33 migration] catalogProducts (archived): ${catalogProductsCount} records found. No changes made.`
  );

  // 2. Check if costItems already seeded (idempotency guard)
  // Re-seed if the count is less than the expected seed size (handles partial/stale seeds).
  const existingCostItems = await storage.getAll(StoreNames.COST_ITEMS);
  if (existingCostItems.length >= COST_ITEMS_SEED.length) {
    console.log(
      `[v33 migration] costItems already fully seeded (${existingCostItems.length} records). Skipping seed.`
    );
    return {
      catalogProductsCount,
      costItemsWritten: 0,
      materialRecordsWritten: 0,
      skipped: true,
    };
  }
  if (existingCostItems.length > 0) {
    console.log(
      `[v33 migration] costItems partial seed detected (${existingCostItems.length}/${COST_ITEMS_SEED.length}). Re-seeding.`
    );
  }

  // 3. Seed costItems (108 records)
  await storage.setMany(
    StoreNames.COST_ITEMS,
    COST_ITEMS_SEED.map((item) => ({ key: item.id, value: item }))
  );
  console.log(`[v33 migration] costItems seeded: ${COST_ITEMS_SEED.length} records`);

  // 4. Seed materialRecords (8 records)
  await storage.setMany(
    StoreNames.MATERIAL_RECORDS,
    MATERIAL_RECORDS_SEED.map((item) => ({ key: item.id, value: item }))
  );
  console.log(`[v33 migration] materialRecords seeded: ${MATERIAL_RECORDS_SEED.length} records`);

  return {
    catalogProductsCount,
    costItemsWritten: COST_ITEMS_SEED.length,
    materialRecordsWritten: MATERIAL_RECORDS_SEED.length,
    skipped: false,
  };
}
