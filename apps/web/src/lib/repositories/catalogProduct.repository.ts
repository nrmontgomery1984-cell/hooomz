/**
 * CatalogProductRepository — Good/Better/Best tier material products.
 * Distinct from CatalogRepository (estimating catalogItems store).
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type {
  CatalogProduct,
  CreateCatalogProduct,
  CatalogProductFilters,
  ProductTrade,
  ProductTier,
  TieredOptions,
} from '../types/catalogProduct.types';

export class CatalogProductRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CATALOG_PRODUCTS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `cprod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: CreateCatalogProduct): Promise<CatalogProduct> {
    const ts = this.now();
    const product: CatalogProduct = {
      ...data,
      id: this.generateId(),
      createdAt: ts,
      updatedAt: ts,
    };
    await this.storage.set(this.storeName, product.id, product);
    return product;
  }

  async upsert(product: CatalogProduct): Promise<CatalogProduct> {
    const ts = this.now();
    const saved: CatalogProduct = { ...product, updatedAt: ts };
    await this.storage.set(this.storeName, saved.id, saved);
    return saved;
  }

  async findById(id: string): Promise<CatalogProduct | null> {
    return this.storage.get<CatalogProduct>(this.storeName, id);
  }

  async findBySku(sku: string): Promise<CatalogProduct | null> {
    const results = await this.storage.query<CatalogProduct>(
      this.storeName,
      (p) => p.sku === sku,
    );
    return results[0] ?? null;
  }

  async findAll(): Promise<CatalogProduct[]> {
    return this.storage.getAll<CatalogProduct>(this.storeName);
  }

  async findByTrade(trade: ProductTrade): Promise<CatalogProduct[]> {
    return this.storage.query<CatalogProduct>(this.storeName, (p) => p.trade === trade);
  }

  async findByTier(tier: ProductTier): Promise<CatalogProduct[]> {
    return this.storage.query<CatalogProduct>(this.storeName, (p) => p.tier === tier);
  }

  async findFiltered(filters: CatalogProductFilters): Promise<CatalogProduct[]> {
    return this.storage.query<CatalogProduct>(this.storeName, (p) => {
      if (filters.category && p.category !== filters.category) return false;
      if (filters.trade && p.trade !== filters.trade) return false;
      if (filters.tier && p.tier !== filters.tier) return false;
      if (filters.inStock !== undefined && p.inStock !== filters.inStock) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const match =
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }

  async getTieredOptions(trade: ProductTrade, subcategory?: string): Promise<TieredOptions> {
    const products = await this.storage.query<CatalogProduct>(
      this.storeName,
      (p) =>
        p.trade === trade &&
        (subcategory === undefined || p.subcategory === subcategory),
    );
    return {
      good: products.filter((p) => p.tier === 'good'),
      better: products.filter((p) => p.tier === 'better'),
      best: products.filter((p) => p.tier === 'best'),
    };
  }

  async update(id: string, changes: Partial<Omit<CatalogProduct, 'id' | 'createdAt'>>): Promise<CatalogProduct | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: CatalogProduct = { ...existing, ...changes, id, updatedAt: this.now() };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async saveMany(products: CatalogProduct[]): Promise<void> {
    await this.storage.setMany(
      this.storeName,
      products.map((p) => ({ key: p.id, value: p })),
    );
  }
}
