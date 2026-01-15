# Catalog Usage Examples

Practical examples for working with the material and labor catalog.

## Setup

```typescript
import {
  CatalogService,
  LaborRateService,
  InMemoryCatalogRepository,
} from '@hooomz/estimating';

// Initialize repository
const catalogRepository = new InMemoryCatalogRepository();

// Initialize services
const catalogService = new CatalogService({ catalogRepository });
const laborRateService = new LaborRateService({ catalogRepository });
```

## Example 1: Creating a Kitchen Renovation Estimate

```typescript
// Get suggested items for a kitchen renovation
const suggestions = await catalogService.suggestItems('kitchen renovation');

if (suggestions.success && suggestions.data) {
  console.log(`Found ${suggestions.data.length} suggested items`);

  // Filter materials vs labor
  const materials = suggestions.data.filter(item => item.type === 'material');
  const labor = suggestions.data.filter(item => item.type === 'labor');

  console.log(`Materials: ${materials.length}, Labor: ${labor.length}`);
}
```

## Example 2: Searching for Specific Materials

```typescript
// Search for drywall products
const drywallResults = await catalogService.searchCatalog('drywall');

if (drywallResults.success && drywallResults.data) {
  drywallResults.data.forEach(item => {
    console.log(`${item.name}: $${item.unitCost} per ${item.unit}`);
    console.log(`  Supplier: ${item.supplier}`);
  });
}

// Search within a specific category
const paintResults = await catalogService.searchCatalog('interior', 'paint');
```

## Example 3: Calculating Framing Labor Cost

```typescript
// Calculate cost for a framing crew working on a project
const crew = [
  { trade: 'framing crew', hours: 40 }, // Lead framer
  { trade: 'framing crew', hours: 40 }, // Second framer
  { trade: 'general laborer', hours: 40 }, // Helper
];

const crewCost = await laborRateService.calculateCrewCost(crew);

if (crewCost.success && crewCost.data) {
  console.log('Framing Crew Cost:');
  console.log(`Total Hours: ${crewCost.data.totalHours}`);
  console.log(`Total Cost: $${crewCost.data.totalCost}`);
  console.log(`Average Rate: $${crewCost.data.averageRate}/hr`);

  crewCost.data.crew.forEach(member => {
    console.log(`  ${member.trade}: ${member.hours}hrs @ $${member.rate}/hr = $${member.cost}`);
  });
}
```

## Example 4: Comparing Labor Rates

```typescript
// Compare all carpenter rates
const comparison = await laborRateService.compareRatesForTrade('carpenter');

if (comparison.success && comparison.data) {
  console.log(`Carpenter Rates (${comparison.data.rates.length} options):`);

  comparison.data.rates.forEach(rate => {
    console.log(`${rate.name}: $${rate.unitCost}/${rate.unit}`);
    console.log(`  Source: ${rate.supplier}`);
    if (rate.notes) console.log(`  Notes: ${rate.notes}`);
  });
}
```

## Example 5: Getting Materials by Category

```typescript
// Get all roofing materials
const roofingMaterials = await catalogService.getItemsByCategory('roofing');

if (roofingMaterials.success && roofingMaterials.data) {
  console.log('Roofing Materials:');

  roofingMaterials.data.forEach(item => {
    console.log(`${item.name}: $${item.unitCost} per ${item.unit}`);
  });
}
```

## Example 6: Adding Custom Materials from Receipts

```typescript
// Add a new material from a Home Hardware receipt
const newMaterial = await catalogService.addCatalogItem({
  type: 'material',
  name: '2x12x20 SPF',
  description: 'Spruce-Pine-Fir dimensional lumber',
  category: 'lumber',
  unit: 'each',
  unitCost: 56.99,
  supplier: 'Home Hardware',
  sku: 'LUM-2x12x20',
  notes: 'Receipt dated 2024-01-15',
  isActive: true,
});

if (newMaterial.success && newMaterial.data) {
  console.log(`Added: ${newMaterial.data.name} (${newMaterial.data.id})`);
}
```

