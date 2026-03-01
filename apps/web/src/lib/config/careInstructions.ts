/**
 * Care Instructions Config — static maintenance guidance per trade.
 *
 * Each trade has care instructions, things to avoid, and warranty notes.
 * Used by the Home Care Sheet to merge with project-specific data.
 */

import { WorkCategory, WORK_CATEGORY_META } from '@hooomz/shared-contracts';

export interface TradeCareConfig {
  tradeName: string;
  careInstructions: string[];
  thingsToAvoid: string[];
  warrantyNotes: string;
}

const CARE_CONFIG: Partial<Record<WorkCategory, TradeCareConfig>> = {
  [WorkCategory.FL]: {
    tradeName: 'Flooring',
    careInstructions: [
      'Sweep or vacuum regularly to prevent grit buildup that scratches the finish',
      'Damp-mop with a manufacturer-approved cleaner — never soak the floor',
      'Use felt pads under all furniture legs and replace them every 6 months',
      'Place mats at exterior doorways to catch moisture and debris',
      'Maintain indoor humidity between 35–55% to prevent expansion or cupping',
      'Wipe up spills immediately to avoid moisture damage',
    ],
    thingsToAvoid: [
      'Steam mops — heat and moisture can delaminate LVP and engineered wood',
      'Vinegar, ammonia, or abrasive cleaners',
      'Dragging furniture or appliances across the floor',
      'Rubber-backed mats (can discolour LVP)',
      'Excessive water — never wet-mop hardwood or laminate',
    ],
    warrantyNotes: 'Labour warranty covers installation defects for 1 year. Product warranties vary by manufacturer — refer to your flooring product documentation.',
  },

  [WorkCategory.PT]: {
    tradeName: 'Paint',
    careInstructions: [
      'Allow new paint to cure for 30 days before washing or scrubbing',
      'Clean marks with a damp cloth and mild soap — blot, don\'t scrub',
      'Touch up small nicks with leftover paint (keep cans sealed and stored at room temperature)',
      'Wipe kitchen and bathroom walls quarterly to prevent grease and moisture buildup',
    ],
    thingsToAvoid: [
      'Abrasive sponges or magic erasers on flat/matte finishes — they burnish the surface',
      'Hanging items for 30 days after painting to allow full cure',
      'Harsh chemical cleaners (bleach, TSP) on painted surfaces',
      'Direct heat sources near painted walls (space heaters, radiators)',
    ],
    warrantyNotes: 'Labour warranty covers peeling, blistering, or poor adhesion due to prep defects for 1 year. Normal wear, nail holes, and colour fading are not covered.',
  },

  [WorkCategory.FC]: {
    tradeName: 'Finish Carpentry',
    careInstructions: [
      'Dust trim and moldings regularly with a soft cloth or microfiber duster',
      'Clean with a lightly damp cloth — avoid excessive moisture on wood trim',
      'Inspect caulk joints at season changes — re-caulk if gaps appear due to settling',
      'Touch up paint or stain on nicked trim using the original product',
    ],
    thingsToAvoid: [
      'Hanging heavy items from trim or crown molding',
      'Excessive moisture near baseboards (mop water pooling)',
      'Removing shoe molding to clean underneath — it may not re-seat cleanly',
    ],
    warrantyNotes: 'Labour warranty covers joint separation, loose fasteners, and finish defects for 1 year. Normal wood movement due to seasonal humidity changes is not covered.',
  },

  [WorkCategory.DW]: {
    tradeName: 'Drywall',
    careInstructions: [
      'Allow patches to fully cure before painting (typically 24–48 hours)',
      'Use proper anchors for wall-mounted items — never drive screws without an anchor in drywall',
      'Report any new cracks to Hooomz within 90 days — minor settling cracks are normal',
    ],
    thingsToAvoid: [
      'Hanging extremely heavy items without proper blocking or anchoring',
      'Exposing patched areas to moisture before they are primed and painted',
      'Poking or pressing repaired areas while compound is still curing',
    ],
    warrantyNotes: 'Labour warranty covers tape joints, visible seams, and patch failures for 1 year. Settling cracks from normal house movement are repaired once at no charge within 90 days.',
  },

  [WorkCategory.TL]: {
    tradeName: 'Tile',
    careInstructions: [
      'Clean tile with a pH-neutral cleaner — avoid acidic products on natural stone',
      'Re-seal grout annually in wet areas (showers, backsplashes near sinks)',
      'Wipe down shower tile after each use to minimize soap scum and mildew',
      'Inspect caulk at tile-to-tub and tile-to-counter joints — re-caulk if cracked or discoloured',
    ],
    thingsToAvoid: [
      'Abrasive scrubbers on glazed tile — they scratch the finish',
      'Bleach-based cleaners on coloured grout — they cause fading',
      'Dropping heavy objects on tile floors — ceramic and porcelain will crack',
      'Standing water on grout joints — it leads to staining and mildew',
    ],
    warrantyNotes: 'Labour warranty covers cracked or loose tiles, grout failure, and waterproofing defects for 1 year. Caulk maintenance is the homeowner\'s responsibility after 90 days.',
  },
};

/**
 * Get care config for a set of trade codes found on a project.
 * Returns sorted by WORK_CATEGORY_META order.
 */
export function getCareConfigForTrades(codes: WorkCategory[]): { code: WorkCategory; config: TradeCareConfig }[] {
  const unique = [...new Set(codes)];
  return unique
    .filter((code) => CARE_CONFIG[code] !== undefined)
    .sort((a, b) => (WORK_CATEGORY_META[a]?.order ?? 99) - (WORK_CATEGORY_META[b]?.order ?? 99))
    .map((code) => ({ code, config: CARE_CONFIG[code]! }));
}
