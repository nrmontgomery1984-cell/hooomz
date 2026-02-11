'use client';

/**
 * ContractorIntakeWizard - HOOOMZ INTERIORS Contractor Intake Flow
 *
 * 4-step wizard for Hooomz Interiors projects:
 * 1. Project Info - Bundle type, client, and room count
 * 2. Scope - Interiors-specific scope items (flooring, paint, trim)
 * 3. Schedule - Timeline based on bundle complexity
 * 4. Review - Summary and estimate generation
 *
 * Work Categories: FL (Flooring), PT (Paint), FC (Finish Carpentry), TL (Tile), DW (Drywall)
 * Stages: ST-DM (Demo), ST-PR (Prime & Prep), ST-FN (Finish), ST-PL (Punch), ST-CL (Closeout)
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type {
  ContractorIntakeData,
  ScopeItem,
  ProjectType,
  SpecLevel,
} from '@/lib/types/intake.types';
import { TRADE_CODES, STAGE_CODES, ROOM_LOCATIONS } from '@/lib/types/intake.types';

// =============================================================================
// INTERIORS Bundle Templates
// =============================================================================

// Bundle to work categories mapping
const PROJECT_TYPE_TRADES: Record<ProjectType, string[]> = {
  floor_refresh: ['FL', 'FC'],                    // Flooring + Finish Carpentry (baseboard)
  room_refresh: ['FL', 'PT', 'FC'],               // + Paint
  full_interior: ['FL', 'PT', 'FC', 'DW'],        // + Drywall repairs
  custom: [],                                     // Custom scope
};

// Bundle to phases mapping (Interiors workflow)
const PROJECT_TYPE_PHASES: Record<ProjectType, { name: string; duration_weeks: number }[]> = {
  floor_refresh: [
    { name: 'Demo', duration_weeks: 0.5 },
    { name: 'Floor Prep', duration_weeks: 0.5 },
    { name: 'Flooring Install', duration_weeks: 1 },
    { name: 'Baseboard Install', duration_weeks: 0.5 },
    { name: 'Punch List', duration_weeks: 0.5 },
  ],
  room_refresh: [
    { name: 'Demo', duration_weeks: 0.5 },
    { name: 'Floor Prep', duration_weeks: 0.5 },
    { name: 'Wall Prep & Prime', duration_weeks: 0.5 },
    { name: 'Flooring Install', duration_weeks: 1 },
    { name: 'Baseboard Install', duration_weeks: 0.5 },
    { name: 'Paint', duration_weeks: 1 },
    { name: 'Punch List', duration_weeks: 0.5 },
  ],
  full_interior: [
    { name: 'Demo', duration_weeks: 1 },
    { name: 'Wall Patching', duration_weeks: 0.5 },
    { name: 'Floor Prep', duration_weeks: 0.5 },
    { name: 'Prime & Prep', duration_weeks: 0.5 },
    { name: 'Flooring Install', duration_weeks: 1.5 },
    { name: 'Trim Install', duration_weeks: 1 },
    { name: 'Paint', duration_weeks: 1.5 },
    { name: 'Punch List', duration_weeks: 0.5 },
    { name: 'Closeout', duration_weeks: 0.5 },
  ],
  custom: [
    { name: 'Demo', duration_weeks: 0.5 },
    { name: 'Prep', duration_weeks: 1 },
    { name: 'Install', duration_weeks: 2 },
    { name: 'Finish', duration_weeks: 1 },
    { name: 'Punch List', duration_weeks: 0.5 },
  ],
};

// =============================================================================
// Cost Estimates per Scope Item (based on NB market rates)
// =============================================================================

// Material + Labor cost estimates per unit (combined for simplicity)
const SCOPE_ITEM_COSTS: Record<string, { materialCost: number; laborCost: number }> = {
  // Flooring (FL)
  'Install LVP/LVT': { materialCost: 4, laborCost: 3 },              // per sqft
  'Install hardwood': { materialCost: 7, laborCost: 4 },              // per sqft
  'Install engineered hardwood': { materialCost: 6, laborCost: 3.50 }, // per sqft
  'Install laminate': { materialCost: 3, laborCost: 2.50 },           // per sqft
  'Install underlayment': { materialCost: 0.50, laborCost: 0.50 },    // per sqft
  'Sand and finish hardwood': { materialCost: 1.50, laborCost: 3.50 }, // per sqft
  'Floor leveling compound': { materialCost: 0.75, laborCost: 1.25 }, // per sqft
  'Remove existing flooring': { materialCost: 0, laborCost: 1.25 },   // per sqft
  // Paint (PT)
  'Prime walls': { materialCost: 0.15, laborCost: 0.40 },             // per sqft
  'Paint walls': { materialCost: 0.20, laborCost: 0.60 },             // per sqft
  'Paint ceiling': { materialCost: 0.20, laborCost: 0.70 },           // per sqft
  'Paint trim': { materialCost: 0.50, laborCost: 1.50 },              // per lf
  'Paint doors': { materialCost: 15, laborCost: 45 },                 // per door
  // Finish Carpentry (FC)
  'Install baseboard': { materialCost: 2.50, laborCost: 3.50 },       // per lf
  'Install shoe molding': { materialCost: 1.00, laborCost: 1.50 },    // per lf
  'Install door casing': { materialCost: 25, laborCost: 45 },         // per door
  'Install window casing': { materialCost: 30, laborCost: 50 },       // per window
  'Install crown molding': { materialCost: 4, laborCost: 6 },         // per lf
  'Install interior doors': { materialCost: 150, laborCost: 150 },    // per door
  'Install wainscoting': { materialCost: 8, laborCost: 12 },          // per sqft
  'Install board and batten': { materialCost: 6, laborCost: 10 },     // per sqft
  'Install picture frame molding': { materialCost: 3, laborCost: 8 }, // per lf
  'Remove existing baseboard': { materialCost: 0, laborCost: 1.00 },  // per lf
  // Tile (TL) — Year 2 K&B
  'Install floor tile': { materialCost: 6, laborCost: 12 },           // per sqft
  'Install wall tile': { materialCost: 8, laborCost: 15 },            // per sqft
  'Install backsplash': { materialCost: 12, laborCost: 18 },          // per sqft
  'Grout tile': { materialCost: 0.50, laborCost: 2 },                 // per sqft
  // Drywall (DW) — patches only
  'Tape and mud': { materialCost: 0.15, laborCost: 0.85 },            // per sqft
  'Sand and prep': { materialCost: 0.05, laborCost: 0.35 },           // per sqft
  'Patch drywall': { materialCost: 5, laborCost: 25 },                // per patch
  'Texture matching': { materialCost: 0.10, laborCost: 0.50 },        // per sqft
};

// =============================================================================
// Project Type Scope Templates (pre-populated items with quantities)
// =============================================================================

interface ScopeItemTemplate {
  trade_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  category: string;
  stage_code: string;
  location_id: string;
  // Pipeline-ready fields (Build 3b integration)
  sopCodes?: string[];
  isLooped?: boolean;
  loopContextLabel?: string;
  estimatedHoursPerUnit?: number;
}

// =============================================================================
// Interiors Bundle Scope Templates
// =============================================================================

// Floor Refresh scope template (per room, ~200 sqft)
const FLOOR_REFRESH_SCOPE: ScopeItemTemplate[] = [
  // Flooring
  { trade_code: 'FL', item_name: 'Install LVP/LVT', quantity: 200, unit: 'sqft', category: 'vinyl', stage_code: 'ST-FN', location_id: 'loc-living', sopCodes: ['HI-SOP-FL-004'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 4 },
  { trade_code: 'FL', item_name: 'Install underlayment', quantity: 200, unit: 'sqft', category: 'prep', stage_code: 'ST-PR', location_id: 'loc-living', sopCodes: ['HI-SOP-FL-001'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 2 },
  // Finish Carpentry
  { trade_code: 'FC', item_name: 'Install baseboard', quantity: 60, unit: 'lf', category: 'trim', stage_code: 'ST-FN', location_id: 'loc-living', sopCodes: ['HI-SOP-FC-003'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 1.5 },
];

// Room Refresh scope template (flooring + paint, ~200 sqft)
const ROOM_REFRESH_SCOPE: ScopeItemTemplate[] = [
  // Flooring
  { trade_code: 'FL', item_name: 'Install LVP/LVT', quantity: 200, unit: 'sqft', category: 'vinyl', stage_code: 'ST-FN', location_id: 'loc-living', sopCodes: ['HI-SOP-FL-004'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 4 },
  { trade_code: 'FL', item_name: 'Install underlayment', quantity: 200, unit: 'sqft', category: 'prep', stage_code: 'ST-PR', location_id: 'loc-living', sopCodes: ['HI-SOP-FL-001'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 2 },
  // Finish Carpentry
  { trade_code: 'FC', item_name: 'Install baseboard', quantity: 60, unit: 'lf', category: 'trim', stage_code: 'ST-FN', location_id: 'loc-living', sopCodes: ['HI-SOP-FC-003'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 1.5 },
  // Paint
  { trade_code: 'PT', item_name: 'Prime walls', quantity: 400, unit: 'sqft', category: 'prep', stage_code: 'ST-PR', location_id: 'loc-living', sopCodes: ['HI-SOP-PT-001'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 2 },
  { trade_code: 'PT', item_name: 'Paint walls', quantity: 400, unit: 'sqft', category: 'paint', stage_code: 'ST-FN', location_id: 'loc-living', sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 3 },
  { trade_code: 'PT', item_name: 'Paint ceiling', quantity: 200, unit: 'sqft', category: 'paint', stage_code: 'ST-FN', location_id: 'loc-living', sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 1.5 },
  { trade_code: 'PT', item_name: 'Paint trim', quantity: 60, unit: 'lf', category: 'paint', stage_code: 'ST-FN', location_id: 'loc-living', sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 1 },
];

// Full Interior scope template (multiple rooms, ~800 sqft)
const FULL_INTERIOR_SCOPE: ScopeItemTemplate[] = [
  // Flooring (4 rooms)
  { trade_code: 'FL', item_name: 'Install LVP/LVT', quantity: 800, unit: 'sqft', category: 'vinyl', stage_code: 'ST-FN', location_id: 'loc-general', sopCodes: ['HI-SOP-FL-004'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 4 },
  { trade_code: 'FL', item_name: 'Install underlayment', quantity: 800, unit: 'sqft', category: 'prep', stage_code: 'ST-PR', location_id: 'loc-general', sopCodes: ['HI-SOP-FL-001'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 2 },
  // Drywall (repairs)
  { trade_code: 'DW', item_name: 'Tape and mud', quantity: 200, unit: 'sqft', category: 'repair', stage_code: 'ST-PR', location_id: 'loc-general', sopCodes: ['HI-SOP-DW-002'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 3 },
  { trade_code: 'DW', item_name: 'Sand and prep', quantity: 200, unit: 'sqft', category: 'repair', stage_code: 'ST-PR', location_id: 'loc-general', sopCodes: ['HI-SOP-DW-003'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 2 },
  // Finish Carpentry
  { trade_code: 'FC', item_name: 'Install baseboard', quantity: 240, unit: 'lf', category: 'trim', stage_code: 'ST-FN', location_id: 'loc-general', sopCodes: ['HI-SOP-FC-003'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 1.5 },
  { trade_code: 'FC', item_name: 'Install door casing', quantity: 8, unit: 'ea', category: 'trim', stage_code: 'ST-FN', location_id: 'loc-general', sopCodes: ['HI-SOP-FC-001'], isLooped: false, estimatedHoursPerUnit: 0.5 },
  { trade_code: 'FC', item_name: 'Install interior doors', quantity: 4, unit: 'ea', category: 'doors', stage_code: 'ST-FN', location_id: 'loc-general', sopCodes: ['HI-SOP-FC-005'], isLooped: false, estimatedHoursPerUnit: 1 },
  // Paint
  { trade_code: 'PT', item_name: 'Prime walls', quantity: 1600, unit: 'sqft', category: 'prep', stage_code: 'ST-PR', location_id: 'loc-general', sopCodes: ['HI-SOP-PT-001'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 2 },
  { trade_code: 'PT', item_name: 'Paint walls', quantity: 1600, unit: 'sqft', category: 'paint', stage_code: 'ST-FN', location_id: 'loc-general', sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 3 },
  { trade_code: 'PT', item_name: 'Paint ceiling', quantity: 800, unit: 'sqft', category: 'paint', stage_code: 'ST-FN', location_id: 'loc-general', sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 1.5 },
  { trade_code: 'PT', item_name: 'Paint trim', quantity: 240, unit: 'lf', category: 'paint', stage_code: 'ST-FN', location_id: 'loc-general', sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: 'Per Room', estimatedHoursPerUnit: 1 },
];

// Map project types to their scope templates
const PROJECT_TYPE_SCOPE_TEMPLATES: Record<ProjectType, ScopeItemTemplate[]> = {
  floor_refresh: FLOOR_REFRESH_SCOPE,
  room_refresh: ROOM_REFRESH_SCOPE,
  full_interior: FULL_INTERIOR_SCOPE,
  custom: [], // Custom scope - user defines everything
};

// Calculate estimate for scope items
function calculateEstimate(items: ScopeItemTemplate[]): { low: number; high: number; materialTotal: number; laborTotal: number } {
  let materialTotal = 0;
  let laborTotal = 0;

  items.forEach((item) => {
    const costs = SCOPE_ITEM_COSTS[item.item_name];
    if (costs) {
      materialTotal += costs.materialCost * item.quantity;
      laborTotal += costs.laborCost * item.quantity;
    }
  });

  const subtotal = materialTotal + laborTotal;
  // Add 15% contingency for low estimate, 25% for high
  const low = Math.round(subtotal * 1.15);
  const high = Math.round(subtotal * 1.25);

  return { low, high, materialTotal: Math.round(materialTotal), laborTotal: Math.round(laborTotal) };
}

// Suggested scope items per trade (Interiors trades only)
const TRADE_SCOPE_SUGGESTIONS: Record<string, { name: string; unit: string; category: string }[]> = {
  'FL': [  // Flooring
    { name: 'Install hardwood', unit: 'sqft', category: 'hardwood' },
    { name: 'Install LVP/LVT', unit: 'sqft', category: 'vinyl' },
    { name: 'Install carpet', unit: 'sqft', category: 'carpet' },
    { name: 'Install underlayment', unit: 'sqft', category: 'prep' },
    { name: 'Sand and finish hardwood', unit: 'sqft', category: 'hardwood' },
    { name: 'Remove existing flooring', unit: 'sqft', category: 'demo' },
  ],
  'PT': [  // Paint
    { name: 'Prime walls', unit: 'sqft', category: 'prep' },
    { name: 'Paint walls', unit: 'sqft', category: 'paint' },
    { name: 'Paint ceiling', unit: 'sqft', category: 'paint' },
    { name: 'Paint trim', unit: 'lf', category: 'paint' },
    { name: 'Paint cabinets', unit: 'ea', category: 'specialty' },
    { name: 'Accent wall', unit: 'sqft', category: 'specialty' },
  ],
  'FC': [  // Finish Carpentry
    { name: 'Install baseboard', unit: 'lf', category: 'trim' },
    { name: 'Install door casing', unit: 'ea', category: 'trim' },
    { name: 'Install window casing', unit: 'ea', category: 'trim' },
    { name: 'Install crown molding', unit: 'lf', category: 'trim' },
    { name: 'Install interior doors', unit: 'ea', category: 'doors' },
    { name: 'Install wainscoting', unit: 'sqft', category: 'millwork' },
    { name: 'Install chair rail', unit: 'lf', category: 'trim' },
  ],
  'TL': [  // Tile
    { name: 'Install floor tile', unit: 'sqft', category: 'floor' },
    { name: 'Install wall tile', unit: 'sqft', category: 'wall' },
    { name: 'Install backsplash', unit: 'sqft', category: 'wall' },
    { name: 'Grout tile', unit: 'sqft', category: 'finish' },
    { name: 'Remove existing tile', unit: 'sqft', category: 'demo' },
  ],
  'DW': [  // Drywall
    { name: 'Hang drywall', unit: 'sqft', category: 'install' },
    { name: 'Tape and mud', unit: 'sqft', category: 'finish' },
    { name: 'Sand and prep', unit: 'sqft', category: 'finish' },
    { name: 'Patch holes', unit: 'ea', category: 'repair' },
    { name: 'Skim coat', unit: 'sqft', category: 'finish' },
  ],
  'OH': [  // Overhead
    { name: 'Project management', unit: 'hr', category: 'admin' },
    { name: 'Site cleanup', unit: 'ea', category: 'cleanup' },
    { name: 'Waste disposal', unit: 'ea', category: 'cleanup' },
    { name: 'Material delivery', unit: 'ea', category: 'logistics' },
  ],
};

// =============================================================================
// Step Components
// =============================================================================

interface StepProps {
  data: ContractorIntakeData;
  updateData: (section: keyof ContractorIntakeData, value: unknown) => void;
  errors: Record<string, string>;
  onProjectTypeChange?: (projectType: ProjectType) => void;
}

// Step 1: Project Info
function ProjectInfoStep({ data, updateData, onProjectTypeChange }: StepProps) {
  const project = data.project;
  const client = data.client;

  // Handle project type change with auto-population
  const handleProjectTypeChange = (projectType: ProjectType) => {
    updateData('project', { ...project, project_type: projectType });
    onProjectTypeChange?.(projectType);
  };

  const projectTypes: { value: ProjectType; label: string; desc: string }[] = [
    { value: 'floor_refresh', label: 'Floor Refresh', desc: 'Flooring + baseboard (~$5,400)' },
    { value: 'room_refresh', label: 'Room Refresh', desc: 'Flooring + paint + trim (~$8,200)' },
    { value: 'full_interior', label: 'Full Interior', desc: 'Multiple rooms, full scope (~$11,800)' },
    { value: 'custom', label: 'Custom', desc: 'Define your own scope' },
  ];

  const specLevels: { value: SpecLevel; label: string; desc: string }[] = [
    { value: 'good', label: 'Good', desc: 'Quality basics' },
    { value: 'better', label: 'Better', desc: 'Upgraded materials' },
    { value: 'best', label: 'Best', desc: 'Premium finishes' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Project Information</h2>
        <p className="text-slate-500">Basic details about the project</p>
      </div>

      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Project Name *</label>
        <input
          type="text"
          value={project.name}
          onChange={(e) => updateData('project', { ...project, name: e.target.value })}
          className="input"
          placeholder="e.g., Smith Kitchen Renovation"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Project Address *</label>
        <input
          type="text"
          value={project.address.street}
          onChange={(e) =>
            updateData('project', { ...project, address: { ...project.address, street: e.target.value } })
          }
          className="input mb-2"
          placeholder="123 Main Street"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={project.address.city}
            onChange={(e) =>
              updateData('project', { ...project, address: { ...project.address, city: e.target.value } })
            }
            className="input"
            placeholder="City"
          />
          <input
            type="text"
            value={project.address.province}
            onChange={(e) =>
              updateData('project', { ...project, address: { ...project.address, province: e.target.value } })
            }
            className="input"
            placeholder="Province"
          />
          <input
            type="text"
            value={project.address.postal_code}
            onChange={(e) =>
              updateData('project', { ...project, address: { ...project.address, postal_code: e.target.value } })
            }
            className="input"
            placeholder="Postal"
          />
        </div>
      </div>

      {/* Project Type */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Project Type *</label>
        <p className="text-xs text-slate-400 mb-2">Selecting a type will pre-populate trades and phases</p>
        <div className="grid grid-cols-2 gap-2">
          {projectTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleProjectTypeChange(type.value)}
              className={cn(
                'min-h-[48px] px-4 rounded-xl text-sm font-medium transition-colors text-left',
                project.project_type === type.value
                  ? 'bg-coral text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spec Level */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Spec Level</label>
        <div className="grid grid-cols-2 gap-2">
          {specLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => updateData('project', { ...project, spec_level: level.value })}
              className={cn(
                'p-3 rounded-xl text-left transition-colors',
                project.spec_level === level.value
                  ? 'bg-coral text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <span className="font-medium">{level.label}</span>
              <p
                className={cn(
                  'text-xs mt-0.5',
                  project.spec_level === level.value ? 'text-white/80' : 'text-slate-500'
                )}
              >
                {level.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Building Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Storeys</label>
          <div className="flex gap-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => updateData('project', { ...project, storeys: num })}
                className={cn(
                  'flex-1 min-h-[48px] rounded-xl font-medium transition-colors',
                  project.storeys === num
                    ? 'bg-coral text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Basement</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateData('project', { ...project, has_basement: false })}
              className={cn(
                'flex-1 min-h-[48px] rounded-xl font-medium transition-colors',
                !project.has_basement
                  ? 'bg-coral text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => updateData('project', { ...project, has_basement: true })}
              className={cn(
                'flex-1 min-h-[48px] rounded-xl font-medium transition-colors',
                project.has_basement
                  ? 'bg-coral text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Yes
            </button>
          </div>
        </div>
      </div>

      {/* Client Info (Optional) */}
      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Client Information (Optional)</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={client?.name || ''}
            onChange={(e) => updateData('client', { ...client, name: e.target.value })}
            className="input"
            placeholder="Client Name"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              value={client?.email || ''}
              onChange={(e) => updateData('client', { ...client, email: e.target.value })}
              className="input"
              placeholder="Email"
            />
            <input
              type="tel"
              value={client?.phone || ''}
              onChange={(e) => updateData('client', { ...client, phone: e.target.value })}
              className="input"
              placeholder="Phone"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Project Notes</label>
        <textarea
          value={project.notes || ''}
          onChange={(e) => updateData('project', { ...project, notes: e.target.value })}
          className="textarea"
          rows={3}
          placeholder="Any initial notes about the project..."
        />
      </div>
    </div>
  );
}

// Step 2: Scope (Trade-Organized)
function ScopeStep({ data, updateData }: StepProps) {
  const scope = data.scope;
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ScopeItem>>({});

  const trades = Object.entries(TRADE_CODES);
  const stages = Object.entries(STAGE_CODES);
  const locations = Object.entries(ROOM_LOCATIONS);

  const toggleTrade = (tradeCode: string) => {
    const newTrades = scope.enabled_trades.includes(tradeCode)
      ? scope.enabled_trades.filter((t) => t !== tradeCode)
      : [...scope.enabled_trades, tradeCode];
    updateData('scope', { ...scope, enabled_trades: newTrades });
  };

  const addScopeItem = () => {
    if (!newItem.item_name || !newItem.trade_code) return;

    const item: ScopeItem = {
      id: `scope-${Date.now()}`,
      trade_code: newItem.trade_code,
      category: newItem.category || 'general',
      item_name: newItem.item_name,
      quantity: newItem.quantity || 1,
      unit: newItem.unit || 'ea',
      work_category_code: newItem.trade_code,
      stage_code: newItem.stage_code || 'ST-FINISH',
      location_id: newItem.location_id || 'loc-kitchen',
      notes: newItem.notes,
    };

    updateData('scope', { ...scope, items: [...scope.items, item] });
    setNewItem({});
    setShowAddItem(false);
  };

  const removeScopeItem = (itemId: string) => {
    updateData('scope', { ...scope, items: scope.items.filter((i) => i.id !== itemId) });
  };

  const getTradeItems = (tradeCode: string) => {
    return scope.items.filter((i) => i.trade_code === tradeCode);
  };

  // Get suggested items for a trade that aren't already added
  const getSuggestions = (tradeCode: string) => {
    const suggestions = TRADE_SCOPE_SUGGESTIONS[tradeCode] || [];
    const existingNames = scope.items.map((i) => i.item_name.toLowerCase());
    return suggestions.filter((s) => !existingNames.includes(s.name.toLowerCase()));
  };

  // Quick-add a suggested item
  const addSuggestedItem = (tradeCode: string, suggestion: { name: string; unit: string; category: string }) => {
    const item: ScopeItem = {
      id: `scope-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      trade_code: tradeCode,
      category: suggestion.category,
      item_name: suggestion.name,
      quantity: 1,
      unit: suggestion.unit,
      work_category_code: tradeCode,
      stage_code: 'ST-FINISH',
      location_id: 'loc-general',
    };
    updateData('scope', { ...scope, items: [...scope.items, item] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Project Scope</h2>
        <p className="text-slate-500">Trades are pre-selected based on project type. Tap to add/remove.</p>
      </div>

      {/* Trade Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-3">Trades Involved</label>
        <div className="grid grid-cols-3 gap-2">
          {trades.map(([code, trade]) => {
            const isEnabled = scope.enabled_trades.includes(code);
            const itemCount = getTradeItems(code).length;

            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleTrade(code)}
                className={cn(
                  'min-h-[48px] px-3 rounded-xl text-sm font-medium transition-colors',
                  'flex items-center gap-2',
                  isEnabled
                    ? 'bg-coral/10 border-2 border-coral text-coral'
                    : 'bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100'
                )}
              >
                <span>{trade.icon}</span>
                <span className="flex-1 text-left">{trade.name}</span>
                {itemCount > 0 && (
                  <span className="bg-coral text-white text-xs px-1.5 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope Items by Trade */}
      {scope.enabled_trades.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-600">Scope Items</label>
            <button
              type="button"
              onClick={() => setShowAddItem(true)}
              className="text-sm text-coral font-medium hover:underline"
            >
              + Add Item
            </button>
          </div>

          {/* Items grouped by trade */}
          {scope.enabled_trades.map((tradeCode) => {
            const trade = TRADE_CODES[tradeCode as keyof typeof TRADE_CODES];
            const items = getTradeItems(tradeCode);

            return (
              <div key={tradeCode} className="card">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setSelectedTrade(selectedTrade === tradeCode ? null : tradeCode)}
                >
                  <span className="text-lg">{trade?.icon}</span>
                  <span className="font-semibold text-slate-800 flex-1">{trade?.name}</span>
                  <span className="text-sm text-slate-500">{items.length} items</span>
                  <span className="text-slate-400">{selectedTrade === tradeCode ? '▼' : '▶'}</span>
                </div>

                {selectedTrade === tradeCode && (
                  <div className="mt-4 space-y-3">
                    {/* Added items */}
                    {items.length > 0 && (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-sage/10 rounded-lg"
                          >
                            <span className="text-sage">✓</span>
                            <div className="flex-1">
                              <span className="font-medium text-slate-800">{item.item_name}</span>
                              <p className="text-xs text-slate-500">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeScopeItem(item.id)}
                              className="text-slate-400 hover:text-coral min-w-[44px] min-h-[44px] flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick-add suggestions */}
                    {getSuggestions(tradeCode).length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Quick add common items:</p>
                        <div className="flex flex-wrap gap-2">
                          {getSuggestions(tradeCode).slice(0, 5).map((suggestion) => (
                            <button
                              key={suggestion.name}
                              type="button"
                              onClick={() => addSuggestedItem(tradeCode, suggestion)}
                              className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-coral/10 hover:text-coral transition-colors"
                            >
                              + {suggestion.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {items.length === 0 && getSuggestions(tradeCode).length === 0 && (
                      <p className="text-sm text-slate-400 italic">No items added yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Add Scope Item</h3>
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Trade *</label>
              <select
                value={newItem.trade_code || ''}
                onChange={(e) => setNewItem({ ...newItem, trade_code: e.target.value })}
                className="input"
              >
                <option value="">Select trade...</option>
                {scope.enabled_trades.map((code) => (
                  <option key={code} value={code}>
                    {TRADE_CODES[code as keyof typeof TRADE_CODES]?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Item Name *</label>
              <input
                type="text"
                value={newItem.item_name || ''}
                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                className="input"
                placeholder="e.g., Install recessed lights"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newItem.quantity || 1}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Unit</label>
                <select
                  value={newItem.unit || 'ea'}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="input"
                >
                  <option value="ea">Each</option>
                  <option value="sqft">Sq Ft</option>
                  <option value="lf">Lin Ft</option>
                  <option value="hr">Hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Location</label>
              <select
                value={newItem.location_id || ''}
                onChange={(e) => setNewItem({ ...newItem, location_id: e.target.value })}
                className="input"
              >
                <option value="">Select location...</option>
                {locations.map(([id, loc]) => (
                  <option key={id} value={id}>
                    {loc.icon} {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Stage</label>
              <select
                value={newItem.stage_code || ''}
                onChange={(e) => setNewItem({ ...newItem, stage_code: e.target.value })}
                className="input"
              >
                <option value="">Select stage...</option>
                {stages.map(([code, stage]) => (
                  <option key={code} value={code}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={addScopeItem}
              disabled={!newItem.item_name || !newItem.trade_code}
              className="btn btn-primary w-full"
            >
              Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 3: Schedule
function ScheduleStep({ data, updateData }: StepProps) {
  const schedule = data.schedule;

  const addPhase = () => {
    const phases = schedule.phases || [];
    const newPhase = {
      name: `Phase ${phases.length + 1}`,
      duration_weeks: 1,
      dependencies: [],
    };
    updateData('schedule', { ...schedule, phases: [...phases, newPhase] });
  };

  const updatePhase = (index: number, updates: Partial<{ name: string; duration_weeks: number; dependencies?: string[] }>) => {
    const phases = [...(schedule.phases || [])];
    phases[index] = { ...phases[index], ...updates };
    updateData('schedule', { ...schedule, phases });
  };

  const removePhase = (index: number) => {
    const phases = (schedule.phases || []).filter((_, i) => i !== index);
    updateData('schedule', { ...schedule, phases });
  };

  const totalWeeks = (schedule.phases || []).reduce((sum, p) => sum + p.duration_weeks, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Project Schedule</h2>
        <p className="text-slate-500">Set timeline and phases</p>
      </div>

      {/* Start Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Estimated Start</label>
          <input
            type="date"
            value={schedule.estimated_start || ''}
            onChange={(e) => updateData('schedule', { ...schedule, estimated_start: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Est. Duration (weeks)</label>
          <input
            type="number"
            min={1}
            value={schedule.estimated_duration_weeks || totalWeeks || ''}
            onChange={(e) =>
              updateData('schedule', {
                ...schedule,
                estimated_duration_weeks: parseInt(e.target.value) || undefined,
              })
            }
            className="input"
            placeholder="Auto-calculated if phases set"
          />
        </div>
      </div>

      {/* Phases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-600">Project Phases</label>
          <button
            type="button"
            onClick={addPhase}
            className="text-sm text-coral font-medium hover:underline"
          >
            + Add Phase
          </button>
        </div>

        {(schedule.phases || []).length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <p className="text-slate-500 mb-3">No phases defined yet</p>
            <button type="button" onClick={addPhase} className="btn btn-primary">
              Add First Phase
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(schedule.phases || []).map((phase, index) => (
              <div key={index} className="card">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => updatePhase(index, { name: e.target.value })}
                      className="input font-medium"
                      placeholder="Phase name"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Duration:</span>
                      <input
                        type="number"
                        min={1}
                        value={phase.duration_weeks}
                        onChange={(e) =>
                          updatePhase(index, { duration_weeks: parseInt(e.target.value) || 1 })
                        }
                        className="input w-20 text-center"
                      />
                      <span className="text-sm text-slate-600">weeks</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhase(index)}
                    className="text-slate-400 hover:text-coral min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Total Duration */}
            <div className="bg-sage/10 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-600">Total Duration</p>
              <p className="text-xl font-semibold text-sage-dark">{totalWeeks} weeks</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 4: Review
function ReviewStep({ data }: StepProps) {
  const itemCount = data.scope.items.length;
  const tradeCount = data.scope.enabled_trades.length;
  const totalWeeks = (data.schedule.phases || []).reduce((sum, p) => sum + p.duration_weeks, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Review & Submit</h2>
        <p className="text-slate-500">Confirm project details before creating</p>
      </div>

      {/* Project Summary */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-3">Project</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-slate-800 font-medium">{data.project.name || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Type</dt>
            <dd className="text-slate-800">{data.project.project_type.replace('_', ' ')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Address</dt>
            <dd className="text-slate-800 text-right">{data.project.address.street || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Spec Level</dt>
            <dd className="text-slate-800 capitalize">{data.project.spec_level}</dd>
          </div>
        </dl>
      </div>

      {/* Client Summary */}
      {data.client?.name && (
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-3">Client</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-800">{data.client.name}</dd>
            </div>
            {data.client.email && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-800">{data.client.email}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Scope Summary */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-3">Scope</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-coral">{tradeCount}</p>
            <p className="text-sm text-slate-500">Trades</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-coral">{itemCount}</p>
            <p className="text-sm text-slate-500">Scope Items</p>
          </div>
        </div>

        {/* Trade breakdown */}
        <div className="mt-4 space-y-1">
          {data.scope.enabled_trades.map((code) => {
            const trade = TRADE_CODES[code as keyof typeof TRADE_CODES];
            const count = data.scope.items.filter((i) => i.trade_code === code).length;
            return (
              <div key={code} className="flex items-center gap-2 text-sm">
                <span>{trade?.icon}</span>
                <span className="flex-1 text-slate-600">{trade?.name}</span>
                <span className="text-slate-400">{count} items</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-3">Schedule</h3>
        <dl className="space-y-2 text-sm">
          {data.schedule.estimated_start && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Start Date</dt>
              <dd className="text-slate-800">{data.schedule.estimated_start}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">Duration</dt>
            <dd className="text-slate-800">
              {data.schedule.estimated_duration_weeks || totalWeeks || '-'} weeks
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Phases</dt>
            <dd className="text-slate-800">{(data.schedule.phases || []).length}</dd>
          </div>
        </dl>
      </div>

      {/* Estimate Summary */}
      {data.estimates ? (
        <div className="card bg-sage/5 border-2 border-sage/20">
          <h3 className="font-semibold text-slate-800 mb-3">Preliminary Estimate</h3>
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-1">Estimated Range</p>
            <p className="text-3xl font-bold text-sage-dark">
              ${data.estimates.low.toLocaleString()} - ${data.estimates.high.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
              <span>?</span> Based on template quantities • Refine in Estimate Builder
            </p>
          </div>
          <div className="border-t border-sage/20 pt-3 mt-3">
            <p className="text-xs text-slate-500 text-center">
              Includes 15-25% contingency • Based on NB market rates
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber/10 rounded-xl p-4">
          <p className="text-sm text-amber-dark">
            <strong>Note:</strong> A detailed estimate will be generated after you submit. You can
            refine it in the Estimate Builder.
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Wizard Component
// =============================================================================

const STEPS = [
  { id: 'project-info', name: 'Project', component: ProjectInfoStep },
  { id: 'scope', name: 'Scope', component: ScopeStep },
  { id: 'schedule', name: 'Schedule', component: ScheduleStep },
  { id: 'review', name: 'Review', component: ReviewStep },
];

interface ContractorIntakeWizardProps {
  onComplete: (data: ContractorIntakeData) => void;
  onCancel: () => void;
}

// Default project type for initial data
const DEFAULT_PROJECT_TYPE: ProjectType = 'floor_refresh';

// Convert scope template to ScopeItem with unique ID
function templateToScopeItem(template: ScopeItemTemplate, index: number): ScopeItem {
  return {
    id: `scope-${Date.now()}-${index}`,
    trade_code: template.trade_code,
    category: template.category,
    item_name: template.item_name,
    quantity: template.quantity,
    unit: template.unit,
    work_category_code: template.trade_code,
    stage_code: template.stage_code,
    location_id: template.location_id,
    // Pipeline-ready fields
    sopCodes: template.sopCodes,
    isLooped: template.isLooped,
    loopContextLabel: template.loopContextLabel,
    estimatedHoursPerUnit: template.estimatedHoursPerUnit,
  };
}

// Compute initial data with pre-populated values based on default project type
const getInitialData = (): ContractorIntakeData => {
  const defaultTrades = PROJECT_TYPE_TRADES[DEFAULT_PROJECT_TYPE] || [];
  const defaultPhases = PROJECT_TYPE_PHASES[DEFAULT_PROJECT_TYPE] || [];
  const defaultScopeTemplates = PROJECT_TYPE_SCOPE_TEMPLATES[DEFAULT_PROJECT_TYPE] || [];
  const defaultScopeItems = defaultScopeTemplates.map((t, i) => templateToScopeItem(t, i));
  const estimate = calculateEstimate(defaultScopeTemplates);

  return {
    project: {
      name: '',
      address: { street: '', city: '', province: '', postal_code: '' },
      project_type: DEFAULT_PROJECT_TYPE,
      spec_level: 'good',
      storeys: 1,
      has_basement: false,
      ceiling_heights: { main: 9 },
    },
    scope: {
      enabled_trades: defaultTrades,
      items: defaultScopeItems,
    },
    schedule: {
      phases: defaultPhases,
      estimated_duration_weeks: defaultPhases.reduce((sum, p) => sum + p.duration_weeks, 0),
    },
    estimates: {
      low: estimate.low,
      high: estimate.high,
      confidence: 'estimate',
    },
  };
};

export function ContractorIntakeWizard({ onComplete, onCancel }: ContractorIntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ContractorIntakeData>(getInitialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateData = useCallback((section: keyof ContractorIntakeData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [section]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(section)) delete newErrors[key];
      });
      return newErrors;
    });
  }, []);

  // Auto-populate trades, phases, scope items, and estimates when project type changes
  const handleProjectTypeChange = useCallback((projectType: ProjectType) => {
    // Get suggested trades for this project type
    const suggestedTrades = PROJECT_TYPE_TRADES[projectType] || [];

    // Get suggested phases for this project type
    const suggestedPhases = PROJECT_TYPE_PHASES[projectType] || [];

    // Get scope item templates for this project type
    const scopeTemplates = PROJECT_TYPE_SCOPE_TEMPLATES[projectType] || [];
    const scopeItems = scopeTemplates.map((t, i) => templateToScopeItem(t, i));

    // Calculate estimate from templates
    const estimate = calculateEstimate(scopeTemplates);

    setFormData((prev) => ({
      ...prev,
      scope: {
        ...prev.scope,
        enabled_trades: suggestedTrades,
        items: scopeItems, // Replace with template items
      },
      schedule: {
        ...prev.schedule,
        phases: suggestedPhases,
        estimated_duration_weeks: suggestedPhases.reduce((sum, p) => sum + p.duration_weeks, 0),
      },
      estimates: scopeTemplates.length > 0 ? {
        low: estimate.low,
        high: estimate.high,
        confidence: 'estimate',
      } : undefined,
    }));
  }, []);


  const validateStep = useCallback((): boolean => {
    const step = STEPS[currentStep];
    const newErrors: Record<string, string> = {};

    if (step.id === 'project-info') {
      if (!formData.project.name) newErrors['project.name'] = 'Required';
      if (!formData.project.address.street) newErrors['project.address'] = 'Required';
    }

    if (step.id === 'scope') {
      if (formData.scope.enabled_trades.length === 0) newErrors['scope.trades'] = 'Select at least one trade';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        onComplete(formData);
      }
    }
  }, [currentStep, formData, onComplete, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onCancel();
    }
  }, [currentStep, onCancel]);

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header with Progress */}
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleBack}
              className="text-slate-500 hover:text-slate-700 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              ← {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>
            <span className="text-sm text-slate-500">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-coral transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Pills */}
          <div className="flex gap-2 mt-3">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'text-xs px-3 py-1 rounded-full transition-colors',
                  index === currentStep
                    ? 'bg-coral text-white'
                    : index < currentStep
                      ? 'bg-sage/20 text-sage-dark'
                      : 'bg-slate-100 text-slate-400'
                )}
              >
                {step.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <CurrentStepComponent
          data={formData}
          updateData={updateData}
          errors={errors}
          onProjectTypeChange={handleProjectTypeChange}
        />
      </div>

      {/* Footer with Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe">
        <div className="max-w-lg mx-auto px-4 py-4">
          <button onClick={handleNext} className="btn btn-primary w-full">
            {currentStep === STEPS.length - 1 ? 'Create Project' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContractorIntakeWizard;