## Example 7: Updating Prices

```typescript
// Update lumber price when costs change
const lumberItem = await catalogService.getCatalogItem('2x4x8 SPF Stud', 'material');

if (lumberItem.success && lumberItem.data) {
  const updated = await catalogService.updatePrice(lumberItem.data.id, 5.49);

  if (updated.success && updated.data) {
    console.log(`Updated ${updated.data.name} from $${lumberItem.data.unitCost} to $${updated.data.unitCost}`);
  }
}
```

## Example 8: Working with Subcontractors

```typescript
// Get all subcontractor rates
const subRates = await laborRateService.getSubcontractorRates();

if (subRates.success && subRates.data) {
  console.log('Subcontractor Rates:');

  // Group by category
  const byCategory = subRates.data.reduce((acc, rate) => {
    if (!acc[rate.category]) acc[rate.category] = [];
    acc[rate.category].push(rate);
    return acc;
  }, {} as Record<string, typeof subRates.data>);

  Object.entries(byCategory).forEach(([category, rates]) => {
    console.log(`\n${category.toUpperCase()}:`);
    rates.forEach(rate => {
      console.log(`  ${rate.name}: $${rate.unitCost}/${rate.unit}`);
    });
  });
}
```

## Example 9: Building a Complete Bathroom Estimate

```typescript
// Get suggestions for bathroom renovation
const suggestions = await catalogService.suggestItems('bathroom renovation');

if (!suggestions.success || !suggestions.data) {
  throw new Error('Failed to get suggestions');
}

// Build line items for the estimate
const lineItems = [];

// Drywall materials
const drywallSheet = suggestions.data.find(
  item => item.type === 'material' && item.name.includes('Drywall Sheet')
);
if (drywallSheet) {
  lineItems.push({
    description: drywallSheet.name,
    quantity: 8,
    unit: drywallSheet.unit,
    unitCost: drywallSheet.unitCost,
    isLabor: false,
    category: 'drywall',
  });
}

// Drywall labor
const drywallLabor = suggestions.data.find(
  item => item.type === 'labor' && item.name.includes('Drywall Installation')
);
if (drywallLabor) {
  lineItems.push({
    description: 'Drywall Installation (200 sqft)',
    quantity: 200,
    unit: drywallLabor.unit,
    unitCost: drywallLabor.unitCost,
    isLabor: true,
    category: 'drywall',
  });
}

// Plumbing labor
const plumber = suggestions.data.find(
  item => item.type === 'labor' && item.name.includes('Plumber')
);
if (plumber) {
  lineItems.push({
    description: 'Plumbing rough-in',
    quantity: 8,
    unit: plumber.unit,
    unitCost: plumber.unitCost,
    isLabor: true,
    category: 'plumbing',
  });
}

console.log('Bathroom Estimate Line Items:');
lineItems.forEach(item => {
  const total = item.quantity * item.unitCost;
  console.log(`${item.description}: ${item.quantity} ${item.unit} @ $${item.unitCost} = $${total}`);
});
```

## Example 10: Multi-Trade Day Rate Calculation

```typescript
// Calculate daily cost for a multi-trade crew
const dailyCrew = [
  { trade: 'general carpenter', hours: 8 },
  { trade: 'electrician', hours: 4 }, // Half day
  { trade: 'plumber', hours: 3 }, // Few hours for rough-in
  { trade: 'general laborer', hours: 8 },
];

const dayCost = await laborRateService.calculateCrewCost(dailyCrew);

if (dayCost.success && dayCost.data) {
  console.log('Daily Crew Cost Breakdown:');
  console.log(`Total Labor Hours: ${dayCost.data.totalHours}`);
  console.log(`Total Daily Cost: $${dayCost.data.totalCost}`);
  console.log(`Blended Rate: $${dayCost.data.averageRate}/hr\n`);

  console.log('Individual Trade Costs:');
  dayCost.data.crew.forEach(member => {
    console.log(`  ${member.trade}: ${member.hours}hrs @ $${member.rate}/hr = $${member.cost}`);
  });
}
```

