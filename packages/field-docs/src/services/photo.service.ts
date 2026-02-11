/**
 * Photo Service
 * Business logic for photo management
 */

import type { ActivityEventType } from '@hooomz/shared';
import { EVENT_VISIBILITY_DEFAULTS } from '@hooomz/shared';
import type { IPhotoRepository } from '../repositories';
import type {
  Photo,
  CreatePhoto,
  UpdatePhoto,
  PhotoFilters,
  PhotosByDate,
  PhotoStats,
  PhotoContext,
} from '../types';

// Activity service interface
export interface ActivityService {
  log(event: {
    organization_id: string;
    project_id: string;
    property_id: string;
    event_type: ActivityEventType;
    actor_id: string;
    actor_type: 'team_member' | 'system' | 'customer';
    entity_type: string;
    entity_id: string;
    homeowner_visible: boolean;
    event_data: Record<string, unknown>;
    loop_iteration_id?: string | null;
  }): Promise<void>;
}

// Storage service interface
export interface StorageService {
  uploadPhoto(
    organizationId: string,
    projectId: string,
    file: File | Blob,
    filename: string
  ): Promise<{ storagePath: string; thumbnailPath?: string }>;
  deletePhoto(storagePath: string): Promise<void>;
  getSignedUrl(storagePath: string, expiresIn?: number): Promise<string>;
}

export interface PhotoServiceDependencies {
  photoRepo: IPhotoRepository;
  storageService?: StorageService;
  activityService?: ActivityService;
}

export class PhotoService {
  private photoRepo: IPhotoRepository;
  private storageService?: StorageService;
  private activityService?: ActivityService;

  constructor(deps: PhotoServiceDependencies) {
    this.photoRepo = deps.photoRepo;
    this.storageService = deps.storageService;
    this.activityService = deps.activityService;
  }

  async uploadPhoto(
    organizationId: string,
    projectId: string,
    propertyId: string,
    file: File | Blob,
    filename: string,
    uploadedBy: string,
    context?: PhotoContext,
    options?: { caption?: string; tags?: string[] }
  ): Promise<Photo> {
    if (!this.storageService) {
      throw new Error('Storage service not configured');
    }

    // Upload to storage
    const { storagePath, thumbnailPath } = await this.storageService.uploadPhoto(
      organizationId,
      projectId,
      file,
      filename
    );

    // Create photo record
    const photo = await this.photoRepo.create({
      organization_id: organizationId,
      project_id: projectId,
      property_id: propertyId,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      uploaded_by: uploadedBy,
      location_id: context?.location_id,
      work_category_code: context?.work_category_code,
      task_instance_id: context?.task_instance_id,
      caption: options?.caption,
      tags: options?.tags,
    });

    // Log activity
    if (this.activityService) {
      await this.activityService.log({
        organization_id: organizationId,
        project_id: projectId,
        property_id: propertyId,
        event_type: 'photo.uploaded',
        actor_id: uploadedBy,
        actor_type: 'team_member',
        entity_type: 'photo',
        entity_id: photo.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['photo.uploaded'],
        event_data: { caption: photo.caption, tags: photo.tags },
        loop_iteration_id: context?.location_id,
      });
    }

    return photo;
  }

  async createPhotoRecord(data: CreatePhoto, actorId: string): Promise<Photo> {
    const photo = await this.photoRepo.create(data);

    if (this.activityService) {
      await this.activityService.log({
        organization_id: data.organization_id,
        project_id: data.project_id,
        property_id: data.property_id,
        event_type: 'photo.uploaded',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'photo',
        entity_id: photo.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['photo.uploaded'],
        event_data: { caption: photo.caption, tags: photo.tags },
        loop_iteration_id: data.location_id,
      });
    }

    return photo;
  }

  async getPhoto(id: string): Promise<Photo | null> {
    return this.photoRepo.findById(id);
  }

  async getPhotoWithUrl(id: string): Promise<(Photo & { url: string }) | null> {
    const photo = await this.photoRepo.findById(id);
    if (!photo || !this.storageService) return null;

    const url = await this.storageService.getSignedUrl(photo.storage_path);
    return { ...photo, url };
  }

  async listByProject(projectId: string): Promise<Photo[]> {
    return this.photoRepo.findByProject(projectId);
  }

  async listByProperty(propertyId: string): Promise<Photo[]> {
    return this.photoRepo.findByProperty(propertyId);
  }

  async listByFilters(filters: PhotoFilters): Promise<Photo[]> {
    return this.photoRepo.findByFilters(filters);
  }

  async updatePhoto(id: string, data: UpdatePhoto): Promise<Photo> {
    return this.photoRepo.update(id, data);
  }

  async deletePhoto(id: string): Promise<void> {
    const photo = await this.photoRepo.findById(id);
    if (!photo) return;

    // Delete from storage
    if (this.storageService) {
      await this.storageService.deletePhoto(photo.storage_path);
      if (photo.thumbnail_path) {
        await this.storageService.deletePhoto(photo.thumbnail_path);
      }
    }

    // Delete record
    await this.photoRepo.delete(id);
  }

  async shareToPortal(id: string, actorId: string): Promise<Photo> {
    const photo = await this.photoRepo.shareToPortal(id);

    if (this.activityService) {
      await this.activityService.log({
        organization_id: photo.organization_id,
        project_id: photo.project_id,
        property_id: photo.property_id,
        event_type: 'photo.shared',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'photo',
        entity_id: photo.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['photo.shared'],
        event_data: { caption: photo.caption },
        loop_iteration_id: photo.location_id,
      });
    }

    return photo;
  }

  async unshareFromPortal(id: string): Promise<Photo> {
    return this.photoRepo.unshareFromPortal(id);
  }

  async getSharedPhotos(propertyId: string): Promise<Photo[]> {
    return this.photoRepo.findSharedByProperty(propertyId);
  }

  async groupByDate(projectId: string): Promise<PhotosByDate[]> {
    const photos = await this.photoRepo.findByProject(projectId);

    const grouped = new Map<string, Photo[]>();
    for (const photo of photos) {
      const date = photo.taken_at.split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(photo);
    }

    return Array.from(grouped.entries())
      .map(([date, photos]) => ({ date, photos }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getStats(projectId: string): Promise<PhotoStats> {
    const photos = await this.photoRepo.findByProject(projectId);

    const stats: PhotoStats = {
      total_count: photos.length,
      shared_count: photos.filter(p => p.shared_to_portal).length,
      by_location: {},
      by_work_category: {},
    };

    for (const photo of photos) {
      if (photo.location_id) {
        stats.by_location[photo.location_id] = (stats.by_location[photo.location_id] || 0) + 1;
      }
      if (photo.work_category_code) {
        stats.by_work_category[photo.work_category_code] =
          (stats.by_work_category[photo.work_category_code] || 0) + 1;
      }
    }

    return stats;
  }
}
