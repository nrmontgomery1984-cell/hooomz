/**
 * Inspection Repository - IndexedDB implementation for offline-first operation
 */

import type {
  Inspection,
  CreateInspection,
  UpdateInspection,
  InspectionFilters,
  InspectionType,
  InspectionStatus,
  IInspectionRepository,
} from '@hooomz/field-docs';
import type { QueryParams } from '@hooomz/shared-contracts';
import { generateId, createMetadata, updateMetadata } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

/**
 * IndexedDB-backed Inspection Repository
 */
export class InspectionRepository implements IInspectionRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.INSPECTIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(params?: QueryParams<InspectionFilters>): Promise<Inspection[]> {
    let results = await this.storage.getAll<Inspection>(this.storeName);

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.projectId) {
        results = results.filter((i) => i.projectId === filters.projectId);
      }

      if (filters.type) {
        results = results.filter((i) => i.type === filters.type);
      }

      if (filters.status) {
        results = results.filter((i) => i.status === filters.status);
      }

      if (filters.requiresReinspection !== undefined) {
        results = results.filter(
          (i) => i.requiresReinspection === filters.requiresReinspection
        );
      }

      if (filters.inspectorName) {
        results = results.filter((i) =>
          i.inspectorName?.toLowerCase().includes(filters.inspectorName!.toLowerCase())
        );
      }

      if (filters.scheduledAfter) {
        const afterDate = new Date(filters.scheduledAfter);
        results = results.filter((i) => new Date(i.scheduledDate) >= afterDate);
      }

      if (filters.scheduledBefore) {
        const beforeDate = new Date(filters.scheduledBefore);
        results = results.filter((i) => new Date(i.scheduledDate) <= beforeDate);
      }
    }

    // Apply sorting
    if (params?.sortBy) {
      results.sort((a, b) => {
        const aValue = a[params.sortBy as keyof Inspection] as any;
        const bValue = b[params.sortBy as keyof Inspection] as any;

        if (aValue < bValue) return params.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default: sort by scheduled date, newest first
      results.sort(
        (a, b) =>
          new Date(b.scheduledDate).getTime() -
          new Date(a.scheduledDate).getTime()
      );
    }

    // Apply pagination
    if (params?.limit) {
      const offset = params.offset || 0;
      results = results.slice(offset, offset + params.limit);
    }

    return results;
  }

  async findById(id: string): Promise<Inspection | null> {
    return await this.storage.get<Inspection>(this.storeName, id);
  }

  async findByProjectId(projectId: string): Promise<Inspection[]> {
    const inspections = await this.storage.getAll<Inspection>(this.storeName);
    return inspections.filter((i) => i.projectId === projectId);
  }

  async create(data: CreateInspection): Promise<Inspection> {
    const inspection: Inspection = {
      id: generateId('inspection'),
      projectId: data.projectId,
      type: data.type,
      status: 'scheduled',
      scheduledDate: data.scheduledDate,
      inspectorName: data.inspectorName,
      inspectorContact: data.inspectorContact,
      notes: data.notes,
      requiresReinspection: false,
      metadata: createMetadata(),
    };

    await this.storage.set(this.storeName, inspection.id, inspection);
    await this.syncQueue.queueCreate(this.storeName, inspection.id, inspection);

    return inspection;
  }

  async update(id: string, data: UpdateInspection): Promise<Inspection> {
    const inspection = await this.storage.get<Inspection>(this.storeName, id);
    if (!inspection) {
      throw new Error(`Inspection ${id} not found`);
    }

    const updated: Inspection = {
      ...inspection,
      ...data,
      metadata: updateMetadata(inspection.metadata),
    };

    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.storage.get<Inspection>(this.storeName, id);
    if (!existing) {
      throw new Error(`Inspection ${id} not found`);
    }

    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
  }

  async findUpcoming(days: number = 7): Promise<Inspection[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const inspections = await this.storage.getAll<Inspection>(this.storeName);

    return inspections
      .filter((i) => {
        const scheduledDate = new Date(i.scheduledDate);
        return (
          i.status === 'scheduled' &&
          scheduledDate >= now &&
          scheduledDate <= futureDate
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );
  }

  async findFailed(): Promise<Inspection[]> {
    const inspections = await this.storage.getAll<Inspection>(this.storeName);
    return inspections
      .filter((i) => i.status === 'failed' || i.requiresReinspection)
      .sort(
        (a, b) =>
          new Date(b.completedDate || b.scheduledDate).getTime() -
          new Date(a.completedDate || a.scheduledDate).getTime()
      );
  }

  async findByType(type: InspectionType): Promise<Inspection[]> {
    const inspections = await this.storage.getAll<Inspection>(this.storeName);
    return inspections.filter((i) => i.type === type);
  }

  async findByStatus(status: InspectionStatus): Promise<Inspection[]> {
    const inspections = await this.storage.getAll<Inspection>(this.storeName);
    return inspections.filter((i) => i.status === status);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Inspection[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const inspections = await this.storage.getAll<Inspection>(this.storeName);

    return inspections
      .filter((i) => {
        const scheduledDate = new Date(i.scheduledDate);
        return scheduledDate >= start && scheduledDate <= end;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );
  }
}
