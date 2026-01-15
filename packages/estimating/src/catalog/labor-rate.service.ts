/**
 * Labor Rate Service
 *
 * Specialized service for managing labor rates and crew calculations.
 */

import type { ApiResponse } from '@hooomz/shared-contracts';

import {
  createSuccessResponse,
  createErrorResponse,
} from '@hooomz/shared-contracts';

import type { ICatalogRepository, CatalogItem } from './catalog.repository';

/**
 * Labor Rate Service Dependencies
 */
export interface LaborRateServiceDependencies {
  catalogRepository: ICatalogRepository;
}

/**
 * Crew member for multi-trade calculations
 */
export interface CrewMember {
  trade: string;
  hours: number;
  rate?: number; // Optional override rate
}

/**
 * Crew cost calculation result
 */
export interface CrewCostResult {
  crew: {
    trade: string;
    hours: number;
    rate: number;
    cost: number;
  }[];
  totalHours: number;
  totalCost: number;
  averageRate: number;
}

/**
 * Labor Rate Service
 */
export class LaborRateService {
  constructor(private deps: LaborRateServiceDependencies) {}

  /**
   * Get all labor rates, optionally filtered by trade
   */
  async getLaborRates(trade?: string): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const { items } = await this.deps.catalogRepository.findAll({
        type: 'labor',
        isActive: true,
      });

      let filteredItems = items;
      if (trade) {
        filteredItems = items.filter(
          (item) => item.category.toLowerCase() === trade.toLowerCase()
        );
      }

      return createSuccessResponse(filteredItems);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch labor rates'
      );
    }
  }

  /**
   * Get labor rate by trade name
   */
  async getLaborRateByTrade(trade: string): Promise<ApiResponse<CatalogItem>> {
    try {
      const items = await this.deps.catalogRepository.search(trade, 'labor');

      if (items.length === 0) {
        return createErrorResponse(
          'LABOR_RATE_NOT_FOUND',
          `No labor rate found for trade: ${trade}`
        );
      }

      // Return the first match (or could return all matches)
      return createSuccessResponse(items[0]);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch labor rate'
      );
    }
  }

  /**
   * Update labor rate
   */
  async updateLaborRate(id: string, newRate: number): Promise<ApiResponse<CatalogItem>> {
    try {
      if (newRate < 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Labor rate cannot be negative');
      }

      const existing = await this.deps.catalogRepository.findById(id);
      if (!existing) {
        return createErrorResponse('LABOR_RATE_NOT_FOUND', `Labor rate ${id} not found`);
      }

      if (existing.type !== 'labor') {
        return createErrorResponse(
          'INVALID_TYPE',
          'This item is not a labor rate'
        );
      }

      const updated = await this.deps.catalogRepository.update(id, {
        unitCost: newRate,
      });

      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update labor rate');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update labor rate'
      );
    }
  }

  /**
   * Calculate crew cost for multiple trades working together
   */
  async calculateCrewCost(crew: CrewMember[]): Promise<ApiResponse<CrewCostResult>> {
    try {
      if (!crew || crew.length === 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Crew must have at least one member');
      }

      const crewDetails: CrewCostResult['crew'] = [];
      let totalHours = 0;
      let totalCost = 0;

      for (const member of crew) {
        if (member.hours < 0) {
          return createErrorResponse(
            'VALIDATION_ERROR',
            `Hours cannot be negative for ${member.trade}`
          );
        }

        let rate = member.rate;

        // If no rate provided, look up from catalog
        if (!rate) {
          const items = await this.deps.catalogRepository.search(member.trade, 'labor');

          if (items.length === 0) {
            return createErrorResponse(
              'LABOR_RATE_NOT_FOUND',
              `No labor rate found for trade: ${member.trade}`
            );
          }

          // Use the first matching rate
          rate = items[0].unitCost;
        }

        const cost = member.hours * rate;

        crewDetails.push({
          trade: member.trade,
          hours: member.hours,
          rate,
          cost: Math.round(cost * 100) / 100,
        });

        totalHours += member.hours;
        totalCost += cost;
      }

      const averageRate = totalHours > 0 ? totalCost / totalHours : 0;

      return createSuccessResponse({
        crew: crewDetails,
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        averageRate: Math.round(averageRate * 100) / 100,
      });
    } catch (error) {
      return createErrorResponse(
        'CALCULATION_ERROR',
        error instanceof Error ? error.message : 'Failed to calculate crew cost'
      );
    }
  }

  /**
   * Get all trades (unique categories from labor items)
   */
  async getAllTrades(): Promise<ApiResponse<string[]>> {
    try {
      const { items } = await this.deps.catalogRepository.findAll({
        type: 'labor',
        isActive: true,
      });

      const trades = new Set<string>();
      items.forEach((item) => trades.add(item.category));

      const sortedTrades = Array.from(trades).sort();

      return createSuccessResponse(sortedTrades);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch trades'
      );
    }
  }

  /**
   * Get subcontractor labor rates only
   */
  async getSubcontractorRates(): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const { items } = await this.deps.catalogRepository.findAll({
        type: 'labor',
        supplier: 'Subcontractor',
        isActive: true,
      });

      return createSuccessResponse(items);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch subcontractor rates'
      );
    }
  }

  /**
   * Get in-house labor rates only
   */
  async getInHouseRates(): Promise<ApiResponse<CatalogItem[]>> {
    try {
      const { items } = await this.deps.catalogRepository.findAll({
        type: 'labor',
        isActive: true,
      });

      // Filter out subcontractor rates
      const inHouseItems = items.filter(
        (item) => item.supplier !== 'Subcontractor'
      );

      return createSuccessResponse(inHouseItems);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch in-house rates'
      );
    }
  }

  /**
   * Compare labor rates across different suppliers/sources
   */
  async compareRatesForTrade(
    trade: string
  ): Promise<ApiResponse<{ trade: string; rates: CatalogItem[] }>> {
    try {
      const items = await this.deps.catalogRepository.search(trade, 'labor');

      if (items.length === 0) {
        return createErrorResponse(
          'NO_RATES_FOUND',
          `No labor rates found for trade: ${trade}`
        );
      }

      // Sort by unit cost (rate)
      const sortedItems = items.sort((a, b) => a.unitCost - b.unitCost);

      return createSuccessResponse({
        trade,
        rates: sortedItems,
      });
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to compare rates'
      );
    }
  }
}
