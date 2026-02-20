/**
 * Seed All Labs Data
 *
 * Converts all 21 hardcoded SOPs from lib/data/sops.ts into IndexedDB database
 * SOPs with checklist items, creates knowledge items from lab test references,
 * and seeds the product/technique/tool catalogs.
 *
 * Idempotent: skips each category if data already exists.
 */

import { SOPS } from './sops';
import { seedLabsCatalogs } from './labsSeedData';
import { seedEstimatingCatalog } from './estimatingCatalogSeed';
import { seedToolResearchData } from './toolResearchSeed';
import { seedLabsIntegrationData } from './labsIntegrationSeed';
import type { Services } from '../services';
import { ProjectStatus } from '@hooomz/shared-contracts';

// Guide source prefix → tradeFamily
const TRADE_FAMILY_MAP: Record<string, string> = {
  DW: 'Drywall',
  FC: 'Finish Carpentry',
  FL: 'Flooring',
  PT: 'Paint',
  OH: 'Safety',
  TL: 'Tile',
};

function getTradeFamily(guideSource: string): string {
  const prefix = guideSource.split('-')[0].split(',')[0].trim();
  return TRADE_FAMILY_MAP[prefix] || prefix;
}

function getKnowledgeType(standard: string): 'specification' | 'product' | 'material' | 'technique' {
  const lower = standard.toLowerCase();
  if (lower.includes('adhesive') || lower.includes('bostik') || lower.includes('dap') || lower.includes('zinsser')) return 'product';
  if (lower.includes('mdf') || lower.includes('plywood') || lower.includes('osb') || lower.includes('tape')) return 'material';
  if (lower.includes('cope') || lower.includes('power stretch') || lower.includes('skim coat')) return 'technique';
  return 'specification';
}

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
 * Called on app init so the task pipeline can find SOPs without manual /labs/seed visit.
 */
export async function seedSOPsIfEmpty(services: Services): Promise<number> {
  const existing = await services.labs.sops.getAllCurrent();
  if (existing.length > 0) return 0;

  const now = new Date().toISOString();
  let count = 0;

  for (const sop of SOPS) {
    const tradeFamily = getTradeFamily(sop.guide_source);
    const dbSop = await services.labs.sops.createSop({
      sopCode: sop.id,
      title: sop.title,
      description: null,
      tradeFamily,
      effectiveDate: now,
      defaultObservationMode: 'standard',
      certificationLevel: 'apprentice',
      requiredSupervisedCompletions: 3,
      reviewQuestionCount: 5,
      reviewPassThreshold: 80,
      fieldGuideRef: sop.guide_source,
      status: 'active',
      createdBy: 'auto-seed',
      versionNotes: 'Auto-seeded on app init',
    });
    count++;

    for (const step of sop.quick_steps) {
      const hasPhotoHint = /photo|document|capture/i.test(step.action);
      await services.labs.sops.addChecklistItem(dbSop.id, {
        title: step.action,
        description: null,
        checklistType: 'activity',
        category: 'procedure',
        isCritical: false,
        generatesObservation: hasPhotoHint,
        observationKnowledgeType: null,
        requiresPhoto: hasPhotoHint,
        hasTimingFollowup: null,
        triggerTiming: 'batch',
        defaultProductId: null,
        defaultTechniqueId: null,
        defaultToolId: null,
        scriptPhase: null,
      });
    }
  }

  console.log(`[Auto-seed] Created ${count} SOPs with checklist items`);

  // Recovery: re-run pipeline for APPROVED projects that have 0 tasks
  // (they were approved before SOPs existed, so pipeline generated nothing)
  const approvedProjects = await services.projects.findByStatus(ProjectStatus.APPROVED);
  for (const proj of approvedProjects) {
    const tasks = await services.scheduling.tasks.findByProjectId(proj.id);
    if (tasks.length === 0) {
      const lineItems = await services.estimating.lineItems.findByProjectId(proj.id);
      const pipelineItems = lineItems.filter((li) => li.sopCodes && li.sopCodes.length > 0 && li.isLabor !== false);
      if (pipelineItems.length > 0) {
        const result = await services.pipeline.generateFromEstimate(proj.id, pipelineItems);
        console.log(`[Auto-seed] Recovery: generated ${result.blueprints.length} blueprints, deployed ${result.deployed.length} tasks for project "${proj.name}"`);
      }
    }
  }

  return count;
}

