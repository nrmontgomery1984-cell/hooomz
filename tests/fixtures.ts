/**
 * Test Fixtures
 *
 * Mock data for integration tests.
 */

import type {
  Customer,
  Project,
  Estimate,
  LineItem,
  Task,
  Inspection,
  ChecklistItem,
  Photo,
} from '@hooomz/shared-contracts';

// Customer Fixtures
export const mockCustomer: Partial<Customer> = {
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+1-555-0123',
  address: '123 Main St, Toronto, ON M5H 2N2',
  customerType: 'residential',
};

export const mockCommercialCustomer: Partial<Customer> = {
  name: 'ABC Construction Ltd',
  email: 'contact@abcconstruction.com',
  phone: '+1-555-0456',
  address: '456 Business Blvd, Toronto, ON M4B 1B3',
  customerType: 'commercial',
  companyName: 'ABC Construction Ltd',
};

// Project Fixtures
export const mockProject: Partial<Project> = {
  name: 'Kitchen Renovation',
  description: 'Complete kitchen remodel including cabinets, countertops, and appliances',
  status: 'planning',
  startDate: '2024-02-01',
  targetEndDate: '2024-03-15',
};

export const mockCommercialProject: Partial<Project> = {
  name: 'Office Building Renovation',
  description: 'Full office renovation with new HVAC, electrical, and flooring',
  status: 'in-progress',
  startDate: '2024-01-15',
  targetEndDate: '2024-06-30',
};

// Line Item Fixtures
export const mockLineItems: Partial<LineItem>[] = [
  {
    description: 'Custom Oak Cabinets',
    category: 'materials',
    quantity: 12,
    unit: 'ea',
    unitCost: 450.0,
    supplier: 'Wood Works Inc',
    sku: 'CAB-OAK-001',
  },
  {
    description: 'Granite Countertop',
    category: 'materials',
    quantity: 25,
    unit: 'sq ft',
    unitCost: 85.0,
    supplier: 'Stone Masters',
    sku: 'GRN-BLK-001',
  },
  {
    description: 'Cabinet Installation',
    category: 'labor',
    quantity: 16,
    unit: 'hour',
    unitCost: 75.0,
  },
  {
    description: 'Plumbing Work',
    category: 'subcontractors',
    quantity: 1,
    unit: 'job',
    unitCost: 2500.0,
    supplier: 'Pro Plumbing',
  },
  {
    description: 'Electrical Updates',
    category: 'subcontractors',
    quantity: 1,
    unit: 'job',
    unitCost: 1800.0,
    supplier: 'Bright Spark Electric',
  },
];

// Estimate Fixture
export const mockEstimate: Partial<Estimate> = {
  status: 'draft',
  markup: 15, // 15%
  taxRate: 13, // 13% HST
  validUntil: '2024-02-28',
};

// Task Fixtures
export const mockTasks: Partial<Task>[] = [
  {
    title: 'Demo existing kitchen',
    description: 'Remove old cabinets, countertops, and appliances',
    status: 'pending',
    priority: 'high',
    startDate: '2024-02-01',
    dueDate: '2024-02-03',
    estimatedHours: 16,
  },
  {
    title: 'Install cabinets',
    description: 'Install new custom oak cabinets',
    status: 'pending',
    priority: 'high',
    startDate: '2024-02-05',
    dueDate: '2024-02-08',
    estimatedHours: 24,
  },
  {
    title: 'Install countertops',
    description: 'Template and install granite countertops',
    status: 'pending',
    priority: 'medium',
    startDate: '2024-02-10',
    dueDate: '2024-02-12',
    estimatedHours: 8,
  },
  {
    title: 'Final inspection',
    description: 'Walkthrough with customer and final quality check',
    status: 'pending',
    priority: 'high',
    startDate: '2024-03-14',
    dueDate: '2024-03-15',
    estimatedHours: 2,
  },
];

// Checklist Item Fixtures
export const mockChecklistItems: ChecklistItem[] = [
  {
    id: 'check-1',
    title: 'Verify permit compliance',
    description: 'All work complies with building permit requirements',
    required: true,
    checked: false,
  },
  {
    id: 'check-2',
    title: 'Check cabinet installation',
    description: 'Cabinets are level, secure, and doors operate smoothly',
    required: true,
    checked: false,
  },
  {
    id: 'check-3',
    title: 'Inspect countertop seams',
    description: 'Seams are tight and properly sealed',
    required: true,
    checked: false,
  },
  {
    id: 'check-4',
    title: 'Test all appliances',
    description: 'All appliances are installed and functioning correctly',
    required: true,
    checked: false,
  },
  {
    id: 'check-5',
    title: 'Verify electrical outlets',
    description: 'All outlets are properly wired and grounded',
    required: true,
    checked: false,
  },
];

// Inspection Fixture
export const mockInspection: Partial<Inspection> = {
  title: 'Final Quality Inspection',
  inspectionType: 'quality',
  status: 'pending',
  scheduledDate: '2024-03-14',
  inspector: 'Mike Johnson',
  notes: 'Final walkthrough before project completion',
};

// Photo Fixtures
export const mockPhotos: Partial<Photo>[] = [
  {
    url: 'https://example.com/photos/before-1.jpg',
    thumbnailUrl: 'https://example.com/photos/thumbs/before-1.jpg',
    caption: 'Kitchen before renovation',
    capturedAt: '2024-01-30T10:00:00Z',
    uploadStatus: 'completed',
  },
  {
    url: 'https://example.com/photos/progress-1.jpg',
    thumbnailUrl: 'https://example.com/photos/thumbs/progress-1.jpg',
    caption: 'Cabinet installation in progress',
    capturedAt: '2024-02-07T14:30:00Z',
    uploadStatus: 'completed',
  },
  {
    url: 'https://example.com/photos/after-1.jpg',
    thumbnailUrl: 'https://example.com/photos/thumbs/after-1.jpg',
    caption: 'Completed kitchen renovation',
    capturedAt: '2024-03-14T16:00:00Z',
    uploadStatus: 'pending',
  },
];

// Expected Calculation Results
export const expectedCalculations = {
  // Line items total: (12 * 450) + (25 * 85) + (16 * 75) + 2500 + 1800
  subtotal: 11025.0,
  // Markup: 11025 * 0.15
  markupAmount: 1653.75,
  // Subtotal with markup: 11025 + 1653.75
  subtotalWithMarkup: 12678.75,
  // Tax: 12678.75 * 0.13
  taxAmount: 1648.24,
  // Grand total: 12678.75 + 1648.24
  grandTotal: 14326.99,
};

// Variance Analysis Fixture
export const mockActualCosts = {
  materials: 7325.0, // Expected: (12 * 450) + (25 * 85) = 7525
  labor: 1350.0, // Expected: 16 * 75 = 1200
  subcontractors: 4100.0, // Expected: 2500 + 1800 = 4300
};

export const expectedVariance = {
  materialsVariance: -200.0, // Under budget
  laborVariance: 150.0, // Over budget
  subcontractorsVariance: -200.0, // Under budget
  totalVariance: -250.0, // Under budget overall
  percentVariance: -2.27, // -250 / 11025 * 100
};
