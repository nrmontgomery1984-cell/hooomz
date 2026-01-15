/**
 * Photo Service - Business logic for managing field photos
 * Handles photo management, tagging, and organization
 */

import type { ApiResponse } from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@hooomz/shared-contracts';

import type {
  IPhotoRepository,
  Photo,
  CreatePhoto,
  UpdatePhoto,
  PhotoMetadata,
  PhotoFilters,
} from './photo.repository';

/**
 * Photo service dependencies
 */
export interface PhotoServiceDependencies {
  photoRepository: IPhotoRepository;
}

/**
 * Organized photos by date for timeline view
 */
export interface PhotosByDate {
  date: string; // YYYY-MM-DD format
  photos: Photo[];
}

/**
 * Photo statistics
 */
export interface PhotoStats {
  total: number;
  byTag: Record<string, number>;
  uploadedToCloud: number;
  pendingUpload: number;
  storageUsed: number; // In bytes
}

/**
 * Photo Service
 * Provides business logic for photo management
 */
export class PhotoService {
  constructor(private deps: PhotoServiceDependencies) {}

  /**
   * Add photo to project
   */
  async addPhoto(
    projectId: string,
    filePath: string,
    metadata: PhotoMetadata,
    fileInfo?: {
      size?: number;
      mimeType?: string;
      width?: number;
      height?: number;
      thumbnailPath?: string;
    },
    inspectionId?: string
  ): Promise<ApiResponse<Photo>> {
    try {
      const photo = await this.deps.photoRepository.create({
        projectId,
        inspectionId,
        filePath,
        fileSize: fileInfo?.size,
        mimeType: fileInfo?.mimeType,
        width: fileInfo?.width,
        height: fileInfo?.height,
        thumbnailPath: fileInfo?.thumbnailPath,
        metadata,
      });

      return createSuccessResponse(photo);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to add photo',
        { error }
      );
    }
  }

  /**
   * Get photo by ID
   */
  async getById(id: string): Promise<ApiResponse<Photo>> {
    try {
      const photo = await this.deps.photoRepository.findById(id);

      if (!photo) {
        return createErrorResponse('NOT_FOUND', `Photo ${id} not found`);
      }

      return createSuccessResponse(photo);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get photo',
        { error }
      );
    }
  }

  /**
   * Update photo metadata
   */
  async update(id: string, data: UpdatePhoto): Promise<ApiResponse<Photo>> {
    try {
      const photo = await this.deps.photoRepository.update(id, data);
      return createSuccessResponse(photo);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return createErrorResponse('NOT_FOUND', `Photo ${id} not found`);
      }
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to update photo',
        { error }
      );
    }
  }

  /**
   * Delete photo
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await this.deps.photoRepository.delete(id);
      return createSuccessResponse(undefined);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return createErrorResponse('NOT_FOUND', `Photo ${id} not found`);
      }
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to delete photo',
        { error }
      );
    }
  }

  /**
   * Get all photos for a project
   */
  async getPhotosByProject(projectId: string): Promise<ApiResponse<Photo[]>> {
    try {
      const photos = await this.deps.photoRepository.findByProjectId(projectId);
      return createSuccessResponse(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get project photos',
        { error }
      );
    }
  }

  /**
   * Get photos for an inspection
   */
  async getPhotosByInspection(
    inspectionId: string
  ): Promise<ApiResponse<Photo[]>> {
    try {
      const photos = await this.deps.photoRepository.findByInspectionId(
        inspectionId
      );
      return createSuccessResponse(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get inspection photos',
        { error }
      );
    }
  }

  /**
   * Get photos by tag for a project
   */
  async getPhotosByTag(
    projectId: string,
    tag: string
  ): Promise<ApiResponse<Photo[]>> {
    try {
      const photos = await this.deps.photoRepository.findByTag(projectId, tag);
      return createSuccessResponse(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get photos by tag',
        { error }
      );
    }
  }

  /**
   * Get photos by multiple tags (OR logic)
   */
  async getPhotosByTags(
    projectId: string,
    tags: string[]
  ): Promise<ApiResponse<Photo[]>> {
    try {
      if (tags.length === 0) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'At least one tag must be provided'
        );
      }

      const photos = await this.deps.photoRepository.findByTags(
        projectId,
        tags
      );
      return createSuccessResponse(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get photos by tags',
        { error }
      );
    }
  }

  /**
   * Organize photos by date for timeline view
   */
  async organizeByDate(photos: Photo[]): Promise<ApiResponse<PhotosByDate[]>> {
    try {
      const photosByDate = new Map<string, Photo[]>();

      for (const photo of photos) {
        const date = photo.timestamp.split('T')[0]; // Get YYYY-MM-DD

        if (!photosByDate.has(date)) {
          photosByDate.set(date, []);
        }

        photosByDate.get(date)!.push(photo);
      }

      // Convert to array and sort by date (newest first)
      const organized: PhotosByDate[] = Array.from(photosByDate.entries())
        .map(([date, photos]) => ({
          date,
          photos: photos.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      return createSuccessResponse(organized);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to organize photos by date',
        { error }
      );
    }
  }

  /**
   * Get photos within date range
   */
  async getPhotosByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Photo[]>> {
    try {
      const photos = await this.deps.photoRepository.findByDateRange(
        startDate,
        endDate
      );
      return createSuccessResponse(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get photos by date range',
        { error }
      );
    }
  }

  /**
   * Add tag to photo
   */
  async addTag(photoId: string, tag: string): Promise<ApiResponse<Photo>> {
    try {
      const photo = await this.deps.photoRepository.findById(photoId);

      if (!photo) {
        return createErrorResponse('NOT_FOUND', `Photo ${photoId} not found`);
      }

      if (photo.tags.includes(tag)) {
        return createSuccessResponse(photo); // Tag already exists
      }

      const updated = await this.deps.photoRepository.update(photoId, {
        tags: [...photo.tags, tag],
      });

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse('INTERNAL_ERROR', 'Failed to add tag', {
        error,
      });
    }
  }

  /**
   * Remove tag from photo
   */
  async removeTag(photoId: string, tag: string): Promise<ApiResponse<Photo>> {
    try {
      const photo = await this.deps.photoRepository.findById(photoId);

      if (!photo) {
        return createErrorResponse('NOT_FOUND', `Photo ${photoId} not found`);
      }

      const updated = await this.deps.photoRepository.update(photoId, {
        tags: photo.tags.filter((t) => t !== tag),
      });

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse('INTERNAL_ERROR', 'Failed to remove tag', {
        error,
      });
    }
  }

  /**
   * Update photo caption
   */
  async updateCaption(
    photoId: string,
    caption: string
  ): Promise<ApiResponse<Photo>> {
    try {
      const updated = await this.deps.photoRepository.update(photoId, {
        caption,
      });
      return createSuccessResponse(updated);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return createErrorResponse('NOT_FOUND', `Photo ${photoId} not found`);
      }
      return createErrorResponse('INTERNAL_ERROR', 'Failed to update caption', {
        error,
      });
    }
  }

  /**
   * Mark photo as uploaded to cloud (for offline sync tracking)
   */
  async markAsUploaded(photoId: string): Promise<ApiResponse<Photo>> {
    try {
      const updated = await this.deps.photoRepository.update(photoId, {
        uploadedToCloud: true,
      });
      return createSuccessResponse(updated);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return createErrorResponse('NOT_FOUND', `Photo ${photoId} not found`);
      }
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to mark photo as uploaded',
        { error }
      );
    }
  }

  /**
   * Get unsynced photos (for offline sync)
   */
  async getUnsyncedPhotos(): Promise<ApiResponse<Photo[]>> {
    try {
      const photos = await this.deps.photoRepository.findUnsynced();
      return createSuccessResponse(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get unsynced photos',
        { error }
      );
    }
  }

  /**
   * Get photo statistics for a project
   */
  async getProjectPhotoStats(
    projectId: string
  ): Promise<ApiResponse<PhotoStats>> {
    try {
      const photos = await this.deps.photoRepository.findByProjectId(projectId);

      const stats: PhotoStats = {
        total: photos.length,
        byTag: {},
        uploadedToCloud: photos.filter((p) => p.uploadedToCloud).length,
        pendingUpload: photos.filter((p) => !p.uploadedToCloud).length,
        storageUsed: photos.reduce((sum, p) => sum + (p.fileSize || 0), 0),
      };

      // Count photos by tag
      const tagCounts = new Map<string, number>();
      for (const photo of photos) {
        for (const tag of photo.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }

      stats.byTag = Object.fromEntries(tagCounts);

      return createSuccessResponse(stats);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get photo statistics',
        { error }
      );
    }
  }

  /**
   * Search photos by filters
   */
  async searchPhotos(filters: PhotoFilters): Promise<ApiResponse<Photo[]>> {
    try {
      const photos = await this.deps.photoRepository.findAll(filters);
      return createSuccessResponse(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to search photos',
        { error }
      );
    }
  }

  /**
   * Get timeline view of project photos organized by date
   */
  async getProjectTimeline(
    projectId: string
  ): Promise<ApiResponse<PhotosByDate[]>> {
    try {
      const photos = await this.deps.photoRepository.findByProjectId(projectId);
      return this.organizeByDate(photos);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get project timeline',
        { error }
      );
    }
  }
}
