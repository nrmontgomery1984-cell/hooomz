# Catalog Module

Material and labor rate catalog for cost estimation in New Brunswick construction market.

## Overview

The catalog module manages a database of:
- **Materials**: Construction materials with costs from local suppliers (Home Hardware, Kent)
- **Labor Rates**: Trade rates from standard rates and subcontractor quotes

## Components

### CatalogItem

Base interface for all catalog entries:

```typescript
interface CatalogItem {
  id: string;
  type: 'material' | 'labor';
  name: string;
  description?: string;
  category: string;
  unit: string; // 'each', 'sqft', 'hour', 'linear_ft', etc.
  unitCost: number;
  supplier?: string;
  sku?: string;
  notes?: string;
  isActive: boolean;
  metadata: Metadata;
}
```

### LaborRate

Extended interface for labor-specific tracking:

```typescript
interface LaborRate extends CatalogItem {
  type: 'labor';
  trade: string;
  hourlyRate: number; // Same as unitCost
  source?: string; // e.g., "ABC Plumbing quote 2024"
  isSubcontractor: boolean;
}
```

## Material Categories

The catalog is pre-seeded with items across these categories:

- **Lumber**: Dimensional lumber (2x4, 2x6, 2x8, 2x10)
- **Framing**: Framing materials and fasteners
- **Sheathing**: OSB, plywood
- **Roofing**: Shingles, felt, ice & water shield
- **Siding**: Vinyl siding, house wrap
- **Insulation**: Batt insulation (R12, R20), spray foam
- **Drywall**: Sheets, compound, tape
- **Electrical**: Outlets, switches, wire
- **Plumbing**: PEX tubing, faucets, fixtures
- **HVAC**: Ductwork, registers
- **Flooring**: Laminate, vinyl, hardwood
- **Trim**: Baseboard, casing, crown moulding
- **Doors**: Entry doors, interior doors
- **Windows**: Double hung, sliding
- **Paint**: Interior and exterior paint
- **Concrete**: Mix, ready-mix, rebar
- **Foundation**: Forms, rebar

## Labor Trades

Pre-seeded labor rates for common trades:

- **Carpentry**: General carpenter ($45/hr), finish carpenter ($55/hr), trim carpenter ($50/hr)
- **Electrical**: Licensed electrician ($75/hr)
- **Plumbing**: Licensed plumber ($85/hr)
- **HVAC**: HVAC technician ($95/hr)
- **Drywall**: Installation ($1.25/sqft), taping & finishing ($0.85/sqft)
- **Painting**: Interior painting ($1.50/sqft)
- **Flooring**: Installation ($3.00/sqft)
- **Roofing**: Roofer ($4.50/sqft)
- **Siding**: Siding installer ($3.25/sqft)
- **Insulation**: Insulation installer ($0.75/sqft)
- **Concrete**: Concrete finisher ($55/hr)
- **Foundation**: Foundation crew ($65/hr per member)
- **Windows/Doors**: Window installer ($125 each), door installation ($150 each)
- **Framing**: Framing crew ($50/hr per member)
- **General**: General laborer ($25/hr)

## CatalogService

Main service for catalog operations.

### Core Methods

```typescript
// List and search
list(params?: CatalogQueryParams): Promise<PaginatedApiResponse<CatalogItem[]>>
search(query: string, type?: 'material' | 'labor'): Promise<ApiResponse<CatalogItem[]>>
searchCatalog(query: string, category?: string): Promise<ApiResponse<CatalogItem[]>>

// Get items
getById(id: string): Promise<ApiResponse<CatalogItem>>
getCatalogItem(name: string, type?: 'material' | 'labor'): Promise<ApiResponse<CatalogItem>>
getByCategory(category: string): Promise<ApiResponse<CatalogItem[]>>
getItemsByCategory(category: string): Promise<ApiResponse<CatalogItem[]>>

// Create and update
create(data: CreateCatalogItem): Promise<ApiResponse<CatalogItem>>
addCatalogItem(data: CreateCatalogItem): Promise<ApiResponse<CatalogItem>>
update(id: string, data: UpdateCatalogItem): Promise<ApiResponse<CatalogItem>>
updatePrice(id: string, newPrice: number): Promise<ApiResponse<CatalogItem>>

// Delete
delete(id: string): Promise<ApiResponse<void>>
deactivate(id: string): Promise<ApiResponse<CatalogItem>>
activate(id: string): Promise<ApiResponse<CatalogItem>>

// Specialized queries
getMaterials(): Promise<ApiResponse<CatalogItem[]>>
getLaborRates(): Promise<ApiResponse<CatalogItem[]>>
getBySupplier(supplier: string): Promise<ApiResponse<CatalogItem[]>>
suggestItems(projectType: string): Promise<ApiResponse<CatalogItem[]>>
```

### Project Type Suggestions

The `suggestItems()` method returns relevant materials and labor for common project types:

- **New Construction / New Build**: All categories
- **Renovation / Remodel**: Drywall, flooring, paint, trim, doors, windows, electrical, plumbing
- **Kitchen Renovation**: Drywall, flooring, paint, electrical, plumbing, trim
- **Bathroom Renovation**: Drywall, flooring, paint, plumbing, electrical, trim
- **Roofing**: Roofing materials and labor
- **Siding**: Siding materials and labor
- **Addition**: Framing, foundation, all finishing trades
- **Deck / Outdoor**: Lumber, framing, concrete
- **Interior Finishing**: Drywall, flooring, trim, paint, doors

