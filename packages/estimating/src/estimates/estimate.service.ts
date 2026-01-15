/**
 * Estimate Service
 *
 * Business logic for managing line items and project estimates.
 */

import type {
  LineItem,
  CreateLineItem,
  UpdateLineItem,
  QueryParams,
  LineItemFilters,
  LineItemSortField,
  ApiResponse,
  PaginatedApiResponse,
  EstimatingOperations,
} from '@hooomz/shared-contracts';

import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
  validateCreateLineItem,
  validateUpdateLineItem,
} from '@hooomz/shared-contracts';

import type { ILineItemRepository } from './estimate.repository';
import type { ICatalogRepository } from '../catalog/catalog.repository';
import {
  calculateEstimateTotals,
  calculateLineItemWithMarkup,
  calculateRecommendedMarkup,
  applyGlobalMarkup,
  applyDifferentialMarkup,
  calculateCategoryBreakdown,
  type EstimateTotals,
  type LineItemTotal,
} from '../calculations';

/**
 * Estimate Service Dependencies
 */
export interface EstimateServiceDependencies {
  lineItemRepository: ILineItemRepository;
  catalogRepository?: ICatalogRepository;
}

/**
 * Estimate summary for a project
 */
export interface EstimateSummary {
  projectId: string;
  lineItems: LineItem[];
  totals: EstimateTotals;
  categoryBreakdown: Record<string, { cost: number; price: number; count: number }>;
  recommendedMarkup?: {
    materialMarkup: number;
    laborMarkup: number;
    reasoning: string;
  };
}

/**
 * Estimate Service
 */
export class EstimateService implements EstimatingOperations {
  constructor(private deps: EstimateServiceDependencies) {}

