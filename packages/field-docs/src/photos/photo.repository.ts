/**
 * Photo Repository - Data access layer for field photos
 * Designed for offline-first operation with image handling
 */

import type { ApiResponse, Metadata } from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
  generateId,
  createMetadata,
  updateMetadata,
} from '@hooomz/shared-contracts';

/**
 * Photo metadata for field documentation
 */
export interface PhotoMetadata {
  caption?: string;
  tags?: string[]; // e.g., 'framing', 'electrical', 'plumbing', 'before', 'after', 'damage'
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: string; // When photo was taken
  takenBy?: string; // User who took the photo
  deviceInfo?: string; // Device/camera used
}

/**
 * Photo entity
 */
export interface Photo {
  id: string;
  projectId: string;
  inspectionId?: string; // If photo is part of an inspection
  filePath: string; // Local file path or URL
  fileSize?: number; // In bytes
  mimeType?: string; // e.g., 'image/jpeg', 'image/png'
  width?: number;
  height?: number;
  thumbnailPath?: string; // Thumbnail for quick loading
  caption?: string;
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: string; // When photo was taken
  takenBy?: string;
  deviceInfo?: string;
  uploadedToCloud: boolean; // Track sync status for offline support
  metadata: Metadata;
}

/**
 * Create photo data
 */
export interface CreatePhoto {
  projectId: string;
  inspectionId?: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  thumbnailPath?: string;
  metadata: PhotoMetadata;
}

/**
 * Update photo data
 */
export interface UpdatePhoto {
  caption?: string;
  tags?: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  uploadedToCloud?: boolean;
}

/**
 * Photo filters
 */
export interface PhotoFilters {
  projectId?: string;
  inspectionId?: string;
  tags?: string[];
  takenBy?: string;
  takenAfter?: string;
  takenBefore?: string;
  uploadedToCloud?: boolean;
}

/**
 * Photo repository interface
 */
export interface IPhotoRepository {
  // CRUD operations
  findAll(filters?: PhotoFilters): Promise<Photo[]>;
  findById(id: string): Promise<Photo | null>;
  findByProjectId(projectId: string): Promise<Photo[]>;
  findByInspectionId(inspectionId: string): Promise<Photo[]>;
  create(data: CreatePhoto): Promise<Photo>;
  update(id: string, data: UpdatePhoto): Promise<Photo>;
  delete(id: string): Promise<void>;

  // Specialized queries
  findByTag(projectId: string, tag: string): Promise<Photo[]>;
  findByTags(projectId: string, tags: string[]): Promise<Photo[]>;
  findByDateRange(startDate: string, endDate: string): Promise<Photo[]>;
  findUnsynced(): Promise<Photo[]>; // Photos not uploaded to cloud
}

/**
 * In-memory implementation of photo repository
 * Suitable for offline-first operation with local storage
 */
export class InMemoryPhotoRepository implements IPhotoRepository {
  private photos: Map<string, Photo> = new Map();

  /**
   * Find all photos with optional filtering
   */
  async findAll(filters?: PhotoFilters): Promise<Photo[]> {
    let results = Array.from(this.photos.values());

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

  /**
   * Find photo by ID
   */
  async findById(id: string): Promise<Photo | null> {
    return this.photos.get(id) || null;
  }

  /**
   * Find all photos for a project
   */
  async findByProjectId(projectId: string): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter((p) => p.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  /**
   * Find all photos for an inspection
   */
  async findByInspectionId(inspectionId: string): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter((p) => p.inspectionId === inspectionId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  /**
   * Create new photo
   */
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

    this.photos.set(photo.id, photo);
    return photo;
  }

  /**
   * Update existing photo
   */
  async update(id: string, data: UpdatePhoto): Promise<Photo> {
    const photo = this.photos.get(id);
    if (!photo) {
      throw new Error(`Photo ${id} not found`);
    }

    const updated: Photo = {
      ...photo,
      ...data,
      metadata: updateMetadata(photo.metadata),
    };

    this.photos.set(id, updated);
    return updated;
  }

  /**
   * Delete photo
   */
  async delete(id: string): Promise<void> {
    if (!this.photos.has(id)) {
      throw new Error(`Photo ${id} not found`);
    }
    this.photos.delete(id);
  }

  /**
   * Find photos by single tag
   */
  async findByTag(projectId: string, tag: string): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter((p) => p.projectId === projectId && p.tags.includes(tag))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  /**
   * Find photos by multiple tags (OR logic)
   */
  async findByTags(projectId: string, tags: string[]): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(
        (p) =>
          p.projectId === projectId &&
          tags.some((tag) => p.tags.includes(tag))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  /**
   * Find photos within date range
   */
  async findByDateRange(startDate: string, endDate: string): Promise<Photo[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return Array.from(this.photos.values())
      .filter((p) => {
        const photoDate = new Date(p.timestamp);
        return photoDate >= start && photoDate <= end;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  /**
   * Find photos not yet uploaded to cloud (for offline sync)
   */
  async findUnsynced(): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter((p) => !p.uploadedToCloud)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ); // Oldest first for sync
  }
}
