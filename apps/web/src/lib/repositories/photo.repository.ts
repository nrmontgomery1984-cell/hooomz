/**
 * Photo Repository - IndexedDB implementation for offline-first operation
 */

import type {
  Photo,
  CreatePhoto,
  UpdatePhoto,
} from '@hooomz/shared-contracts';
import { generateId, createMetadata, updateMetadata } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

interface PhotoFilters {
  projectId?: string;
  inspectionId?: string;
  tags?: string[];
  takenBy?: string;
  takenAfter?: string;
  takenBefore?: string;
  uploadedToCloud?: boolean;
}

/**
 * IndexedDB-backed Photo Repository
 */
export class PhotoRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.PHOTOS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(filters?: PhotoFilters): Promise<Photo[]> {
    let results = await this.storage.getAll<Photo>(this.storeName);

    if (filters) {
      if (filters.projectId) {
        results = results.filter((p) => p.projectId === filters.projectId);
      }

      if (filters.inspectionId) {
        results = results.filter((p) => p.inspectionId === filters.inspectionId);
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter((p) =>
          filters.tags!.some((tag) => p.tags.includes(tag))
        );
      }

      if (filters.takenBy) {
        results = results.filter((p) => p.takenBy === filters.takenBy);
      }

      if (filters.takenAfter) {
        const afterDate = new Date(filters.takenAfter);
        results = results.filter((p) => new Date(p.timestamp) >= afterDate);
      }

      if (filters.takenBefore) {
        const beforeDate = new Date(filters.takenBefore);
        results = results.filter((p) => new Date(p.timestamp) <= beforeDate);
      }

      if (filters.uploadedToCloud !== undefined) {
        results = results.filter(
          (p) => p.uploadedToCloud === filters.uploadedToCloud
        );
      }
    }

    // Sort by timestamp, newest first
    return results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async findById(id: string): Promise<Photo | null> {
    return await this.storage.get<Photo>(this.storeName, id);
  }

  async findByProjectId(projectId: string): Promise<Photo[]> {
    const photos = await this.storage.getAll<Photo>(this.storeName);
    return photos
      .filter((p) => p.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async findByInspectionId(inspectionId: string): Promise<Photo[]> {
    const photos = await this.storage.getAll<Photo>(this.storeName);
    return photos
      .filter((p) => p.inspectionId === inspectionId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async create(data: CreatePhoto): Promise<Photo> {
    const photo: Photo = {
      id: generateId('photo'),
      projectId: data.projectId,
      inspectionId: data.inspectionId,
      filePath: data.filePath,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      width: data.width,
      height: data.height,
      thumbnailPath: data.thumbnailPath,
      caption: data.metadata.caption,
      tags: data.metadata.tags || [],
      location: data.metadata.location,
      timestamp: data.metadata.timestamp,
      takenBy: data.metadata.takenBy,
      deviceInfo: data.metadata.deviceInfo,
      uploadedToCloud: false, // Initially not uploaded
      metadata: createMetadata(),
    };

    await this.storage.set(this.storeName, photo.id, photo);
    await this.syncQueue.queueCreate(this.storeName, photo.id, photo);

    return photo;
  }

  async update(id: string, data: UpdatePhoto): Promise<Photo> {
    const photo = await this.storage.get<Photo>(this.storeName, id);
    if (!photo) {
      throw new Error(`Photo ${id} not found`);
    }

    const updated: Photo = {
      ...photo,
      ...data,
      metadata: updateMetadata(photo.metadata),
    };

    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.storage.get<Photo>(this.storeName, id);
    if (!existing) {
      throw new Error(`Photo ${id} not found`);
    }

    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
  }

  async findByTag(projectId: string, tag: string): Promise<Photo[]> {
    const photos = await this.storage.getAll<Photo>(this.storeName);
    return photos
      .filter((p) => p.projectId === projectId && p.tags.includes(tag))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async findByTags(projectId: string, tags: string[]): Promise<Photo[]> {
    const photos = await this.storage.getAll<Photo>(this.storeName);
    return photos
      .filter(
        (p) =>
          p.projectId === projectId && tags.some((tag) => p.tags.includes(tag))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Photo[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const photos = await this.storage.getAll<Photo>(this.storeName);

    return photos
      .filter((p) => {
        const photoDate = new Date(p.timestamp);
        return photoDate >= start && photoDate <= end;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async findUnsynced(): Promise<Photo[]> {
    const photos = await this.storage.getAll<Photo>(this.storeName);
    return photos
      .filter((p) => !p.uploadedToCloud)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ); // Oldest first for sync
  }
}
