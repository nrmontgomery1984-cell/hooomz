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
import type { Services } from '../services';

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
}

export type SeedProgressCallback = (message: string) => void;

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

  log('Seed complete!');
  return result;
}
