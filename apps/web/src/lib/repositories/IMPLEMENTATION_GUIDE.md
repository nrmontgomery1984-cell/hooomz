# Repository Implementation Guide

## Overview

This directory contains offline-first repository implementations using IndexedDB for client-side storage with automatic sync queuing for when the app comes back online.

## Architecture

### Storage Layer
```
StorageAdapter (interface)
    └── IndexedDBAdapter (implementation)
        ├── Uses browser IndexedDB API
        ├── Supports queries and indexes
        └── Handles database lifecycle
```

### Repository Pattern
```
IRepository (from packages)
    └── ConcreteRepository (apps/web)
        ├── Uses StorageAdapter for data access
        ├── Implements sync queuing
        └── Follows offline-first principles
```

### Sync Queue
```
SyncQueue
    ├── Tracks all changes (create, update, delete)
    ├── Queues operations for sync
    ├── Retries failed syncs
    └── Cleans up after successful sync
```

## Files Created

### Storage Abstraction
- **`storage/StorageAdapter.ts`** - Interface for storage backends
- **`storage/IndexedDBAdapter.ts`** - IndexedDB implementation
  - Supports all CRUD operations
  - Indexes for common queries
  - Handles connection lifecycle

### Base Classes
- **`BaseRepository.ts`** - Abstract base with common CRUD patterns
  - ID generation
  - Metadata management
  - Sync queue integration

- **`SyncQueue.ts`** - Manages offline changes
  - Queues create/update/delete operations
  - Tracks sync status
  - Handles retries and errors

### Concrete Repositories
- **`project.repository.ts`** - ✅ Implemented
- **`customer.repository.ts`** - Needs update
- **`lineitem.repository.ts`** - To be created
- **`catalog.repository.ts`** - To be created
- **`task.repository.ts`** - To be created
- **`inspection.repository.ts`** - To be created
- **`photo.repository.ts`** - To be created

## Usage

### Initialize Storage

```typescript
import { IndexedDBAdapter } from '@/lib/storage/IndexedDBAdapter';

// Create storage adapter
const storage = new IndexedDBAdapter();

// Initialize (creates database and object stores)
await storage.initialize();
```

### Create Repository

```typescript
import { ProjectRepository } from '@/lib/repositories/project.repository';
import { IndexedDBAdapter } from '@/lib/storage/IndexedDBAdapter';

const storage = new IndexedDBAdapter();
await storage.initialize();

const projectRepo = new ProjectRepository(storage);
```

### Use Repository

```typescript
// Create project
const project = await projectRepo.create({
  name: 'House Build',
  clientId: 'client_123',
  // ... other fields
});

// Find all projects
const { projects, total } = await projectRepo.findAll({
  filters: { status: 'active' },
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  pageSize: 10,
});

// Update project
const updated = await projectRepo.update(project.id, {
  status: 'in-progress',
});

// Delete project
const deleted = await projectRepo.delete(project.id);
```

### Check Sync Queue

```typescript
import { SyncQueue } from '@/lib/repositories/SyncQueue';

const syncQueue = SyncQueue.getInstance(storage);

// Get pending changes
const pending = await syncQueue.getPendingItems();
console.log(`${pending.length} changes waiting to sync`);

// Get count
const count = await syncQueue.getPendingCount();
```

## Offline-First Workflow

### 1. User Makes Changes (Offline)
```typescript
// Works offline - stores in IndexedDB
const project = await projectRepo.create({ /* data */ });
// ↓
// Automatically queued for sync
```

### 2. Changes Are Queued
```typescript
// SyncQueue tracks the operation
{
  id: 'sync_123',
  operation: 'create',
  storeName: 'projects',
  entityId: 'proj_456',
  data: { /* project data */ },
  synced: false,
  retryCount: 0,
}
```

### 3. Connection Restored
```typescript
// Sync service (to be implemented) processes queue
const pending = await syncQueue.getPendingItems();

for (const item of pending) {
  try {
    // Send to API
    await api.syncOperation(item);

    // Mark as synced
    await syncQueue.markAsSynced(item.id);
  } catch (error) {
    // Mark as failed
    await syncQueue.markAsFailed(item.id, error.message);
  }
}
```

### 4. Clean Up
```typescript
// Remove synced items
await syncQueue.clearSynced();
```

## Store Names

All entity types have predefined store names:

```typescript
export const StoreNames = {
  PROJECTS: 'projects',
  CUSTOMERS: 'customers',
  LINE_ITEMS: 'lineItems',
  CATALOG_ITEMS: 'catalogItems',
  TASKS: 'tasks',
  INSPECTIONS: 'inspections',
  PHOTOS: 'photos',
  SYNC_QUEUE: 'syncQueue',
};
```

## IndexedDB Schema

### Projects Store
- **Key**: `id`
- **Indexes**:
  - `customerId` - Find projects by customer
  - `status` - Find projects by status

### Tasks Store
- **Key**: `id`
- **Indexes**:
  - `projectId` - Find tasks by project
  - `assigneeId` - Find tasks by assignee