## LaborRateService

Specialized service for labor rate management and crew calculations.

### Methods

```typescript
// Get labor rates
getLaborRates(trade?: string): Promise<ApiResponse<CatalogItem[]>>
getLaborRateByTrade(trade: string): Promise<ApiResponse<CatalogItem>>
getAllTrades(): Promise<ApiResponse<string[]>>

// Update rates
updateLaborRate(id: string, newRate: number): Promise<ApiResponse<CatalogItem>>

// Crew calculations
calculateCrewCost(crew: CrewMember[]): Promise<ApiResponse<CrewCostResult>>

// Filter by type
getSubcontractorRates(): Promise<ApiResponse<CatalogItem[]>>
getInHouseRates(): Promise<ApiResponse<CatalogItem[]>>

// Compare rates
compareRatesForTrade(trade: string): Promise<ApiResponse<{ trade: string; rates: CatalogItem[] }>>
```

### Crew Cost Calculation

Calculate total cost for multiple trades working together:

```typescript
const crewMembers: CrewMember[] = [
  { trade: 'carpenter', hours: 8 },
  { trade: 'electrician', hours: 4 },
  { trade: 'plumber', hours: 6 },
];

const result = await laborRateService.calculateCrewCost(crewMembers);

// Returns:
// {
//   crew: [
//     { trade: 'carpenter', hours: 8, rate: 45, cost: 360 },
//     { trade: 'electrician', hours: 4, rate: 75, cost: 300 },
//     { trade: 'plumber', hours: 6, rate: 85, cost: 510 }
//   ],
//   totalHours: 18,
//   totalCost: 1170,
//   averageRate: 65
// }
```

### Rate Override

You can override catalog rates when calculating crew costs:

```typescript
const crewMembers: CrewMember[] = [
  { trade: 'carpenter', hours: 8, rate: 50 }, // Override rate
  { trade: 'electrician', hours: 4 }, // Use catalog rate
];
```

## Usage Examples

### Adding a New Material

```typescript
const catalogService = new CatalogService({ catalogRepository });

const newMaterial = await catalogService.addCatalogItem({
  type: 'material',
  name: '2x12x16 SPF',
  category: 'lumber',
  unit: 'each',
  unitCost: 42.99,
  supplier: 'Home Hardware',
  isActive: true,
});
```

### Updating a Price

```typescript
const updated = await catalogService.updatePrice('cat_123', 45.99);
```

### Searching for Materials

```typescript
// Search all items
const results = await catalogService.searchCatalog('drywall');

// Search with category filter
const paintResults = await catalogService.searchCatalog('interior', 'paint');
```

### Getting Suggestions for a Project

```typescript
const suggestions = await catalogService.suggestItems('kitchen renovation');

// Returns all relevant materials and labor for kitchen work:
// - Drywall materials and labor
// - Flooring options
// - Paint
// - Electrical items and rates
// - Plumbing fixtures and rates
// - Trim materials and labor
```

### Working with Labor Rates

```typescript
const laborRateService = new LaborRateService({ catalogRepository });

// Get all electrician rates
const electricianRates = await laborRateService.getLaborRateByTrade('electrician');

// Compare rates for a trade
const comparison = await laborRateService.compareRatesForTrade('carpenter');
// Returns all carpenter rates sorted by cost

// Get all available trades
const trades = await laborRateService.getAllTrades();
// Returns: ['carpentry', 'electrical', 'plumbing', 'drywall', ...]

// Calculate cost for a multi-trade crew
const crewCost = await laborRateService.calculateCrewCost([
  { trade: 'framing crew', hours: 40 },
  { trade: 'general laborer', hours: 40 },
]);
```

### Getting Items by Category

```typescript
// Get all roofing materials
const roofingMaterials = await catalogService.getItemsByCategory('roofing');

// Get all electrical labor rates
const electricalLabor = await laborRateService.getLaborRates('electrical');
```

### Filtering by Supplier

```typescript
// Get all items from Home Hardware
const homeHardwareItems = await catalogService.getBySupplier('Home Hardware');

// Get only subcontractor labor
const subcontractors = await laborRateService.getSubcontractorRates();

// Get only in-house labor
const inHouse = await laborRateService.getInHouseRates();
```

## Data Sources

### Material Prices
- Home Hardware receipts (Moncton, NB)
- Kent Building Supplies (NB locations)
- Local suppliers for specialty items

### Labor Rates
- Standard trade rates for NB market (2024)
- Subcontractor quotes collected from active projects
- Licensed contractor rates (electrical, plumbing, HVAC)

## Best Practices

1. **Update prices regularly**: Construction material costs fluctuate. Update catalog prices when you receive new receipts.

2. **Track sources**: Always include supplier and date information when adding items. This helps with price verification.

3. **Use project suggestions**: The `suggestItems()` method provides a starting point for estimates, saving time on common project types.

4. **Compare rates**: Use `compareRatesForTrade()` to find the most cost-effective labor options.

5. **Deactivate instead of delete**: Use `deactivate()` instead of `delete()` to preserve historical data while removing items from active use.

6. **Crew calculations**: Use `calculateCrewCost()` to accurately estimate multi-trade labor costs for complex tasks.

## Future Enhancements

Potential improvements for future versions:

- Historical price tracking
- Bulk price updates
- Import from supplier catalogs
- Automatic price updates from supplier APIs
- Regional price variations
- Seasonal pricing adjustments
- Volume discount tracking
- Preferred supplier management
