# Integration Tests

Comprehensive integration tests that verify all Hooomz modules work together correctly.

## Test Structure

```
tests/
├── setup.ts                           # Test environment setup
├── fixtures.ts                        # Mock data fixtures
├── integration/
│   ├── project-lifecycle.test.ts      # Complete project workflow
│   ├── calculation-accuracy.test.ts   # Financial calculations
│   ├── data-integrity.test.ts         # Referential integrity
│   └── offline-scenarios.test.ts      # Offline functionality
└── reports/                           # Test coverage reports
```

## Running Tests

### All Tests
```bash
npm test
```

### Integration Tests Only
```bash
npm test:integration
```

### With Coverage
```bash
npm test:coverage
```

### Watch Mode
```bash
npm test:watch
```

### Specific Test File
```bash
npm test tests/integration/project-lifecycle.test.ts
```

## Test Categories

### 1. Project Lifecycle Tests
Tests complete project workflow from creation to completion:
- Create customer
- Create project for customer
- Add estimate with line items
- Create and link tasks
- Schedule inspection
- Update statuses through lifecycle
- Generate final report
- Verify data consistency across all modules

**Run:** `npm test project-lifecycle`

### 2. Calculation Accuracy Tests
Verifies financial calculations:
- Line item totals
- Estimate subtotals
- Markup calculations
- Tax calculations
- Grand totals
- Category breakdowns
- Variance analysis (estimate vs actual)
- Profit margin calculations
- Rounding and precision
- Edge cases (zero, negative, very large numbers)

**Run:** `npm test calculation-accuracy`

### 3. Data Integrity Tests
Tests referential integrity and validation:
- Referential integrity across modules
- Cascade delete behaviors
- Validation rules (required fields, formats, ranges)
- Unique constraints
- Transaction rollback on errors
- Concurrent update handling

**Run:** `npm test data-integrity`

### 4. Offline Scenarios Tests
Tests offline functionality:
- Data creation while offline
- Sync queue management
- Queue persistence
- Operation deduplication
- Coming online and syncing
- Sync order preservation
- Failure handling and retries
- Conflict resolution
- Photo upload status
- Intermittent connectivity
- Large offline queues

**Run:** `npm test offline-scenarios`

## Test Data Fixtures

Mock data is provided in `fixtures.ts`:
- `mockCustomer` - Sample residential customer
- `mockCommercialCustomer` - Sample commercial customer
- `mockProject` - Kitchen renovation project
- `mockLineItems` - Estimate line items with known values
- `mockTasks` - Project tasks with dependencies
- `mockInspection` - Quality inspection with checklist
- `mockPhotos` - Sample project photos
- `expectedCalculations` - Expected financial calculation results
- `expectedVariance` - Expected variance analysis results

## Expected Calculation Results

For the fixture data, expected totals are:
- Subtotal: $11,025.00
- Markup (15%): $1,653.75
- Subtotal with Markup: $12,678.75
- Tax (13% HST): $1,648.24
- Grand Total: $14,326.99

## Writing New Tests

### Test Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnvironment } from '../setup';
import { mockCustomer, mockProject } from '../fixtures';

describe('My Feature', () => {
  setupTestEnvironment();

  let customerId: string;

  beforeEach(async () => {
    // Setup code
    const customerService = {} as any;
    const customer = await customerService.create(mockCustomer);
    customerId = customer.data!.id;
  });

  it('should do something', async () => {
    // Test code
    expect(customerId).toBeDefined();
  });
});
```

### Assertions
```typescript
// Basic assertions
expect(value).toBe(expected);
expect(value).toBeDefined();
expect(value).toBeNull();

// Numeric comparisons
expect(value).toBeGreaterThan(0);
expect(value).toBeCloseTo(10.5, 2); // For floating point

// Array/Object
expect(array).toHaveLength(5);
expect(array).toContain(item);
expect(obj).toHaveProperty('id');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Coverage Requirements

Minimum coverage thresholds:
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

View coverage report: `tests/reports/index.html`

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Scheduled daily runs

CI will fail if:
- Any test fails
- Coverage drops below thresholds
- Tests timeout (>10 seconds per test)

## Debugging Tests

### Enable Debug Output
```bash
DEBUG=* npm test
```

### Run Single Test
```typescript
it.only('should test specific behavior', async () => {
  // Only this test will run
});
```

### Skip Test
```typescript
it.skip('should test later', async () => {
  // This test will be skipped
});
```

### VSCode Debugging
1. Set breakpoint in test file
2. Click "Debug" above test in VSCode
3. Use debugger controls to step through

## Mock Services

Test files use mock services. In a real implementation:

```typescript
import { createCustomerService } from '@hooomz/customers';
import { createIndexedDBRepository } from './repositories';

const repository = await createIndexedDBRepository('customers');
const customerService = createCustomerService(repository);
```

## Troubleshooting

### Tests Hanging
- Check for missing `await` keywords
- Verify async operations complete
- Check timeout values in vitest.config.ts

### Flaky Tests
- Use `waitFor()` helper for async operations
- Check for race conditions
- Ensure proper cleanup in `afterEach`

### IndexedDB Errors
- Ensure `setupTestEnvironment()` is called
- Check database cleanup in setup.ts
- Verify browser environment is available

## Best Practices

1. **Isolation** - Each test should be independent
2. **Cleanup** - Always clean up test data
3. **Descriptive Names** - Use clear test descriptions
4. **Arrange-Act-Assert** - Follow AAA pattern
5. **Mock External Dependencies** - Don't make real API calls
6. **Test Edge Cases** - Include boundary conditions
7. **Use Fixtures** - Leverage existing mock data
8. **Async/Await** - Always await async operations
9. **Meaningful Assertions** - Check specific values, not just truthy
10. **Documentation** - Add comments for complex test logic

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Jest Matchers](https://jestjs.io/docs/expect) (Compatible with Vitest)
