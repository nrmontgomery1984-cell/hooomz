'use client';

/**
 * useCreateTask — Create a manual task on a project.
 *
 * Sets workSource = 'uncaptured' to distinguish from estimate-sourced tasks.
 * Title format: "Task Name — Room" (parsed by enrichTask).
 * Description line 1: "Stage Name · Trade Name" (parsed by enrichTask).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskStatus, TaskPriority } from '@hooomz/shared-contracts';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';

export interface CreateTaskInput {
  projectId: string;
  title: string;
  room: string;
  stageName: string;
  tradeName: string;
}

export function useCreateTask() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!services) throw new Error('Services not initialized');

      // Format title: "Task Name — Room" (parsed by parseRoomFromTitle)
      const formattedTitle = input.room && input.room !== 'General'
        ? `${input.title} — ${input.room}`
        : input.title;

      // Description line 1: "Stage Name · Trade Name" (parsed by parseStageTradeFromDescription)
      const description = `${input.stageName} · ${input.tradeName}`;

      const task = await services.scheduling.tasks.create({
        projectId: input.projectId,
        title: formattedTitle,
        description,
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        workSource: 'uncaptured',
        isUncaptured: true,
      });

      // Activity log — spine rule
      await services.activity.logTaskEvent('task.created', input.projectId, task.id, {
        task_title: formattedTitle,
      });

      return task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}