export async function seedAllLabsData(
  services: Services,
  onProgress?: SeedProgressCallback
): Promise<SeedResult> {
  const log = onProgress || (() => {});
  const now = new Date().toISOString();
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
  // 1. SOPs + Checklist Items
  // ========================================================================
  const existingSops = await services.labs.sops.getAllCurrent();
  if (existingSops.length > 0) {
    log(`Skipping SOPs — ${existingSops.length} already exist`);
  } else {
    log('Seeding SOPs...');
    for (let i = 0; i < SOPS.length; i++) {
      const sop = SOPS[i];
      const tradeFamily = getTradeFamily(sop.guide_source);

      log(`  Creating SOP ${i + 1}/${SOPS.length}: ${sop.id} — ${sop.title}`);

      const dbSop = await services.labs.sops.createSop({
        sopCode: sop.id,
        title: sop.title,
        description: null,
        tradeFamily,
        effectiveDate: now,
        defaultObservationMode: 'standard',
        certificationLevel: 'apprentice',
        requiredSupervisedCompletions: 3,
        reviewQuestionCount: 5,
        reviewPassThreshold: 80,
        fieldGuideRef: sop.guide_source,
        status: 'active',
        createdBy: 'seed',
        versionNotes: 'Initial seed from field guide',
      });
      result.sops++;

      // Add checklist items from quick_steps
      for (const step of sop.quick_steps) {
        const hasPhotoHint = /photo|document|capture/i.test(step.action);
        await services.labs.sops.addChecklistItem(dbSop.id, {
          title: step.action,
          description: null,
          checklistType: 'activity',
          category: 'procedure',
          isCritical: false,
          generatesObservation: hasPhotoHint,
          observationKnowledgeType: null,
          requiresPhoto: hasPhotoHint,
          hasTimingFollowup: null,
          triggerTiming: 'batch',
          defaultProductId: null,
          defaultTechniqueId: null,
          defaultToolId: null,
          scriptPhase: null,
        });
        result.checklistItems++;
      }
    }
    log(`SOPs complete: ${result.sops} SOPs, ${result.checklistItems} checklist items`);
  }

  // ========================================================================
  // 2. Knowledge Items from lab references
  // ========================================================================
  const existingKnowledge = await services.labs.knowledge.findAll();
  if (existingKnowledge.length > 0) {
    log(`Skipping knowledge items — ${existingKnowledge.length} already exist`);
  } else {
    log('Seeding knowledge items from lab references...');

    // Collect unique L-2026-xxx references
    const labRefs = new Map<string, { standard: string; tradeFamily: string }>();
    for (const sop of SOPS) {
      const tradeFamily = getTradeFamily(sop.guide_source);
      for (const cs of sop.critical_standards) {
        if (cs.source.startsWith('L-')) {
          if (!labRefs.has(cs.source)) {
            labRefs.set(cs.source, { standard: cs.standard, tradeFamily });
          }
        }
      }
    }

    let knowledgeCount = 0;
    for (const [sourceCode, { standard, tradeFamily }] of labRefs) {
      knowledgeCount++;
      log(`  Creating knowledge ${knowledgeCount}/${labRefs.size}: ${sourceCode}`);

      const title = standard.length > 80
        ? standard.substring(0, 77) + '...'
        : standard;

      await services.labs.knowledge.create({
        knowledgeType: getKnowledgeType(standard),
        category: tradeFamily,
        title,
        summary: standard,
        confidenceScore: 85,
        lastConfidenceUpdate: now,
        observationCount: 0,
        experimentCount: 1,
        status: 'published',
        createdBy: 'seed',
        tags: [sourceCode, tradeFamily],
      });
      result.knowledgeItems++;
    }
    log(`Knowledge items complete: ${result.knowledgeItems} items`);
  }

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

  log('Seed complete!');
  return result;
}
