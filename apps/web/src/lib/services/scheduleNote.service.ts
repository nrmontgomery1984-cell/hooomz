/**
 * Schedule Note Service
 * Scoped manager notes on schedule blocks with activity logging
 */

import type { ScheduleNote, NoteAudience } from '@hooomz/shared-contracts';
import type { ScheduleNoteRepository } from '../repositories/scheduleNote.repository';
import type { ActivityService } from '../repositories/activity.repository';

export interface CreateNoteParams {
  blockId: string;
  projectId: string;
  date: string;
  authorId: string;
  authorName: string;
  audience: NoteAudience;
  targetCrewMemberId?: string;
  targetCrewMemberName?: string;
  body: string;
}

export interface ScheduleNoteService {
  getNotesForBlock(blockId: string): Promise<ScheduleNote[]>;
  getNotesForSite(projectId: string, date: string): Promise<ScheduleNote[]>;
  addNote(params: CreateNoteParams): Promise<ScheduleNote>;
  deleteNote(noteId: string, deletedByName: string): Promise<boolean>;
}

export function createScheduleNoteService(
  noteRepo: ScheduleNoteRepository,
  activityService: ActivityService,
): ScheduleNoteService {
  return {
    async getNotesForBlock(blockId) {
      return noteRepo.findByBlock(blockId);
    },

    async getNotesForSite(projectId, date) {
      return noteRepo.findByProjectAndDate(projectId, date);
    },

    async addNote(params) {
      const note = await noteRepo.create({
        blockId: params.blockId,
        projectId: params.projectId,
        date: params.date,
        authorId: params.authorId,
        authorName: params.authorName,
        audience: params.audience,
        targetCrewMemberId: params.targetCrewMemberId ?? null,
        targetCrewMemberName: params.targetCrewMemberName ?? null,
        body: params.body,
      });

      const audienceLabel: Record<NoteAudience, string> = {
        crew_all: 'All crew',
        site_all: `Everyone on site (${params.date})`,
        task_crew: 'Task crew',
        person: params.targetCrewMemberName ?? 'Person',
      };

      await activityService.create({
        event_type: 'schedule.note_added',
        project_id: params.projectId,
        entity_type: 'schedule_note',
        entity_id: note.id,
        summary: `Note → ${audienceLabel[params.audience]}: "${params.body.substring(0, 60)}${params.body.length > 60 ? '…' : ''}"`,
        event_data: {
          blockId: params.blockId,
          audience: params.audience,
          targetCrewMemberId: params.targetCrewMemberId ?? null,
        },
      });

      return note;
    },

    async deleteNote(noteId, deletedByName) {
      const note = await noteRepo.findById(noteId);
      if (!note) return false;

      const deleted = await noteRepo.delete(noteId);

      if (deleted) {
        await activityService.create({
          event_type: 'schedule.note_deleted',
          project_id: note.projectId,
          entity_type: 'schedule_note',
          entity_id: noteId,
          summary: `Note deleted by ${deletedByName}`,
          event_data: { blockId: note.blockId },
        });
      }

      return deleted;
    },
  };
}
