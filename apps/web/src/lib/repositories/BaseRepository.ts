/**
 * Base Repository
 * Abstract class with common CRUD patterns for offline-first repositories
 */

import type { ApiResponse, Metadata } from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@hooomz/shared-contracts';
import type { StorageAdapter, StoreName } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export interface BaseEntity {
  id: string;
  metadata: Metadata;
}

export interface CreateData {
  [key: string]: any;
}

export interface UpdateData {
  [key: string]: any;
}

export abstract class BaseRepository<
  T extends BaseEntity,
  TCreate extends CreateData = CreateData,
  TUpdate extends UpdateData = UpdateData,
> {
  protected storage: StorageAdapter;
  protected storeName: StoreName;
  protected syncQueue: SyncQueue;

  constructor(storage: StorageAdapter, storeName: StoreName) {
    this.storage = storage;
    this.storeName = storeName;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  /**
   * Generate a unique ID for new entities
   */
  protected generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Create metadata for new entities
   */
  protected createMetadata(): Metadata {
    const now = new Date().toISOString();
    return {
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
  }

  /**
   * Update metadata for existing entities
   */
  protected updateMetadata(existing: Metadata): Metadata {
    return {
      ...existing,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
  }

  /**
   * Create a new entity
   */
  async create(data: TCreate): Promise<ApiResponse<T>> {
    try {
      const id = this.generateId(this.getIdPrefix());
      const entity = this.buildEntity(id, data);

      await this.storage.set(this.storeName, id, entity);

      // Queue for sync
      await this.syncQueue.queueCreate(this.storeName, id, entity);

      return createSuccessResponse(entity);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        `Failed to create ${this.storeName}`,
        { error }
      );
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<ApiResponse<T | null>> {
    try {
      const entity = await this.storage.get<T>(this.storeName, id);
      return createSuccessResponse(entity);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        `Failed to find ${this.storeName}`,
        { error }
      );
    }
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<ApiResponse<T[]>> {
    try {
      const entities = await this.storage.getAll<T>(this.storeName);
      return createSuccessResponse(entities);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        `Failed to find all ${this.storeName}`,
        { error }
      );
    }
  }

  /**
   * Update an entity
   */
  async update(id: string, data: TUpdate): Promise<ApiResponse<T>> {
    try {
      const existing = await this.storage.get<T>(this.storeName, id);

      if (!existing) {
        return createErrorResponse(
          'NOT_FOUND',
          `${this.storeName} not found`
        );
      }

      const updated = this.mergeUpdate(existing, data);

      await this.storage.set(this.storeName, id, updated);

      // Queue for sync
      await this.syncQueue.queueUpdate(this.storeName, id, updated);

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        `Failed to update ${this.storeName}`,
        { error }
      );
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const existing = await this.storage.get<T>(this.storeName, id);

      if (!existing) {
        return createErrorResponse(
          'NOT_FOUND',
          `${this.storeName} not found`
        );
      }

      await this.storage.delete(this.storeName, id);

      // Queue for sync
      await this.syncQueue.queueDelete(this.storeName, id);

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        `Failed to delete ${this.storeName}`,
        { error }
      );
    }
  }

  /**
   * Query entities with a predicate
   */
  async query(
    predicate: (entity: T) => boolean
  ): Promise<ApiResponse<T[]>> {
    try {
      const entities = await this.storage.query<T>(this.storeName, predicate);
      return createSuccessResponse(entities);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        `Failed to query ${this.storeName}`,
        { error }
      );
    }
  }

  /**
   * Get the ID prefix for this entity type
   * Must be implemented by subclasses
   */
  protected abstract getIdPrefix(): string;

  /**
   * Build a complete entity from create data
   * Must be implemented by subclasses
   */
  protected abstract buildEntity(id: string, data: TCreate): T;

  /**
   * Merge update data with existing entity
   * Must be implemented by subclasses
   */
  protected abstract mergeUpdate(existing: T, data: TUpdate): T;
}
