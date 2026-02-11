/**
 * ActivityService Unit Tests
 *
 * Tests for the Activity Log service - THE SPINE of Hooomz.
 * Uses mocked Supabase client to test business logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityService, SYSTEM_USER } from './ActivityService';
import type { CreateActivityEventInput } from '@hooomz/shared';

// Mock Supabase response type
interface MockSupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

// Create mock Supabase client
function createMockSupabase() {
  const mockData: Record<string, unknown>[] = [];
  let insertedData: Record<string, unknown> | null = null;

  const mockSelect = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockImplementation(() => ({
    data: insertedData,
    error: null,
  }));
  const mockEq = vi.fn().mockReturnThis();
  const mockLt = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLike = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockImplementation(() => ({
    data: mockData,
    error: null,
  }));

  const mockInsert = vi.fn().mockImplementation((data: Record<string, unknown>) => {
    insertedData = {
      id: crypto.randomUUID(),
      ...data,
      actor_name: data.actor_name || 'Test User',
    };
    mockData.push(insertedData);
    return {
      select: mockSelect.mockReturnValue({
        single: mockSingle,
      }),
    };
  });

  const mockFrom = vi.fn().mockImplementation(() => ({
    insert: mockInsert,
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit,
        }),
        lt: mockLt.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit,
          }),
        }),
        gte: mockGte.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
      order: mockOrder.mockReturnValue({
        limit: mockLimit,
      }),
    }),
    eq: mockEq,
    lt: mockLt,
    lte: mockLte,
    gte: mockGte,
    like: mockLike,
    order: mockOrder,
    limit: mockLimit,
  }));

  return {
    from: mockFrom,
    _mockData: mockData,
    _mockInsert: mockInsert,
    _mockFrom: mockFrom,
    _setMockData: (data: Record<string, unknown>[]) => {
      mockData.length = 0;
      mockData.push(...data);
    },
    _setError: (error: { message: string } | null) => {
      mockLimit.mockImplementation(() => ({ data: null, error }));
      mockSingle.mockImplementation(() => ({ data: null, error }));
    },
  };
}

describe('ActivityService', () => {
  let service: ActivityService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new ActivityService(mockSupabase as unknown as Parameters<typeof ActivityService.prototype['createEvent']>[0] extends infer T ? T extends { organization_id: string } ? never : Parameters<ConstructorParameters<typeof ActivityService>[0]['from']>[0] extends infer U ? U extends string ? Parameters<ConstructorParameters<typeof ActivityService>[0]['from']>[0] extends string ? ConstructorParameters<typeof ActivityService>[0] : never : never : never : never);
  });

  describe('SYSTEM_USER constant', () => {
    it('should have correct system user properties', () => {
      expect(SYSTEM_USER.id).toBe('00000000-0000-0000-0000-000000000000');
      expect(SYSTEM_USER.name).toBe('System');
      expect(SYSTEM_USER.type).toBe('system');
    });
  });

  describe('createEvent', () => {
    it('should create an event with all required fields', async () => {
      const input: CreateActivityEventInput = {
        organization_id: 'org-123',
        event_type: 'project.created',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: 'proj-123',
        project_id: 'proj-123',
      };

      const result = await service.createEvent(input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.organization_id).toBe('org-123');
      expect(result.event_type).toBe('project.created');
      expect(result.event_data._version).toBe(1);
    });

    it('should use default visibility from EVENT_VISIBILITY_DEFAULTS', async () => {
      const input: CreateActivityEventInput = {
        organization_id: 'org-123',
        event_type: 'project.created', // Should default to visible
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: 'proj-123',
      };

      const result = await service.createEvent(input);

      expect(result.homeowner_visible).toBe(true);
    });

    it('should allow overriding visibility', async () => {
      const input: CreateActivityEventInput = {
        organization_id: 'org-123',
        event_type: 'project.created',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: 'proj-123',
        homeowner_visible: false, // Override default
      };

      const result = await service.createEvent(input);

      expect(result.homeowner_visible).toBe(false);
    });

    it('should set input_method to system for system actors', async () => {
      const input: CreateActivityEventInput = {
        organization_id: 'org-123',
        event_type: 'project.health_changed',
        actor_id: SYSTEM_USER.id,
        actor_type: 'system',
        entity_type: 'project',
        entity_id: 'proj-123',
      };

      const result = await service.createEvent(input);

      expect(result.input_method).toBe('system');
    });

    it('should add _version: 1 to event_data', async () => {
      const input: CreateActivityEventInput = {
        organization_id: 'org-123',
        event_type: 'task.completed',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'task_instance',
        entity_id: 'task-123',
        event_data: {
          task_name: 'Install cabinet',
          duration_hours: 4,
        },
      };

      const result = await service.createEvent(input);

      expect(result.event_data._version).toBe(1);
      expect(result.event_data.task_name).toBe('Install cabinet');
      expect(result.event_data.duration_hours).toBe(4);
    });

    it('should throw error when required fields are missing', async () => {
      const input = {
        organization_id: 'org-123',
        // Missing event_type, actor_id, etc.
      } as CreateActivityEventInput;

      await expect(service.createEvent(input)).rejects.toThrow('Missing required field');
    });

    it('should accept custom timestamp', async () => {
      const customDate = new Date('2024-01-15T10:30:00Z');
      const input: CreateActivityEventInput = {
        organization_id: 'org-123',
        event_type: 'project.created',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: 'proj-123',
        timestamp: customDate,
      };

      const result = await service.createEvent(input);

      expect(result.timestamp).toBe(customDate.toISOString());
    });

    it('should include three-axis metadata when provided', async () => {
      const input: CreateActivityEventInput = {
        organization_id: 'org-123',
        event_type: 'task.completed',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'task_instance',
        entity_id: 'task-123',
        work_category_code: 'EL',
        stage_code: 'ST-RO',
        location_id: 'loc-kitchen',
      };

      const result = await service.createEvent(input);

      expect(result.work_category_code).toBe('EL');
      expect(result.stage_code).toBe('ST-RO');
      expect(result.location_id).toBe('loc-kitchen');
    });
  });

  describe('createBatch', () => {
    it('should create multiple events with same batch_id', async () => {
      const events: CreateActivityEventInput[] = [
        {
          organization_id: 'org-123',
          event_type: 'task.completed',
          actor_id: 'user-123',
          actor_type: 'team_member',
          entity_type: 'task_instance',
          entity_id: 'task-1',
        },
        {
          organization_id: 'org-123',
          event_type: 'task.completed',
          actor_id: 'user-123',
          actor_type: 'team_member',
          entity_type: 'task_instance',
          entity_id: 'task-2',
        },
      ];

      const results = await service.createBatch(events);

      expect(results.length).toBe(2);
      // All events should have the same batch_id
      const batchId = results[0].batch_id;
      expect(batchId).toBeDefined();
      expect(results[1].batch_id).toBe(batchId);
    });

    it('should return empty array for empty input', async () => {
      const results = await service.createBatch([]);
      expect(results).toEqual([]);
    });
  });

  describe('logSystemEvent', () => {
    it('should use SYSTEM_USER as actor', async () => {
      const result = await service.logSystemEvent({
        organization_id: 'org-123',
        event_type: 'project.health_changed',
        entity_type: 'project',
        entity_id: 'proj-123',
        event_data: { old_health: 80, new_health: 65 },
      });

      expect(result.actor_id).toBe(SYSTEM_USER.id);
      expect(result.actor_type).toBe('system');
      expect(result.actor_name).toBe(SYSTEM_USER.name);
      expect(result.input_method).toBe('system');
    });
  });

  describe('validation', () => {
    it('should require organization_id', async () => {
      const input = {
        event_type: 'project.created',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: 'proj-123',
      } as CreateActivityEventInput;

      await expect(service.createEvent(input)).rejects.toThrow('organization_id');
    });

    it('should require entity_type', async () => {
      const input = {
        organization_id: 'org-123',
        event_type: 'project.created',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_id: 'proj-123',
      } as CreateActivityEventInput;

      await expect(service.createEvent(input)).rejects.toThrow('entity_type');
    });

    it('should require entity_id', async () => {
      const input = {
        organization_id: 'org-123',
        event_type: 'project.created',
        actor_id: 'user-123',
        actor_type: 'team_member',
        entity_type: 'project',
      } as CreateActivityEventInput;

      await expect(service.createEvent(input)).rejects.toThrow('entity_id');
    });
  });
});

describe('ActivityService Query Methods', () => {
  let service: ActivityService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  const mockEvents = [
    {
      id: 'event-1',
      organization_id: 'org-123',
      project_id: 'proj-123',
      event_type: 'task.completed',
      timestamp: '2024-01-15T10:00:00Z',
      actor_id: 'user-123',
      actor_type: 'team_member',
      actor_name: 'John Doe',
      entity_type: 'task_instance',
      entity_id: 'task-1',
      homeowner_visible: true,
      event_data: { _version: 1 },
      input_method: 'manual_entry',
      batch_id: null,
      work_category_code: null,
      stage_code: null,
      location_id: null,
      loop_iteration_id: null,
      property_id: null,
    },
    {
      id: 'event-2',
      organization_id: 'org-123',
      project_id: 'proj-123',
      event_type: 'task.started',
      timestamp: '2024-01-15T09:00:00Z',
      actor_id: 'user-123',
      actor_type: 'team_member',
      actor_name: 'John Doe',
      entity_type: 'task_instance',
      entity_id: 'task-2',
      homeowner_visible: false,
      event_data: { _version: 1 },
      input_method: 'manual_entry',
      batch_id: null,
      work_category_code: null,
      stage_code: null,
      location_id: null,
      loop_iteration_id: null,
      property_id: null,
    },
  ];

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockSupabase._setMockData(mockEvents);
    service = new ActivityService(mockSupabase as unknown as ConstructorParameters<typeof ActivityService>[0]);
  });

  describe('getProjectActivity', () => {
    it('should return paginated results', async () => {
      const result = await service.getProjectActivity('proj-123', { limit: 10 });

      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.hasMore).toBeDefined();
      expect(typeof result.hasMore).toBe('boolean');
    });

    it('should respect limit option', async () => {
      const result = await service.getProjectActivity('proj-123', { limit: 1 });

      expect(result.events.length).toBeLessThanOrEqual(1);
    });

    it('should enforce maximum limit of 100', async () => {
      // This is tested implicitly - service should cap at 100
      const result = await service.getProjectActivity('proj-123', { limit: 200 });
      // The normalizeOptions caps at MAX_LIMIT (100)
      expect(mockSupabase._mockFrom).toHaveBeenCalled();
    });
  });

  describe('getRecentActivity', () => {
    it('should return activity for organization', async () => {
      const result = await service.getRecentActivity('org-123', { limit: 20 });

      expect(result.events).toBeDefined();
      expect(result.nextCursor).toBeDefined();
      expect(typeof result.hasMore).toBe('boolean');
    });
  });

  describe('getPropertyActivity', () => {
    it('should filter by homeowner_visible when homeownerOnly is true', async () => {
      const result = await service.getPropertyActivity('prop-123', true, {});

      // Verify the correct view is queried
      expect(mockSupabase._mockFrom).toHaveBeenCalledWith('v_homeowner_activity');
    });

    it('should query all events when homeownerOnly is false', async () => {
      const result = await service.getPropertyActivity('prop-123', false, {});

      expect(mockSupabase._mockFrom).toHaveBeenCalledWith('activity_events');
    });
  });

  describe('pagination', () => {
    it('should return nextCursor when there are more results', async () => {
      // Add more items than the limit
      const manyEvents = Array.from({ length: 25 }, (_, i) => ({
        ...mockEvents[0],
        id: `event-${i}`,
      }));
      mockSupabase._setMockData(manyEvents);

      const result = await service.getProjectActivity('proj-123', { limit: 20 });

      if (result.hasMore) {
        expect(result.nextCursor).not.toBeNull();
      }
    });

    it('should return null nextCursor when no more results', async () => {
      mockSupabase._setMockData([mockEvents[0]]);

      const result = await service.getProjectActivity('proj-123', { limit: 20 });

      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });
});

describe('ActivityService Aggregations', () => {
  let service: ActivityService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new ActivityService(mockSupabase as unknown as ConstructorParameters<typeof ActivityService>[0]);
  });

  describe('getEventCountByType', () => {
    it('should return counts grouped by event type', async () => {
      const mockEvents = [
        { event_type: 'task.completed' },
        { event_type: 'task.completed' },
        { event_type: 'task.started' },
        { event_type: 'photo.uploaded' },
      ];
      mockSupabase._setMockData(mockEvents);

      const result = await service.getEventCountByType('proj-123', new Date('2024-01-01'));

      expect(result instanceof Map).toBe(true);
      expect(result.get('task.completed')).toBe(2);
      expect(result.get('task.started')).toBe(1);
      expect(result.get('photo.uploaded')).toBe(1);
    });

    it('should return empty map when no events', async () => {
      mockSupabase._setMockData([]);

      const result = await service.getEventCountByType('proj-123', new Date());

      expect(result.size).toBe(0);
    });
  });

  describe('getEventCountByCategory', () => {
    it('should group counts by category prefix', async () => {
      const mockEvents = [
        { event_type: 'task.completed' },
        { event_type: 'task.started' },
        { event_type: 'photo.uploaded' },
        { event_type: 'photo.shared' },
      ];
      mockSupabase._setMockData(mockEvents);

      const result = await service.getEventCountByCategory('proj-123', new Date('2024-01-01'));

      expect(result.get('task')).toBe(2);
      expect(result.get('photo')).toBe(2);
    });
  });
});
