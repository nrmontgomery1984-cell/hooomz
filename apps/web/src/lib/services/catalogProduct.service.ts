/**
 * CatalogProductService — Good/Better/Best tier material products.
 * Distinct from CatalogService (estimating catalogItems).
 */

import type { CatalogProductRepository } from '../repositories/catalogProduct.repository';
import type { ActivityService } from '../repositories/activity.repository';
import type {
  CatalogProduct,
  CreateCatalogProduct,
  CatalogProductFilters,
  ProductTrade,
  TieredOptions,
} from '../types/catalogProduct.types';

export class CatalogProductService {
  constructor(
    private repo: CatalogProductRepository,
    private activity: ActivityService,
  ) {}

  async create(data: CreateCatalogProduct): Promise<CatalogProduct> {
    const product = await this.repo.create(data);
    this.activity.logCatalogEvent('catalog.item_added', product.id, {
      item_name: product.name,
      category: product.category,
    }).catch((err) => console.error('Failed to log catalog product create:', err));
    return product;
  }

  async findById(id: string): Promise<CatalogProduct | null> {
    return this.repo.findById(id);
  }

  async findBySku(sku: string): Promise<CatalogProduct | null> {
    return this.repo.findBySku(sku);
  }

  async findAll(): Promise<CatalogProduct[]> {
    return this.repo.findAll();
  }

  async findFiltered(filters: CatalogProductFilters): Promise<CatalogProduct[]> {
    return this.repo.findFiltered(filters);
  }

  async getTieredOptions(trade: ProductTrade, subcategory?: string): Promise<TieredOptions> {
    return this.repo.getTieredOptions(trade, subcategory);
  }

  async update(id: string, changes: Partial<Omit<CatalogProduct, 'id' | 'createdAt'>>): Promise<CatalogProduct | null> {
    const product = await this.repo.update(id, changes);
    if (product) {
      this.activity.logCatalogEvent('catalog.item_updated', id, {
        item_name: product.name,
      }).catch((err) => console.error('Failed to log catalog product update:', err));
    }
    return product;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) return false;
    const deleted = await this.repo.delete(id);
    if (deleted) {
      this.activity.logCatalogEvent('catalog.item_deleted', id, {
        item_name: existing.name,
      }).catch((err) => console.error('Failed to log catalog product delete:', err));
    }
    return deleted;
  }

  async saveMany(products: CatalogProduct[]): Promise<void> {
    return this.repo.saveMany(products);
  }
}

export function createCatalogProductService(
  repo: CatalogProductRepository,
  activity: ActivityService,
): CatalogProductService {
  return new CatalogProductService(repo, activity);
}
