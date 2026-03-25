/**
 * Seed All Labs Data
 *
 * Seeds operational data: crew members, estimating catalog, workflows.
 * SOP/training/labs content is now created through the app, not hardcoded.
 *
 * Idempotent: skips each category if data already exists.
 */

import { SOPS } from './sops';
import { seedLabsCatalogs } from './labsSeedData';
import { seedEstimatingCatalog } from './estimatingCatalogSeed';
import { seedToolResearchData } from './toolResearchSeed';
import { seedLabsIntegrationData } from './labsIntegrationSeed';
import TG_FLR_001 from './tg-flr-001.json';
import TG_PNT_001 from './tg-pnt-001.json';
import type { TrainingGuide } from '@hooomz/shared-contracts';
import type { Services } from '../services';

export interface SeedResult {
  sops: number;
  checklistItems: number;
  knowledgeItems: number;
  products: number;
  techniques: number;
  toolMethods: number;
  crewMembers: number;
  catalogItems: number;
  toolPlatforms?: number;
  toolResearchItems?: number;
  toolInventoryItems?: number;
  customers?: number;
  projects?: number;
  tasks?: number;
  leads?: number;
}

export type SeedProgressCallback = (message: string) => void;

/**
 * Auto-seed SOPs if none exist in IndexedDB.
 * No-op — SOPs are now created through the app (Standards > SOPs or Labs > SOPs).
 * Kept for backward compatibility with ServicesContext.tsx.
 */
export async function seedSOPsIfEmpty(_services: Services): Promise<number> {
  // SOPS array is empty — nothing to seed.
  // SOPs are now created through the app, not hardcoded.
  return 0;
}

