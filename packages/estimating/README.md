# @hooomz/estimating

Cost estimation engine for residential construction projects in New Brunswick.

## Features

- **Line Item Management**: CRUD operations for project line items
- **Material Catalog**: 40+ pre-seeded materials from local suppliers
- **Labor Rates**: 20+ trade rates from NB market
- **Cost Calculations**: Pure functions for estimates, markup, tax, margins
- **Variance Analysis**: Compare estimated vs actual costs
- **Project Suggestions**: Intelligent item recommendations by project type
- **Crew Calculations**: Multi-trade labor cost calculations

## Installation

```bash
# Install in workspace
npm install @hooomz/estimating
```

## Quick Start

```typescript
import {
  EstimateService,
  CatalogService,
  InMemoryLineItemRepository,
  InMemoryCatalogRepository,
  calculateEstimateTotal,
  NB_HST_RATE,
} from '@hooomz/estimating';

// Initialize
const lineItemRepo = new InMemoryLineItemRepository();
const catalogRepo = new InMemoryCatalogRepository();

const estimateService = new EstimateService({
  lineItemRepository: lineItemRepo,
  catalogRepository: catalogRepo,
});

const catalogService = new CatalogService({ catalogRepository: catalogRepo });

// Get suggestions for your project
const suggestions = await catalogService.suggestItems('kitchen renovation');

// Create line items
const lineItems = [
  {
    projectId: 'proj_123',
    description: '2x4 Lumber',
    quantity: 100,
    unit: 'each',
    unitCost: 4.99,
    isLabor: false,
    category: 'lumber',
  },
  // ... more items
];

// Calculate estimate with 35% markup and NB HST
const estimate = calculateEstimateTotal(lineItems, 35, NB_HST_RATE);

console.log(`Subtotal: $${estimate.subtotal}`);
console.log(`After Markup: $${estimate.afterMarkup}`);
console.log(`Tax: $${estimate.taxAmount}`);
console.log(`Total: $${estimate.total}`);
```

## Core Modules

### 1. Calculations (`/calculations`)

Pure functions for all cost calculations:

```typescript
import {
  calculateEstimateTotal,
  calculateMargin,
  projectProfitability,
  compareEstimateToActual,
  NB_HST_RATE,
} from '@hooomz/estimating';

// Calculate complete estimate
const estimate = calculateEstimateTotal(lineItems, 35, NB_HST_RATE);

// Calculate profit margin
const margin = calculateMargin(revenue, cost);

// Project profitability with overhead
const profitability = projectProfitability(revenue, cost, 12);

// Compare estimate to actual
const comparison = compareEstimateToActual(estimatedItems, actualItems);
```

**Key Functions:**
- Line item calculations (quantity × cost, waste factors, labor)
- Estimate totals (subtotal, materials, labor, markup, tax)
- Margin analysis (profit, breakeven, ROI)
- Variance analysis (estimate vs actual)

### 2. Catalog (`/catalog`)

Material and labor rate database:

```typescript
import {
  CatalogService,
  LaborRateService,
  InMemoryCatalogRepository,
} from '@hooomz/estimating';

const catalogRepo = new InMemoryCatalogRepository();
const catalogService = new CatalogService({ catalogRepository: catalogRepo });
const laborService = new LaborRateService({ catalogRepository: catalogRepo });

// Search materials
const drywall = await catalogService.searchCatalog('drywall');

// Get items by category
const lumber = await catalogService.getItemsByCategory('lumber');

// Get project suggestions
const items = await catalogService.suggestItems('bathroom renovation');

// Calculate crew cost
const crewCost = await laborService.calculateCrewCost([
  { trade: 'carpenter', hours: 8 },
  { trade: 'electrician', hours: 4 },
]);
```

**Pre-Seeded Data:**
- 40+ materials (lumber, drywall, roofing, flooring, etc.)
- 20+ labor rates (carpentry, electrical, plumbing, etc.)
- NB market prices from Home Hardware and Kent

**Project Types Supported:**
- New Construction
- Renovation/Remodel
- Kitchen/Bathroom
- Roofing/Siding
- Addition
- Deck/Outdoor
- Interior Finishing

### 3. Estimates (`/estimates`)

Line item and project estimate management:

```typescript
import {
  EstimateService,
  InMemoryLineItemRepository,
  InMemoryCatalogRepository,
} from '@hooomz/estimating';

const estimateService = new EstimateService({
  lineItemRepository: new InMemoryLineItemRepository(),
  catalogRepository: new InMemoryCatalogRepository(),
});

// CRUD operations
await estimateService.create(lineItemData);
await estimateService.update(id, updateData);
await estimateService.delete(id);

// Project operations
const items = await estimateService.getByProjectId(projectId);
const totals = await estimateService.calculateProjectTotals(projectId);
const summary = await estimateService.getProjectEstimateSummary(projectId);

// Bulk operations
await estimateService.bulkCreateLineItems(projectId, items);
await estimateService.copyLineItems(sourceProjectId, targetProjectId);

// Markup operations
await estimateService.applyGlobalMarkup(projectId, 35);
await estimateService.applyDifferentialMarkup(projectId, 30, 40);
```

## API Reference

### Calculation Functions

