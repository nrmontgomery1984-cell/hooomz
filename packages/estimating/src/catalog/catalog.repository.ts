/**
 * Catalog Repository
 *
 * Data access layer for material and labor rate catalog.
 * Stores standard costs from Home Hardware receipts and subcontractor quotes.
 */

import {
  generateId,
  createMetadata,
  updateMetadata,
  type Metadata,
} from '@hooomz/shared-contracts';

/**
 * Catalog item (material or labor rate)
 */
export interface CatalogItem {
  id: string;
  type: 'material' | 'labor';
  name: string;
  description?: string;
  category: string;
  unit: string; // 'each', 'sqft', 'hour', 'linear_ft', etc.
  unitCost: number;
  supplier?: string; // e.g., "Home Hardware", "Kent", "Subcontractor Name"
  sku?: string; // Product SKU or code
  manufacturer?: string; // e.g., "Shaw", "Beauti-Tone", "CGC"
  productName?: string; // e.g., "Endura Plus", "Signature Series"
  modelNumber?: string; // e.g., "SPC-EP-7", "BT-SIG-INT"
  notes?: string;
  isActive: boolean;
  metadata: Metadata;
}

/**
 * Labor rate with subcontractor tracking
 */
export interface LaborRate extends CatalogItem {
  type: 'labor';
  trade: string; // e.g., "carpentry", "electrical", "plumbing"
  hourlyRate: number; // Same as unitCost for consistency
  source?: string; // e.g., "ABC Plumbing quote 2024"
  isSubcontractor: boolean;
}

/**
 * Create catalog item data
 */
export type CreateCatalogItem = Omit<CatalogItem, 'id' | 'metadata'>;

/**
 * Update catalog item data
 */
export type UpdateCatalogItem = Partial<Omit<CatalogItem, 'metadata'>> & {
  id: string;
};

/**
 * Catalog query parameters
 */
export interface CatalogQueryParams {
  type?: 'material' | 'labor';
  category?: string;
  supplier?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'unitCost' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Catalog Repository Interface
 */
export interface ICatalogRepository {
  findAll(params?: CatalogQueryParams): Promise<{
    items: CatalogItem[];
    total: number;
  }>;
  findById(id: string): Promise<CatalogItem | null>;
  findByName(name: string, type?: 'material' | 'labor'): Promise<CatalogItem | null>;
  search(query: string, type?: 'material' | 'labor'): Promise<CatalogItem[]>;
  findByCategory(category: string): Promise<CatalogItem[]>;
  create(data: CreateCatalogItem): Promise<CatalogItem>;
  update(
    id: string,
    data: Partial<Omit<CatalogItem, 'id' | 'metadata'>>
  ): Promise<CatalogItem | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

/**
 * In-Memory Catalog Repository
 * Pre-populated with common items from NB construction market
 */
export class InMemoryCatalogRepository implements ICatalogRepository {
  private items: Map<string, CatalogItem> = new Map();

  constructor() {
    // Pre-populate with common materials and labor rates
    this.seedData();
  }

