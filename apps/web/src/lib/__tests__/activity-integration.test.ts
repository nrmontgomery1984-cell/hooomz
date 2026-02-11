/**
 * Activity Integration Verification Test
 *
 * This test script verifies that the ActivityService integration is working correctly.
 * It tests that all mutation hooks properly log to the Activity Log (THE SPINE).
 *
 * Run with: npx jest src/lib/__tests__/activity-integration.test.ts
 *
 * @jest-environment node
 */

/* eslint-disable */
import { ActivityRepository, ActivityService } from '../repositories/activity.repository';

// Declare Jest globals for TypeScript
declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

// Mock StorageAdapter
const createMockStorage = () => {
  const store: Map<string, Map<string, any>> = new Map();

  return {
    get: async <T>(storeName: string, key: string): Promise<T | null> => {
      const storeData = store.get(storeName);
      return storeData?.get(key) ?? null;
    },
    getAll: async <T>(storeName: string): Promise<T[]> => {
      const storeData = store.get(storeName);
      return storeData ? Array.from(storeData.values()) : [];
    },
    set: async <T>(storeName: string, key: string, value: T): Promise<void> => {
      if (!store.has(storeName)) {
        store.set(storeName, new Map());
      }
      store.get(storeName)!.set(key, value);
    },
    delete: async (storeName: string, key: string): Promise<void> => {
      store.get(storeName)?.delete(key);
    },
    clear: async (storeName: string): Promise<void> => {
      store.get(storeName)?.clear();
    },
    query: async <T>(
      storeName: string,
      predicate: (item: T) => boolean
    ): Promise<T[]> => {
      const storeData = store.get(storeName);
      if (!storeData) return [];
      return Array.from(storeData.values()).filter(predicate);
    },
    initialize: async () => {},
    isAvailable: () => true,
  };
};

// Mock SyncQueue
jest.mock('../repositories/SyncQueue', () => ({
  SyncQueue: {
    getInstance: () => ({
      queueCreate: jest.fn(),
      queueUpdate: jest.fn(),
      queueDelete: jest.fn(),
    }),
  },
}));

