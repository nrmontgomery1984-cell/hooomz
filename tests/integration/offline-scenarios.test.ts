/**
 * Offline Scenarios Integration Tests
 *
 * Tests offline functionality, sync queue, and data integrity after sync.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockCustomer,
  mockProject,
  mockInspection,
  mockPhotos,
  mockChecklistItems,
} from '../fixtures';
import { setupTestEnvironment, waitFor } from '../setup';

describe('Offline Scenarios', () => {
  setupTestEnvironment();

  describe('Offline Data Creation', () => {
    it('should create data while offline', async () => {
      const customerService = {} as any;

      // Simulate offline mode
      const mockNavigator = { onLine: false };
      vi.stubGlobal('navigator', mockNavigator);

      // Create customer while offline
      const response = await customerService.create(mockCustomer);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBeDefined();

      // Data should be marked as pending sync
      expect(response.data?._syncStatus).toBe('pending');

      // Restore online status
      vi.unstubAllGlobals();
    });

    it('should queue multiple operations while offline', async () => {
      const projectService = {} as any;
      const customerService = {} as any;

      // Simulate offline mode
      vi.stubGlobal('navigator', { onLine: false });

      // Create multiple entities
      const customer = await customerService.create(mockCustomer);
      const project1 = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });
      const project2 = await projectService.create({
        ...mockProject,
        name: 'Second Project',
        customerId: customer.data!.id,
      });

      // Check sync queue
      const syncQueue = await {} as any; // syncService.getQueue();

      expect(syncQueue.length).toBeGreaterThanOrEqual(3);
      expect(syncQueue.every((item: any) => item.status === 'pending')).toBe(true);

      vi.unstubAllGlobals();
    });

    it('should handle photo capture offline', async () => {
      const fieldDocsService = {} as any;
      const projectService = {} as any;
      const customerService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Create project
      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      // Create photos
      for (const photo of mockPhotos) {
        const response = await fieldDocsService.createPhoto({
          ...photo,
          projectId: project.data!.id,
        });

        expect(response.success).toBe(true);
        expect(response.data?.uploadStatus).toBe('pending');
      }

      // Verify photos are queued
      const photos = await fieldDocsService.listPhotosByProject(project.data!.id);
      expect(photos.data?.every((p: any) => p.uploadStatus === 'pending')).toBe(true);

      vi.unstubAllGlobals();
    });

    it('should handle inspection checklist updates offline', async () => {
      const fieldDocsService = {} as any;
      const projectService = {} as any;
      const customerService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      // Create inspection
      const inspection = await fieldDocsService.create({
        ...mockInspection,
        projectId: project.data!.id,
        checklistItems: mockChecklistItems,
      });

      // Update checklist items
      const updatedItems = mockChecklistItems.map((item, index) => ({
        ...item,
        checked: index < 3, // Check first 3 items
        notes: index === 0 ? 'Verified offline' : undefined,
      }));

      const updateResponse = await fieldDocsService.update(inspection.data!.id, {
        checklistItems: updatedItems,
      });

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data?._syncStatus).toBe('pending');

      vi.unstubAllGlobals();
    });
  });

  describe('Sync Queue Management', () => {
    it('should maintain queue order', async () => {
      const syncService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Create operations in specific order
      const operations = [
        { type: 'CREATE', entity: 'customer', data: mockCustomer },
        { type: 'CREATE', entity: 'project', data: mockProject },
        { type: 'UPDATE', entity: 'project', data: { status: 'in-progress' } },
      ];

      for (const op of operations) {
        await syncService.queueOperation(op);
      }

      const queue = await syncService.getQueue();

      // Verify order is preserved
      expect(queue[0].type).toBe('CREATE');
      expect(queue[0].entity).toBe('customer');
      expect(queue[1].type).toBe('CREATE');
      expect(queue[1].entity).toBe('project');
      expect(queue[2].type).toBe('UPDATE');

      vi.unstubAllGlobals();
    });

    it('should handle queue persistence', async () => {
      const syncService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Add operations to queue
      await syncService.queueOperation({
        type: 'CREATE',
        entity: 'customer',
        data: mockCustomer,
      });

      // Simulate app reload
      const persistedQueue = await syncService.getQueue();

      expect(persistedQueue.length).toBeGreaterThan(0);
      expect(persistedQueue[0].type).toBe('CREATE');

      vi.unstubAllGlobals();
    });

    it('should deduplicate operations', async () => {
      const syncService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Queue same update multiple times
      const entityId = 'project-123';
      await syncService.queueOperation({
        type: 'UPDATE',
        entity: 'project',
        id: entityId,
        data: { status: 'in-progress' },
      });

      await syncService.queueOperation({
        type: 'UPDATE',
        entity: 'project',
        id: entityId,
        data: { status: 'completed' },
      });

      const queue = await syncService.getQueue();

      // Should only keep latest update for same entity
      const projectUpdates = queue.filter(
        (op: any) => op.entity === 'project' && op.id === entityId
      );
      expect(projectUpdates.length).toBe(1);
      expect(projectUpdates[0].data.status).toBe('completed');

      vi.unstubAllGlobals();
    });
  });

  describe('Coming Online and Syncing', () => {
    it('should detect online status change', async () => {
      const syncService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Queue operations
      await syncService.queueOperation({
        type: 'CREATE',
        entity: 'customer',
        data: mockCustomer,
      });

      // Simulate coming online
      vi.stubGlobal('navigator', { onLine: true });

      // Trigger sync
      const syncResult = await syncService.syncAll();

      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBeGreaterThan(0);

      vi.unstubAllGlobals();
    });

    it('should sync data in correct order', async () => {
      const syncService = {} as any;
      const executionOrder: string[] = [];

      vi.stubGlobal('navigator', { onLine: false });

      // Mock sync operations to track execution order
      const mockSync = vi.fn((operation: any) => {
        executionOrder.push(`${operation.type}-${operation.entity}`);
        return Promise.resolve({ success: true });
      });

      // Queue operations
      await syncService.queueOperation({
        type: 'CREATE',
        entity: 'customer',
        data: mockCustomer,
      });
      await syncService.queueOperation({
        type: 'CREATE',
        entity: 'project',
        data: mockProject,
      });

      // Come online and sync
      vi.stubGlobal('navigator', { onLine: true });
      await syncService.syncAll(mockSync);

      // Verify customer created before project
      expect(executionOrder[0]).toBe('CREATE-customer');
      expect(executionOrder[1]).toBe('CREATE-project');

      vi.unstubAllGlobals();
    });

    it('should handle sync failures gracefully', async () => {
      const syncService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Queue operations
      await syncService.queueOperation({
        type: 'CREATE',
        entity: 'customer',
        data: mockCustomer,
      });

      // Simulate network error during sync
      vi.stubGlobal('navigator', { onLine: true });

      const mockFailingSync = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const syncResult = await syncService.syncAll(mockFailingSync);

      expect(syncResult.success).toBe(false);
      expect(syncResult.failedCount).toBeGreaterThan(0);

      // Failed operations should remain in queue
      const queue = await syncService.getQueue();
      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0].status).toBe('failed');

      vi.unstubAllGlobals();
    });

    it('should retry failed operations', async () => {
      const syncService = {} as any;
      let attemptCount = 0;

      const mockRetrySync = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ success: true });
      });

      vi.stubGlobal('navigator', { onLine: true });

      const syncResult = await syncService.syncWithRetry(mockRetrySync, {
        maxRetries: 3,
        retryDelay: 100,
      });

      expect(syncResult.success).toBe(true);
      expect(attemptCount).toBe(3);

      vi.unstubAllGlobals();
    });
  });

  describe('Data Integrity After Sync', () => {
    it('should maintain referential integrity after sync', async () => {
      const syncService = {} as any;
      const customerService = {} as any;
      const projectService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Create related entities offline
      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      // Come online and sync
      vi.stubGlobal('navigator', { onLine: true });
      await syncService.syncAll();

      // Wait for sync to complete
      await waitFor(500);

      // Verify relationships are preserved
      const syncedProject = await projectService.getById(project.data!.id);
      expect(syncedProject.data?.customerId).toBe(customer.data!.id);

      const customerProjects = await projectService.listByCustomer(customer.data!.id);
      expect(customerProjects.data?.some((p: any) => p.id === project.data!.id)).toBe(
        true
      );

      vi.unstubAllGlobals();
    });

    it('should preserve timestamps correctly', async () => {
      const syncService = {} as any;
      const projectService = {} as any;
      const customerService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      const offlineTimestamp = new Date().toISOString();

      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      const localCreatedAt = project.data!.createdAt;

      // Come online and sync
      vi.stubGlobal('navigator', { onLine: true });
      await syncService.syncAll();

      // Verify timestamps
      const syncedProject = await projectService.getById(project.data!.id);

      // Created timestamp should be preserved from offline creation
      expect(syncedProject.data?.createdAt).toBe(localCreatedAt);

      // Updated timestamp should be set during sync
      expect(
        new Date(syncedProject.data!.updatedAt).getTime()
      ).toBeGreaterThanOrEqual(new Date(localCreatedAt).getTime());

      vi.unstubAllGlobals();
    });

    it('should handle conflicts during sync', async () => {
      const syncService = {} as any;
      const projectService = {} as any;
      const customerService = {} as any;

      // Create project online
      vi.stubGlobal('navigator', { onLine: true });
      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      // Go offline and update locally
      vi.stubGlobal('navigator', { onLine: false });
      await projectService.update(project.data!.id, {
        status: 'in-progress',
      });

      // Simulate server-side update (would happen through different client)
      // Mock: Server has status 'on-hold'

      // Come online and sync - should detect conflict
      vi.stubGlobal('navigator', { onLine: true });
      const syncResult = await syncService.syncAll();

      // Conflict should be detected and handled
      expect(syncResult.conflicts).toHaveLength(1);
      expect(syncResult.conflicts[0].entity).toBe('project');
      expect(syncResult.conflicts[0].localValue).toBe('in-progress');
      expect(syncResult.conflicts[0].serverValue).toBe('on-hold');

      vi.unstubAllGlobals();
    });

    it('should verify photo upload status after sync', async () => {
      const syncService = {} as any;
      const fieldDocsService = {} as any;
      const projectService = {} as any;
      const customerService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      // Create photos offline
      for (const photo of mockPhotos) {
        await fieldDocsService.createPhoto({
          ...photo,
          projectId: project.data!.id,
          uploadStatus: 'pending',
        });
      }

      // Come online and sync
      vi.stubGlobal('navigator', { onLine: true });
      await syncService.syncAll();

      // Wait for photo uploads
      await waitFor(1000);

      // Verify upload status
      const photos = await fieldDocsService.listPhotosByProject(project.data!.id);
      expect(photos.data?.every((p: any) => p.uploadStatus === 'completed')).toBe(true);

      vi.unstubAllGlobals();
    });
  });

  describe('Offline Edge Cases', () => {
    it('should handle intermittent connectivity', async () => {
      const syncService = {} as any;

      // Flip between online and offline rapidly
      for (let i = 0; i < 5; i++) {
        vi.stubGlobal('navigator', { onLine: i % 2 === 0 });
        await waitFor(100);
      }

      // Should not corrupt data or duplicate operations
      const queue = await syncService.getQueue();
      const uniqueOperations = new Set(queue.map((op: any) => op.id));
      expect(uniqueOperations.size).toBe(queue.length);

      vi.unstubAllGlobals();
    });

    it('should handle large offline queues', async () => {
      const syncService = {} as any;

      vi.stubGlobal('navigator', { onLine: false });

      // Queue many operations
      for (let i = 0; i < 100; i++) {
        await syncService.queueOperation({
          type: 'CREATE',
          entity: 'task',
          data: { title: `Task ${i}` },
        });
      }

      const queue = await syncService.getQueue();
      expect(queue.length).toBe(100);

      // Sync all
      vi.stubGlobal('navigator', { onLine: true });
      const syncResult = await syncService.syncAll();

      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(100);

      vi.unstubAllGlobals();
    });
  });
});
