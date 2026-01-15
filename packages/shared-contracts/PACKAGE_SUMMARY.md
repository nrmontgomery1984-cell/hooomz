# @hooomz/shared-contracts - Package Summary

## Overview

The `@hooomz/shared-contracts` package is the foundational layer of the Hooomz monorepo, providing:
- **Type definitions** - Core entity types and enums
- **Runtime validation** - Zod schemas for all entities
- **Utility functions** - Common operations for IDs, dates, money, and status
- **API contracts** - TypeScript interfaces defining the entire application API

This package is the **single source of truth** for all data types and contracts across the monorepo.

## Package Structure

```
packages/shared-contracts/
├── src/
│   ├── types/          # Enums and type definitions
│   ├── constants/      # Labeled constants and validation regexes
│   ├── schemas/        # Zod schemas and validation functions
│   ├── utils/          # Utility functions
│   ├── api/            # API contract interfaces
│   ├── __tests__/      # Test files
│   └── index.ts        # Main entry point
├── package.json
├── tsconfig.json
├── verify-exports.js   # Export verification script
└── README.md           # Full documentation
```

## Exports

The package provides multiple export paths:

### Main Export
```typescript
import { ... } from '@hooomz/shared-contracts';
```
Everything is available from the main export.

### Specific Exports
```typescript
import { ... } from '@hooomz/shared-contracts/types';
import { ... } from '@hooomz/shared-contracts/constants';
import { ... } from '@hooomz/shared-contracts/schemas';
import { ... } from '@hooomz/shared-contracts/utils';
import { ... } from '@hooomz/shared-contracts/api';
```

## Core Features

### 1. Entity Types (Zod-inferred)
- `Project` - Construction projects with status, budget, timeline
- `Customer` - Client information with contact preferences
- `Task` - Work items with dependencies and priorities
- `LineItem` - Cost estimates and actuals
- `Inspection` - Field documentation with photos

### 2. Validation
- Create schemas (without id/metadata): `CreateProject`, `CreateCustomer`, etc.
- Update schemas (partial): `UpdateProject`, `UpdateCustomer`, etc.
- Validation functions: `validateProject()`, `validateCreateProject()`, etc.

### 3. Utilities
- **IDs**: `generateProjectId()`, `generateCustomerId()`, etc.
- **Dates**: `formatDate()`, `parseDate()`, `isOverdue()`, `daysUntil()`
- **Money**: `formatCurrency()`, `parseCurrency()`, `sumLineItems()`
- **Status**: `getStatusColor()`, `getNextStatuses()`, `isValidStatusTransition()`

### 4. API Contract
- Standard responses: `ApiResponse<T>`, `PaginatedApiResponse<T>`
- CRUD interfaces: `ProjectOperations`, `CustomerOperations`, etc.
- Module operations: `CoreOperations`, `EstimatingOperations`, `SchedulingOperations`, etc.
- Complete API: `HooomzApi` interface

## Dependencies

- `zod` (^3.22.4) - Runtime validation
- `nanoid` (^5.0.4) - ID generation
- `typescript` (^5.3.3) - Type checking (dev)

## Build & Verification

### Build
```bash
pnpm build              # Compile TypeScript
pnpm typecheck          # Type check without building
pnpm verify             # Verify all exports are accessible
pnpm clean              # Remove dist folder
```

### From Root
```bash
pnpm build:shared       # Build shared-contracts only
pnpm typecheck:shared   # Type check shared-contracts only
pnpm verify:shared      # Verify shared-contracts exports
```

## Usage in Other Packages

### In package.json
```json
{
  "dependencies": {
    "@hooomz/shared-contracts": "workspace:*"
  }
}
```

### In TypeScript files
```typescript
import {
  Project,
  ProjectStatus,
  validateCreateProject,
  generateProjectId,
  formatCurrency,
  createSuccessResponse,
  type ApiResponse,
  type ProjectOperations
} from '@hooomz/shared-contracts';
```

### In tsconfig.json
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@hooomz/shared-contracts": ["../../packages/shared-contracts/src"]
    }
  },
  "references": [
    { "path": "../../packages/shared-contracts" }
  ]
}
```

## Type Safety

All types are inferred from Zod schemas, ensuring:
- **Compile-time** type checking via TypeScript
- **Runtime** validation via Zod
- **Single source of truth** - schemas define both

## Status Transition Rules

### Projects
LEAD → QUOTED → APPROVED → IN_PROGRESS → COMPLETE
- Can go ON_HOLD from IN_PROGRESS
- Can CANCEL at any time before COMPLETE

### Tasks
NOT_STARTED → IN_PROGRESS → COMPLETE
- Can go BLOCKED from any state except COMPLETE
- Can return to IN_PROGRESS from BLOCKED

### Inspections
SCHEDULED → PASSED/FAILED → PENDING_REINSPECTION → SCHEDULED

## Validation Examples

```typescript
// Create a new project
const createData: CreateProject = {
  name: 'Kitchen Remodel',
  address: { /* ... */ },
  status: ProjectStatus.LEAD,
  projectType: ProjectType.KITCHEN_REMODEL,
  clientId: 'cust-123',
  dates: {},
  budget: { estimatedCost: 50000, actualCost: 0 }
};

const result = validateCreateProject(createData);
if (result.success) {
  // data is validated and typed
  const validData = result.data;
} else {
  // error contains Zod validation errors
  console.error(result.error.errors);
}
```

## API Contract Examples

```typescript
// Implement the contract
class ProjectService implements ProjectOperations {
  async list(params?: QueryParams): Promise<PaginatedApiResponse<Project[]>> {
    // implementation
  }

  async getById(id: string): Promise<ApiResponse<Project>> {
    // implementation
  }

  // ... other CRUD methods
}

// Use with type safety
const response = await projectService.list({
  filters: { status: ProjectStatus.IN_PROGRESS },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20
});

if (isSuccessResponse(response)) {
  const projects = response.data; // TypeScript knows this is Project[]
  const total = response.meta?.total;
}
```

## Next Steps

Other packages will:
1. Import types and validation from this package
2. Implement the API contracts defined here
3. Use the utility functions for common operations
4. Follow the status transition rules defined here

## Maintenance

When adding new features:
1. Add enum values to `src/types/index.ts`
2. Add Zod schemas to `src/schemas/index.ts`
3. Add constants to `src/constants/index.ts`
4. Add utilities to `src/utils/index.ts` if needed
5. Add API contracts to `src/api/index.ts` if needed
6. Run `pnpm verify` to ensure exports work
7. Run `pnpm typecheck` to verify TypeScript compilation
8. Update examples and documentation

## Status

✅ Package structure complete
✅ All exports configured
✅ TypeScript types defined
✅ Zod validation implemented
✅ Utility functions created
✅ API contracts defined
✅ Documentation complete
✅ Verification script ready

**Ready for use in other packages!**