export async function seedAllLabsData(
  services: Services,
  onProgress?: SeedProgressCallback
): Promise<SeedResult> {
  const log = onProgress || (() => {});
  const result: SeedResult = {
    sops: 0,
    checklistItems: 0,
    knowledgeItems: 0,
    products: 0,
    techniques: 0,
    toolMethods: 0,
    crewMembers: 0,
    catalogItems: 0,
  };

  // ========================================================================
  // 1. SOPs — no-op (SOPS array is empty, content created through the app)
  // ========================================================================
  if (SOPS.length > 0) {
    log('Seeding SOPs...');
    // SOPs array is empty — this block won't execute
    log(`SOPs complete: ${result.sops} SOPs, ${result.checklistItems} checklist items`);
  } else {
    log('Skipping SOPs — content created through the app');
  }

  // ========================================================================
  // 2. Knowledge Items — no-op (derived from SOPs which are now empty)
  // ========================================================================
  log('Skipping knowledge items — content created through the app');

  // ========================================================================
  // 3. Catalog items (existing seed function, already idempotent)
  // ========================================================================
  log('Seeding catalogs...');
  const catalogResult = await seedLabsCatalogs({
    catalog: services.labs.catalog,
  });
  result.products = catalogResult.products;
  result.techniques = catalogResult.techniques;
  result.toolMethods = catalogResult.toolMethods;
  log(`Catalogs complete: ${result.products} products, ${result.techniques} techniques, ${result.toolMethods} tools`);

  // ========================================================================
  // 4. Crew Members (Build 3c)
  // ========================================================================
  const existingCrew = await services.crew.findAll();
  if (existingCrew.length > 0) {
    log(`Skipping crew members — ${existingCrew.length} already exist`);
  } else {
    log('Seeding crew members...');

    await services.crew.createWithId('crew_nathan', {
      name: 'Nathan Montgomery',
      role: 'Owner / Supervisor',
      authRole: 'owner',
      tier: 'master',
      tradeSpecialties: ['Flooring', 'Finish Carpentry', 'Paint', 'Drywall'],
      wageRate: 45,
      chargedRate: 95,
      isActive: true,
      startDate: '2004-01-01',
      certifications: ['Red Seal Journeyman Carpenter'],
    });
    result.crewMembers++;

    await services.crew.createWithId('crew_nishant', {
      name: 'Nishant',
      role: 'Flooring Specialist',
      authRole: 'installer',
      tier: 'learner',
      tradeSpecialties: ['Flooring'],
      wageRate: 28,
      chargedRate: 55,
      isActive: true,
      startDate: '2025-06-01',
      certifications: [],
    });
    result.crewMembers++;

    log(`Crew members complete: ${result.crewMembers} members`);
  }

  // ========================================================================
  // 5. Estimating Catalog (materials + labor rates)
  // ========================================================================
  log('Seeding estimating catalog...');
  const catalogCount = await seedEstimatingCatalog(services);
  result.catalogItems = catalogCount;
  if (catalogCount > 0) {
    log(`Estimating catalog complete: ${catalogCount} items`);
  } else {
    log('Skipping estimating catalog — items already exist');
  }

  // ========================================================================
  // 6. Tool Research Data
  // ========================================================================
  log('Seeding tool research data...');
  const toolResult = await seedToolResearchData(services, log);
  result.toolPlatforms = toolResult.platforms;
  result.toolResearchItems = toolResult.researchItems;
  result.toolInventoryItems = toolResult.inventoryItems;

  // ========================================================================
  // 7. Workflows (Labs — construction sequencing)
  // ========================================================================
  const existingWorkflows = await services.labs.workflows.getAll();
  if (existingWorkflows.length > 0) {
    log(`Skipping workflows — ${existingWorkflows.length} already exist`);
  } else {
    log('Seeding workflows...');

    await services.labs.workflows.createWithId('wf_standard_reno', {
      name: 'Standard Residential Renovation',
      description: 'Default construction sequence for interior renovation projects: demo → drywall → prime → paint ceilings → paint walls → flooring → trim → hardware → punch list → cleanup',
      status: 'active',
      isDefault: true,
      phases: [
        { phaseCode: 'DEMO', name: 'Demolition & Removal', order: 1, stageCode: 'ST-DM', tradeCodes: ['FL', 'FC', 'PT', 'DW', 'TL'], sopCodes: [], description: 'Remove existing materials before new work begins' },
        { phaseCode: 'DRYWALL', name: 'Drywall Patching', order: 2, stageCode: 'ST-PR', tradeCodes: ['DW'], sopCodes: [], description: 'Patch, tape, and mud drywall before priming' },
        { phaseCode: 'PRIME', name: 'Prime & Prep', order: 3, stageCode: 'ST-PR', tradeCodes: ['PT'], sopCodes: [], description: 'Sand, fill, and prime all surfaces' },
        { phaseCode: 'PAINT-CEIL', name: 'Paint Ceilings', order: 4, stageCode: 'ST-FN', tradeCodes: ['PT'], sopCodes: ['PT-CEIL-ROLL', 'PT-CEIL-SPRAY'], description: 'Paint ceilings before walls to catch drips' },
        { phaseCode: 'PAINT-WALL', name: 'Paint Walls', order: 5, stageCode: 'ST-FN', tradeCodes: ['PT'], sopCodes: ['PT-WALL-ROLL', 'PT-WALL-SPRAY', 'PT-WALL-BRUSH'], description: 'Paint walls after ceilings, before flooring' },
        { phaseCode: 'FLOORING', name: 'Install Flooring', order: 6, stageCode: 'ST-FN', tradeCodes: ['FL', 'TL'], sopCodes: [], description: 'Install flooring after paint is dry' },
        { phaseCode: 'TRIM', name: 'Install Trim & Millwork', order: 7, stageCode: 'ST-FN', tradeCodes: ['FC'], sopCodes: [], description: 'Install baseboard, casing, and crown after flooring' },
        { phaseCode: 'HARDWARE', name: 'Hardware & Accessories', order: 8, stageCode: 'ST-FN', tradeCodes: ['FC'], sopCodes: [], description: 'Door hardware, outlet covers, accessories' },
        { phaseCode: 'PUNCH', name: 'Punch List & Touch-ups', order: 9, stageCode: 'ST-PL', tradeCodes: ['FL', 'FC', 'PT', 'DW', 'TL'], sopCodes: [], description: 'Touch-up paint, fix deficiencies, snag list' },
        { phaseCode: 'CLEANUP', name: 'Closeout & Cleanup', order: 10, stageCode: 'ST-CL', tradeCodes: ['FL', 'FC', 'PT', 'DW', 'TL'], sopCodes: [], description: 'Final clean, inspection, client handoff' },
      ],
    });
    log('Workflows complete: 1 workflow (Standard Residential Renovation)');
  }

  // ========================================================================
  // 8. Labs Integration Data (Tokens, Tests, Voting)
  // ========================================================================
  log('Seeding Labs integration data...');
  const integrationResult = await seedLabsIntegrationData(services, log);
  if (integrationResult.tokens > 0 || integrationResult.tests > 0 || integrationResult.ballots > 0) {
    log(`Labs integration complete: ${integrationResult.tokens} tokens, ${integrationResult.tests} tests, ${integrationResult.ballots} ballots`);
  }

  // ========================================================================
  // 9. Training Guides (TG-FLR-001, TG-PNT-001)
  // ========================================================================
  const existingTGs = await services.trainingGuides.getAll();
  if (existingTGs.length > 0) {
    log(`Skipping training guides — ${existingTGs.length} already exist`);
  } else {
    log('Seeding training guides...');
    await services.trainingGuides.save(TG_FLR_001 as TrainingGuide);
    await services.trainingGuides.save(TG_PNT_001 as TrainingGuide);
    log('Training guides complete: 2 guides (Flooring + Painting)');
  }

  log('Seed complete!');
  return result;
}
