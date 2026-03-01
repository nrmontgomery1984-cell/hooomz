'use client';

/**
 * Notification Hooks — query and mutate app-wide notifications.
 * Reuses the Labs notification infrastructure (same IndexedDB store).
 * userId convention: 'manager' (single-user offline-first app).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { LabsNotification, NotificationType } from '@hooomz/shared-contracts';

// ============================================================================
// Constants
// ============================================================================

const MANAGER_USER_ID = 'manager';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
  unreadCount: () => ['notifications', 'unreadCount'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useNotifications() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(),
    queryFn: async () => {
      if (!services) return [];
      const all = await services.labs.notifications.findByUser(MANAGER_USER_ID);
      // Sort newest first
      return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50);
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

export function useUnreadCount() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: async () => {
      if (!services) return 0;
      return services.labs.notifications.getUnreadCount(MANAGER_USER_ID);
    },
    enabled: !servicesLoading && !!services,
    staleTime: 3_000,
    refetchInterval: 10_000, // Poll every 10s for new notifications
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateNotification() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: NotificationType;
      title: string;
      body: string;
      actionUrl?: string;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.labs.notifications.create({
        userId: MANAGER_USER_ID,
        type: data.type,
        title: data.title,
        body: data.body,
        actionUrl: data.actionUrl,
        isRead: false,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkNotificationRead() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!services) throw new Error('Services not initialized');
      return services.labs.notifications.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllRead() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.labs.notifications.markAllAsRead(MANAGER_USER_ID);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

// ============================================================================
// Helper — format relative time
// ============================================================================

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Re-export for convenience
export type { LabsNotification, NotificationType };