  private seedData() {
    // Common materials from Home Hardware
    const materials: Omit<CatalogItem, 'id' | 'metadata'>[] = [
      // Lumber
      {
        type: 'material',
        name: '2x4x8 SPF Stud',
        category: 'lumber',
        unit: 'each',
        unitCost: 4.99,
        supplier: 'Home Hardware',
        sku: 'LUM-2x4x8',
        isActive: true,
      },
      {
        type: 'material',
        name: '2x6x8 SPF',
        category: 'lumber',
        unit: 'each',
        unitCost: 8.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: '2x10x12 SPF',
        category: 'lumber',
        unit: 'each',
        unitCost: 24.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Drywall
      {
        type: 'material',
        name: '4x8 Drywall Sheet (1/2")',
        category: 'drywall',
        unit: 'sheet',
        unitCost: 12.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Joint Compound (18L)',
        category: 'drywall',
        unit: 'pail',
        unitCost: 18.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Flooring
      {
        type: 'material',
        name: 'Laminate Flooring',
        category: 'flooring',
        unit: 'sqft',
        unitCost: 2.49,
        supplier: 'Kent',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Vinyl Plank Flooring',
        category: 'flooring',
        unit: 'sqft',
        unitCost: 3.99,
        supplier: 'Kent',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Hardwood Flooring',
        category: 'flooring',
        unit: 'sqft',
        unitCost: 6.99,
        supplier: 'Kent',
        isActive: true,
      },
      // Paint
      {
        type: 'material',
        name: 'Interior Paint (Gallon)',
        category: 'paint',
        unit: 'gallon',
        unitCost: 42.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Exterior Paint (Gallon)',
        category: 'paint',
        unit: 'gallon',
        unitCost: 54.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Electrical
      {
        type: 'material',
        name: 'Electrical Outlet',
        category: 'electrical',
        unit: 'each',
        unitCost: 1.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Light Switch',
        category: 'electrical',
        unit: 'each',
        unitCost: 2.49,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Plumbing
      {
        type: 'material',
        name: '3/4" PEX Tubing',
        category: 'plumbing',
        unit: 'linear_ft',
        unitCost: 0.89,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Kitchen Faucet',
        category: 'plumbing',
        unit: 'each',
        unitCost: 149.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Framing
      {
        type: 'material',
        name: '2x8x12 SPF',
        category: 'framing',
        unit: 'each',
        unitCost: 18.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Framing Nails (30lb box)',
        category: 'framing',
        unit: 'box',
        unitCost: 45.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Sheathing
      {
        type: 'material',
        name: '7/16" OSB Sheathing 4x8',
        category: 'sheathing',
        unit: 'sheet',
        unitCost: 19.99,
        supplier: 'Kent',
        isActive: true,
      },
      {
        type: 'material',
        name: '1/2" Plywood 4x8',
        category: 'sheathing',
        unit: 'sheet',
        unitCost: 32.99,
        supplier: 'Kent',
        isActive: true,
      },
      // Roofing
      {
        type: 'material',
        name: 'Asphalt Shingles (bundle)',
        category: 'roofing',
        unit: 'bundle',
        unitCost: 34.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Roofing Felt (15lb)',
        category: 'roofing',
        unit: 'roll',
        unitCost: 24.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Ice & Water Shield',
        category: 'roofing',
        unit: 'roll',
        unitCost: 89.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Siding
      {
        type: 'material',
        name: 'Vinyl Siding',
        category: 'siding',
        unit: 'sqft',
        unitCost: 3.49,
        supplier: 'Kent',
        isActive: true,
      },
      {
        type: 'material',
        name: 'House Wrap (Tyvek)',
        category: 'siding',
        unit: 'roll',
        unitCost: 149.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Insulation
      {
        type: 'material',
        name: 'R20 Batt Insulation',
        category: 'insulation',
        unit: 'sqft',
        unitCost: 0.89,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'R12 Batt Insulation',
        category: 'insulation',
        unit: 'sqft',
        unitCost: 0.65,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Spray Foam Insulation',
        category: 'insulation',
        unit: 'board_ft',
        unitCost: 1.25,
        supplier: 'Subcontractor',
        isActive: true,
      },
      // Windows & Doors
      {
        type: 'material',
        name: 'Entry Door',
        category: 'doors',
        unit: 'each',
        unitCost: 499.99,
        supplier: 'Kent',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Interior Door',
        category: 'doors',
        unit: 'each',
        unitCost: 89.99,
        supplier: 'Kent',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Double Hung Window',
        category: 'windows',
        unit: 'each',
        unitCost: 349.99,
        supplier: 'Kent',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Sliding Window',
        category: 'windows',
        unit: 'each',
        unitCost: 299.99,
        supplier: 'Kent',
        isActive: true,
      },
      // Trim
      {
        type: 'material',
        name: 'Baseboard Trim (8ft)',
        category: 'trim',
        unit: 'each',
        unitCost: 12.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Door Casing (7ft)',
        category: 'trim',
        unit: 'each',
        unitCost: 8.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Crown Moulding (8ft)',
        category: 'trim',
        unit: 'each',
        unitCost: 18.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      // Concrete & Foundation
      {
        type: 'material',
        name: 'Concrete Mix (30kg)',
        category: 'concrete',
        unit: 'bag',
        unitCost: 6.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Ready-Mix Concrete',
        category: 'concrete',
        unit: 'cubic_yard',
        unitCost: 145.0,
        supplier: 'Local Supplier',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Rebar (10ft)',
        category: 'foundation',
        unit: 'each',
        unitCost: 8.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Concrete Forms',
        category: 'foundation',
        unit: 'linear_ft',
        unitCost: 4.5,
        supplier: 'Kent',
        isActive: true,
      },
      // HVAC
      {
        type: 'material',
        name: 'Ductwork (per foot)',
        category: 'hvac',
        unit: 'linear_ft',
        unitCost: 8.99,
        supplier: 'HVAC Supplier',
        isActive: true,
      },
      {
        type: 'material',
        name: 'Air Vent Register',
        category: 'hvac',
        unit: 'each',
        unitCost: 12.99,
        supplier: 'Home Hardware',
        isActive: true,
      },
    ];

    // Common labor rates in New Brunswick
    const labor: Omit<CatalogItem, 'id' | 'metadata'>[] = [
      {
        type: 'labor',
        name: 'General Carpenter',
        category: 'carpentry',
        unit: 'hour',
        unitCost: 45.0,
        supplier: 'Standard Rate',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Finish Carpenter',
        category: 'carpentry',
        unit: 'hour',
        unitCost: 55.0,
        supplier: 'Standard Rate',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Electrician',
        category: 'electrical',
        unit: 'hour',
        unitCost: 75.0,
        supplier: 'Licensed Contractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Plumber',
        category: 'plumbing',
        unit: 'hour',
        unitCost: 85.0,
        supplier: 'Licensed Contractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Drywall Installation',
        category: 'drywall',
        unit: 'sqft',
        unitCost: 1.25,
        supplier: 'Subcontractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Drywall Taping & Finishing',
        category: 'drywall',
        unit: 'sqft',
        unitCost: 0.85,
        supplier: 'Subcontractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Interior Painting',
        category: 'painting',
        unit: 'sqft',
        unitCost: 1.5,
        supplier: 'Subcontractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Flooring Installation',
        category: 'flooring',
        unit: 'sqft',
        unitCost: 3.0,
        supplier: 'Subcontractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'HVAC Technician',
        category: 'hvac',
        unit: 'hour',
        unitCost: 95.0,
        supplier: 'Licensed Contractor',
        notes: 'Licensed HVAC specialist',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Roofer',
        category: 'roofing',
        unit: 'sqft',
        unitCost: 4.5,
        supplier: 'Subcontractor',
        notes: 'Includes tear-off and installation',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Siding Installer',
        category: 'siding',
        unit: 'sqft',
        unitCost: 3.25,
        supplier: 'Subcontractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Insulation Installer',
        category: 'insulation',
        unit: 'sqft',
        unitCost: 0.75,
        supplier: 'Subcontractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Concrete Finisher',
        category: 'concrete',
        unit: 'hour',
        unitCost: 55.0,
        supplier: 'Subcontractor',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Foundation Crew',
        category: 'foundation',
        unit: 'hour',
        unitCost: 65.0,
        supplier: 'Subcontractor',
        notes: 'Per crew member',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Trim Carpenter',
        category: 'trim',
        unit: 'hour',
        unitCost: 50.0,
        supplier: 'Standard Rate',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Window Installer',
        category: 'windows',
        unit: 'each',
        unitCost: 125.0,
        supplier: 'Subcontractor',
        notes: 'Per window installed',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Door Installation',
        category: 'doors',
        unit: 'each',
        unitCost: 150.0,
        supplier: 'Subcontractor',
        notes: 'Includes hanging and trim',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'Framing Crew',
        category: 'framing',
        unit: 'hour',
        unitCost: 50.0,
        supplier: 'Standard Rate',
        notes: 'Per crew member',
        isActive: true,
      },
      {
        type: 'labor',
        name: 'General Laborer',
        category: 'general',
        unit: 'hour',
        unitCost: 25.0,
        supplier: 'Standard Rate',
        isActive: true,
      },
    ];

    // Create all items
    [...materials, ...labor].forEach((data) => {
      const item: CatalogItem = {
        ...data,
        id: generateId('cat'),
        metadata: createMetadata(),
      };
      this.items.set(item.id, item);
    });
  }

  async findAll(params?: CatalogQueryParams): Promise<{
    items: CatalogItem[];
    total: number;
  }> {
    let items = Array.from(this.items.values());

    // Apply filters
    if (params?.type) {
      items = items.filter((item) => item.type === params.type);
    }

    if (params?.category) {
      items = items.filter((item) => item.category === params.category);
    }

    if (params?.supplier) {
      items = items.filter((item) => item.supplier === params.supplier);
    }

    if (params?.isActive !== undefined) {
      items = items.filter((item) => item.isActive === params.isActive);
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.supplier?.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.manufacturer?.toLowerCase().includes(searchLower) ||
          item.productName?.toLowerCase().includes(searchLower) ||
          item.modelNumber?.toLowerCase().includes(searchLower)
      );
    }

    const total = items.length;

    // Apply sorting
    if (params?.sortBy) {
      const { sortBy, sortOrder = 'asc' } = params;
      items.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortBy) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'unitCost':
            aVal = a.unitCost;
            bVal = b.unitCost;
            break;
          case 'category':
            aVal = a.category.toLowerCase();
            bVal = b.category.toLowerCase();
            break;
          case 'createdAt':
            aVal = new Date(a.metadata.createdAt).getTime();
            bVal = new Date(b.metadata.createdAt).getTime();
            break;
          default:
            aVal = a.metadata.createdAt;
            bVal = b.metadata.createdAt;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      items = items.slice(start, end);
    }

    return { items, total };
  }

  async findById(id: string): Promise<CatalogItem | null> {
    return this.items.get(id) || null;
  }

  async findByName(name: string, type?: 'material' | 'labor'): Promise<CatalogItem | null> {
    const items = Array.from(this.items.values());
    return (
      items.find(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() && (!type || item.type === type)
      ) || null
    );
  }

  async search(query: string, type?: 'material' | 'labor'): Promise<CatalogItem[]> {
    const queryLower = query.toLowerCase();
    let items = Array.from(this.items.values());

    if (type) {
      items = items.filter((item) => item.type === type);
    }

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.category.toLowerCase().includes(queryLower) ||
        item.supplier?.toLowerCase().includes(queryLower) ||
        item.sku?.toLowerCase().includes(queryLower) ||
        item.manufacturer?.toLowerCase().includes(queryLower) ||
        item.productName?.toLowerCase().includes(queryLower) ||
        item.modelNumber?.toLowerCase().includes(queryLower)
    );
  }

  async findByCategory(category: string): Promise<CatalogItem[]> {
    const items = Array.from(this.items.values());
    return items.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }

  async create(data: CreateCatalogItem): Promise<CatalogItem> {
    const item: CatalogItem = {
      ...data,
      id: generateId('cat'),
      metadata: createMetadata(),
    };

    this.items.set(item.id, item);
    return item;
  }

  async update(
    id: string,
    data: Partial<Omit<CatalogItem, 'id' | 'metadata'>>
  ): Promise<CatalogItem | null> {
    const existing = this.items.get(id);
    if (!existing) return null;

    const updated: CatalogItem = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: updateMetadata(existing.metadata),
    };

    this.items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.items.has(id);
  }
}