### Inspections Store
- **Key**: `id`
- **Indexes**:
  - `projectId` - Find inspections by project
  - `status` - Find inspections by status

### Photos Store
- **Key**: `id`
- **Indexes**:
  - `projectId` - Find photos by project
  - `uploadedToCloud` - Find unsynced photos

### Sync Queue Store
- **Key**: `id`
- **Indexes**:
  - `timestamp` - Process in order
  - `synced` - Find pending items

## Error Handling

All repository methods catch errors and return proper types:

```typescript
try {
  const project = await projectRepo.findById('proj_123');
  return project; // Project | null
} catch (error) {
  // Errors are caught internally
  // Null returned if not found
  return null;
}
```

## Testing

### Check if IndexedDB is Available

```typescript
const storage = new IndexedDBAdapter();
if (storage.isAvailable()) {
  await storage.initialize();
} else {
  // Fallback to in-memory or show error
}
```

### Clear All Data (for testing)

```typescript
// Clear specific store
await storage.clear(StoreNames.PROJECTS);

// Clear sync queue
await syncQueue.clearAll();
```

## Future Enhancements

### PostgreSQL Adapter
```typescript
export class PostgresAdapter implements StorageAdapter {
  // Connect to PostgreSQL
  // Implement same interface
  // Use for server-side or web workers
}
```

### Sync Service
```typescript
export class SyncService {
  async syncAll(): Promise<void> {
    // Process sync queue
    // Handle conflicts
    // Retry failed operations
  }

  async startAutoSync(): void {
    // Monitor online/offline
    // Sync when connection restored
  }
}
```

### Conflict Resolution
```typescript
export interface ConflictResolver {
  resolve(local: T, remote: T): T;
}

// Strategies:
// - Last write wins
// - Manual merge
// - Keep both (branches)
```

## Performance Considerations

### Indexes
- Add indexes for common queries
- Balance between read speed and write overhead
- Monitor index size

### Pagination
- Always paginate large result sets
- Use `page` and `pageSize` parameters
- Consider virtual scrolling for UI

### Caching
- Storage adapter caches DB connection
- Singleton SyncQueue avoids multiple instances
- Consider in-memory cache for frequently accessed data

## Browser Support

IndexedDB is supported in:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+
- Mobile browsers (iOS Safari 10+, Chrome Mobile)

## Security

### Local Storage Security
- IndexedDB is origin-isolated
- Data persists until explicitly cleared
- No encryption by default (consider for sensitive data)

### Sync Security
- Use HTTPS for sync endpoints
- Include authentication tokens
- Validate data on server

## Migration Strategy

When schema changes:

```typescript
const DB_VERSION = 2; // Increment version

request.onupgradeneeded = (event) => {
  const db = request.result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 2) {
    // Add new index
    const projectStore = db.objectStore('projects');
    projectStore.createIndex('priority', 'priority', { unique: false });
  }
};
```

## Debugging

### View IndexedDB in DevTools

1. Open Chrome DevTools
2. Go to Application tab
3. Select IndexedDB
4. Expand `hooomz_db`
5. View object stores and data

### Log Sync Queue

```typescript
const pending = await syncQueue.getPendingItems();
console.table(pending);
```

### Clear Everything

```typescript
// In browser console
indexedDB.deleteDatabase('hooomz_db');
// Then refresh page
```

## Best Practices

1. **Always initialize storage** before using repositories
2. **Use transactions** for related operations
3. **Queue all mutations** for sync
4. **Handle offline/online** events in UI
5. **Show sync status** to users
6. **Test offline scenarios** thoroughly
7. **Implement retry logic** for failed syncs
8. **Clean up synced items** periodically
9. **Monitor storage quota** on mobile
10. **Provide data export** for users

## Complete Example

```typescript
// Initialize
import { IndexedDBAdapter } from '@/lib/storage/IndexedDBAdapter';
import { ProjectRepository } from '@/lib/repositories/project.repository';
import { SyncQueue } from '@/lib/repositories/SyncQueue';

// Setup
const storage = new IndexedDBAdapter();
await storage.initialize();

const projectRepo = new ProjectRepository(storage);
const syncQueue = SyncQueue.getInstance(storage);

// Create project (works offline)
const project = await projectRepo.create({
  name: 'Kitchen Renovation',
  clientId: 'client_123',
  projectType: 'residential',
  status: 'planning',
  address: {
    street: '123 Main St',
    city: 'Fredericton',
    province: 'NB',
    postalCode: 'E3B 1A1',
    country: 'Canada',
  },
  budget: {
    estimatedCost: 50000,
    actualCost: 0,
  },
  dates: {
    startDate: '2024-03-01',
    estimatedEndDate: '2024-05-31',
  },
});

// Check sync status
const pendingCount = await syncQueue.getPendingCount();
console.log(`${pendingCount} changes waiting to sync`);

// When online, sync (to be implemented)
if (navigator.onLine) {
  const pending = await syncQueue.getPendingItems();
  // Process pending items...
}
```
