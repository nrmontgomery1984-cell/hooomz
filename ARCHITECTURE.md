# Hooomz Architecture

This document explains the architecture and design decisions of the Hooomz construction management platform.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Application                          │
│                      (Next.js 14 App Router)                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Uses
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                             │
│  ┌────────────┬────────────┬────────────┬────────────────────┐  │
│  │ Customers  │ Projects   │ Estimating │ Scheduling         │  │
│  │ Service    │ Service    │ Service    │ Service            │  │
│  └────────────┴────────────┴────────────┴────────────────────┘  │
│  ┌────────────┬────────────┐                                    │
│  │ Field Docs │ Reporting  │                                    │
│  │ Service    │ Service    │                                    │
│  └────────────┴────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Imports types from
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Shared Contracts                            │
│              (Types, Interfaces, Schemas)                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Used by
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              IndexedDB Repository Pattern                 │   │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐   │   │
│  │  │Customers │ Projects │Estimates │  Tasks           │   │   │
│  │  │   DB     │    DB    │    DB    │   DB             │   │   │
│  │  └──────────┴──────────┴──────────┴──────────────────┘   │   │
│  │  ┌──────────┬──────────┐                                 │   │
│  │  │Inspection│  Photos  │                                 │   │
│  │  │   DB     │    DB    │                                 │   │
│  │  └──────────┴──────────┘                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Persists to
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Browser IndexedDB                             │
│                  (Client-side persistence)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Module Structure

Each feature module follows the same pattern:

```
packages/[module]/
├── src/
│   ├── types/              # Module-specific types
│   ├── services/           # Business logic
│   ├── repositories/       # Data access
│   ├── validators/         # Input validation
│   └── index.ts           # Public API exports
├── package.json
├── tsconfig.json
└── README.md
```

## Data Flow

### 1. User Interaction Flow

```
User Action (UI Component)
    ↓
Service Method Call
    ↓
Input Validation
    ↓
Business Logic
    ↓
Repository Call
    ↓
IndexedDB Operation
    ↓
Return ServiceResponse<T>
    ↓
Update UI State
```

### 2. Offline-First Flow

```
User Action
    ↓
Check Online Status
    ↓
If Offline:
    ├─→ Save to Local IndexedDB
    ├─→ Add to Sync Queue
    └─→ Mark as Pending
    ↓
When Online:
    ├─→ Process Sync Queue
    ├─→ Upload to Server (future)
    └─→ Update Sync Status
```

## Key Design Patterns

### 1. Service Layer Pattern

**Purpose**: Separate business logic from UI and data access.

```typescript
// Service provides high-level operations
interface CustomerService {
  create(data: CreateCustomerInput): Promise<ServiceResponse<Customer>>;
  getById(id: string): Promise<ServiceResponse<Customer>>;
  list(filters?: CustomerFilters): Promise<ServiceResponse<Customer[]>>;
  update(id: string, data: UpdateCustomerInput): Promise<ServiceResponse<Customer>>;
  delete(id: string): Promise<ServiceResponse<void>>;
}
```

**Benefits**:
- UI components don't need to know about data storage
- Business rules are centralized
- Easy to test in isolation
- Can switch storage backends without changing UI

### 2. Repository Pattern

**Purpose**: Abstract data access logic.

```typescript
// Repository handles CRUD operations
interface Repository<T> {
  create(item: T): Promise<T>;
  read(id: string): Promise<T | null>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  list(filters?: any): Promise<T[]>;
}
```

**Benefits**:
- Data access is abstracted
- Easy to switch from IndexedDB to API calls
- Centralized error handling
- Supports multiple storage backends

### 3. ServiceResponse Pattern

**Purpose**: Consistent error handling across all services.

```typescript
type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

**Benefits**:
- Explicit success/failure handling
- No thrown exceptions in normal flow
- Type-safe error handling
- Consistent API across all services

### 4. Offline-First Architecture

**Purpose**: Work without internet connectivity.

**Components**:
1. **Local Storage**: All data in IndexedDB
2. **Sync Queue**: Pending operations when offline
3. **Conflict Resolution**: Handle concurrent edits
4. **Progressive Enhancement**: Works offline, better online

```typescript
interface SyncQueueItem {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}
```

## Package Dependencies

```
shared-contracts (foundation)
    ↓
    ├─→ db (data layer)
    ├─→ ui (components)
    └─→ Feature packages:
        ├─→ customers
        ├─→ projects
        ├─→ estimating
        ├─→ scheduling
        ├─→ field-docs
        └─→ reporting
            ↓
        web app (uses all)
```

### Why This Structure?

1. **shared-contracts** has no dependencies - pure types
2. **db** and **ui** depend only on shared-contracts
3. **Feature packages** depend on shared-contracts, db, ui
4. **web app** depends on everything

This ensures:
- No circular dependencies
- Clear dependency flow
- Easy to build in order
- Type safety across boundaries

## Module Boundaries

### What Goes Where?

**shared-contracts**:
- TypeScript types and interfaces
- Validation schemas (Zod)
- Constants and enums
- NO implementation logic

**db**:
- IndexedDB setup and configuration
- Generic repository implementations
- Database migrations
- NO business logic

**ui**:
- Reusable React components
- Design system primitives
- Hooks for common UI patterns
- NO business logic or data fetching

**Feature packages** (customers, projects, etc.):
- Domain-specific types (if any)
- Service implementations
- Repository implementations
- Validators
- Business logic

**web app**:
- Page components (App Router)
- Feature-specific UI components
- Service composition
- Routing and navigation
- NO business logic (delegate to services)

## State Management

**Approach**: Service Layer + React State

```typescript
// Component uses service and manages local state
function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const customerService = useCustomerService();

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      const response = await customerService.list();
      if (response.success) {
        setCustomers(response.data);
      }
      setLoading(false);
    }
    loadCustomers();
  }, []);

  return <div>{/* render customers */}</div>;
}
```

**Why not Redux/Zustand?**
- Services already provide state management
- React Query not needed (offline-first)
- IndexedDB is the source of truth
- Simpler mental model
- Less boilerplate

**When to use Context?**
- User authentication
- Theme preferences
- Global UI state (modals, toasts)
- NOT for domain data

## Performance Considerations

### 1. Code Splitting

Next.js automatically code-splits by route:
```
/customers        → loads customer bundle
/projects         → loads project bundle
/reports          → loads reports bundle
```

### 2. IndexedDB Indexes

```typescript
// Create indexes for common queries
const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
customerStore.createIndex('email', 'email', { unique: true });
customerStore.createIndex('type', 'type', { unique: false });
```

### 3. Pagination

Large lists use pagination:
```typescript
interface ListOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### 4. Virtual Scrolling

