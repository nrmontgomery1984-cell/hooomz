'use client';

/**
 * Schedule Notes Hooks — React Query hooks for scoped manager notes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { NoteAudience } from '@hooomz/shared-contracts';

export const SCHEDULE_NOTE_KEYS = {
  byBlock: (blockId: string) => ['scheduleNotes', 'block', blockId] as const,
  bySite: (projectId: string, date: string) =>
    ['scheduleNotes', 'site', projectId, date] as const,
};

export function useNotesForBlock(blockId: string | null) {
  const { services } = useServicesContext();
  return useQuery({
    queryKey: SCHEDULE_NOTE_KEYS.byBlock(blockId ?? ''),
    queryFn: () => services!.scheduleNotes.getNotesForBlock(blockId!),
    enabled: !!services && !!blockId,
    staleTime: 10_000,
  });
}

export function useAddScheduleNote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      blockId: string;
      projectId: string;
      date: string;
      authorId: string;
      authorName: string;
      audience: NoteAudience;
      targetCrewMemberId?: string;
      targetCrewMemberName?: string;
      body: string;
    }) => services!.scheduleNotes.addNote(params),
    onSuccess: (note) => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_NOTE_KEYS.byBlock(note.blockId),
      });
      queryClient.invalidateQueries({
        queryKey: ['scheduleNotes'],
      });
    },
  });
}

export function useDeleteScheduleNote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      noteId: string;
      deletedByName: string;
      blockId: string;
    }) => services!.scheduleNotes.deleteNote(params.noteId, params.deletedByName),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_NOTE_KEYS.byBlock(params.blockId),
      });
      queryClient.invalidateQueries({
        queryKey: ['scheduleNotes'],
      });
    },
  });
}