  /**
   * List line items with filtering and pagination
   */
  async list(
    params?: QueryParams<LineItemSortField, LineItemFilters>
  ): Promise<PaginatedApiResponse<LineItem[]>> {
    try {
      const { lineItems, total } = await this.deps.lineItemRepository.findAll(params);

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 50;

      return createPaginatedResponse(
        lineItems,
        calculatePaginationMeta(total, page, pageSize)
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list line items',
        },
      };
    }
  }

  /**
   * Get line item by ID
   */
  async getById(id: string): Promise<ApiResponse<LineItem>> {
    try {
      const lineItem = await this.deps.lineItemRepository.findById(id);

      if (!lineItem) {
        return createErrorResponse('LINE_ITEM_NOT_FOUND', `Line item ${id} not found`);
      }

      return createSuccessResponse(lineItem);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch line item'
      );
    }
  }

  /**
   * Create line item
   */
  async create(data: CreateLineItem): Promise<ApiResponse<LineItem>> {
    try {
      // Validate input
      const validation = validateCreateLineItem(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid line item data',
            details: validation.error.errors,
          },
        };
      }

      const lineItem = await this.deps.lineItemRepository.create(validation.data);
      return createSuccessResponse(lineItem);
    } catch (error) {
      return createErrorResponse(
        'CREATE_ERROR',
        error instanceof Error ? error.message : 'Failed to create line item'
      );
    }
  }

  /**
   * Update line item
   */
  async update(id: string, data: UpdateLineItem): Promise<ApiResponse<LineItem>> {
    try {
      // Validate input
      const validation = validateUpdateLineItem(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validation.error.errors,
          },
        };
      }

      // Check if line item exists
      const existing = await this.deps.lineItemRepository.findById(id);
      if (!existing) {
        return createErrorResponse('LINE_ITEM_NOT_FOUND', `Line item ${id} not found`);
      }

      const updated = await this.deps.lineItemRepository.update(id, {
        ...data,
        id: undefined,
        metadata: undefined,
      });

      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update line item');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update line item'
      );
    }
  }

  /**
   * Delete line item
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const exists = await this.deps.lineItemRepository.exists(id);
      if (!exists) {
        return createErrorResponse('LINE_ITEM_NOT_FOUND', `Line item ${id} not found`);
      }

      const deleted = await this.deps.lineItemRepository.delete(id);
      if (!deleted) {
        return createErrorResponse('DELETE_ERROR', 'Failed to delete line item');
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Failed to delete line item'
      );
    }
  }

  /**
   * Get all line items for a project
   */
  async getByProjectId(projectId: string): Promise<ApiResponse<LineItem[]>> {
    try {
      const lineItems = await this.deps.lineItemRepository.findByProjectId(projectId);
      return createSuccessResponse(lineItems);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch line items for project'
      );
    }
  }

  /**
   * Calculate estimate totals for a project
   */
  async calculateProjectTotals(projectId: string): Promise<ApiResponse<EstimateTotals>> {
    try {
      const lineItems = await this.deps.lineItemRepository.findByProjectId(projectId);
      const totals = calculateEstimateTotals(lineItems);

      return createSuccessResponse(totals);
    } catch (error) {
      return createErrorResponse(
        'CALCULATION_ERROR',
        error instanceof Error ? error.message : 'Failed to calculate totals'
      );
    }
  }

  /**
   * Get comprehensive estimate summary for a project
   */
  async getProjectEstimateSummary(
    projectId: string,
    projectType?: string
  ): Promise<ApiResponse<EstimateSummary>> {
    try {
      const lineItems = await this.deps.lineItemRepository.findByProjectId(projectId);
      const totals = calculateEstimateTotals(lineItems);
      const categoryBreakdown = calculateCategoryBreakdown(lineItems);

      const summary: EstimateSummary = {
        projectId,
        lineItems,
        totals,
        categoryBreakdown,
      };

      // Add recommended markup if project type provided
      if (projectType && totals.totalCost > 0) {
        summary.recommendedMarkup = calculateRecommendedMarkup(
          projectType,
          totals.totalCost
        );
      }

      return createSuccessResponse(summary);
    } catch (error) {
      return createErrorResponse(
        'SUMMARY_ERROR',
        error instanceof Error ? error.message : 'Failed to generate estimate summary'
      );
    }
  }

  /**
   * Apply global markup to all line items in a project
   */
  async applyGlobalMarkup(
    projectId: string,
    markupPercentage: number
  ): Promise<ApiResponse<LineItem[]>> {
    try {
      if (markupPercentage < 0) {
        return createErrorResponse('INVALID_MARKUP', 'Markup percentage cannot be negative');
      }

      const lineItems = await this.deps.lineItemRepository.findByProjectId(projectId);

      if (lineItems.length === 0) {
        return createErrorResponse('NO_LINE_ITEMS', 'No line items found for project');
      }

      const updatedItems = applyGlobalMarkup(lineItems, markupPercentage);

      // Save all updated items
      const savedItems: LineItem[] = [];
      for (const item of updatedItems) {
        const updated = await this.deps.lineItemRepository.update(item.id, item);
        if (updated) {
          savedItems.push(updated);
        }
      }

      return createSuccessResponse(savedItems);
    } catch (error) {
      return createErrorResponse(
        'MARKUP_ERROR',
        error instanceof Error ? error.message : 'Failed to apply markup'
      );
    }
  }

  /**
   * Apply different markups to materials and labor
   */
  async applyDifferentialMarkup(
    projectId: string,
    materialMarkup: number,
    laborMarkup: number
  ): Promise<ApiResponse<LineItem[]>> {
    try {
      if (materialMarkup < 0 || laborMarkup < 0) {
        return createErrorResponse('INVALID_MARKUP', 'Markup percentages cannot be negative');
      }

      const lineItems = await this.deps.lineItemRepository.findByProjectId(projectId);

      if (lineItems.length === 0) {
        return createErrorResponse('NO_LINE_ITEMS', 'No line items found for project');
      }

      const updatedItems = applyDifferentialMarkup(lineItems, materialMarkup, laborMarkup);

      // Save all updated items
      const savedItems: LineItem[] = [];
      for (const item of updatedItems) {
        const updated = await this.deps.lineItemRepository.update(item.id, item);
        if (updated) {
          savedItems.push(updated);
        }
      }

      return createSuccessResponse(savedItems);
    } catch (error) {
      return createErrorResponse(
        'MARKUP_ERROR',
        error instanceof Error ? error.message : 'Failed to apply differential markup'
      );
    }
  }

  /**
   * Copy line items from one project to another
   */
  async copyLineItems(
    sourceProjectId: string,
    targetProjectId: string
  ): Promise<ApiResponse<LineItem[]>> {
    try {
      const sourceItems = await this.deps.lineItemRepository.findByProjectId(
        sourceProjectId
      );

      if (sourceItems.length === 0) {
        return createErrorResponse('NO_LINE_ITEMS', 'No line items found in source project');
      }

      const copiedItems: LineItem[] = [];

      for (const item of sourceItems) {
        const createData: CreateLineItem = {
          projectId: targetProjectId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          isLabor: item.isLabor,
          category: item.category,
          notes: item.notes,
          markup: item.markup,
        };

        const copied = await this.deps.lineItemRepository.create(createData);
        copiedItems.push(copied);
      }

      return createSuccessResponse(copiedItems);
    } catch (error) {
      return createErrorResponse(
        'COPY_ERROR',
        error instanceof Error ? error.message : 'Failed to copy line items'
      );
    }
  }

  /**
   * Delete all line items for a project
   */
  async deleteByProjectId(projectId: string): Promise<ApiResponse<{ count: number }>> {
    try {
      const count = await this.deps.lineItemRepository.deleteByProjectId(projectId);
      return createSuccessResponse({ count });
    } catch (error) {
      return createErrorResponse(
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Failed to delete line items'
      );
    }
  }

  /**
   * Calculate single line item total with markup
   */
  calculateLineItemTotal(lineItem: LineItem): LineItemTotal {
    return calculateLineItemWithMarkup(lineItem);
  }

  /**
   * Get recommended markup for a project
   */
  getRecommendedMarkup(
    projectType: string,
    estimatedCost: number
  ): {
    materialMarkup: number;
    laborMarkup: number;
    reasoning: string;
  } {
    return calculateRecommendedMarkup(projectType, estimatedCost);
  }

  /**
   * Calculate full estimate breakdown for a project
   */
  async calculateEstimate(projectId: string): Promise<
    ApiResponse<{
      projectId: string;
      categories: {
        category: string;
        items: LineItem[];
        subtotal: number;
      }[];
      laborTotal: number;
      materialsTotal: number;
      grandTotal: number;
    }>
  > {
    try {
      const lineItems = await this.deps.lineItemRepository.findByProjectId(projectId);

      if (lineItems.length === 0) {
        return createSuccessResponse({
          projectId,
          categories: [],
          laborTotal: 0,
          materialsTotal: 0,
          grandTotal: 0,
        });
      }

      const categoryBreakdown = calculateCategoryBreakdown(lineItems);
      const totals = calculateEstimateTotals(lineItems);

      // Convert category breakdown to the expected format
      const categories = Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        items: lineItems.filter((item) => item.category === category),
        subtotal: data.price,
      }));

      return createSuccessResponse({
        projectId,
        categories,
        laborTotal: totals.laborPrice,
        materialsTotal: totals.materialPrice,
        grandTotal: totals.totalPrice,
      });
    } catch (error) {
      return createErrorResponse(
        'CALCULATION_ERROR',
        error instanceof Error ? error.message : 'Failed to calculate estimate'
      );
    }
  }

  /**
   * Get estimate summary
   */
  async getEstimateSummary(projectId: string): Promise<
    ApiResponse<{
      projectId: string;
      estimatedCost: number;
      actualCost: number;
      variance: number;
      variancePercentage: number;
      itemCount: number;
      lastUpdated: string;
    }>
  > {
    try {
      const lineItems = await this.deps.lineItemRepository.findByProjectId(projectId);
      const totals = calculateEstimateTotals(lineItems);

      // For now, actualCost equals estimatedCost since we don't track actual costs separately
      // This can be enhanced later when actual cost tracking is implemented
      const estimatedCost = totals.totalCost;
      const actualCost = totals.totalCost;
      const variance = actualCost - estimatedCost;
      const variancePercentage = estimatedCost > 0 ? (variance / estimatedCost) * 100 : 0;

      // Get the most recent update timestamp
      const lastUpdated = lineItems.length > 0
        ? new Date(Math.max(...lineItems.map(item => new Date(item.metadata.updatedAt).getTime()))).toISOString()
        : new Date().toISOString();

      return createSuccessResponse({
        projectId,
        estimatedCost,
        actualCost,
        variance,
        variancePercentage,
        itemCount: lineItems.length,
        lastUpdated,
      });
    } catch (error) {
      return createErrorResponse(
        'SUMMARY_ERROR',
        error instanceof Error ? error.message : 'Failed to generate estimate summary'
      );
    }
  }

  /**
   * Bulk create line items
   */
  async bulkCreateLineItems(
    projectId: string,
    items: CreateLineItem[]
  ): Promise<ApiResponse<LineItem[]>> {
    try {
      if (items.length === 0) {
        return createSuccessResponse([]);
      }

      // Validate all items first
      for (const item of items) {
        const validation = validateCreateLineItem({ ...item, projectId });
        if (!validation.success) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid line item data: ${item.description}`,
              details: validation.error.errors,
            },
          };
        }
      }

      // Create all items
      const createdItems: LineItem[] = [];
      for (const item of items) {
        const created = await this.deps.lineItemRepository.create({
          ...item,
          projectId,
        });
        createdItems.push(created);
      }

      return createSuccessResponse(createdItems);
    } catch (error) {
      return createErrorResponse(
        'BULK_CREATE_ERROR',
        error instanceof Error ? error.message : 'Failed to bulk create line items'
      );
    }
  }
}
