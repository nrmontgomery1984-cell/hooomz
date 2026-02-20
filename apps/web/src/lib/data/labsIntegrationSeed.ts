/**
 * Labs Integration Seed Data
 *
 * Seeds tokens, tests, and voting ballots for the Labs integration system.
 * Idempotent: skips each category if data already exists.
 */

import type { LabsToken, LabsTest, LabsVoteBallot } from '@hooomz/shared-contracts';
import type { Services } from '../services';

export interface LabsIntegrationSeedResult {
  tokens: number;
  tests: number;
  ballots: number;
}

// ============================================================================
// Seed Token Data — 10 dynamic material reference tokens
// ============================================================================

const now = new Date().toISOString();

const SEED_TOKENS: LabsToken[] = [
  {
    id: 'floor-protection',
    category: 'protection',
    context: 'during-renovation',
    displayName: 'Floor Protection Product',
    currentRecommendation: 'Ram Board',
    recommendationDetail: 'Heavy-duty temporary floor protection. Tested over 15 projects.',
    status: 'validated',
    labsTestId: 'HL-TEST-001',
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['FL-LVP-CLICK', 'FL-LVP-GLUE', 'FL-HARDWOOD', 'FL-CARPET-STRETCH'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'lvp-adhesive',
    category: 'adhesive',
    context: 'lvp-gluedown',
    displayName: 'LVP Glue-Down Adhesive',
    currentRecommendation: 'Bostik Laybond',
    recommendationDetail: 'Pressure-sensitive adhesive for glue-down LVP. Labs confidence 92%.',
    status: 'validated',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['FL-LVP-GLUE'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'subfloor-primer',
    category: 'primer',
    context: 'subfloor-prep',
    displayName: 'Subfloor Primer',
    currentRecommendation: 'Mapei Primer T',
    recommendationDetail: 'Acrylic primer for porous substrates before leveler or adhesive.',
    status: 'validated',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['FL-LVP-GLUE', 'FL-LVP-CLICK', 'TL-FLOOR-CERAMIC'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'trim-caulk',
    category: 'caulk',
    context: 'trim-to-wall',
    displayName: 'Trim Caulk',
    currentRecommendation: 'DAP Alex Flex',
    recommendationDetail: 'Paintable latex caulk for trim-to-wall transitions.',
    status: 'validated',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['FC-BASE-NAIL', 'FC-BASE-GLUE', 'FC-CASE-STD', 'FC-CROWN-STD'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'stain-block-primer',
    category: 'primer',
    context: 'stain-blocking',
    displayName: 'Stain-Blocking Primer',
    currentRecommendation: 'Zinsser BIN',
    recommendationDetail: 'Shellac-based primer for water stains, smoke damage, knots.',
    status: 'validated',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['PT-WALL-ROLL', 'PT-WALL-BRUSH', 'PT-CEIL-ROLL'],
    division: ['interiors', 'exteriors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'drywall-compound',
    category: 'compound',
    context: 'drywall-finishing',
    displayName: 'Drywall Joint Compound',
    currentRecommendation: 'Sheetrock Plus 3',
    recommendationDetail: 'Lightweight all-purpose joint compound for taping and finishing.',
    status: 'standard',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['DW-TAPE-STD', 'DW-PATCH-SM', 'DW-PATCH-LG'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'tile-thinset',
    category: 'adhesive',
    context: 'tile-installation',
    displayName: 'Tile Thinset Mortar',
    currentRecommendation: 'Mapei Kerabond',
    recommendationDetail: 'Modified thinset mortar for floor and wall tile.',
    status: 'standard',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['TL-FLOOR-CERAMIC', 'TL-WALL-SUBWAY'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'carpet-seam-tape',
    category: 'tape',
    context: 'carpet-seaming',
    displayName: 'Carpet Seam Tape',
    currentRecommendation: 'Orcon Seam Tape',
    recommendationDetail: 'Hot-melt seam tape for carpet seaming. Currently under test.',
    status: 'planned',
    labsTestId: 'HL-TEST-002',
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['FL-CARPET-STRETCH'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'wood-glue-trim',
    category: 'adhesive',
    context: 'trim-joints',
    displayName: 'Trim Joint Adhesive',
    currentRecommendation: 'Titebond III',
    recommendationDetail: 'Waterproof wood glue for trim mitre joints and scarf joints.',
    status: 'standard',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['FC-BASE-NAIL', 'FC-CROWN-STD'],
    division: ['interiors', 'exteriors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'self-leveler',
    category: 'leveler',
    context: 'subfloor-leveling',
    displayName: 'Self-Leveling Compound',
    currentRecommendation: 'Mapei Novoplan 2 Plus',
    recommendationDetail: 'Self-leveling underlayment for uneven subfloors before flooring.',
    status: 'validated',
    labsTestId: null,
    labsTestUrl: null,
    previousRecommendations: [],
    sopReferences: ['FL-LVP-CLICK', 'FL-LVP-GLUE', 'TL-FLOOR-CERAMIC'],
    division: ['interiors'],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
];

// ============================================================================
// Seed Test Data — 3 sample tests in different PDCA phases
// ============================================================================

const SEED_TESTS: LabsTest[] = [
  {
    id: 'HL-TEST-001',
    title: 'Floor Protection: Ram Board vs. Cardboard vs. Masonite',
    description: 'Compare reusability, protection level, and cost-per-use of three floor protection methods across 5 residential renovation projects.',
    category: 'product',
    status: 'published',
    plan: {
      question: 'Which floor protection provides the best cost-per-use when factoring reusability?',
      variables: ['material type', 'number of reuses', 'damage incidents'],
      protocol: 'Use each product on 5 sequential projects, track reuses and floor damage incidents.',
      successCriteria: 'Lowest cost-per-use with zero floor damage incidents.',
    },
    doData: {
      startDate: '2025-09-01',
      endDate: '2025-12-15',
      notes: 'Tested across 15 rooms. Ram Board averaged 4 reuses vs 1 for cardboard.',
      photos: [],
    },
    checkResults: {
      summary: 'Ram Board wins on cost-per-use ($0.12/sqft/use vs $0.08 cardboard single-use). Zero damage incidents with Ram Board, 3 with cardboard.',
      winner: 'Ram Board',
      data: 'Ram Board: $0.12/sqft/use (4 avg reuses), Cardboard: $0.08/sqft/use (1 use), Masonite: $0.15/sqft/use (6 reuses but heavy).',
    },
    actChanges: {
      sopUpdates: [
        { sopId: 'FL-LVP-CLICK', tokenId: 'floor-protection', oldValue: 'contractor choice', newValue: 'Ram Board' },
      ],
      contentPublished: [
        { type: 'video', url: '/content/floor-protection-test', publishDate: '2026-01-10' },
      ],
    },
    voteCount: 8,
    votedBy: ['nathan', 'nishant', 'partner-1', 'partner-2', 'partner-3', 'partner-4', 'partner-5', 'partner-6'],
    tokenIds: ['floor-protection'],
    sopIds: ['FL-LVP-CLICK', 'FL-LVP-GLUE', 'FL-HARDWOOD', 'FL-CARPET-STRETCH'],
    divisionsImpacted: ['interiors'],
    priority: 1,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'HL-TEST-002',
    title: 'Carpet Seam Tape Durability: Orcon vs. ToolTech vs. Roberts',
    description: 'Test seam tape adhesion strength and longevity under high-traffic residential conditions.',
    category: 'product',
    status: 'in-progress',
    plan: {
      question: 'Which carpet seam tape maintains strongest bond after 6 months of residential foot traffic?',
      variables: ['tape brand', 'traffic level', 'carpet type'],
      protocol: 'Install 3 seams per brand in high-traffic hallways. Inspect monthly for delamination.',
      successCriteria: 'No visible seam separation at 6-month inspection.',
    },
    doData: {
      startDate: '2026-01-15',
      endDate: null,
      notes: 'Month 1 inspection complete. All three brands holding. Orcon showing best lay-flat.',
      photos: [],
    },
    checkResults: null,
    actChanges: null,
    voteCount: 5,
    votedBy: ['nathan', 'nishant', 'partner-1', 'partner-2', 'partner-3'],
    tokenIds: ['carpet-seam-tape'],
    sopIds: ['FL-CARPET-STRETCH'],
    divisionsImpacted: ['interiors'],
    priority: 2,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
  {
    id: 'HL-TEST-003',
    title: 'LVP Adhesive Open Time: Bostik vs. Mapei vs. Henry',
    description: 'Compare working time, bond strength at 24hr, and ease of application for three LVP adhesives.',
    category: 'product',
    status: 'proposed',
    plan: null,
    doData: null,
    checkResults: null,
    actChanges: null,
    voteCount: 0,
    votedBy: [],
    tokenIds: ['lvp-adhesive'],
    sopIds: ['FL-LVP-GLUE'],
    divisionsImpacted: ['interiors'],
    priority: 3,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  },
];

// ============================================================================
// Seed Ballot Data — 1 closed ballot with results
// ============================================================================

const SEED_BALLOT: LabsVoteBallot = {
  id: '2026-W06',
  weekStart: '2026-02-02',
  weekEnd: '2026-02-08',
  status: 'closed',
  options: [
    {
      testId: 'HL-TEST-002',
      title: 'Carpet Seam Tape Durability',
      description: 'Compare Orcon, ToolTech, and Roberts seam tapes for residential carpet.',
      voteCount: 5,
    },
    {
      testId: 'HL-TEST-003',
      title: 'LVP Adhesive Open Time',
      description: 'Compare Bostik, Mapei, and Henry adhesives for glue-down LVP.',
      voteCount: 2,
    },
    {
      testId: 'HL-TEST-004-PLACEHOLDER',
      title: 'Drywall Primer Adhesion',
      description: 'Test primer adhesion on new drywall vs. skim-coated surfaces.',
      voteCount: 1,
    },
  ],
  totalVotes: 8,
  createdBy: 'nathan',
  createdAt: now,
  updatedAt: now,
  syncStatus: 'synced',
};


// ============================================================================
// Main Seed Function
// ============================================================================

export async function seedLabsIntegrationData(
  services: Services,
  onProgress?: (message: string) => void,
): Promise<LabsIntegrationSeedResult> {
  const log = onProgress || (() => {});
  const result: LabsIntegrationSeedResult = {
    tokens: 0,
    tests: 0,
    ballots: 0,
  };

  // ---- Tokens ----
  const existingTokens = await services.labs.tokens.findAll();
  if (existingTokens.length > 0) {
    log(`Skipping tokens — ${existingTokens.length} already exist`);
  } else {
    log('Seeding Labs tokens...');
    for (const token of SEED_TOKENS) {
      await services.labs.tokens.createWithId(token);
      result.tokens++;
      log(`  Token: ${token.displayName} → ${token.currentRecommendation}`);
    }
    log(`Tokens complete: ${result.tokens} tokens`);
  }

  // ---- Tests ----
  const existingTests = await services.labs.tests.findAll();
  if (existingTests.length > 0) {
    log(`Skipping tests — ${existingTests.length} already exist`);
  } else {
    log('Seeding Labs tests...');
    for (const test of SEED_TESTS) {
      await services.labs.tests.createWithId(test);
      result.tests++;
      log(`  Test: ${test.title} [${test.status}]`);
    }
    log(`Tests complete: ${result.tests} tests`);
  }

  // ---- Voting Ballot ----
  const existingBallots = await services.labs.voting.findAllBallots();
  if (existingBallots.length > 0) {
    log(`Skipping ballots — ${existingBallots.length} already exist`);
  } else {
    log('Seeding Labs voting ballot...');
    await services.labs.voting.createBallotWithId(SEED_BALLOT);
    result.ballots = 1;
    log(`  Ballot: Week ${SEED_BALLOT.id} (${SEED_BALLOT.status}, ${SEED_BALLOT.totalVotes} votes)`);
    log(`Voting complete: ${result.ballots} ballot`);
  }

  return result;
}
