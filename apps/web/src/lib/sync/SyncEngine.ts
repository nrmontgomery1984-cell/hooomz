/**
 * SyncEngine — Cross-device sync via Supabase generic sync_data table.
 *
 * Strategy:
 *   Push: Every SyncQueue mutation is upserted to sync_data as JSONB.
 *   Pull: On app load, fetch all sync_data rows and merge into IndexedDB.
 *   Conflict resolution: Last-write-wins using metadata.updatedAt.
 *
 * The sync_data table stores:
 *   (store_name, id) → { data: JSONB, updated_at, device_id, deleted }
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { SyncQueueItem } from '../repositories/SyncQueue';

/**
 * Stores that should be synced to Supabase.
 * Excludes local-only stores (drafts, UI state, sync infrastructure).
 */
const SYNCED_STORES: Set<string> = new Set([
  // Core
  StoreNames.PROJECTS,
  StoreNames.TASKS,
  StoreNames.CUSTOMERS_V2,
  StoreNames.ACTIVITY_EVENTS,
  StoreNames.LINE_ITEMS,
  StoreNames.CATALOG_ITEMS,
  StoreNames.INSPECTIONS,
  StoreNames.PHOTOS,
  // Crew & scheduling
  StoreNames.CREW_MEMBERS,
  StoreNames.TRAINING_RECORDS,
  StoreNames.TASK_BUDGETS,
  StoreNames.DEPLOYED_TASKS,
  StoreNames.SOP_TASK_BLUEPRINTS,
  StoreNames.CREW_SCHEDULE_BLOCKS,
  StoreNames.SCHEDULE_NOTES,
  StoreNames.TIME_ENTRIES,
  // Sales pipeline
  StoreNames.CONSULTATIONS,
  StoreNames.QUOTES,
  // Finance
  StoreNames.EXPENSES,
  StoreNames.INVOICES,
  StoreNames.PAYMENTS,
  StoreNames.COST_CATALOG,
  StoreNames.SKILL_RATE_CONFIG,
  StoreNames.FORECAST_CONFIGS,
  StoreNames.FORECAST_SNAPSHOTS,
  // Integration
  StoreNames.CHANGE_ORDERS,
  StoreNames.CHANGE_ORDER_LINE_ITEMS,
  // Standards
  StoreNames.SOPS,
  StoreNames.SOP_CHECKLIST_ITEM_TEMPLATES,
  StoreNames.TRAINING_GUIDES,
  StoreNames.CHECKLIST_SUBMISSIONS,
  // Labs
  StoreNames.FIELD_OBSERVATIONS,
  StoreNames.LABS_PRODUCTS,
  StoreNames.LABS_TECHNIQUES,
  StoreNames.LABS_TOOL_METHODS,
  StoreNames.LABS_COMBINATIONS,
  StoreNames.LABS_TESTS,
  StoreNames.LABS_TOKENS,
  StoreNames.LABS_VOTE_BALLOTS,
  StoreNames.LABS_VOTES,
  StoreNames.EXPERIMENTS,
  StoreNames.KNOWLEDGE_ITEMS,
  // Tool Research
  StoreNames.TOOL_PLATFORMS,
  StoreNames.TOOL_RESEARCH_ITEMS,
  StoreNames.TOOL_INVENTORY,
  // Workflows
  StoreNames.WORKFLOWS,
  // Material Selection (Block 2)
  StoreNames.CATALOG_PRODUCTS,
  StoreNames.PROJECT_MATERIAL_SELECTIONS,
  // RoomScan (Block 3)
  StoreNames.ROOM_SCANS,
  StoreNames.ROOMS,
  // Layout Selector (Block 4)
  StoreNames.FLOORING_LAYOUTS,
  // Trim Cut Calculator (Block 5)
  StoreNames.MILLWORK_ASSEMBLY_CONFIGS,
  StoreNames.TRIM_CALCULATIONS,
]);

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('hooomz_device_id');
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('hooomz_device_id', id);
  }
  return id;
}

export class SyncEngine {
  private static instance: SyncEngine | null = null;
  private storage: StorageAdapter;
  private deviceId: string;
  private isPulling = false;
  private isPushing = false;

