/**
 * Inspection Repository - IndexedDB implementation for offline-first operation
 */

import type {
  Inspection,
  CreateInspection,
} from '@hooomz/shared-contracts';
import { generateId, createMetadata, updateMetadata, InspectionStatus, InspectionType } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

interface InspectionFilters {
  projectId?: string;
  status?: InspectionStatus;
  type?: InspectionType;
  inspectorName?: string;
  scheduledAfter?: string;
  scheduledBefore?: string;
}

interface InspectionQueryParams {
  filters?: InspectionFilters;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * IndexedDB-backed Inspection Repository
 */
export class InspectionRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.INSPECTIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(params?: InspectionQueryParams): Promise<Inspection[]> {
    let results = await this.storage.getAll<Inspection>(this.storeName);

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.projectId) {
        results = results.filter((i) => i.projectId === filters.projectId);
      }

      if (filters.type) {
        results = results.filter((i) => i.inspectionType === filters.type);
      }

      if (filters.status) {
        results = results.filter((i) => i.status === filters.status);
      }

      if (filters.inspectorName) {
        results = results.filter((i) =>
          i.inspector?.toLowerCase().includes(filters.inspectorName!.toLowerCase())
        );
      }

      if (filters.scheduledAfter) {
        const afterDate = new Date(filters.scheduledAfter);
        results = results.filter((i) => new Date(i.date) >= afterDate);
      }

      if (filters.scheduledBefore) {
        const beforeDate = new Date(filters.scheduledBefore);
        results = results.filter((i) => new Date(i.date) <= beforeDate);
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
      // Default: sort by date, newest first
      results.sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );
    }

    // Apply pagination
    if (params?.page && params?.pageSize) {
      const offset = (params.page - 1) * params.pageSize;
      results = results.slice(offset, offset + params.pageSize);
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
      inspectionType: data.inspectionType,
      status: InspectionStatus.SCHEDULED,
      date: data.date,
      inspector: data.inspector,
      notes: data.notes,
      photos: data.photos || [],
      metadata: createMetadata(),
    };

    await this.storage.set(this.storeName, inspection.id, inspection);
    await this.syncQueue.queueCreate(this.storeName, inspection.id, inspection);

    return inspection;
  }

  async update(id: string, data: Partial<Omit<Inspection, 'id' | 'metadata'>>): Promise<Inspection> {
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
        const inspectionDate = new Date(i.date);
        return (
          i.status === InspectionStatus.SCHEDULED &&
          inspectionDate >= now &&
          inspectionDate <= futureDate
        );
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );
  }

  async findFailed(): Promise<Inspection[]> {
    const inspections = await this.storage.getAll<Inspection>(this.storeName);
    return inspections
      .filter((i) => i.status === InspectionStatus.FAILED)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );
  }

  async findByType(type: InspectionType): Promise<Inspection[]> {
    const inspections = await this.storage.getAll<Inspection>(this.storeName);
    return inspections.filter((i) => i.inspectionType === type);
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
        const inspectionDate = new Date(i.date);
        return inspectionDate >= start && inspectionDate <= end;
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );
  }
}
