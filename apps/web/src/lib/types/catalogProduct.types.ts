/**
 * CatalogProduct — Good/Better/Best tier material product catalog.
 * Distinct from the estimating CatalogItem (labor/material cost items).
 * Used for Material Selection, Layout, and Trim modules.
 */

export type ProductTier = 'good' | 'better' | 'best';
export type ProductCategory = 'flooring' | 'paint' | 'trim' | 'tile' | 'drywall';
export type ProductTrade = 'flooring' | 'paint' | 'trim' | 'tile' | 'drywall';
export type ProductUnit = 'sqft' | 'lf' | 'gallon' | 'each' | 'box';

/**
 * Flexible dimensions bag — callers pull what they need.
 * Trim calculator uses: width_mm, thickness_mm
 * Flooring layout uses: width_mm, length_mm
 */
export interface ProductDimensions {
  width_mm?: number;
  length_mm?: number;
  thickness_mm?: number;
  [key: string]: number | undefined;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  trade: ProductTrade;
  tier: ProductTier;
  unitPrice: number;          // CAD
  unit: ProductUnit;
  description: string;
  dimensions: ProductDimensions;
  specs: Record<string, unknown>;
  supplier: string;
  leadTimeDays: number;
  inStock: boolean;
  imageUrl: string | null;
  installerSopCode?: string;  // links to StandardSOP via useStandardSOPByCode
  createdAt: string;
  updatedAt: string;
}

export type CreateCatalogProduct = Omit<CatalogProduct, 'id' | 'createdAt' | 'updatedAt'>;

export interface CatalogProductFilters {
  category?: ProductCategory;
  trade?: ProductTrade;
  tier?: ProductTier;
  inStock?: boolean;
  searchTerm?: string;
}

export interface TieredOptions {
  good: CatalogProduct[];
  better: CatalogProduct[];
  best: CatalogProduct[];
}
