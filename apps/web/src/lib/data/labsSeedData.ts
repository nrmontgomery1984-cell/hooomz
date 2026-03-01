/**
 * Labs Seed Data — Catalog items for products, techniques, and tool methods
 *
 * Seed arrays are empty — catalog content is now created through the app
 * (Labs > Catalogs). The seedLabsCatalogs() function signature is kept
 * for backward compatibility with seedAll.ts.
 */

import type { LabsProduct, LabsTechnique, LabsToolMethod } from '@hooomz/shared-contracts';

type SeedProduct = Omit<LabsProduct, 'id' | 'metadata'>;
type SeedTechnique = Omit<LabsTechnique, 'id' | 'metadata'>;
type SeedToolMethod = Omit<LabsToolMethod, 'id' | 'metadata'>;

export const SEED_PRODUCTS: SeedProduct[] = [];
export const SEED_TECHNIQUES: SeedTechnique[] = [];
export const SEED_TOOL_METHODS: SeedToolMethod[] = [];

/**
 * Seed the Labs catalogs with initial data
 * No-op when arrays are empty — returns zero counts
 */
export async function seedLabsCatalogs(labsServices: {
  catalog: {
    createProduct: (data: SeedProduct) => Promise<any>;
    createTechnique: (data: SeedTechnique) => Promise<any>;
    createToolMethod: (data: SeedToolMethod) => Promise<any>;
    findAllProducts: () => Promise<any[]>;
    findAllTechniques: () => Promise<any[]>;
    findAllToolMethods: () => Promise<any[]>;
  };
}): Promise<{ products: number; techniques: number; toolMethods: number }> {
  const existing = {
    products: await labsServices.catalog.findAllProducts(),
    techniques: await labsServices.catalog.findAllTechniques(),
    toolMethods: await labsServices.catalog.findAllToolMethods(),
  };

  let seededProducts = 0;
  let seededTechniques = 0;
  let seededToolMethods = 0;

  if (existing.products.length === 0) {
    for (const product of SEED_PRODUCTS) {
      await labsServices.catalog.createProduct(product);
      seededProducts++;
    }
  }

  if (existing.techniques.length === 0) {
    for (const technique of SEED_TECHNIQUES) {
      await labsServices.catalog.createTechnique(technique);
      seededTechniques++;
    }
  }

  if (existing.toolMethods.length === 0) {
    for (const toolMethod of SEED_TOOL_METHODS) {
      await labsServices.catalog.createToolMethod(toolMethod);
      seededToolMethods++;
    }
  }

  return { products: seededProducts, techniques: seededTechniques, toolMethods: seededToolMethods };
}