#### Line Item Calculations
- `calculateLineItemTotal(quantity, unitCost)` - Basic multiplication
- `calculateWithWaste(quantity, wastePercentage)` - Add waste factor
- `calculateLaborCost(hours, hourlyRate)` - Labor cost
- `getDefaultWasteFactor(category)` - Get recommended waste %

#### Estimate Totals
- `calculateSubtotal(lineItems)` - Sum all items
- `calculateMaterialsTotal(lineItems)` - Materials only
- `calculateLaborTotal(lineItems)` - Labor only
- `applyMarkup(amount, markupPercentage)` - Add markup
- `calculateTax(amount, taxRate)` - Calculate HST
- `calculateEstimateTotal(lineItems, markup, taxRate)` - Complete calculation

#### Margin Analysis
- `calculateMargin(revenue, cost)` - Profit margin %
- `calculateBreakeven(fixedCosts, marginPercentage)` - Breakeven revenue
- `analyzeBreakeven(fixedCosts, margin, unitPrice?, dailyRevenue?)` - Detailed analysis
- `projectProfitability(revenue, cost, overheadPercentage)` - Full profitability

#### Comparison
- `calculateVariance(estimated, actual)` - Variance with status
- `compareEstimateToActual(estimatedItems, actualItems)` - Full comparison
- `identifyOverruns(estimatedItems, actualItems, threshold)` - Flag problem areas

### Services

See [PACKAGE_SUMMARY.md](./PACKAGE_SUMMARY.md) for complete API documentation.

## Constants

```typescript
export const NB_HST_RATE = 15; // New Brunswick HST

export const DEFAULT_WASTE_FACTORS = {
  lumber: 10,
  drywall: 15,
  flooring: 10,
  tile: 15,
  paint: 5,
  concrete: 5,
  insulation: 10,
  roofing: 10,
  siding: 10,
};
```

## Testing

The package includes comprehensive tests:

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Run simple test suite
npx tsx src/calculations/run-tests.ts
```

## Documentation

- [PACKAGE_SUMMARY.md](./PACKAGE_SUMMARY.md) - Complete package overview
- [CATALOG_SUMMARY.md](./CATALOG_SUMMARY.md) - Catalog implementation details
- [catalog/README.md](./src/catalog/README.md) - Catalog API reference
- [catalog/EXAMPLES.md](./src/catalog/EXAMPLES.md) - 15 practical examples

## Examples

### Creating a Complete Estimate

```typescript
// 1. Get suggestions for your project
const suggestions = await catalogService.suggestItems('new construction');

// 2. Create line items for your project
const createItem = async (catalogItem, quantity) => {
  return await estimateService.create({
    projectId: 'proj_123',
    description: catalogItem.name,
    quantity,
    unit: catalogItem.unit,
    unitCost: catalogItem.unitCost,
    isLabor: catalogItem.type === 'labor',
    category: catalogItem.category,
  });
};

// 3. Calculate totals
const totals = await estimateService.calculateProjectTotals('proj_123');

// 4. Apply markup
await estimateService.applyDifferentialMarkup('proj_123', 30, 40);

// 5. Get final summary
const summary = await estimateService.getProjectEstimateSummary('proj_123');
```

### Calculating Crew Costs

```typescript
const crew = [
  { trade: 'framing crew', hours: 40 },
  { trade: 'framing crew', hours: 40 },
  { trade: 'general laborer', hours: 40 },
];

const result = await laborService.calculateCrewCost(crew);

console.log(`Total Hours: ${result.data.totalHours}`);
console.log(`Total Cost: $${result.data.totalCost}`);
console.log(`Average Rate: $${result.data.averageRate}/hr`);
```

### Comparing Estimate to Actual

```typescript
// Get estimate and actual line items
const estimatedItems = await estimateService.getByProjectId('proj_123');
const actualItems = await estimateService.getByProjectId('proj_123_actual');

// Compare
const comparison = compareEstimateToActual(
  estimatedItems.data,
  actualItems.data
);

console.log(`Total Variance: $${comparison.summary.totalVariance}`);
console.log(`Variance %: ${comparison.summary.totalVariancePercentage}%`);

// Show overruns
comparison.overruns.forEach(item => {
  console.log(`${item.description}: +$${item.variance} (${item.variancePercentage}%)`);
});
```

## Type Safety

All operations return `ApiResponse<T>` with success/error structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

Always check `response.success` before accessing `response.data`:

```typescript
const result = await catalogService.searchCatalog('lumber');

if (result.success && result.data) {
  // Safe to use result.data
  result.data.forEach(item => console.log(item.name));
} else {
  // Handle error
  console.error(result.error?.message);
}
```

## Best Practices

1. **Check Response Success**: Always verify `response.success` before using data
2. **Use Project Suggestions**: Start estimates with `suggestItems()` for common projects
3. **Update Prices Regularly**: Keep catalog current with `updatePrice()`
4. **Apply Differential Markup**: Use different markups for materials vs labor
5. **Track Variance**: Compare estimates to actuals to improve future estimates
6. **Deactivate vs Delete**: Use `deactivate()` to preserve historical data

## Dependencies

- **@hooomz/shared-contracts**: Base types and utilities

## License

Private - Internal use only

## Support

For issues or questions, see [PACKAGE_SUMMARY.md](./PACKAGE_SUMMARY.md) for detailed documentation.
