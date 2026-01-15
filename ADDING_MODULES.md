# Adding New Modules to Hooomz

This guide walks you through adding a new feature module to the Hooomz platform.

## Overview

Adding a new module involves:
1. Define types in `shared-contracts`
2. Create package structure
3. Implement service layer
4. Implement repository
5. Create UI components
6. Add routes in web app
7. Write tests
8. Update documentation

## Example: Adding an "Inventory" Module

Let's walk through adding an inventory management feature.

## Step 1: Define Types in shared-contracts

### 1.1 Create Type Definitions

Edit `packages/shared-contracts/src/types/inventory.ts`:

```typescript
/**
 * Inventory item in warehouse or vehicle
 */
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  sku?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  location: string;
  reorderPoint?: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryCategory =
  | 'materials'
  | 'tools'
  | 'equipment'
  | 'supplies'
  | 'safety';

export interface CreateInventoryItemInput {
  name: string;
  description?: string;
  category: InventoryCategory;
  sku?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  location: string;
  reorderPoint?: number;
  supplier?: string;
}

export interface UpdateInventoryItemInput {
  name?: string;
  description?: string;
  category?: InventoryCategory;
  sku?: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  location?: string;
  reorderPoint?: number;
  supplier?: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'purchase' | 'use' | 'return' | 'adjustment';
  quantity: number;
  projectId?: string;
  notes?: string;
  createdAt: string;
}
```

### 1.2 Create Validation Schemas

Edit `packages/shared-contracts/src/schemas/inventory.ts`:

```typescript
import { z } from 'zod';

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['materials', 'tools', 'equipment', 'supplies', 'safety']),
  sku: z.string().max(50).optional(),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(20),
  unitCost: z.number().min(0),
  location: z.string().min(1).max(200),
  reorderPoint: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['materials', 'tools', 'equipment', 'supplies', 'safety']),
  sku: z.string().max(50).optional(),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(20),
  unitCost: z.number().min(0),
  location: z.string().min(1).max(200),
  reorderPoint: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();
```

### 1.3 Export from index

Edit `packages/shared-contracts/src/index.ts`:

```typescript
// Add to existing exports
export * from './types/inventory';
export * from './schemas/inventory';
```

### 1.4 Build shared-contracts

```bash
pnpm build:shared
```

## Step 2: Create Package Structure

### 2.1 Create Package Directory

```bash
mkdir -p packages/inventory/src/{services,repositories,validators}
```

### 2.2 Create package.json

`packages/inventory/package.json`:

```json
{
  "name": "@hooomz/inventory",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "clean": "rm -rf dist tsconfig.tsbuildinfo",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "@hooomz/shared-contracts": "workspace:*",
    "@hooomz/db": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### 2.3 Create tsconfig.json

`packages/inventory/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared-contracts" },
    { "path": "../db" }
  ]
}
```

## Step 3: Implement Repository

`packages/inventory/src/repositories/inventory-repository.ts`:

```typescript
import { IndexedDBRepository } from '@hooomz/db';
import type { InventoryItem } from '@hooomz/shared-contracts';

export class InventoryRepository extends IndexedDBRepository<InventoryItem> {
  constructor() {
    super('inventory');
  }

  /**
   * Find items below reorder point
   */
  async findLowStock(): Promise<InventoryItem[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const items = await store.getAll();

    return items.filter(
      (item) => item.reorderPoint && item.quantity <= item.reorderPoint
    );
  }

  /**
   * Find items by location
   */
  async findByLocation(location: string): Promise<InventoryItem[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const index = store.index('location');

    return await index.getAll(location);
  }

  /**
   * Search items by name or SKU
   */
  async search(query: string): Promise<InventoryItem[]> {
    const allItems = await this.list();
    const lowerQuery = query.toLowerCase();

    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.sku?.toLowerCase().includes(lowerQuery)
    );
  }
}
```

## Step 4: Implement Service

`packages/inventory/src/services/inventory-service.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid';
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ServiceResponse,
} from '@hooomz/shared-contracts';
import { createInventoryItemSchema, updateInventoryItemSchema } from '@hooomz/shared-contracts';
import { InventoryRepository } from '../repositories/inventory-repository';

export interface InventoryService {
  create(input: CreateInventoryItemInput): Promise<ServiceResponse<InventoryItem>>;
  getById(id: string): Promise<ServiceResponse<InventoryItem>>;
  list(): Promise<ServiceResponse<InventoryItem[]>>;
  search(query: string): Promise<ServiceResponse<InventoryItem[]>>;
  getLowStock(): Promise<ServiceResponse<InventoryItem[]>>;
  getByLocation(location: string): Promise<ServiceResponse<InventoryItem[]>>;
  update(id: string, input: UpdateInventoryItemInput): Promise<ServiceResponse<InventoryItem>>;
  delete(id: string): Promise<ServiceResponse<void>>;
  adjustQuantity(id: string, adjustment: number): Promise<ServiceResponse<InventoryItem>>;
}