## Example 11: Negotiated Rate Override

```typescript
// Calculate cost with negotiated rates for specific subcontractors
const negotiatedCrew = [
  { trade: 'electrician', hours: 40, rate: 70 }, // Negotiated down from $75
  { trade: 'plumber', hours: 32, rate: 80 }, // Negotiated down from $85
];

const negotiatedCost = await laborRateService.calculateCrewCost(negotiatedCrew);

if (negotiatedCost.success && negotiatedCost.data) {
  console.log('Cost with Negotiated Rates:');
  console.log(`Total: $${negotiatedCost.data.totalCost}`);

  // Compare to catalog rates
  const catalogCrew = [
    { trade: 'electrician', hours: 40 },
    { trade: 'plumber', hours: 32 },
  ];

  const catalogCost = await laborRateService.calculateCrewCost(catalogCrew);

  if (catalogCost.success && catalogCost.data) {
    const savings = catalogCost.data.totalCost - negotiatedCost.data.totalCost;
    console.log(`Catalog Rate Total: $${catalogCost.data.totalCost}`);
    console.log(`Savings: $${savings.toFixed(2)}`);
  }
}
```

## Example 12: Getting All Available Trades

```typescript
// Get list of all trades in the system
const trades = await laborRateService.getAllTrades();

if (trades.success && trades.data) {
  console.log(`Available Trades (${trades.data.length}):`);
  trades.data.forEach(trade => console.log(`  - ${trade}`));
}
```

## Example 13: Filtering by Supplier

```typescript
// Get all items from a specific supplier
const homeHardware = await catalogService.getBySupplier('Home Hardware');

if (homeHardware.success && homeHardware.data) {
  console.log(`Home Hardware Catalog (${homeHardware.data.length} items):`);

  // Group by category
  const byCategory = homeHardware.data.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof homeHardware.data>);

  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`\n${category} (${items.length} items)`);
  });
}
```

## Example 14: Deactivating Discontinued Items

```typescript
// Deactivate an item that's no longer available
const item = await catalogService.getCatalogItem('Old Product Name', 'material');

if (item.success && item.data) {
  const deactivated = await catalogService.deactivate(item.data.id);

  if (deactivated.success) {
    console.log(`Deactivated: ${item.data.name}`);
    console.log('Item is now inactive but preserved in historical data');
  }
}
```

## Example 15: Creating a New Construction Material List

```typescript
// Get comprehensive material list for new construction
const newBuildItems = await catalogService.suggestItems('new construction');

if (newBuildItems.success && newBuildItems.data) {
  const materials = newBuildItems.data.filter(item => item.type === 'material');

  // Group by category for shopping list
  const shoppingList = materials.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof materials>);

  console.log('New Construction Material List:\n');
  Object.entries(shoppingList).forEach(([category, items]) => {
    console.log(`${category.toUpperCase()}`);
    items.forEach(item => {
      console.log(`  [ ] ${item.name} - $${item.unitCost}/${item.unit} (${item.supplier})`);
    });
    console.log('');
  });
}
```

## Best Practices

1. **Always check response.success**: All service methods return ApiResponse with success/error structure
2. **Use project suggestions as starting point**: Saves time and ensures you don't miss common items
3. **Update prices regularly**: Keep catalog current with market prices
4. **Track sources**: Include supplier and date info when adding custom items
5. **Deactivate vs delete**: Preserve historical data by deactivating instead of deleting
6. **Override rates when needed**: Use rate overrides in crew calculations for negotiated prices
7. **Group by category**: Organize results by category for better readability
8. **Cache repository**: Reuse the same repository instance across services for consistency
