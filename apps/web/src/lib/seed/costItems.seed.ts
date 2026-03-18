/**
 * Cost Items Seed — 108 items (GEN-001–025, FLR-001–037, PNT-001–015,
 * TRM-001–020, ACC-001–011).
 *
 * Source of truth: hooomz_catalogue.jsx COST_DATA array.
 * All prices in CAD. All division = 'interiors'.
 *
 * G/B/B column model: one row covers all three tiers.
 * At estimation time, the active tier selects lG/lB/lBB or mG/mB/mBB.
 */

import type { CostItem } from '../types/catalogue.types';

const NOW = new Date().toISOString();

const BASE: Pick<CostItem, 'division' | 'createdAt' | 'updatedAt'> = {
  division: 'interiors',
  createdAt: NOW,
  updatedAt: NOW,
};

export const COST_ITEMS_SEED: CostItem[] = [
  // ── General ──────────────────────────────────────────────────────────────────
  { ...BASE, id:'GEN-001', cat:'General', section:'Site Preparation',  phase:'S', name:'Initial Site Walk & Assessment',           unit:'per visit',  lG:85,  lB:85,  lBB:85,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-002', cat:'General', section:'Site Preparation',  phase:'S', name:'Protection / Drop Cloths Setup',           unit:'per room',   lG:40,  lB:40,  lBB:40,  mG:18,   mB:18,   mBB:18   },
  { ...BASE, id:'GEN-003', cat:'General', section:'Site Preparation',  phase:'S', name:'Furniture Move (in-room only)',             unit:'per room',   lG:50,  lB:50,  lBB:50,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-004', cat:'General', section:'Site Preparation',  phase:'S', name:'Furniture Move (off-site coordination)',   unit:'per hour',   lG:65,  lB:65,  lBB:65,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-005', cat:'General', section:'Site Preparation',  phase:'S', name:'Floor Protection – Paper & Tape',          unit:'per room',   lG:25,  lB:25,  lBB:25,  mG:12,   mB:12,   mBB:12   },
  { ...BASE, id:'GEN-006', cat:'General', section:'Site Preparation',  phase:'S', name:'Masking / Taping',                         unit:'per hour',   lG:55,  lB:55,  lBB:55,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-007', cat:'General', section:'Site Preparation',  phase:'S', name:'Hardware Removal & Reinstall',             unit:'per door',   lG:22,  lB:22,  lBB:22,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-008', cat:'General', section:'Site Preparation',  phase:'S', name:'Outlet / Switch Cover Remove & Reinstall', unit:'each',       lG:6,   lB:6,   lBB:6,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-009', cat:'General', section:'Cleanup & Waste',   phase:'T', name:'Daily Clean-Up',                           unit:'per day',    lG:65,  lB:65,  lBB:65,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-010', cat:'General', section:'Cleanup & Waste',   phase:'T', name:'Final Clean-Up',                           unit:'per room',   lG:85,  lB:85,  lBB:85,  mG:12,   mB:12,   mBB:12   },
  { ...BASE, id:'GEN-011', cat:'General', section:'Cleanup & Waste',   phase:'T', name:'Debris Removal / Haul-Away',               unit:'per load',   lG:110, lB:110, lBB:110, mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-012', cat:'General', section:'Cleanup & Waste',   phase:'T', name:'Dumpster Rental Coordination',             unit:'per week',   lG:45,  lB:45,  lBB:45,  mG:425,  mB:425,  mBB:425  },
  { ...BASE, id:'GEN-013', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Drywall Patch – Small (under 4 in)',       unit:'each',       lG:50,  lB:50,  lBB:50,  mG:7,    mB:7,    mBB:7    },
  { ...BASE, id:'GEN-014', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Drywall Patch – Medium (4–12 in)',         unit:'each',       lG:90,  lB:90,  lBB:90,  mG:18,   mB:18,   mBB:18   },
  { ...BASE, id:'GEN-015', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Drywall Patch – Large (over 12 in)',       unit:'sq ft',      lG:14,  lB:14,  lBB:14,  mG:5,    mB:5,    mBB:5    },
  { ...BASE, id:'GEN-016', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Drywall Replace – Full Sheet',             unit:'each',       lG:130, lB:130, lBB:130, mG:25,   mB:25,   mBB:25   },
  { ...BASE, id:'GEN-017', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Skim Coat / Plaster Repair',               unit:'sq ft',      lG:5,   lB:5,   lBB:5,   mG:1.5,  mB:1.5,  mBB:1.5  },
  { ...BASE, id:'GEN-018', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Texture Matching',                         unit:'sq ft',      lG:6,   lB:6,   lBB:6,   mG:1.5,  mB:1.5,  mBB:1.5  },
  { ...BASE, id:'GEN-019', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Caulking – General',                       unit:'linear ft',  lG:1.2, lB:1.2, lBB:1.2, mG:0.6,  mB:0.6,  mBB:0.6  },
  { ...BASE, id:'GEN-020', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Popcorn Ceiling Removal',                  unit:'sq ft',      lG:2,   lB:2,   lBB:2,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-021', cat:'General', section:'Repairs & Prep',    phase:'C', name:'Ceiling Crack Repair',                     unit:'linear ft',  lG:9,   lB:9,   lBB:9,   mG:3,    mB:3,    mBB:3    },
  { ...BASE, id:'GEN-022', cat:'General', section:'Travel & Admin',    phase:'S', name:'Travel Time',                              unit:'per hour',   lG:55,  lB:55,  lBB:55,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-023', cat:'General', section:'Travel & Admin',    phase:'S', name:'Project Management / Supervision',         unit:'per hour',   lG:80,  lB:80,  lBB:80,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-024', cat:'General', section:'Travel & Admin',    phase:'S', name:'Estimate / Quote Preparation',             unit:'per quote',  lG:75,  lB:75,  lBB:75,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'GEN-025', cat:'General', section:'Travel & Admin',    phase:'S', name:'Permit Acquisition Assistance',            unit:'per permit', lG:95,  lB:95,  lBB:95,  mG:0,    mB:0,    mBB:0    },

  // ── Flooring ─────────────────────────────────────────────────────────────────
  { ...BASE, id:'FLR-001', cat:'Flooring', section:'Subfloor Prep',       phase:'C', name:'Subfloor Inspection',                        unit:'per room',   lG:60,  lB:60,  lBB:60,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-002', cat:'Flooring', section:'Subfloor Prep',       phase:'C', name:'Subfloor Repair – Minor',                    unit:'sq ft',      lG:5,   lB:5,   lBB:5,   mG:2.5,  mB:2.5,  mBB:2.5  },
  { ...BASE, id:'FLR-003', cat:'Flooring', section:'Subfloor Prep',       phase:'C', name:'Subfloor Replace – Full Sheet',              unit:'each',       lG:125, lB:125, lBB:125, mG:48,   mB:48,   mBB:48   },
  { ...BASE, id:'FLR-004', cat:'Flooring', section:'Subfloor Prep',       phase:'C', name:'Self-Levelling Compound',                    unit:'sq ft',      lG:3,   lB:3,   lBB:3,   mG:1,    mB:1.5,  mBB:2    },
  { ...BASE, id:'FLR-005', cat:'Flooring', section:'Subfloor Prep',       phase:'C', name:'Moisture Barrier Installation',              unit:'sq ft',      lG:0.6, lB:0.6, lBB:0.6, mG:0.3,  mB:0.5,  mBB:0.8  },
  { ...BASE, id:'FLR-006', cat:'Flooring', section:'Subfloor Prep',       phase:'C', name:'Underlayment Installation',                  unit:'sq ft',      lG:0.6, lB:0.6, lBB:0.6, mG:0.4,  mB:0.7,  mBB:1    },
  { ...BASE, id:'FLR-007', cat:'Flooring', section:'Demo & Removal',      phase:'R', name:'Hardwood – Remove & Dispose',                unit:'sq ft',      lG:1,   lB:1,   lBB:1,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-008', cat:'Flooring', section:'Demo & Removal',      phase:'R', name:'Laminate – Remove & Dispose',                unit:'sq ft',      lG:0.8, lB:0.8, lBB:0.8, mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-009', cat:'Flooring', section:'Demo & Removal',      phase:'R', name:'LVP / LVT – Remove & Dispose',               unit:'sq ft',      lG:0.8, lB:0.8, lBB:0.8, mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-010', cat:'Flooring', section:'Demo & Removal',      phase:'R', name:'Carpet – Remove & Dispose',                  unit:'sq ft',      lG:0.5, lB:0.5, lBB:0.5, mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-011', cat:'Flooring', section:'Demo & Removal',      phase:'R', name:'Tile – Remove & Dispose',                    unit:'sq ft',      lG:3,   lB:3,   lBB:3,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-012', cat:'Flooring', section:'Hardwood',            phase:'I', name:'Hardwood – Floating Install (labour)',       unit:'sq ft',      lG:3,   lB:3,   lBB:3,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-013', cat:'Flooring', section:'Hardwood',            phase:'I', name:'Hardwood – Nail Down Install (labour)',      unit:'sq ft',      lG:4,   lB:4,   lBB:4,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-014', cat:'Flooring', section:'Hardwood',            phase:'I', name:'Hardwood – Glue Down Install (labour)',      unit:'sq ft',      lG:4,   lB:4,   lBB:4,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-015', cat:'Flooring', section:'Hardwood',            phase:'I', name:'Engineered Hardwood – Supply & Install',     unit:'sq ft',      lG:3,   lB:3,   lBB:3,   mG:4,    mB:7,    mBB:12   },
  { ...BASE, id:'FLR-016', cat:'Flooring', section:'Hardwood',            phase:'I', name:'Solid Hardwood – Supply & Install',          unit:'sq ft',      lG:4,   lB:4,   lBB:4,   mG:5,    mB:9,    mBB:16   },
  { ...BASE, id:'FLR-017', cat:'Flooring', section:'Hardwood',            phase:'P', name:'Hardwood – Screen & Recoat',                 unit:'sq ft',      lG:1.2, lB:1.2, lBB:1.2, mG:0.5,  mB:0.8,  mBB:1.5  },
  { ...BASE, id:'FLR-018', cat:'Flooring', section:'Hardwood',            phase:'P', name:'Hardwood – Sand, Stain & 3-Coat Finish',     unit:'sq ft',      lG:4,   lB:4,   lBB:4,   mG:1,    mB:1.5,  mBB:2.5  },
  { ...BASE, id:'FLR-019', cat:'Flooring', section:'Hardwood',            phase:'P', name:'Hardwood – Hand-Scraped / Wire-Brushed',     unit:'sq ft',      lG:5,   lB:5,   lBB:5,   mG:1.5,  mB:2,    mBB:3    },
  { ...BASE, id:'FLR-020', cat:'Flooring', section:'LVP & LVT',           phase:'I', name:'LVP – Supply & Install',                     unit:'sq ft',      lG:2.5, lB:2.5, lBB:2.5, mG:2,    mB:3.5,  mBB:5    },
  { ...BASE, id:'FLR-021', cat:'Flooring', section:'LVP & LVT',           phase:'I', name:'LVP – Install Only',                         unit:'sq ft',      lG:2.5, lB:2.5, lBB:2.5, mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'FLR-022', cat:'Flooring', section:'LVP & LVT',           phase:'I', name:'LVT Standard Format – Supply & Install',     unit:'sq ft',      lG:2.5, lB:2.5, lBB:2.5, mG:3,    mB:5,    mBB:8    },
  { ...BASE, id:'FLR-023', cat:'Flooring', section:'LVP & LVT',           phase:'I', name:'LVT Large Format (24in+) – Supply & Install',unit:'sq ft',      lG:3,   lB:3,   lBB:3,   mG:4,    mB:6,    mBB:10   },
  { ...BASE, id:'FLR-024', cat:'Flooring', section:'Laminate',            phase:'I', name:'Laminate – Supply & Install',                unit:'sq ft',      lG:2.5, lB:2.5, lBB:2.5, mG:2,    mB:4,    mBB:6    },
  { ...BASE, id:'FLR-025', cat:'Flooring', section:'Carpet',              phase:'I', name:'Carpet – Supply & Install',                  unit:'sq ft',      lG:1.8, lB:1.8, lBB:1.8, mG:2,    mB:4,    mBB:6    },
  { ...BASE, id:'FLR-026', cat:'Flooring', section:'Carpet',              phase:'I', name:'Carpet – Stretching / Re-tack',              unit:'per room',   lG:90,  lB:90,  lBB:90,  mG:8,    mB:8,    mBB:8    },
  { ...BASE, id:'FLR-027', cat:'Flooring', section:'Tile',                phase:'I', name:'Tile – Standard Install',                    unit:'sq ft',      lG:6,   lB:6,   lBB:6,   mG:3,    mB:6,    mBB:12   },
  { ...BASE, id:'FLR-028', cat:'Flooring', section:'Tile',                phase:'I', name:'Tile – Large Format (24in+)',                unit:'sq ft',      lG:9,   lB:9,   lBB:9,   mG:5,    mB:9,    mBB:18   },
  { ...BASE, id:'FLR-029', cat:'Flooring', section:'Tile',                phase:'I', name:'Tile – Mosaic Install',                      unit:'sq ft',      lG:12,  lB:12,  lBB:12,  mG:8,    mB:15,   mBB:30   },
  { ...BASE, id:'FLR-030', cat:'Flooring', section:'Tile',                phase:'P', name:'Tile – Grout & Seal',                        unit:'sq ft',      lG:2.5, lB:2.5, lBB:2.5, mG:0.5,  mB:0.8,  mBB:1.5  },
  { ...BASE, id:'FLR-031', cat:'Flooring', section:'Tile',                phase:'I', name:'Heated Floor Mat – Install',                 unit:'sq ft',      lG:5,   lB:5,   lBB:5,   mG:5,    mB:9,    mBB:14   },
  { ...BASE, id:'FLR-032', cat:'Flooring', section:'Transitions & Trim',  phase:'P', name:'Transition Strip – Install',                 unit:'each',       lG:22,  lB:22,  lBB:22,  mG:8,    mB:14,   mBB:22   },
  { ...BASE, id:'FLR-033', cat:'Flooring', section:'Transitions & Trim',  phase:'P', name:'Reducer Strip – Install',                    unit:'each',       lG:20,  lB:20,  lBB:20,  mG:7,    mB:12,   mBB:18   },
  { ...BASE, id:'FLR-034', cat:'Flooring', section:'Transitions & Trim',  phase:'P', name:'Stair Nosing – Install',                     unit:'per stair',  lG:25,  lB:25,  lBB:25,  mG:10,   mB:18,   mBB:28   },
  { ...BASE, id:'FLR-035', cat:'Flooring', section:'Stairs',              phase:'I', name:'Stair Tread – Laminate or Vinyl',            unit:'per tread',  lG:35,  lB:35,  lBB:35,  mG:15,   mB:28,   mBB:45   },
  { ...BASE, id:'FLR-036', cat:'Flooring', section:'Stairs',              phase:'I', name:'Stair Tread – Hardwood',                     unit:'per tread',  lG:55,  lB:55,  lBB:55,  mG:28,   mB:48,   mBB:80   },
  { ...BASE, id:'FLR-037', cat:'Flooring', section:'Stairs',              phase:'I', name:'Stair Riser – Painted MDF',                  unit:'per riser',  lG:30,  lB:30,  lBB:30,  mG:10,   mB:10,   mBB:10   },

  // ── Painting ──────────────────────────────────────────────────────────────────
  { ...BASE, id:'PNT-001', cat:'Painting', section:'Surface Prep',   phase:'C', name:'Drywall / Surface Sanding',               unit:'sq ft',      lG:0.4, lB:0.4, lBB:0.4, mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'PNT-002', cat:'Painting', section:'Surface Prep',   phase:'C', name:'Primer – Walls',                          unit:'sq ft',      lG:0.5, lB:0.5, lBB:0.5, mG:0.1,  mB:0.15, mBB:0.2  },
  { ...BASE, id:'PNT-003', cat:'Painting', section:'Surface Prep',   phase:'C', name:'Primer – Ceiling',                        unit:'sq ft',      lG:0.6, lB:0.6, lBB:0.6, mG:0.1,  mB:0.15, mBB:0.2  },
  { ...BASE, id:'PNT-004', cat:'Painting', section:'Surface Prep',   phase:'C', name:'Stain-Blocking Primer',                   unit:'sq ft',      lG:0.6, lB:0.6, lBB:0.6, mG:0.15, mB:0.2,  mBB:0.35 },
  { ...BASE, id:'PNT-005', cat:'Painting', section:'Walls',          phase:'I', name:'Wall Paint – 1 Coat',                     unit:'sq ft',      lG:0.6, lB:0.6, lBB:0.6, mG:0.1,  mB:0.18, mBB:0.3  },
  { ...BASE, id:'PNT-006', cat:'Painting', section:'Walls',          phase:'I', name:'Wall Paint – 2 Coats',                    unit:'sq ft',      lG:0.9, lB:0.9, lBB:0.9, mG:0.2,  mB:0.3,  mBB:0.5  },
  { ...BASE, id:'PNT-007', cat:'Painting', section:'Walls',          phase:'I', name:'Wall Paint – Full Room (walls only)',     unit:'per room',   lG:200, lB:200, lBB:200, mG:45,   mB:70,   mBB:100  },
  { ...BASE, id:'PNT-008', cat:'Painting', section:'Walls',          phase:'I', name:'Wall Paint – Full Room (walls + ceiling)',unit:'per room',   lG:265, lB:265, lBB:265, mG:60,   mB:95,   mBB:135  },
  { ...BASE, id:'PNT-009', cat:'Painting', section:'Ceilings',       phase:'I', name:'Ceiling Paint – 2 Coats',                 unit:'sq ft',      lG:1.1, lB:1.1, lBB:1.1, mG:0.2,  mB:0.3,  mBB:0.5  },
  { ...BASE, id:'PNT-010', cat:'Painting', section:'Ceilings',       phase:'I', name:'Ceiling – Full Room',                     unit:'per room',   lG:130, lB:130, lBB:130, mG:35,   mB:55,   mBB:80   },
  { ...BASE, id:'PNT-011', cat:'Painting', section:'Ceilings',       phase:'I', name:'Vaulted / Cathedral Ceiling',             unit:'sq ft',      lG:1,   lB:1,   lBB:1,   mG:0.1,  mB:0.18, mBB:0.3  },
  { ...BASE, id:'PNT-012', cat:'Painting', section:'Exterior',       phase:'I', name:'Exterior Wall – Brush/Roll',              unit:'sq ft',      lG:0.8, lB:0.8, lBB:0.8, mG:0.2,  mB:0.35, mBB:0.5  },
  { ...BASE, id:'PNT-013', cat:'Painting', section:'Exterior',       phase:'I', name:'Exterior Spray Application',              unit:'sq ft',      lG:1.1, lB:1.1, lBB:1.1, mG:0.2,  mB:0.35, mBB:0.5  },
  { ...BASE, id:'PNT-014', cat:'Painting', section:'Specialty',      phase:'I', name:'Cabinet Paint – Per Door/Drawer Face',   unit:'each',       lG:20,  lB:20,  lBB:20,  mG:3,    mB:6,    mBB:10   },
  { ...BASE, id:'PNT-015', cat:'Painting', section:'Specialty',      phase:'I', name:'Cabinet Paint – Full Set',               unit:'per set',    lG:400, lB:400, lBB:400, mG:70,   mB:120,  mBB:200  },

  // ── Trim & Doors ──────────────────────────────────────────────────────────────
  { ...BASE, id:'TRM-001', cat:'Trim & Doors', section:'Baseboards',     phase:'R', name:'Baseboard – Remove Only',                unit:'linear ft',  lG:1.2, lB:1.2, lBB:1.2, mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'TRM-002', cat:'Trim & Doors', section:'Baseboards',     phase:'I', name:'Baseboard – Supply & Install',           unit:'linear ft',  lG:2.5, lB:2.5, lBB:2.5, mG:0.8,  mB:1.5,  mBB:2.8  },
  { ...BASE, id:'TRM-003', cat:'Trim & Doors', section:'Baseboards',     phase:'P', name:'Baseboard – Caulk & Paint',              unit:'linear ft',  lG:1,   lB:1,   lBB:1,   mG:0.2,  mB:0.3,  mBB:0.5  },
  { ...BASE, id:'TRM-004', cat:'Trim & Doors', section:'Door Casings',   phase:'R', name:'Door Casing – Remove',                   unit:'each',       lG:18,  lB:18,  lBB:18,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'TRM-005', cat:'Trim & Doors', section:'Door Casings',   phase:'I', name:'Door Casing – Supply & Install',         unit:'each',       lG:42,  lB:42,  lBB:42,  mG:22,   mB:40,   mBB:70   },
  { ...BASE, id:'TRM-006', cat:'Trim & Doors', section:'Door Casings',   phase:'P', name:'Door Casing – Caulk & Paint',            unit:'each',       lG:25,  lB:25,  lBB:25,  mG:6,    mB:10,   mBB:16   },
  { ...BASE, id:'TRM-007', cat:'Trim & Doors', section:'Crown Moulding', phase:'I', name:'Crown Moulding – Supply & Install',      unit:'linear ft',  lG:5,   lB:5,   lBB:7,   mG:1.5,  mB:2.5,  mBB:5    },
  { ...BASE, id:'TRM-008', cat:'Trim & Doors', section:'Crown Moulding', phase:'I', name:'Crown Moulding – Install (complex)',     unit:'linear ft',  lG:7,   lB:7,   lBB:7,   mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'TRM-009', cat:'Trim & Doors', section:'Crown Moulding', phase:'P', name:'Crown Moulding – Caulk & Paint',         unit:'linear ft',  lG:1.2, lB:1.2, lBB:1.2, mG:0.3,  mB:0.4,  mBB:0.7  },
  { ...BASE, id:'TRM-010', cat:'Trim & Doors', section:'Interior Doors', phase:'R', name:'Door – Remove & Dispose',                unit:'each',       lG:35,  lB:35,  lBB:35,  mG:0,    mB:0,    mBB:0    },
  { ...BASE, id:'TRM-011', cat:'Trim & Doors', section:'Interior Doors', phase:'I', name:'Door – Prehung Hollow Core',             unit:'each',       lG:130, lB:130, lBB:130, mG:85,   mB:140,  mBB:220  },
  { ...BASE, id:'TRM-012', cat:'Trim & Doors', section:'Interior Doors', phase:'I', name:'Door – Prehung Solid Core',              unit:'each',       lG:155, lB:155, lBB:155, mG:130,  mB:220,  mBB:400  },
  { ...BASE, id:'TRM-013', cat:'Trim & Doors', section:'Interior Doors', phase:'I', name:'Door – Pocket Door Install',             unit:'each',       lG:220, lB:220, lBB:220, mG:160,  mB:270,  mBB:450  },
  { ...BASE, id:'TRM-014', cat:'Trim & Doors', section:'Interior Doors', phase:'I', name:'Door – Barn Door Install',               unit:'each',       lG:175, lB:175, lBB:175, mG:190,  mB:340,  mBB:600  },
  { ...BASE, id:'TRM-015', cat:'Trim & Doors', section:'Interior Doors', phase:'I', name:'Door – Bi-fold Install',                 unit:'each',       lG:80,  lB:80,  lBB:80,  mG:65,   mB:110,  mBB:190  },
  { ...BASE, id:'TRM-016', cat:'Trim & Doors', section:'Door Hardware',  phase:'P', name:'Door Knob / Lever – Supply & Install',   unit:'each',       lG:22,  lB:22,  lBB:22,  mG:32,   mB:70,   mBB:165  },
  { ...BASE, id:'TRM-017', cat:'Trim & Doors', section:'Door Hardware',  phase:'P', name:'Deadbolt – Supply & Install',            unit:'each',       lG:28,  lB:28,  lBB:28,  mG:45,   mB:90,   mBB:200  },
  { ...BASE, id:'TRM-018', cat:'Trim & Doors', section:'Exterior Doors', phase:'I', name:'Ext. Door – Prehung Steel',              unit:'each',       lG:240, lB:240, lBB:240, mG:270,  mB:480,  mBB:980  },
  { ...BASE, id:'TRM-019', cat:'Trim & Doors', section:'Exterior Doors', phase:'I', name:'Ext. Door – Prehung Fibreglass',         unit:'each',       lG:280, lB:280, lBB:280, mG:375,  mB:750,  mBB:1600 },
  { ...BASE, id:'TRM-020', cat:'Trim & Doors', section:'Exterior Doors', phase:'I', name:'Ext. Door – Prehung Wood',               unit:'each',       lG:300, lB:300, lBB:300, mG:425,  mB:850,  mBB:2400 },

  // ── Accent Walls ──────────────────────────────────────────────────────────────
  { ...BASE, id:'ACC-001', cat:'Accent Walls', section:'Painted',    phase:'I', name:'Single Colour Accent Wall – 2 Coats',    unit:'per wall',   lG:110, lB:110, lBB:110, mG:28,   mB:45,   mBB:70   },
  { ...BASE, id:'ACC-002', cat:'Accent Walls', section:'Painted',    phase:'I', name:'Two-Tone / Colour Block Wall',           unit:'per wall',   lG:145, lB:145, lBB:145, mG:35,   mB:55,   mBB:85   },
  { ...BASE, id:'ACC-003', cat:'Accent Walls', section:'Painted',    phase:'I', name:'Stencil Pattern Wall',                   unit:'per wall',   lG:170, lB:170, lBB:170, mG:25,   mB:40,   mBB:70   },
  { ...BASE, id:'ACC-004', cat:'Accent Walls', section:'Wallpaper',  phase:'I', name:'Wallpaper – Hang Standard',              unit:'sq ft',      lG:1.8, lB:1.8, lBB:1.8, mG:0.6,  mB:1,    mBB:1.8  },
  { ...BASE, id:'ACC-005', cat:'Accent Walls', section:'Wallpaper',  phase:'I', name:'Wallpaper – Hang Grasscloth / Specialty',unit:'sq ft',      lG:4,   lB:4,   lBB:4,   mG:2,    mB:4,    mBB:8    },
  { ...BASE, id:'ACC-006', cat:'Accent Walls', section:'Wood & Slat',phase:'I', name:'Shiplap Accent Wall – Install & Paint', unit:'sq ft',      lG:3.5, lB:3.5, lBB:3.5, mG:1.8,  mB:3,    mBB:5    },
  { ...BASE, id:'ACC-007', cat:'Accent Walls', section:'Wood & Slat',phase:'I', name:'Wood Slat / Rib Panel – Install',       unit:'sq ft',      lG:3.5, lB:3.5, lBB:3.5, mG:4,    mB:7,    mBB:14   },
  { ...BASE, id:'ACC-008', cat:'Accent Walls', section:'Tile & Stone',phase:'I', name:'Subway Tile Accent Wall',               unit:'sq ft',      lG:7,   lB:7,   lBB:7,   mG:3,    mB:6,    mBB:12   },
  { ...BASE, id:'ACC-009', cat:'Accent Walls', section:'Tile & Stone',phase:'I', name:'Stone Veneer Wall',                     unit:'sq ft',      lG:12,  lB:12,  lBB:12,  mG:6,    mB:12,   mBB:26   },
  { ...BASE, id:'ACC-010', cat:'Accent Walls', section:'Specialty',  phase:'I', name:'Venetian Plaster – 2 Coat',              unit:'sq ft',      lG:4.5, lB:4.5, lBB:4.5, mG:1.5,  mB:2.5,  mBB:5    },
  { ...BASE, id:'ACC-011', cat:'Accent Walls', section:'Specialty',  phase:'I', name:'Venetian Plaster – 3 Coat Polished',     unit:'sq ft',      lG:8,   lB:8,   lBB:8,   mG:2,    mB:4,    mBB:8    },
];