export function createInventoryService(
  repository: InventoryRepository
): InventoryService {
  return {
    async create(input: CreateInventoryItemInput): Promise<ServiceResponse<InventoryItem>> {
      try {
        // Validate input
        const validated = createInventoryItemSchema.parse(input);

        const now = new Date().toISOString();
        const item: InventoryItem = {
          ...validated,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };

        await repository.create(item);

        return { success: true, data: item };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to create inventory item',
          code: 'CREATE_FAILED',
        };
      }
    },

    async getById(id: string): Promise<ServiceResponse<InventoryItem>> {
      try {
        const item = await repository.read(id);

        if (!item) {
          return {
            success: false,
            error: 'Inventory item not found',
            code: 'NOT_FOUND',
          };
        }

        return { success: true, data: item };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get inventory item',
          code: 'READ_FAILED',
        };
      }
    },

    async list(): Promise<ServiceResponse<InventoryItem[]>> {
      try {
        const items = await repository.list();
        return { success: true, data: items };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to list inventory items',
          code: 'LIST_FAILED',
        };
      }
    },

    async search(query: string): Promise<ServiceResponse<InventoryItem[]>> {
      try {
        const items = await repository.search(query);
        return { success: true, data: items };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to search inventory',
          code: 'SEARCH_FAILED',
        };
      }
    },

    async getLowStock(): Promise<ServiceResponse<InventoryItem[]>> {
      try {
        const items = await repository.findLowStock();
        return { success: true, data: items };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get low stock items',
          code: 'LOW_STOCK_FAILED',
        };
      }
    },

    async getByLocation(location: string): Promise<ServiceResponse<InventoryItem[]>> {
      try {
        const items = await repository.findByLocation(location);
        return { success: true, data: items };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get items by location',
          code: 'LOCATION_FAILED',
        };
      }
    },

    async update(
      id: string,
      input: UpdateInventoryItemInput
    ): Promise<ServiceResponse<InventoryItem>> {
      try {
        // Validate input
        const validated = updateInventoryItemSchema.parse(input);

        const existing = await repository.read(id);
        if (!existing) {
          return {
            success: false,
            error: 'Inventory item not found',
            code: 'NOT_FOUND',
          };
        }

        const updated: InventoryItem = {
          ...existing,
          ...validated,
          updatedAt: new Date().toISOString(),
        };

        await repository.update(id, updated);

        return { success: true, data: updated };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to update inventory item',
          code: 'UPDATE_FAILED',
        };
      }
    },

    async delete(id: string): Promise<ServiceResponse<void>> {
      try {
        await repository.delete(id);
        return { success: true, data: undefined };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to delete inventory item',
          code: 'DELETE_FAILED',
        };
      }
    },

    async adjustQuantity(
      id: string,
      adjustment: number
    ): Promise<ServiceResponse<InventoryItem>> {
      try {
        const existing = await repository.read(id);
        if (!existing) {
          return {
            success: false,
            error: 'Inventory item not found',
            code: 'NOT_FOUND',
          };
        }

        const newQuantity = existing.quantity + adjustment;
        if (newQuantity < 0) {
          return {
            success: false,
            error: 'Insufficient quantity',
            code: 'INSUFFICIENT_QUANTITY',
          };
        }

        const updated: InventoryItem = {
          ...existing,
          quantity: newQuantity,
          updatedAt: new Date().toISOString(),
        };

        await repository.update(id, updated);

        return { success: true, data: updated };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to adjust quantity',
          code: 'ADJUST_FAILED',
        };
      }
    },
  };
}
```

## Step 5: Export Public API

`packages/inventory/src/index.ts`:

```typescript
export * from './services/inventory-service';
export * from './repositories/inventory-repository';
```

## Step 6: Build the Package

```bash
cd packages/inventory
pnpm install
pnpm build
```

## Step 7: Create UI Components

### 7.1 Create Service Hook

`apps/web/src/services/inventory.ts`:

```typescript
import { useMemo } from 'react';
import { createInventoryService, InventoryRepository } from '@hooomz/inventory';

