/**
 * Quote-stage seed orchestrator.
 * Call seedQuoteStageDataIfEmpty(services) once on app init — guarded internally.
 */

import type { Services } from '../../services/index';
import { seedCatalogProductsIfEmpty } from './catalog-products.seed';
import { seedAssemblyConfigIfEmpty } from './assembly-config.seed';

export async function seedQuoteStageDataIfEmpty(services: Services): Promise<void> {
  await Promise.all([
    seedCatalogProductsIfEmpty(services),
    seedAssemblyConfigIfEmpty(services),
  ]);
}
