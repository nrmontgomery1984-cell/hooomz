/**
 * SOP Static Data — All 21 Standard Operating Procedures
 *
 * Source: docs/HOOOMZ_TRAINING_MASTER.md Part 10B
 * These are reference data that don't change per-user.
 * Checklist progress is stored separately in IndexedDB.
 */

// ============================================================================
// Types
// ============================================================================

export interface SOPCriticalStandard {
  standard: string;
  source: string;
}

export interface SOPStep {
  order: number;
  action: string;
}

export interface SOP {
  id: string;
  title: string;
  guide_source: string;
  critical_standards: SOPCriticalStandard[];
  quick_steps: SOPStep[];
  stop_conditions: string[];
  linked_recommendations: string[];
}

// ============================================================================
// Helper: parse "1. Do something" → { order: 1, action: "Do something" }
// ============================================================================

function parseSteps(steps: string[]): SOPStep[] {
  return steps.map((s) => {
    const match = s.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      return { order: parseInt(match[1], 10), action: match[2] };
    }
    return { order: 0, action: s };
  });
}

// ============================================================================
// All 21 SOPs
// ============================================================================

export const SOPS: SOP[] = [
  // --- DRYWALL ---
  {
    id: 'HI-SOP-DW-001',
    title: 'Drywall Hanging',
    guide_source: 'DW-01',
    critical_standards: [
      { standard: 'Screw depth: 1/32" below paper surface — 40% stronger than deeper', source: 'L-2026-018' },
      { standard: 'Ceilings first, then walls. Horizontal on walls (fewer joints to tape).', source: 'DW-01' },
    ],
    quick_steps: parseSteps([
      '1. Mark stud locations on floor and ceiling',
      '2. Hang ceiling sheets first, perpendicular to joists',
      '3. Hang wall sheets horizontally, stagger joints from ceiling sheets',
      '4. Screw depth: 1/32" below paper — dimple but don\'t break paper',
      '5. Screws every 12" on field, 8" on edges',
      '6. Cut outlets and openings with rotary tool',
      '7. Leave 1/8" gap at floor',
    ]),
    stop_conditions: [
      'Paper broken at screw heads — back out, drive new screw 2" away',
      'Screws not hitting framing',
    ],
    linked_recommendations: ['DW-01-S3-R001'],
  },
  {
    id: 'HI-SOP-DW-002',
    title: 'Drywall Taping',
    guide_source: 'DW-02',
    critical_standards: [
      { standard: 'Paper tape for all joints — 3x longer crack resistance than mesh', source: 'L-2026-020' },
      { standard: 'Mesh tape ONLY for patches where paper won\'t stick', source: 'L-2026-020' },
    ],
    quick_steps: parseSteps([
      '1. Pre-fill any gaps >1/8" with setting compound',
      '2. Apply thin bed coat of compound to joint',
      '3. Embed PAPER tape into wet compound',
      '4. Wipe excess — tape flat, no bubbles, no dry spots',
      '5. Inside corners: fold paper tape, embed one side at a time',
      '6. Outside corners: metal or vinyl corner bead, mudded over',
      '7. Let dry completely before next coat',
    ]),
    stop_conditions: [
      'Mesh tape being used on flat joints — replace with paper tape',
      'Bubbles in tape — pull and re-embed',
    ],
    linked_recommendations: ['DW-02-S2-R001'],
  },
  {
    id: 'HI-SOP-DW-003',
    title: 'Drywall Mudding & Sanding',
    guide_source: 'DW-03',
    critical_standards: [
      { standard: 'Level 5 finish for flat/matte paint + raking light conditions', source: 'L-2026-022' },
      { standard: 'Level 4 sufficient for textured walls or semi-gloss+ paint', source: 'L-2026-022' },
    ],
    quick_steps: parseSteps([
      '1. First coat: embed tape (see HI-SOP-DW-002)',
      '2. Second coat: wider knife (8-10"), feather edges 6" beyond tape',
      '3. Third coat: widest knife (12"), feather 12"+ beyond tape',
      '4. Sand between coats with 150-grit on pole sander',
      '5. Final sand with 220-grit',
      '6. Check with raking light — fix any imperfections before paint',
      '7. Level 5: skim coat entire surface if flat paint + raking light',
    ]),
    stop_conditions: [
      'Compound not fully dry between coats — do not sand or coat wet mud',
      'Raking light reveals imperfections — fix before releasing to paint',
    ],
    linked_recommendations: ['DW-03-S2-R001'],
  },

  // --- FINISH CARPENTRY ---
  {
    id: 'HI-SOP-FC-001',
    title: 'Door & Window Casing',
    guide_source: 'FC-01, FC-02',
    critical_standards: [
      { standard: 'Caulk miters with DAP Alex Plus — wood filler cracked 80% within 9 months', source: 'L-2026-030' },
      { standard: 'MDF for paint-grade window stools — pine cupped 60%', source: 'L-2026-031' },
      { standard: '3/16" reveal on all jamb edges', source: 'FC-01' },
    ],
    quick_steps: parseSteps([
      '1. Verify jamb plumb and flush',
      '2. Mark 3/16" reveal on all edges',
      '3. Measure and cut head casing with miters',
      '4. Install head, then legs',
      '5. Windows: stool first, then casing, then apron',
      '6. CAULK miters with DAP Alex Plus (not wood filler)',
      '7. Fill nail holes with wood filler, sand smooth',
      '8. Caulk casing-to-wall gap',
    ]),
    stop_conditions: [
      "Miter doesn't close tight — adjust angle, don't force",
      'Wood filler at miters — replace with caulk',
    ],
    linked_recommendations: ['FC-01-S6-R001', 'FC-02-S1-R001'],
  },
  {
    id: 'HI-SOP-FC-002',
    title: 'Window Trim',
    guide_source: 'FC-02',
    critical_standards: [
      { standard: 'MDF for paint-grade stools — pine cupped 60% in one heating season', source: 'L-2026-031' },
    ],
    quick_steps: parseSteps([
      '1. Use MDF for paint-grade stools',
      '2. Measure and notch stool for window frame',
      '3. Install stool level, tight to sash, horns 3/4" past casing',
      '4. Install casing on top and sides (per HI-SOP-FC-001)',
      '5. Install apron centered under stool',
      '6. Caulk and fill',
    ]),
    stop_conditions: [
      'Pine selected for paint-grade stool — switch to MDF',
      'Stool not level — everything above will look crooked',
    ],
    linked_recommendations: ['FC-02-S1-R001'],
  },
  {
    id: 'HI-SOP-FC-003',
    title: 'Baseboard Installation',
    guide_source: 'FC-03',
    critical_standards: [
      { standard: 'ALWAYS cope inside corners. Mitered inside corners opened 70% within 12 months.', source: 'L-2026-032' },
    ],
    quick_steps: parseSteps([
      '1. Start with longest wall',
      '2. First piece: square cuts, tight to corners',
      '3. COPE inside corners — 45° cut, coping saw, 15° back-angle',
      '4. Miter and glue outside corners',
      '5. Scarf joints on long walls (over a stud)',
      '6. Nail into studs at 16" O.C.',
      '7. Caulk top edge and outside miters',
    ]),
    stop_conditions: [
      'Mitered inside corners — STOP and cope instead',
      'A bad cope is STILL better than a mitered inside corner',
    ],
    linked_recommendations: ['FC-03-S3-R001'],
  },
  {
    id: 'HI-SOP-FC-004',
    title: 'Crown Molding',
    guide_source: 'FC-04',
    critical_standards: [
      { standard: 'Construction adhesive + nails mandatory. Nails-only gaps within 6 months.', source: 'L-2026-033' },
    ],
    quick_steps: parseSteps([
      '1. Determine spring angle (38° or 45°)',
      '2. Install blocking or verify framing for nailing',
      '3. Apply construction adhesive to BOTH contact surfaces',
      '4. Install first piece on longest wall',
      '5. Cope inside corners, miter+glue outside corners',
      '6. Nail into top plate and studs',
      '7. Caulk all joints and edges',
    ]),
    stop_conditions: [
      'No blocking or framing to nail into — install nailer strips first',
      'Nails-only without adhesive — add adhesive to every piece',
    ],
    linked_recommendations: ['FC-04-S3-R001'],
  },
  {
    id: 'HI-SOP-FC-005',
    title: 'Interior Door Hanging',
    guide_source: 'FC-05',
    critical_standards: [
      { standard: 'Shim at every hinge point + strike plate. 3" screw in each hinge to stud.', source: 'FC-05' },
      { standard: '1/8" even gap on all three sides', source: 'FC-05' },
    ],
    quick_steps: parseSteps([
      '1. Verify rough opening (2" wider, 1" taller)',
      '2. Set unit, shim hinge side plumb',
      '3. Replace one hinge screw per hinge with 3" into stud',
      '4. Shim strike side for even 1/8" gap',
      '5. Test: door should stay at any position',
      '6. Install hardware and door stop',
      '7. Case door per HI-SOP-FC-001',
    ]),
    stop_conditions: [
      'Door drifts open or closed — hinge side not plumb, re-shim',
      'Gap uneven — adjust shims',
    ],
    linked_recommendations: ['FC-05-S2-R001'],
  },
  {
    id: 'HI-SOP-FC-007',
    title: 'Bifold Door Installation',
    guide_source: 'FC-07',
    critical_standards: [
      { standard: 'Adjustable pivot brackets — NB seasonal movement requires periodic adjustment', source: 'FC-07' },
    ],
    quick_steps: parseSteps([
      '1. Mount track level to head jamb',
      '2. Install adjustable bottom pivot — plumb bob from top pivot',
      '3. Hang doors, adjust for 1/4" floor clearance',
      '4. Adjust until doors fold flat and close flush',
      '5. Install aligners',
    ]),
    stop_conditions: [
      'Fixed-position pivots — replace with adjustable',
      'Pivots not plumb — doors will bind',
    ],
    linked_recommendations: ['FC-07-S1-R001'],
  },
  {
    id: 'HI-SOP-FC-008',
    title: 'Shelving & Closet Systems',
    guide_source: 'FC-08',
    critical_standards: [
      { standard: 'Mount into studs or toggle bolts. Never plastic anchors for loaded shelves.', source: 'FC-08' },
    ],
    quick_steps: parseSteps([
      '1. Plan layout: long-hang 66", double-hang 66"/42", shelves 12" above rod',
      '2. Mark stud locations',
      '3. Mount cleats into studs (toggle bolts where needed)',
      '4. Install shelving, verify level',
      '5. Install rod, center support if span >48"',
      '6. Load test',
    ]),
    stop_conditions: [
      'Plastic drywall anchors on loaded shelves — replace with toggles or find studs',
    ],
    linked_recommendations: ['FC-08-S2-R001'],
  },

  // --- FLOORING ---
  {
    id: 'HI-SOP-FL-001',
    title: 'Subfloor Prep',
    guide_source: 'FL-01',
    critical_standards: [
      { standard: 'Flatness: 3/16" max per 10\' (flooring), 1/8" per 10\' (tile)', source: 'FL-01, TL-01' },
      { standard: 'Moisture: <12% MC wood-to-wood, <3 lbs/1000sf/24hr calcium chloride on concrete', source: 'FL-01, L-2026-003' },
      { standard: 'Plywood for below-grade subfloors — never OSB below grade', source: 'L-2026-012' },
      { standard: 'Acclimate product 5-7 days before installation (hardwood)', source: 'L-2026-008' },
    ],
    quick_steps: parseSteps([
      '1. Check flatness with 10\' straightedge — mark high/low spots',
      '2. Moisture test: pin meter on wood, calcium chloride on concrete',
      '3. Grind high spots, fill low spots with floor-leveling compound',
      '4. Verify subfloor material matches location (plywood below grade)',
      '5. Clean — no debris, adhesive residue, or dust',
      '6. Document with photos before flooring goes down',
    ]),
    stop_conditions: [
      'MC above limits — do not install until resolved',
      'Active water source — fix before proceeding',
      'OSB below grade — must replace with plywood',
      'Flatness beyond spec — level before proceeding',
    ],
    linked_recommendations: ['FL-01-S2-R001', 'FL-01-S3-R001', 'FL-01-S4-R001'],
  },
  {
    id: 'HI-SOP-FL-002',
    title: 'Hardwood Flooring',
    guide_source: 'FL-02',
    critical_standards: [
      { standard: 'Acclimate 5-7 days, within 2% MC of subfloor', source: 'L-2026-008' },
      { standard: 'Subfloor verified per FL-01/HI-SOP-FL-001', source: 'FL-01' },
    ],
    quick_steps: parseSteps([
      '1. Verify subfloor per HI-SOP-FL-001',
      '2. Confirm acclimation: 5-7 days, MC within 2% of subfloor',
      '3. Snap chalk line 3/8" from starting wall',
      '4. Face-nail first 2-3 rows, then blind-nail at 45° through tongue',
      '5. Rack boards from multiple bundles for color/grain mix',
      '6. Stagger end joints 6" minimum',
      '7. Leave 3/8" expansion gap at all walls',
      '8. Rip last row, face-nail, cover with baseboard',
    ]),
    stop_conditions: [
      'MC delta >2% between wood and subfloor',
      'Subfloor not flat to spec',
      'Product not acclimated minimum 5 days',
    ],
    linked_recommendations: ['FL-02-S1-R001'],
  },
  {
    id: 'HI-SOP-FL-003',
    title: 'Engineered Flooring',
    guide_source: 'FL-03',
    critical_standards: [
      { standard: 'Engineered has 6x better dimensional stability than solid — preferred for basements', source: 'L-2026-014' },
      { standard: 'Glue-down: Bostik GreenForce year-round', source: 'L-2026-019' },
    ],
    quick_steps: parseSteps([
      '1. Verify subfloor per HI-SOP-FL-001',
      '2. Select method: float (fastest), glue-down (best performance), nail-down (over plywood)',
      '3. Acclimate per manufacturer (typically 48-72 hours)',
      '4. Glue-down: spread Bostik GreenForce with recommended trowel',
      '5. Float: install underlayment, click-lock or glue-tongue',
      '6. Stagger joints 6" min, expansion gaps at walls',
      '7. Install transitions at doorways',
    ]),
    stop_conditions: [
      'Below-grade without vapor barrier',
      'Concrete MC exceeds limits',
    ],
    linked_recommendations: ['FL-03-S1-R001', 'FL-03-S2-R001'],
  },
  {
    id: 'HI-SOP-FL-004',
    title: 'LVP/LVT Installation',
    guide_source: 'FL-04',
    critical_standards: [
      { standard: 'Glue-down adhesive: Bostik GreenForce year-round', source: 'L-2026-019' },
      { standard: '1/4" expansion gap at all walls and fixed objects', source: 'FL-04' },
    ],
    quick_steps: parseSteps([
      '1. Verify subfloor per HI-SOP-FL-001',
      '2. Acclimate product 48 hours',
      '3. Plan layout — balance cuts, no slivers under 2"',
      '4. Click-lock: angle, fold, tap. Glue-down: GreenForce with trowel',
      '5. Stagger end joints 6" min',
      '6. 1/4" expansion gap everywhere',
      '7. Clean adhesive residue before cure',
      '8. Install transitions',
    ]),
    stop_conditions: [
      'Subfloor not flat to 3/16" per 10\'',
      'Click joints not fully engaging',
    ],
    linked_recommendations: ['FL-04-S4-R001'],
  },
  {
    id: 'HI-SOP-FL-005',
    title: 'Carpet Installation',
    guide_source: 'FL-05',
    critical_standards: [
      { standard: 'POWER STRETCHER mandatory — knee kicker only causes ripples within 18 months', source: 'FL-05' },
    ],
    quick_steps: parseSteps([
      '1. Install tackstrip 1/2" from walls',
      '2. Install pad, tape seams, staple every 6"',
      '3. Roll out carpet with 3" excess',
      '4. Seam with seaming iron if needed',
      '5. POWER STRETCH in both directions',
      '6. Trim and tuck with wall trimmer and stair tool',
      '7. Install transitions',
    ]),
    stop_conditions: [
      'Power stretcher not available — do not proceed with knee kicker only',
      'Seam placement in high-traffic path',
    ],
    linked_recommendations: ['FL-05-S3-R001'],
  },
  {
    id: 'HI-SOP-FL-006',
    title: 'Sheet Vinyl',
    guide_source: 'FL-06',
    critical_standards: [
      { standard: 'Substrate must be skim-coated smooth — every imperfection telegraphs', source: 'FL-06' },
    ],
    quick_steps: parseSteps([
      '1. Skim-coat substrate — fill every screw, seam, grain mark',
      '2. Template complex rooms with kraft paper',
      '3. Cut vinyl with 3" excess, dry-fit',
      '4. Fold back, spread adhesive, lay in',
      '5. Roll with 100 lb floor roller',
      '6. Double-cut seams, seal',
      '7. Trim at walls, install base',
    ]),
    stop_conditions: [
      'Substrate imperfections visible — skim coat again before proceeding',
    ],
    linked_recommendations: ['FL-06-S1-R001'],
  },
  {
    id: 'HI-SOP-FL-007',
    title: 'Flooring Transitions',
    guide_source: 'FL-07',
    critical_standards: [
      { standard: 'Center transition under closed door', source: 'FL-07' },
      { standard: 'Never screw through floating flooring', source: 'FL-07' },
    ],
    quick_steps: parseSteps([
      '1. Measure height difference between floors',
      '2. Select: T-molding (same height), reducer (different), end cap, stair nose',
      '3. Install track to subfloor centered under door',
      '4. Cut transition to doorway width',
      '5. Snap into track',
      '6. Verify: flat, secure, no trip hazard',
    ]),
    stop_conditions: [
      'Height difference >1/2" without custom solution plan',
    ],
    linked_recommendations: ['FL-07-S1-R001'],
  },

  // --- PAINT ---
  {
    id: 'HI-SOP-PT-001',
    title: 'Paint Prep & Prime',
    guide_source: 'PT-01',
    critical_standards: [
      { standard: 'Full prep (TSP + scuff + prime) = 0% adhesion failure. No-prep = 35% failure.', source: 'L-2026-025' },
      { standard: 'Never skip prep on previously painted surfaces', source: 'L-2026-025' },
    ],
    quick_steps: parseSteps([
      '1. Clean surface with TSP solution — remove grease, grime, smoke film',
      '2. Scuff-sand glossy surfaces with 150-grit',
      '3. Fill holes and cracks with spackle, sand smooth',
      '4. Caulk gaps (trim-to-wall, corner joints)',
      '5. Prime: new drywall, stain-prone areas, repaired spots, color changes',
      '6. Verify: surface clean, scuffed, primed, smooth before topcoat',
    ]),
    stop_conditions: [
      'Previously painted surface with gloss — must scuff before topcoat',
      'Visible stains — prime with stain blocker before topcoat',
    ],
    linked_recommendations: ['PT-01-S2-R001'],
  },
  {
    id: 'HI-SOP-PT-002',
    title: 'Cut & Roll',
    guide_source: 'PT-02',
    critical_standards: [
      { standard: '3/8" microfiber roller for smooth drywall — best finish, least stipple', source: 'L-2026-027' },
    ],
    quick_steps: parseSteps([
      '1. Cut in edges first: ceiling line, corners, trim, outlets',
      '2. Load roller evenly — roll in tray until consistent coverage',
      '3. Roll in W pattern, then even out with straight passes',
      '4. Maintain wet edge — don\'t let cut line dry before rolling',
      '5. Two coats minimum, full dry between coats',
      '6. 3/8" microfiber nap for smooth walls, 1/2" for light texture',
      '7. Inspect with raking light between coats',
    ]),
    stop_conditions: [
      'Roller leaving heavy stipple — check nap size and loading technique',
      'Flashing at cut lines — maintain wet edge or back-roll sooner',
    ],
    linked_recommendations: ['PT-02-S3-R001'],
  },
  {
    id: 'HI-SOP-PT-003',
    title: 'Stain Sealing',
    guide_source: 'PT-03',
    critical_standards: [
      { standard: 'Zinsser BIN (shellac-based) = 100% seal rate, one coat, all stain types', source: 'L-2026-029' },
    ],
    quick_steps: parseSteps([
      '1. Identify stain type (water, smoke, tannin, marker, unknown)',
      '2. Apply Zinsser BIN shellac primer over stain — one coat',
      '3. Extend 2" beyond visible stain edges',
      '4. Allow 45 min dry time',
      '5. Verify: stain fully sealed (no bleed visible)',
      '6. If bleed shows: apply second coat of BIN',
      '7. Topcoat over sealed area once fully dry',
    ]),
    stop_conditions: [
      'Active water leak — fix source before sealing stain',
      'Mold present — remediate before sealing (sealing over mold is not remediation)',
    ],
    linked_recommendations: ['PT-03-S2-R001'],
  },

  // --- SAFETY ---
  {
    id: 'HI-SOP-SAFETY-001',
    title: 'Site Safety & PPE',
    guide_source: 'OH-01',
    critical_standards: [
      { standard: 'PPE minimum: safety glasses, CSA boots, hearing protection, N95 for dust', source: 'OH-01' },
      { standard: 'Customer home: shoe covers, drop cloths, dust containment, daily cleanup', source: 'OH-01' },
    ],
    quick_steps: parseSteps([
      '1. PPE check before starting',
      '2. Shoe covers on at customer\'s door',
      '3. Customer walkthrough — confirm scope',
      '4. Drop cloths on all surfaces within 10\'',
      '5. Dust containment for sanding/cutting',
      '6. Locate: panel, water shutoff, exits, extinguisher',
      '7. Clean daily — leave site better than you found it',
    ]),
    stop_conditions: [
      'Missing PPE — do not start work',
      'Suspected asbestos (pre-1990) or lead (pre-1978) — STOP, do not disturb, get testing',
    ],
    linked_recommendations: ['OH-01-S1-R001', 'OH-01-S2-R001'],
  },
];