export function useInventoryService() {
  return useMemo(() => {
    const repository = new InventoryRepository();
    return createInventoryService(repository);
  }, []);
}
```

### 7.2 Create List Page

`apps/web/src/app/inventory/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useInventoryService } from '@/services/inventory';
import type { InventoryItem } from '@hooomz/shared-contracts';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const inventoryService = useInventoryService();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    const response = await inventoryService.list();
    if (response.success) {
      setItems(response.data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>

      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded p-4">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">
              {item.quantity} {item.unit} @ ${item.unitCost.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">{item.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Step 8: Update Build Script

Edit `scripts/build.js` to include the new package:

```javascript
// Step 3: Build all feature packages in parallel
execCommand(
  'pnpm --filter @hooomz/customers --filter @hooomz/projects --filter @hooomz/estimating --filter @hooomz/scheduling --filter @hooomz/field-docs --filter @hooomz/reporting --filter @hooomz/inventory build',
  'Building feature packages (parallel)'
);
```

## Step 9: Write Tests

`tests/integration/inventory.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnvironment } from '../setup';

describe('Inventory Management', () => {
  setupTestEnvironment();

  it('should create and retrieve inventory items', async () => {
    const inventoryService = {} as any; // Mock service

    const response = await inventoryService.create({
      name: 'Paint - White',
      category: 'materials',
      quantity: 10,
      unit: 'gallon',
      unitCost: 35.99,
      location: 'Warehouse A',
      reorderPoint: 5,
    });

    expect(response.success).toBe(true);
    expect(response.data?.name).toBe('Paint - White');
  });

  it('should detect low stock items', async () => {
    const inventoryService = {} as any;

    // Create item with low stock
    await inventoryService.create({
      name: 'Nails',
      category: 'materials',
      quantity: 3,
      unit: 'box',
      unitCost: 12.50,
      location: 'Truck 1',
      reorderPoint: 5,
    });

    const lowStockResponse = await inventoryService.getLowStock();
    expect(lowStockResponse.success).toBe(true);
    expect(lowStockResponse.data?.length).toBeGreaterThan(0);
  });
});
```

## Step 10: Update Documentation

### 10.1 Create Package README

`packages/inventory/README.md`:

```markdown
# @hooomz/inventory

Inventory management module for tracking materials, tools, and equipment.

## Features

- Track inventory items with quantities and costs
- Low stock alerts
- Location-based organization
- Quantity adjustments
- Search functionality

## Usage

\`\`\`typescript
import { createInventoryService, InventoryRepository } from '@hooomz/inventory';

const repository = new InventoryRepository();
const service = createInventoryService(repository);

// Create item
const response = await service.create({
  name: 'Paint - White',
  category: 'materials',
  quantity: 10,
  unit: 'gallon',
  unitCost: 35.99,
  location: 'Warehouse A',
});

// Get low stock items
const lowStock = await service.getLowStock();
\`\`\`

## API

See [ARCHITECTURE.md](../../ARCHITECTURE.md) for patterns and conventions.
```

### 10.2 Update Root README

Add to project structure in `README.md`:

```markdown
├── packages/
│   ├── inventory/              # Inventory management
```

## Step 11: Verify Everything Works

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build

# Run tests
pnpm test

# Start dev server
pnpm dev
```

Navigate to `http://localhost:3000/inventory` to see your new module!

## Checklist

- [ ] Types defined in `shared-contracts`
- [ ] Validation schemas created
- [ ] Package structure created
- [ ] Repository implemented with custom queries
- [ ] Service implemented with all CRUD operations
- [ ] Public API exported
- [ ] Service hook created in web app
- [ ] UI pages created
- [ ] Build script updated
- [ ] Integration tests written
- [ ] Package README created
- [ ] Root documentation updated
- [ ] Everything builds successfully
- [ ] Tests pass
- [ ] Feature works in browser

## Common Issues

### "Cannot find module @hooomz/inventory"

**Solution**: Build the package first:
```bash
cd packages/inventory
pnpm build
```

### "Type errors in web app"

**Solution**: Rebuild shared-contracts:
```bash
pnpm build:shared
pnpm build
```

### "Tests failing"

**Solution**: Update test fixtures with new module data.

## Best Practices

1. **Start with types** - Define your data model first
2. **Keep services thin** - Delegate to repository
3. **Validate early** - Use Zod schemas
4. **Return ServiceResponse** - Consistent error handling
5. **Write tests first** - TDD when possible
6. **Document as you go** - Update READMEs immediately
7. **Follow existing patterns** - Look at other modules

## Related Documentation

- 📐 [Architecture](ARCHITECTURE.md)
- 📘 [Getting Started](GETTING_STARTED.md)
- 🧪 [Testing Guide](tests/README.md)