  private constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.deviceId = getDeviceId();
  }

  static getInstance(storage: StorageAdapter): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine(storage);
    }
    return SyncEngine.instance;
  }

  static resetInstance(): void {
    SyncEngine.instance = null;
  }

  /** Should this store be synced to Supabase? */
  shouldSync(storeName: string): boolean {
    return SYNCED_STORES.has(storeName);
  }

  /**
   * Push a single SyncQueue item to Supabase.
   * Called from ActivitySyncService.sendToServer().
   */
  async pushItem(item: SyncQueueItem): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    if (!this.shouldSync(item.storeName)) {
      return { success: true };
    }

    try {
      if (item.operation === 'delete') {
        const { error } = await supabase
          .from('sync_data')
          .upsert(
            {
              id: item.entityId,
              store_name: item.storeName,
              data: {},
              updated_at: new Date().toISOString(),
              device_id: this.deviceId,
              deleted: true,
            },
            { onConflict: 'store_name,id' }
          );

        if (error) return { success: false, error: error.message };
      } else {
        // create or update — push the full entity
        const { error } = await supabase
          .from('sync_data')
          .upsert(
            {
              id: item.entityId,
              store_name: item.storeName,
              data: item.data,
              updated_at: item.data?.metadata?.updatedAt || new Date().toISOString(),
              device_id: this.deviceId,
              deleted: false,
            },
            { onConflict: 'store_name,id' }
          );

        if (error) return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown sync error',
      };
    }
  }

  /**
   * Pull ALL remote data and merge into IndexedDB.
   * Strategy: last-write-wins by metadata.updatedAt.
   * Called on app init.
   */
  async pullAll(): Promise<{ pulled: number; merged: number; errors: string[] }> {
    if (!isSupabaseConfigured()) {
      return { pulled: 0, merged: 0, errors: [] };
    }

    if (this.isPulling) {
      return { pulled: 0, merged: 0, errors: ['Pull already in progress'] };
    }

    this.isPulling = true;
    const result = { pulled: 0, merged: 0, errors: [] as string[] };

    try {
      // Paginate through all non-deleted rows
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('sync_data')
          .select('*')
          .eq('deleted', false)
          .range(offset, offset + limit - 1)
          .order('updated_at', { ascending: false });

        if (error) {
          result.errors.push(error.message);
          break;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        result.pulled += data.length;

        // Merge each row into local IndexedDB
        for (const row of data) {
          if (!this.shouldSync(row.store_name)) continue;

          try {
            const local = await this.storage.get<any>(row.store_name, row.id);

            if (!local) {
              // Remote has it, local doesn't — write it
              await this.storage.set(row.store_name, row.id, row.data);
              result.merged++;
            } else {
              // Both exist — last-write-wins
              const localUpdated =
                local.metadata?.updatedAt || local.updatedAt || '';
              const remoteUpdated =
                row.data?.metadata?.updatedAt ||
                row.data?.updatedAt ||
                row.updated_at;

              if (remoteUpdated > localUpdated) {
                await this.storage.set(row.store_name, row.id, row.data);
                result.merged++;
              }
            }
          } catch (err) {
            result.errors.push(
              `Merge ${row.store_name}/${row.id}: ${err instanceof Error ? err.message : err}`
            );
          }
        }

        offset += limit;
        if (data.length < limit) hasMore = false;
      }

      // Handle remote deletions — remove from IndexedDB
      const { data: deletedRows, error: delError } = await supabase
        .from('sync_data')
        .select('id, store_name')
        .eq('deleted', true);

      if (!delError && deletedRows) {
        for (const row of deletedRows) {
          if (!this.shouldSync(row.store_name)) continue;
          try {
            const local = await this.storage.get<any>(row.store_name, row.id);
            if (local) {
              await this.storage.delete(row.store_name, row.id);
              result.merged++;
            }
          } catch {
            // Skip deletion errors silently
          }
        }
      }
    } finally {
      this.isPulling = false;
    }

    return result;
  }

  /**
   * Push ALL local data from synced stores to Supabase.
   * Called once per device for initial upload.
   */
  async pushAll(): Promise<{ pushed: number; errors: string[] }> {
    if (!isSupabaseConfigured()) {
      return { pushed: 0, errors: [] };
    }

    if (this.isPushing) {
      return { pushed: 0, errors: ['Push already in progress'] };
    }

    this.isPushing = true;
    const result = { pushed: 0, errors: [] as string[] };

    try {
      for (const storeName of SYNCED_STORES) {
        try {
          const items = await this.storage.getAll<any>(storeName);
          if (items.length === 0) continue;

          // Batch upsert in chunks of 100
          const chunkSize = 100;
          for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            const rows = chunk
              .filter((item) => item && item.id)
              .map((item) => ({
                id: item.id,
                store_name: storeName,
                data: item,
                updated_at:
                  item.metadata?.updatedAt ||
                  item.updatedAt ||
                  new Date().toISOString(),
                device_id: this.deviceId,
                deleted: false,
              }));

            if (rows.length === 0) continue;

            const { error } = await supabase
              .from('sync_data')
              .upsert(rows, { onConflict: 'store_name,id' });

            if (error) {
              result.errors.push(`${storeName}: ${error.message}`);
            } else {
              result.pushed += rows.length;
            }
          }
        } catch (err) {
          result.errors.push(
            `${storeName}: ${err instanceof Error ? err.message : err}`
          );
        }
      }
    } finally {
      this.isPushing = false;
    }

    return result;
  }

  /** Check if Supabase is configured and the sync_data table is accessible */
  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('sync_data')
        .select('id')
        .limit(1);

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