// ============================================================================
// Lookup helpers
// ============================================================================

/** Get SOP by its ID */
export function getSOPById(sopId: string): SOP | undefined {
  return SOPS.find((s) => s.id === sopId);
}

/** Get all SOPs for a trade code (matches guide_source prefix) */
export function getSOPsByTrade(tradePrefix: string): SOP[] {
  const prefix = tradePrefix.toUpperCase();
  if (prefix === 'OH') return SOPS.filter((s) => s.guide_source.startsWith('OH'));
  return SOPS.filter((s) => s.guide_source.startsWith(prefix));
}

/**
 * Task-to-SOP mapping.
 * Maps task title (lowercase) + trade code → SOP ID.
 * Used during project creation to link tasks to their SOPs.
 */
export const TASK_SOP_MAP: Record<string, string> = {
  // Flooring
  'lvp installation:FL': 'HI-SOP-FL-004',
  'floor prep and leveling:FL': 'HI-SOP-FL-001',
  'remove existing flooring:FL': 'HI-SOP-FL-007',
  'transitions:FL': 'HI-SOP-FL-007',

  // Finish Carpentry
  'baseboard installation:FC': 'HI-SOP-FC-003',
  'remove existing baseboard:FC': 'HI-SOP-FC-003',
  'casing installation:FC': 'HI-SOP-FC-001',
  'shoe molding:FC': 'HI-SOP-FC-003',
  'crown molding:FC': 'HI-SOP-FC-004',
  'remove existing trim:FC': 'HI-SOP-FC-001',

  // Paint
  'priming:PT': 'HI-SOP-PT-001',
  'wall painting:PT': 'HI-SOP-PT-002',
  'ceiling painting:PT': 'HI-SOP-PT-002',
  'trim painting:PT': 'HI-SOP-PT-002',

  // Drywall
  'wall patching:DW': 'HI-SOP-DW-003',
  'drywall repair:DW': 'HI-SOP-DW-003',

  // Tile
  'tile work:TL': 'HI-SOP-FL-001', // Uses subfloor prep as starting point

  // Overhead — no SOP (walkthrough, cleanup, touch-ups)
};

/** Trade name → trade code reverse map */
const TRADE_NAME_TO_CODE: Record<string, string> = {
  'flooring': 'FL',
  'paint': 'PT',
  'finish carpentry': 'FC',
  'tile': 'TL',
  'drywall': 'DW',
  'overhead': 'OH',
};

/** Look up the SOP ID for a task based on title and trade code */
export function getSOPForTask(taskTitle: string, tradeCode: string): string | undefined {
  const key = `${taskTitle.toLowerCase()}:${tradeCode.toUpperCase()}`;
  return TASK_SOP_MAP[key];
}

/** Look up the SOP ID for a task using the trade NAME (e.g. "Flooring" instead of "FL") */
export function getSOPForTaskByTradeName(taskTitle: string, tradeName: string): string | undefined {
  const code = TRADE_NAME_TO_CODE[tradeName.toLowerCase()];
  if (!code) return undefined;
  return getSOPForTask(taskTitle, code);
}