For very large lists (1000+ items), use virtual scrolling to render only visible items.

## Security Considerations

### Client-Side Only (Current)

**Data Storage**:
- All data in browser IndexedDB
- No server communication yet
- Data persists in user's browser only

**Important Notes**:
- No authentication yet (planned)
- No multi-user support (planned)
- No data backup (user responsibility)

### Future: Server Integration

When adding a backend:
1. **Authentication**: JWT tokens
2. **Authorization**: Role-based access
3. **Encryption**: Sensitive data encrypted at rest
4. **HTTPS**: All communication over HTTPS
5. **API Keys**: Secure third-party integrations

## Testing Strategy

### 1. Unit Tests (Future)

Test individual functions:
```typescript
// services/__tests__/customer-service.test.ts
describe('CustomerService', () => {
  it('should create a customer', async () => {
    const service = createCustomerService(mockRepository);
    const result = await service.create(mockCustomer);
    expect(result.success).toBe(true);
  });
});
```

### 2. Integration Tests (Current)

Test complete workflows:
```typescript
// tests/integration/project-lifecycle.test.ts
it('should complete full project lifecycle', async () => {
  // Create customer → project → estimate → tasks → completion
});
```

### 3. E2E Tests (Future)

Test user flows with Playwright:
```typescript
test('user can create and complete a project', async ({ page }) => {
  await page.goto('/customers/new');
  // ... user actions
});
```

## Error Handling

### 1. Service Layer

Services return `ServiceResponse<T>`:
```typescript
try {
  const item = await repository.create(data);
  return { success: true, data: item };
} catch (error) {
  return {
    success: false,
    error: error.message,
    code: 'CREATE_FAILED'
  };
}
```

### 2. UI Layer

Components handle service responses:
```typescript
const response = await service.create(data);
if (!response.success) {
  toast.error(response.error);
  return;
}
// Success path
toast.success('Created successfully');
```

### 3. Repository Layer

Repositories throw errors, services catch:
```typescript
// Repository
async create(item: T): Promise<T> {
  const db = await this.getDB();
  const tx = db.transaction(this.storeName, 'readwrite');
  const store = tx.objectStore(this.storeName);

  try {
    await store.add(item);
    return item;
  } catch (error) {
    throw new Error(`Failed to create ${this.storeName}: ${error.message}`);
  }
}
```

## Scalability Considerations

### Current (Single User)
- IndexedDB limit: ~50-100MB typical
- Handles: ~10,000 customers, ~50,000 line items
- Performance: Excellent (local storage)

### Future (Multi-User with Backend)
- Move to cloud database
- Implement proper caching
- Add pagination everywhere
- Background sync for offline edits

## Adding New Features

See [ADDING_MODULES.md](ADDING_MODULES.md) for detailed guide.

**Quick Steps**:
1. Add types to `shared-contracts`
2. Create package in `packages/[feature]`
3. Implement service and repository
4. Add UI in `apps/web/src/app/[feature]`
5. Write integration tests
6. Update documentation

## Technology Choices

### Why These Technologies?

**Next.js 14**:
- App Router for modern React patterns
- Server components for future SSR
- Built-in routing
- Excellent DX

**TypeScript**:
- Type safety across boundaries
- Better IDE support
- Catch errors at compile time
- Self-documenting code

**Tailwind CSS**:
- Utility-first for rapid development
- Consistent design system
- Small bundle size
- No CSS-in-JS runtime cost

**IndexedDB**:
- Browser-native storage
- Offline-first capability
- Large storage capacity
- Structured data with indexes

**pnpm Workspaces**:
- Fast installs
- Efficient disk usage
- Strict dependency resolution
- Monorepo support

**Vitest**:
- Fast test execution
- ESM support
- Similar API to Jest
- Better TypeScript support

## Future Enhancements

### Short Term
- [ ] User authentication
- [ ] Photo compression
- [ ] Export to PDF
- [ ] Email invoices
- [ ] Print estimates

### Medium Term
- [ ] Backend API
- [ ] Multi-device sync
- [ ] Collaborative features
- [ ] Mobile apps (React Native)
- [ ] Offline map integration

### Long Term
- [ ] AI-powered estimating
- [ ] Supplier integrations
- [ ] Payment processing
- [ ] Scheduling optimization
- [ ] Resource planning

## Related Documentation

- 📘 [Getting Started](GETTING_STARTED.md)
- 🔧 [Build System](BUILD_SYSTEM.md)
- ➕ [Adding Modules](ADDING_MODULES.md)
- 🧪 [Testing Guide](tests/README.md)
- 🔄 [CI/CD Guide](.github/README.md)