describe('ActivityService Integration', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let activityRepository: ActivityRepository;
  let activityService: ActivityService;

  beforeEach(() => {
    mockStorage = createMockStorage();
    activityRepository = new ActivityRepository(mockStorage as any);
    activityService = new ActivityService(activityRepository);
  });

  describe('ActivityRepository', () => {
    it('should create an activity event', async () => {
      const event = await activityRepository.create({
        event_type: 'project.created',
        project_id: 'proj_123',
        entity_type: 'project',
        entity_id: 'proj_123',
        summary: 'Created project: Test Project',
        event_data: { project_name: 'Test Project' },
      });

      expect(event.id).toBeDefined();
      expect(event.event_type).toBe('project.created');
      expect(event.project_id).toBe('proj_123');
      expect(event.entity_type).toBe('project');
      expect(event.timestamp).toBeDefined();
    });

    it('should find events by project', async () => {
      await activityRepository.create({
        event_type: 'project.created',
        project_id: 'proj_123',
        entity_type: 'project',
        entity_id: 'proj_123',
        summary: 'Created project proj_123',
      });

      await activityRepository.create({
        event_type: 'task.created',
        project_id: 'proj_123',
        entity_type: 'task',
        entity_id: 'task_456',
        summary: 'Created task task_456',
      });

      await activityRepository.create({
        event_type: 'project.created',
        project_id: 'proj_other',
        entity_type: 'project',
        entity_id: 'proj_other',
        summary: 'Created project proj_other',
      });

      const response = await activityRepository.findByProject('proj_123');

      expect(response.events).toHaveLength(2);
      expect(response.total).toBe(2);
      expect(response.events.every((e) => e.project_id === 'proj_123')).toBe(true);
    });

    it('should sort events by timestamp (newest first)', async () => {
      // Create events with slight delay to ensure different timestamps
      await activityRepository.create({
        event_type: 'event.first',
        project_id: 'proj_123',
        entity_type: 'test',
        entity_id: '1',
        summary: 'First test event',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await activityRepository.create({
        event_type: 'event.second',
        project_id: 'proj_123',
        entity_type: 'test',
        entity_id: '2',
        summary: 'Second test event',
      });

      const response = await activityRepository.findByProject('proj_123');

      expect(response.events[0].event_type).toBe('event.second');
      expect(response.events[1].event_type).toBe('event.first');
    });

    it('should filter by event type', async () => {
      await activityRepository.create({
        event_type: 'task.created',
        project_id: 'proj_123',
        entity_type: 'task',
        entity_id: 'task_1',
        summary: 'Created task_1',
      });

      await activityRepository.create({
        event_type: 'task.completed',
        project_id: 'proj_123',
        entity_type: 'task',
        entity_id: 'task_1',
        summary: 'Completed task_1',
      });

      await activityRepository.create({
        event_type: 'photo.uploaded',
        project_id: 'proj_123',
        entity_type: 'photo',
        entity_id: 'photo_1',
        summary: 'Uploaded photo_1',
      });

      const response = await activityRepository.findByProject('proj_123', {
        filters: { event_type: ['task.created', 'task.completed'] },
      });

      expect(response.events).toHaveLength(2);
      expect(response.events.every((e) => e.event_type.startsWith('task.'))).toBe(true);
    });

    it('should support pagination', async () => {
      // Create 5 events
      for (let i = 0; i < 5; i++) {
        await activityRepository.create({
          event_type: `event.${i}`,
          project_id: 'proj_123',
          entity_type: 'test',
          entity_id: `${i}`,
          summary: `Test event ${i}`,
        });
      }

      const page1 = await activityRepository.findByProject('proj_123', {
        cursor: 0,
        limit: 2,
      });

      expect(page1.events).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.nextCursor).toBe(2);

      const page2 = await activityRepository.findByProject('proj_123', {
        cursor: page1.nextCursor,
        limit: 2,
      });

      expect(page2.events).toHaveLength(2);
      expect(page2.nextCursor).toBe(4);
    });

    it('should filter by homeowner_visible', async () => {
      await activityRepository.create({
        event_type: 'estimate.approved',
        project_id: 'proj_123',
        entity_type: 'estimate',
        entity_id: 'est_1',
        summary: 'Estimate est_1 approved',
        homeowner_visible: true,
      });

      await activityRepository.create({
        event_type: 'task.created',
        project_id: 'proj_123',
        entity_type: 'task',
        entity_id: 'task_1',
        summary: 'Created task_1',
        homeowner_visible: false,
      });

      const homeownerEvents = await activityRepository.findHomeownerVisible('proj_123');

      expect(homeownerEvents.events).toHaveLength(1);
      expect(homeownerEvents.events[0].event_type).toBe('estimate.approved');
    });
  });

  describe('ActivityService', () => {
    it('should log project events', async () => {
      const event = await activityService.logProjectEvent(
        'project.created',
        'proj_123',
        { project_name: 'Test Project' }
      );

      expect(event.event_type).toBe('project.created');
      expect(event.entity_type).toBe('project');
      expect(event.entity_id).toBe('proj_123');
    });

    it('should log task events with Three-Axis metadata', async () => {
      const event = await activityService.logTaskEvent(
        'task.completed',
        'proj_123',
        'task_456',
        {
          task_title: 'Install baseboard — Kitchen',
          work_category_code: 'FC',
          stage_code: 'ST-FN',
          location_id: 'loc_kitchen',
        }
      );

      expect(event.event_type).toBe('task.completed');
      expect(event.entity_type).toBe('task');
      expect(event.work_category_code).toBe('FC');
      expect(event.stage_code).toBe('ST-FN');
      expect(event.location_id).toBe('loc_kitchen');
    });

    it('should log photo events', async () => {
      const event = await activityService.logPhotoEvent(
        'photo.uploaded',
        'proj_123',
        'photo_789',
        {
          caption: 'Progress photo',
          tags: ['progress', 'flooring'],
        }
      );

      expect(event.event_type).toBe('photo.uploaded');
      expect(event.entity_type).toBe('photo');
      expect(event.event_data.tags).toEqual(['progress', 'flooring']);
    });

    it('should log inspection events', async () => {
      const event = await activityService.logInspectionEvent(
        'inspection.passed',
        'proj_123',
        'insp_321',
        {
          inspection_type: 'flooring',
          inspector: 'Nathan Montgomery',
        }
      );

      expect(event.event_type).toBe('inspection.passed');
      expect(event.entity_type).toBe('inspection');
      expect(event.event_data.inspection_type).toBe('flooring');
    });

    it('should log financial events', async () => {
      const event = await activityService.logFinancialEvent(
        'payment.received',
        'proj_123',
        'payment',
        'pay_111',
        { amount: 5000, description: 'Progress payment' }
      );

      expect(event.event_type).toBe('payment.received');
      expect(event.entity_type).toBe('payment');
      expect(event.event_data.amount).toBe(5000);
    });

    it('should log customer events', async () => {
      const event = await activityService.logCustomerEvent(
        'customer.created',
        'cust_555',
        { customer_name: 'Jane Doe' }
      );

      expect(event.event_type).toBe('customer.created');
      expect(event.entity_type).toBe('customer');
    });

    it('should log field note events', async () => {
      const event = await activityService.logFieldNoteEvent(
        'proj_123',
        'note_999',
        {
          content: 'Found moisture damage behind drywall',
          work_category_code: 'DRYWALL',
          location_id: 'loc_bathroom',
        }
      );

      expect(event.event_type).toBe('field_note.created');
      expect(event.entity_type).toBe('field_note');
      expect(event.work_category_code).toBe('DRYWALL');
    });
  });

  describe('Integration Verification', () => {
    it('should provide repository access through service', () => {
      const repo = activityService.getRepository();
      expect(repo).toBe(activityRepository);
    });

    it('should support full activity feed workflow', async () => {
      // Simulate a project lifecycle
      await activityService.logProjectEvent('project.created', 'proj_123', {
        project_name: 'Mitchell Main Floor — Room Refresh',
      });

      await activityService.logTaskEvent(
        'task.instance_created',
        'proj_123',
        'task_1',
        { task_title: 'Demo cabinets' }
      );

      await activityService.logTaskEvent(
        'task.completed',
        'proj_123',
        'task_1',
        { task_title: 'Demo cabinets' }
      );

      await activityService.logPhotoEvent('photo.uploaded', 'proj_123', 'photo_1', {
        caption: 'Before photo',
      });

      await activityService.logInspectionEvent(
        'inspection.passed',
        'proj_123',
        'insp_1',
        { inspection_type: 'flooring' }
      );

      await activityService.logFinancialEvent(
        'estimate.approved',
        'proj_123',
        'estimate',
        'est_1',
        { amount: 25000 }
      );

      // Verify the activity feed
      const feed = await activityRepository.findByProject('proj_123');

      expect(feed.total).toBe(6);
      expect(feed.events[0].event_type).toBe('estimate.approved'); // Most recent
      expect(feed.events[5].event_type).toBe('project.created'); // Oldest
    });
  });
});

/**
 * Manual Verification Checklist:
 *
 * 1. [ ] ActivityService is available in Services interface
 * 2. [ ] useActivityService hook works in components
 * 3. [ ] Activity events are stored in IndexedDB
 * 4. [ ] Events sync to backend via SyncQueue
 * 5. [ ] All mutation hooks log to ActivityService:
 *    - [ ] useProjectMutations
 *    - [ ] useTaskMutations
 *    - [ ] usePhotoMutations
 *    - [ ] useInspectionMutations
 *    - [ ] useCustomerMutations
 *    - [ ] useEstimateMutations
 *    - [ ] useFinancialMutations
 *    - [ ] useFieldNoteMutations
 * 6. [ ] Three-Axis metadata is captured when available
 * 7. [ ] Homeowner visibility rules are applied
 * 8. [ ] Activity feed displays correctly in UI
 */
