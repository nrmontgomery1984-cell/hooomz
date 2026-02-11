/**
 * Field Note Service
 * Business logic for field notes management
 */

import type { ActivityEventType } from '@hooomz/shared';
import { EVENT_VISIBILITY_DEFAULTS } from '@hooomz/shared';
import type { IFieldNoteRepository } from '../repositories';
import type {
  FieldNote,
  CreateFieldNote,
  UpdateFieldNote,
  FieldNoteFilters,
  FieldNoteContext,
  FieldNoteType,
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

// Voice transcription service interface
export interface TranscriptionService {
  transcribe(audioBlob: Blob): Promise<string>;
}

export interface FieldNoteServiceDependencies {
  fieldNoteRepo: IFieldNoteRepository;
  activityService?: ActivityService;
  transcriptionService?: TranscriptionService;
}

export class FieldNoteService {
  private fieldNoteRepo: IFieldNoteRepository;
  private activityService?: ActivityService;
  private transcriptionService?: TranscriptionService;

  constructor(deps: FieldNoteServiceDependencies) {
    this.fieldNoteRepo = deps.fieldNoteRepo;
    this.activityService = deps.activityService;
    this.transcriptionService = deps.transcriptionService;
  }

  async createNote(data: CreateFieldNote, actorId: string): Promise<FieldNote> {
    const fieldNote = await this.fieldNoteRepo.create({
      ...data,
      created_by: actorId,
    });

    if (this.activityService) {
      await this.activityService.log({
        organization_id: data.organization_id,
        project_id: data.project_id,
        property_id: data.property_id,
        event_type: 'field_note.created',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'field_note',
        entity_id: fieldNote.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['field_note.created'],
        event_data: {
          note_type: fieldNote.note_type,
          input_method: fieldNote.input_method,
          content_length: fieldNote.content.length,
        },
        loop_iteration_id: data.location_id,
      });
    }

    return fieldNote;
  }

  async createVoiceNote(
    organizationId: string,
    projectId: string,
    propertyId: string,
    audioBlob: Blob,
    actorId: string,
    context?: FieldNoteContext,
    noteType?: FieldNoteType
  ): Promise<FieldNote> {
    if (!this.transcriptionService) {
      throw new Error('Transcription service not configured');
    }

    // Transcribe audio to text
    const transcript = await this.transcriptionService.transcribe(audioBlob);

    // Create field note with voice metadata
    return this.createNote(
      {
        organization_id: organizationId,
        project_id: projectId,
        property_id: propertyId,
        content: transcript,
        input_method: 'voice',
        voice_transcript: transcript,
        note_type: noteType,
        location_id: context?.location_id,
        work_category_code: context?.work_category_code,
        task_instance_id: context?.task_instance_id,
        created_by: actorId,
      },
      actorId
    );
  }

  async getNote(id: string): Promise<FieldNote | null> {
    return this.fieldNoteRepo.findById(id);
  }

  async listByProject(projectId: string): Promise<FieldNote[]> {
    return this.fieldNoteRepo.findByProject(projectId);
  }

  async listByProperty(propertyId: string): Promise<FieldNote[]> {
    return this.fieldNoteRepo.findByProperty(propertyId);
  }

  async listByFilters(filters: FieldNoteFilters): Promise<FieldNote[]> {
    return this.fieldNoteRepo.findByFilters(filters);
  }

  async listFlaggedForCO(projectId: string): Promise<FieldNote[]> {
    return this.fieldNoteRepo.findFlaggedForCO(projectId);
  }

  async updateNote(id: string, data: UpdateFieldNote): Promise<FieldNote> {
    return this.fieldNoteRepo.update(id, data);
  }

  async flagForChangeOrder(id: string, actorId: string): Promise<FieldNote> {
    const fieldNote = await this.fieldNoteRepo.flagForCO(id);

    if (this.activityService) {
      await this.activityService.log({
        organization_id: fieldNote.organization_id,
        project_id: fieldNote.project_id,
        property_id: fieldNote.property_id,
        event_type: 'field_note.flagged_for_co',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'field_note',
        entity_id: fieldNote.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['field_note.flagged_for_co'],
        event_data: {
          note_type: fieldNote.note_type,
          content_preview: fieldNote.content.substring(0, 100),
        },
        loop_iteration_id: fieldNote.location_id,
      });
    }

    return fieldNote;
  }

  async unflagFromChangeOrder(id: string): Promise<FieldNote> {
    return this.fieldNoteRepo.unflagFromCO(id);
  }

  async linkPhotos(id: string, photoIds: string[]): Promise<FieldNote> {
    return this.fieldNoteRepo.linkPhotos(id, photoIds);
  }

  async addPhoto(id: string, photoId: string): Promise<FieldNote> {
    const fieldNote = await this.fieldNoteRepo.findById(id);
    if (!fieldNote) {
      throw new Error(`Field note ${id} not found`);
    }

    const updatedPhotoIds = [...fieldNote.photo_ids, photoId];
    return this.fieldNoteRepo.linkPhotos(id, updatedPhotoIds);
  }

  async removePhoto(id: string, photoId: string): Promise<FieldNote> {
    const fieldNote = await this.fieldNoteRepo.findById(id);
    if (!fieldNote) {
      throw new Error(`Field note ${id} not found`);
    }

    const updatedPhotoIds = fieldNote.photo_ids.filter(pid => pid !== photoId);
    return this.fieldNoteRepo.linkPhotos(id, updatedPhotoIds);
  }

  async deleteNote(id: string): Promise<void> {
    return this.fieldNoteRepo.delete(id);
  }

  // Get notes by type for a project
  async getByType(projectId: string): Promise<Record<FieldNoteType, FieldNote[]>> {
    const notes = await this.fieldNoteRepo.findByProject(projectId);

    const grouped: Record<FieldNoteType, FieldNote[]> = {
      observation: [],
      issue: [],
      client_request: [],
      material_delivery: [],
      weather: [],
      safety: [],
      general: [],
    };

    for (const note of notes) {
      grouped[note.note_type].push(note);
    }

    return grouped;
  }

  // Get notes for a specific context (location + work category + task)
  async getByContext(
    projectId: string,
    context: FieldNoteContext
  ): Promise<FieldNote[]> {
    return this.fieldNoteRepo.findByFilters({
      project_id: projectId,
      location_id: context.location_id,
      work_category_code: context.work_category_code,
      task_instance_id: context.task_instance_id,
    });
  }
}
