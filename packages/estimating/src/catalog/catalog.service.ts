/**
 * Catalog Service
 *
 * Business logic for managing material and labor rate catalog.
 */

import type {
  ApiResponse,
  PaginatedApiResponse,
} from '@hooomz/shared-contracts';

import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
} from '@hooomz/shared-contracts';

import type {
  ICatalogRepository,
  CatalogItem,
  CreateCatalogItem,
  UpdateCatalogItem,
  CatalogQueryParams,
} from './catalog.repository';

/**
 * Catalog Service Dependencies
 */
export interface CatalogServiceDependencies {
  catalogRepository: ICatalogRepository;
}

/**
 * Catalog Service
 */
export class CatalogService {
  constructor(private deps: CatalogServiceDependencies) {}

  /**
   * List catalog items with filtering and pagination
   */
  async list(
    params?: CatalogQueryParams
  ): Promise<PaginatedApiResponse<CatalogItem[]>> {
    try {
      const { items, total } = await this.deps.catalogRepository.findAll(params);

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 50;

      return createPaginatedResponse(
        items,
        calculatePaginationMeta(total, page, pageSize)
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list catalog items',
        },
      };
    }
  }

  /**
   * Get catalog item by ID
   */
  async getById(id: string): Promise<ApiResponse<CatalogItem>> {
    try {
      const item = await this.deps.catalogRepository.findById(id);

      if (!item) {
        return createErrorResponse('ITEM_NOT_FOUND', `Catalog item ${id} not found`);
      }

      return createSuccessResponse(item);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch catalog item'
      );
    }
  }

  /**
   * Search catalog items
   */
  async search(
    query: string,
    type?: 'material' | 'labor'
  ): Promise<ApiResponse<CatalogItem[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return createErrorResponse(
          'INVALID_QUERY',
          'Search query must be at least 2 characters'
        );
      }

      const items = await this.deps.catalogRepository.search(query.trim(), type);
      return createSuccessResponse(items);
    } catch (error) {
      return createErrorResponse(
        'SEARCH_ERROR',
        error instanceof Error ? error.message : 'Failed to search catalog'
      );
    }
  }

  /**
   * Get items by category
   */
  async getByCategory(category: string): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const items = await this.deps.catalogRepository.findByCategory(category);
      return createSuccessResponse(items);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch items by category'
      );
    }
  }

  /**
   * Create catalog item
   */
  async create(data: CreateCatalogItem): Promise<ApiResponse<CatalogItem>> {
    try {
      // Validate required fields
      if (!data.name || data.name.trim().length === 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Name is required');
      }

      if (!data.category || data.category.trim().length === 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Category is required');
      }

      if (!data.unit || data.unit.trim().length === 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Unit is required');
      }

      if (data.unitCost < 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Unit cost cannot be negative');
      }

      // Check for duplicate name in same type
      const existing = await this.deps.catalogRepository.findByName(data.name, data.type);
      if (existing) {
        return createErrorResponse(
          'DUPLICATE_ITEM',
          `A ${data.type} item named "${data.name}" already exists`
        );
      }

      const item = await this.deps.catalogRepository.create(data);
      return createSuccessResponse(item);
    } catch (error) {
      return createErrorResponse(
        'CREATE_ERROR',
        error instanceof Error ? error.message : 'Failed to create catalog item'
      );
    }
  }

  /**
   * Update catalog item
   */
  async update(id: string, data: UpdateCatalogItem): Promise<ApiResponse<CatalogItem>> {
    try {
      // Check if item exists
      const existing = await this.deps.catalogRepository.findById(id);
      if (!existing) {
        return createErrorResponse('ITEM_NOT_FOUND', `Catalog item ${id} not found`);
      }

      // Validate fields if provided
      if (data.unitCost !== undefined && data.unitCost < 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Unit cost cannot be negative');
      }

      // If name is changing, check for duplicates
      if (data.name && data.name !== existing.name) {
        const duplicate = await this.deps.catalogRepository.findByName(
          data.name,
          existing.type
        );
        if (duplicate && duplicate.id !== id) {
          return createErrorResponse(
            'DUPLICATE_NAME',
            `A ${existing.type} item named "${data.name}" already exists`
          );
        }
      }

      // Extract only the fields we want to update (exclude id since repository takes it as first param)
      const { id: _id, ...updateData } = data;
      const updated = await this.deps.catalogRepository.update(id, updateData);

      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update catalog item');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update catalog item'
      );
    }
  }

  /**
   * Delete catalog item
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const exists = await this.deps.catalogRepository.exists(id);
      if (!exists) {
        return createErrorResponse('ITEM_NOT_FOUND', `Catalog item ${id} not found`);
      }

      const deleted = await this.deps.catalogRepository.delete(id);
      if (!deleted) {
        return createErrorResponse('DELETE_ERROR', 'Failed to delete catalog item');
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Failed to delete catalog item'
      );
    }
  }

  /**
   * Get all materials
   */
  async getMaterials(): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const { items } = await this.deps.catalogRepository.findAll({ type: 'material', isActive: true });
      return createSuccessResponse(items);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch materials'
      );
    }
  }

  /**
   * Get all labor rates
   */
  async getLaborRates(): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const { items } = await this.deps.catalogRepository.findAll({ type: 'labor', isActive: true });
      return createSuccessResponse(items);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch labor rates'
      );
    }
  }

  /**
   * Get items by supplier
   */
  async getBySupplier(supplier: string): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const { items } = await this.deps.catalogRepository.findAll({ supplier, isActive: true });
      return createSuccessResponse(items);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch items by supplier'
      );
    }
  }

  /**
   * Mark item as inactive (soft delete)
   */
  async deactivate(id: string): Promise<ApiResponse<CatalogItem>> {
    return this.update(id, { id, isActive: false });
  }

  /**
   * Mark item as active
   */
  async activate(id: string): Promise<ApiResponse<CatalogItem>> {
    return this.update(id, { id, isActive: true });
  }

  /**
   * Search catalog (alias for search method with optional category filter)
   */
  async searchCatalog(
    query: string,
    category?: string
  ): Promise<ApiResponse<CatalogItem[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return createErrorResponse(
          'INVALID_QUERY',
          'Search query must be at least 2 characters'
        );
      }

      const items = await this.deps.catalogRepository.search(query.trim());

      // Filter by category if provided
      let filteredItems = items;
      if (category) {
        filteredItems = items.filter(
          (item) => item.category.toLowerCase() === category.toLowerCase()
        );
      }

      return createSuccessResponse(filteredItems);
    } catch (error) {
      return createErrorResponse(
        'SEARCH_ERROR',
        error instanceof Error ? error.message : 'Failed to search catalog'
      );
    }
  }

  /**
   * Get catalog item by name and type
   */
  async getCatalogItem(name: string, type?: 'material' | 'labor'): Promise<ApiResponse<CatalogItem>> {
    try {
      const item = await this.deps.catalogRepository.findByName(name, type);

      if (!item) {
        return createErrorResponse(
          'ITEM_NOT_FOUND',
          `Catalog item "${name}" not found`
        );
      }

      return createSuccessResponse(item);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch catalog item'
      );
    }
  }

  /**
   * Add new catalog item (alias for create)
   */
  async addCatalogItem(data: CreateCatalogItem): Promise<ApiResponse<CatalogItem>> {
    return this.create(data);
  }

  /**
   * Update item price
   */
  async updatePrice(id: string, newPrice: number): Promise<ApiResponse<CatalogItem>> {
    try {
      if (newPrice < 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Price cannot be negative');
      }

      const existing = await this.deps.catalogRepository.findById(id);
      if (!existing) {
        return createErrorResponse('ITEM_NOT_FOUND', `Catalog item ${id} not found`);
      }

      const updated = await this.deps.catalogRepository.update(id, {
        unitCost: newPrice,
      });

      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update price');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update price'
      );
    }
  }

  /**
   * Get items by category (wrapper for repository method)
   */
  async getItemsByCategory(category: string): Promise<ApiResponse<CatalogItem[]>> {
    return this.getByCategory(category);
  }

  /**
   * Suggest common items for a project type
   */
  async suggestItems(projectType: string): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const projectTypeLower = projectType.toLowerCase();
      let categories: string[] = [];

      // Map project types to relevant categories
      switch (projectTypeLower) {
        case 'new construction':
        case 'new build':
          categories = [
            'lumber',
            'framing',
            'sheathing',
            'roofing',
            'siding',
            'insulation',
            'drywall',
            'windows',
            'doors',
            'electrical',
            'plumbing',
            'hvac',
            'flooring',
            'trim',
            'paint',
            'concrete',
            'foundation',
          ];
          break;

        case 'renovation':
        case 'remodel':
          categories = [
            'drywall',
            'flooring',
            'paint',
            'trim',
            'doors',
            'windows',
            'electrical',
            'plumbing',
          ];
          break;

        case 'kitchen':
        case 'kitchen renovation':
          categories = ['drywall', 'flooring', 'paint', 'electrical', 'plumbing', 'trim'];
          break;

        case 'bathroom':
        case 'bathroom renovation':
          categories = ['drywall', 'flooring', 'paint', 'plumbing', 'electrical', 'trim'];
          break;

        case 'roofing':
          categories = ['roofing'];
          break;

        case 'siding':
          categories = ['siding'];
          break;

        case 'addition':
          categories = [
            'lumber',
            'framing',
            'sheathing',
            'roofing',
            'siding',
            'insulation',
            'drywall',
            'windows',
            'doors',
            'electrical',
            'plumbing',
            'flooring',
            'trim',
            'paint',
            'foundation',
          ];
          break;

        case 'deck':
        case 'outdoor':
          categories = ['lumber', 'framing', 'concrete'];
          break;

        case 'finishing':
        case 'interior finishing':
          categories = ['drywall', 'flooring', 'trim', 'paint', 'doors'];
          break;

        default:
          // Return most common items if project type not recognized
          categories = [
            'lumber',
            'drywall',
            'paint',
            'flooring',
            'electrical',
            'plumbing',
          ];
      }

      // Get all items for the relevant categories
      const allItems: CatalogItem[] = [];
      for (const category of categories) {
        const { items } = await this.deps.catalogRepository.findAll({
          category,
          isActive: true,
        });
        allItems.push(...items);
      }

      // Remove duplicates and sort by category
      const uniqueItems = Array.from(
        new Map(allItems.map((item) => [item.id, item])).values()
      );
      uniqueItems.sort((a, b) => a.category.localeCompare(b.category));

      return createSuccessResponse(uniqueItems);
    } catch (error) {
      return createErrorResponse(
        'SUGGESTION_ERROR',
        error instanceof Error ? error.message : 'Failed to suggest items'
      );
    }
  }
}
