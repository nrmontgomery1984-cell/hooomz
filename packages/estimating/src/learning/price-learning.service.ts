/**
 * Price Learning Service
 * Records material prices and calculates baselines for Smart Estimating
 *
 * Learning Flow:
 * Receipt/Invoice uploaded → Extract line items → Record to price_history → Update baselines
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PriceHistoryRecord,
  CreatePriceHistoryRecord,
  PriceBaseline,
  ConfidenceLevel,
} from './types';

export class PriceLearningService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Record a price from a receipt, invoice, or manual entry
   */
  async recordPrice(
    orgId: string,
    data: CreatePriceHistoryRecord
  ): Promise<PriceHistoryRecord> {
    const { data: record, error } = await this.supabase
      .from('price_history')
      .insert({
        organization_id: orgId,
        item_name: data.item_name,
        sku: data.sku,
        unit_price: data.unit_price,
        unit: data.unit,
        quantity: data.quantity ?? 1,
        vendor: data.vendor,
        source_type: data.source_type,
        source_id: data.source_id,
        source_url: data.source_url,
        project_id: data.project_id,
        work_category: data.work_category,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record price: ${error.message}`);
    }

    return record;
  }

  /**
   * Record multiple prices at once (e.g., from a receipt with many items)
   */
  async recordPrices(
    orgId: string,
    items: CreatePriceHistoryRecord[]
  ): Promise<PriceHistoryRecord[]> {
    const records = items.map((item) => ({
      organization_id: orgId,
      item_name: item.item_name,
      sku: item.sku,
      unit_price: item.unit_price,
      unit: item.unit,
      quantity: item.quantity ?? 1,
      vendor: item.vendor,
      source_type: item.source_type,
      source_id: item.source_id,
      source_url: item.source_url,
      project_id: item.project_id,
      work_category: item.work_category,
      recorded_at: new Date().toISOString(),
    }));

    const { data, error } = await this.supabase
      .from('price_history')
      .insert(records)
      .select();

    if (error) {
      throw new Error(`Failed to record prices: ${error.message}`);
    }

    return data;
  }

  /**
   * Get the baseline price for an item
   * Uses the v_price_baselines view for calculated averages
   */
  async getBaseline(orgId: string, itemName: string): Promise<PriceBaseline | null> {
    const { data, error } = await this.supabase
      .from('v_price_baselines')
      .select('*')
      .eq('organization_id', orgId)
      .ilike('item_name', `%${itemName}%`)
      .limit(1)
      .single();

    if (error) {
      // No baseline found is not an error
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get price baseline: ${error.message}`);
    }

    return data;
  }

  /**
   * Search for baselines matching a query
   */
  async searchBaselines(
    orgId: string,
    query: string,
    limit = 10
  ): Promise<PriceBaseline[]> {
    const { data, error } = await this.supabase
      .from('v_price_baselines')
      .select('*')
      .eq('organization_id', orgId)
      .ilike('item_name', `%${query}%`)
      .order('data_point_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search price baselines: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get recent price history for an item
   */
  async getPriceHistory(
    orgId: string,
    itemName: string,
    limit = 20
  ): Promise<PriceHistoryRecord[]> {
    const { data, error } = await this.supabase
      .from('price_history')
      .select('*')
      .eq('organization_id', orgId)
      .ilike('item_name', `%${itemName}%`)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get price history: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get the confidence level based on data point count
   */
  getConfidenceLevel(dataPointCount: number): ConfidenceLevel {
    if (dataPointCount >= 3) return 'verified';
    if (dataPointCount >= 1) return 'limited';
    return 'estimate';
  }

  /**
   * Calculate a suggested price for an item
   * Returns the baseline if available, or null if no data
   */
  async getSuggestedPrice(
    orgId: string,
    itemName: string
  ): Promise<{ price: number; confidence: ConfidenceLevel; dataPoints: number } | null> {
    const baseline = await this.getBaseline(orgId, itemName);

    if (!baseline) {
      return null;
    }

    return {
      price: baseline.avg_price,
      confidence: baseline.confidence,
      dataPoints: baseline.data_point_count,
    };
  }
}
