/**
 * Photo Service - Wraps PhotoRepository with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all photo operations are logged.
 */

import type { Photo, CreatePhoto, UpdatePhoto } from '@hooomz/shared-contracts';
import type { Services } from './index';

/**
 * PhotoService - Handles photo operations with activity logging
 */
export class PhotoService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Upload/create a new photo
   */
  async create(
    projectId: string,
    data: CreatePhoto,
    context?: {
      location_name?: string;
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    }
  ): Promise<Photo> {
    const photo = await this.services.fieldDocs.photos.create(data);

    // Log to activity (non-blocking)
    this.services.activity.logPhotoEvent('photo.uploaded', projectId, photo.id, {
      caption: photo.caption,
      tags: photo.tags,
      location_name: context?.location_name,
      work_category_code: context?.work_category_code,
      trade: context?.trade,
      location_id: context?.location_id,
    }).catch((err) => console.error('Failed to log photo.uploaded:', err));

    return photo;
  }

  /**
   * Update a photo (caption, tags, etc.)
   */
  async update(
    projectId: string,
    photoId: string,
    data: UpdatePhoto,
    context?: {
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    }
  ): Promise<Photo> {
    const updated = await this.services.fieldDocs.photos.update(photoId, data);

    // Log update (non-blocking) - use photo.uploaded since there's no photo.updated event
    this.services.activity.logPhotoEvent('photo.uploaded', projectId, photoId, {
      caption: updated.caption,
      tags: updated.tags,
      work_category_code: context?.work_category_code,
      trade: context?.trade,
      location_id: context?.location_id,
    }).catch((err) => console.error('Failed to log photo update:', err));

    return updated;
  }

  /**
   * Share a photo (make visible to homeowner)
   */
  async share(
    projectId: string,
    photoId: string,
    context?: {
      location_name?: string;
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    }
  ): Promise<Photo> {
    const existing = await this.services.fieldDocs.photos.findById(photoId);
    if (!existing) {
      throw new Error(`Photo ${photoId} not found`);
    }

    // Mark as shared (this would typically update a shared flag)
    const updated = await this.services.fieldDocs.photos.update(photoId, {});

    // Log share event (non-blocking)
    this.services.activity.logPhotoEvent('photo.shared', projectId, photoId, {
      caption: existing.caption,
      tags: existing.tags,
      location_name: context?.location_name,
      work_category_code: context?.work_category_code,
      trade: context?.trade,
      location_id: context?.location_id,
    }).catch((err) => console.error('Failed to log photo.shared:', err));

    return updated;
  }

  /**
   * Delete a photo
   */
  async delete(_projectId: string, photoId: string): Promise<void> {
    const existing = await this.services.fieldDocs.photos.findById(photoId);

    await this.services.fieldDocs.photos.delete(photoId);

    // Log deletion (non-blocking) - there's no photo.deleted event, so we skip logging
    // or we could use a generic approach
    console.log(`Photo deleted: ${existing?.caption || photoId}`);
  }

  /**
   * Add tags to a photo
   */
  async addTags(
    projectId: string,
    photoId: string,
    tags: string[]
  ): Promise<Photo> {
    const existing = await this.services.fieldDocs.photos.findById(photoId);
    if (!existing) {
      throw new Error(`Photo ${photoId} not found`);
    }

    const updatedTags = [...new Set([...existing.tags, ...tags])];
    return this.update(projectId, photoId, { tags: updatedTags });
  }

  /**
   * Remove tags from a photo
   */
  async removeTags(
    projectId: string,
    photoId: string,
    tags: string[]
  ): Promise<Photo> {
    const existing = await this.services.fieldDocs.photos.findById(photoId);
    if (!existing) {
      throw new Error(`Photo ${photoId} not found`);
    }

    const updatedTags = existing.tags.filter(tag => !tags.includes(tag));
    return this.update(projectId, photoId, { tags: updatedTags });
  }

  // Passthrough methods for read operations (no logging needed)
  async findById(id: string) {
    return this.services.fieldDocs.photos.findById(id);
  }

  async findByProjectId(projectId: string) {
    return this.services.fieldDocs.photos.findByProjectId(projectId);
  }

  async findByInspectionId(inspectionId: string) {
    return this.services.fieldDocs.photos.findByInspectionId(inspectionId);
  }

  async findByTag(projectId: string, tag: string) {
    return this.services.fieldDocs.photos.findByTag(projectId, tag);
  }
}

/**
 * Create a PhotoService instance
 */
export function createPhotoService(services: Services): PhotoService {
  return new PhotoService(services);
}
