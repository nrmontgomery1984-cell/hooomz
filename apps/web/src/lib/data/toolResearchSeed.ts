/**
 * Tool Research Seed Data
 * Populates IndexedDB with platform comparisons, research items, and inventory
 * All data extracted verbatim from hooomz_labs_tool_research (1).html
 */

import type { Services } from '../services';
import type { ToolResearchCategory } from '@hooomz/shared-contracts';

export interface ToolResearchSeedResult {
  platforms: number;
  researchItems: number;
  inventoryItems: number;
}

// ============================================================================
// PLATFORMS — 6 cordless platform comparisons
// ============================================================================

const PLATFORMS = [
  {
    name: 'Mastercraft 20V',
    tier: 'Budget',
    retailers: ['Canadian Tire'],
    retailerCount: 1,
    platformSize: '~30 tools',
    entryPrice: '$130–170',
    entryNum: 130,
    batteryOptions: '2.0/4.0/5.0Ah PWR POD',
    motorType: 'Mostly brushed',
    warranty: '3-year exchange',
    upgradePath: 'None — no pro tier',
    keyKit: '3-tool combo ~$170',
    pros: 'Cheapest entry. PWR POD cross-compatible with yard/auto tools. Frequent 40-60% CT sales.',
    cons: 'Single retailer. Brushed motors. No pro ceiling. No trade reputation.',
    labsAngle: "Budget baseline test subject. 'How far can the cheapest platform go?'",
    score: { breadth: 1, availability: 1, battery: 4, upgrade: 1, price: 5 },
  },
  {
    name: 'Ryobi ONE+ 18V',
    tier: 'Budget',
    retailers: ['Home Depot'],
    retailerCount: 1,
    platformSize: '280+ tools',
    entryPrice: '$350–550',
    entryNum: 350,
    batteryOptions: '1.5–9.0Ah + HP line',
    motorType: 'Brushed + HP Brushless',
    warranty: '3-year manufacturer',
    upgradePath: 'Limited — HP Brushless is ceiling',
    keyKit: '9-tool w/ brad nailer ~$550',
    pros: "World's largest 18V system. 9-tool kit includes brad nailer. Combo kit value unmatched.",
    cons: "HD only. No contractor credibility. Low resale. Perception issue for Hooomz brand.",
    labsAngle: '9-tool kit = 9 test subjects day one. Most content per dollar spent.',
    score: { breadth: 5, availability: 1, battery: 3, upgrade: 2, price: 3 },
  },
  {
    name: 'DeWalt 20V MAX',
    tier: 'Pro-Accessible',
    retailers: ['Home Depot', 'Home Hardware', 'Kent', 'Rona', 'Canadian Tire'],
    retailerCount: 5,
    platformSize: '200+ tools',
    entryPrice: '$200–350',
    entryNum: 200,
    batteryOptions: '1.5–5.0Ah + FLEXVOLT 60V',
    motorType: 'Brushed → ATOMIC → XR Brushless',
    warranty: '3yr tool, 1yr service, 90-day satisfaction',
    upgradePath: 'Brushed → ATOMIC → XR → FLEXVOLT 60V',
    keyKit: 'ATOMIC 2-tool ~$349; XR 6-tool ~$900',
    pros: 'Wide retail availability. FLEXVOLT 60V extends to heavy tools on same battery.',
    cons: "Build quality inconsistent across tiers — base brushed tools feel cheap. ATOMIC line is compact but underpowered vs competitors at same price. Yellow tax — brand premium without matching quality jump. Ergonomics lag behind Makita.",
    labsAngle: 'Availability comparison content for rural NB contractors.',
    score: { breadth: 4, availability: 5, battery: 3, upgrade: 4, price: 3 },
  },
  {
    name: 'Makita 18V LXT',
    tier: 'Pro-Accessible',
    retailers: ['Home Depot', 'Home Hardware', 'Kent'],
    retailerCount: 3,
    platformSize: '325+ tools',
    entryPrice: '$200–580',
    entryNum: 200,
    batteryOptions: '1.5–6.0Ah + 18Vx2=36V',
    motorType: 'Brushed + Brushless XPT',
    warranty: '3-year limited',
    upgradePath: 'Strong: LXT → LXT Brushless → 40V XGT (adapter available). 18Vx2=36V trick avoids new batteries for heavy tools',
    keyKit: '4-tool combo ~$579; 2-tool ~$250',
    pros: "Fastest charging batteries in the category. Best build quality per dollar — tools feel right in hand. XPT dust/water protection standard on many tools. World's largest 18V platform (325+ tools). Available at Kent (Ritchies relationship). Excellent ergonomics and balance. Strong contractor respect — trades trust Makita. 18Vx2 gives 36V without new batteries.",
    cons: 'Not at CT or Rona (3/5 retailers). 40V XGT is a separate battery platform (adapter exists but adds bulk). Fewer combo kit promotions than competitors.',
    labsAngle: "Build quality and ergonomics testing. Charge time shootout. Battery longevity over 6 months. Pairs naturally with Festool for premium applications — the 'Makita daily driver + Festool precision' workflow.",
    score: { breadth: 5, availability: 3, battery: 5, upgrade: 4, price: 3 },
  },
  {
    name: 'Milwaukee M18',
    tier: 'Professional',
    retailers: ['Home Depot'],
    retailerCount: 1,
    platformSize: '250+ tools',
    entryPrice: '$198–700',
    entryNum: 198,
    batteryOptions: '1.5–12.0Ah HIGH OUTPUT',
    motorType: 'Brushed → Compact BL → FUEL',
    warranty: '5yr tool, 5yr charger, 3yr battery',
    upgradePath: 'Best ceiling: M18 → Compact BL → FUEL (same battery)',
    keyKit: 'Compact BL 2-tool ~$228; FUEL 5-tool ~$1,298',
    pros: "Best upgrade path. 5-year warranty. FUEL is industry's best. ONE-KEY tracking. PACKOUT system.",
    cons: 'Expensive. Primarily HD only. Overkill for budget-first. Bare tools costly.',
    labsAngle: "The 'what does pro-tier actually get you?' content. Budget vs FUEL head-to-head.",
    score: { breadth: 4, availability: 1, battery: 3, upgrade: 5, price: 2 },
  },
  {
    name: 'RIDGID 18V',
    tier: 'Budget-Pro',
    retailers: ['Home Depot'],
    retailerCount: 1,
    platformSize: '100+ tools',
    entryPrice: '$198–350',
    entryNum: 198,
    batteryOptions: '2.0–8.0Ah',
    motorType: 'Brushed + Brushless',
    warranty: 'LIFETIME Service Agreement',
    upgradePath: 'Moderate — brushed → brushless, no FUEL-tier',
    keyKit: '4-tool combo ~$348; Brushless 10-tool ~$649',
    pros: 'LIFETIME WARRANTY — free parts, free service, forever. 4-tool kit at $348 w/ lifetime is best value for Labs testing strategy.',
    cons: "HD only. Smaller platform. No top-tier line. 'Homeowner' brand perception.",
    labsAngle: "THE Labs platform. 'What happens when budget tools fail? RIDGID replaces free.' Content gold.",
    score: { breadth: 2, availability: 1, battery: 3, upgrade: 2, price: 4 },
  },
];

// ============================================================================
// CORDED SAWS — 9 mitre + 7 table/track
// ============================================================================

const MITRE_SAWS = [
  { item: 'Mastercraft 10" Single-Bevel Compound', retailer: 'Canadian Tire', type: 'Non-sliding', specs: '15A, 5000 RPM, 24T blade, 9 positive stops', price: '$130–180', priceNum: 155, notes: 'Wait for CT sale — can drop 40-60%. Good baseline test' },
  { item: 'Mastercraft 10" Sliding Compound', retailer: 'Canadian Tire', type: 'Sliding, single-bevel', specs: '15A, vertical rail, 40T blade, wall-flush design', price: '$200–250', priceNum: 225, notes: 'Vertical rail = compact. Good value sliding option' },
  { item: 'Mastercraft 10" Dual-Bevel Sliding', retailer: 'Canadian Tire', type: 'Sliding, dual-bevel', specs: '15A, dual bevel, sliding fence, 40T blade', price: '$230–300', priceNum: 265, notes: 'Best Mastercraft option. Dual bevel saves crown moulding time' },
  { item: 'Ryobi 15A 10" Sliding Compound', retailer: 'Home Depot', type: 'Sliding', specs: '15A, LED cut line, table extensions, work clamp', price: '~$259', priceNum: 259, notes: 'LED cut line is useful. Table extensions included' },
  { item: 'King Canada 10" Sliding Compound', retailer: 'HD / Kent', type: 'Sliding', specs: '15A, twin laser, e-brake, 40T, extension wings', price: '$200–250', priceNum: 225, notes: 'Surprisingly capable. Twin laser + e-brake at budget price' },
  { item: 'Makita LS1040 10" Compound', retailer: 'HD / Kent', type: 'Non-sliding', specs: '15A, 4600 RPM, direct-drive, 27.5 lbs (lightest in class)', price: '$280–340', priceNum: 310, notes: 'Makita build quality. Direct drive = smooth cuts. Lightest = easy transport' },
  { item: 'Makita LS1019L 10" Dual-Bevel Sliding', retailer: 'HD / Kent', type: 'Sliding, dual-bevel', specs: '15A, 4300 RPM, compact rail, laser, crown stops', price: '$600–700', priceNum: 650, notes: 'UPGRADE TARGET. Compact rail sits closer to wall. Excellent detent system. The serious Makita option' },
  { item: 'DeWalt DWS713 10" Compound', retailer: 'All 5', type: 'Non-sliding', specs: '15A, 5000 RPM, cam-lock, stainless detent plate', price: '$280–320', priceNum: 300, notes: 'Widely available. Stainless detent plate' },
  { item: 'Festool Kapex KS 120 (aspirational)', retailer: 'Festool dealer', type: 'Sliding, dual-bevel', specs: '1600W, dual laser, integrated dust, rail-forward design', price: '$1,800–2,200', priceNum: 2000, notes: 'THE precision mitre saw. Integrated dust collection, rail-forward = zero wall clearance. Long-term Labs upgrade target' },
];

const TABLE_SAWS = [
  { item: 'Mastercraft 10" Portable', retailer: 'Canadian Tire', specs: '15A, rolling stand, rip fence, miter gauge', price: '$250–350', priceNum: 300, notes: 'Budget baseline. Check fence parallelism in store' },
  { item: 'King Canada 10" Portable Jobsite', retailer: 'HD / Kent', specs: '15A, folding stand, rip fence, miter gauge', price: '$300–400', priceNum: 350, notes: 'Solid budget option at Kent' },
  { item: 'Makita 2705 10" Contractor Table Saw', retailer: 'HD / Kent', specs: '15A, 4800 RPM, electric brake, rip fence', price: '$500–600', priceNum: 550, notes: 'Mid-tier Makita. Electric brake is a safety feature worth paying for' },
  { item: 'RIDGID 10" Pro Jobsite', retailer: 'Home Depot', specs: '15A, folding stand, dust port, miter gauge', price: '$400–500', priceNum: 450, notes: 'Lifetime warranty on a table saw. Fence quality TBD' },
  { item: 'Festool TS 55 F Track Saw', retailer: 'Festool dealer / online', specs: '1200W, plunge cut, splinterguard, dust port, guide rail system', price: '$650–750 (saw only)', priceNum: 700, notes: 'DIFFERENT CATEGORY. Replaces table saw for sheet goods + long rips. Dust extraction built-in. Pairs with Festool CT vac. The precision standard.' },
  { item: 'Festool TS 55 F + 55" Rail Kit', retailer: 'Festool dealer / online', specs: 'Saw + FS 1400 guide rail + connectors', price: '$850–1,000', priceNum: 925, notes: 'Complete system. Rail + saw + splinterguard = zero-tearout cuts. Investment that pays back on every finish job' },
  { item: 'Makita SP6000J 6.5" Track Saw', retailer: 'HD / Kent / online', specs: '12A, 2000-5200 RPM variable, plunge, 55" rail available', price: '$450–550 (saw), $100–130 (rail)', priceNum: 550, notes: "Makita's answer to Festool TS 55. Excellent value. Same Makita quality. Compatible with Makita guide rails" },
];

// ============================================================================
// FASTENING — 7 items
// ============================================================================

const FASTENING = [
  { item: 'Makita 18V LXT 18ga Brad Nailer', type: 'Cordless', retailer: 'HD / Kent', price: '$250–300 bare', priceNum: 275, notes: 'Same 18V LXT batteries as your platform. Nail-set depth dial. No fuel cells needed' },
  { item: 'Makita 18V LXT 15ga Finish Nailer', type: 'Cordless', retailer: 'HD / Kent', price: '$350–400 bare', priceNum: 375, notes: 'Sequential or bump fire. Depth adjust. For baseboards, casings, crown' },
  { item: 'Ryobi ONE+ 18ga Brad Nailer', type: 'Cordless', retailer: 'Home Depot', price: '~$150 bare / in 9-tool kit', priceNum: 150, notes: 'Budget option. Free in Ryobi 9-tool combo kit' },
  { item: 'Milwaukee M18 FUEL 18ga Brad Nailer', type: 'Cordless', retailer: 'Home Depot', price: '~$350', priceNum: 350, notes: 'Top-tier cordless nailer. FUEL motor. Different battery platform' },
  { item: 'Mastercraft 20V 18ga Brad Nailer', type: 'Cordless', retailer: 'Canadian Tire', price: '~$130', priceNum: 130, notes: 'Budget cordless option. PWR POD compatible' },
  { item: 'Bostitch / Hitachi pneumatic 18ga', type: 'Pneumatic', retailer: 'HD / CT / Kent', price: '$80–120 + compressor ($150–200)', priceNum: 280, notes: 'Cheaper tool, but add compressor + hose cost. Hitachi (now Metabo HPT) nailers well-regarded' },
  { item: 'Pancake Compressor (6-gal)', type: 'Pneumatic base', retailer: 'All', price: '$150–200', priceNum: 175, notes: 'Required for all pneumatic nailers. Shared across tools' },
];

// ============================================================================
// MEASURING — 8 items
// ============================================================================

const MEASURING = [
  { item: 'Budget Green Cross-Line Laser', cat: 'Laser', priority: 'P0', price: '$50–80', retailer: 'CT / HD', notes: 'THE test subject. Accuracy at 5/10/20m = signature Labs content' },
  { item: 'Bosch GLL 30 Red Cross-Line', cat: 'Laser', priority: 'P0', price: '$80–100', retailer: 'HD / Kent', notes: 'Red beam. Less visible in daylight than green. Bosch quality' },
  { item: 'DeWalt DW088CG Green Cross-Line', cat: 'Laser', priority: 'P0', price: '$150–180', retailer: 'All 5', notes: 'UPGRADE TARGET. IP54, available everywhere. Green beam' },
  { item: 'Makita SK106GDZ 12V CXT Green Cross-Line', cat: 'Laser', priority: 'P0', price: '$180–220', retailer: 'HD / Kent', notes: 'Self-leveling, green 4-point + cross-line. 12V CXT battery or AAA. Makita ecosystem' },
  { item: 'Budget Laser Distance Measurer', cat: 'Distance', priority: 'P1', price: '$30–50', retailer: 'CT / HD', notes: 'Test accuracy vs tape at 5 known distances' },
  { item: 'Budget Digital Angle Finder', cat: 'Angle', priority: 'P2', price: '$20–30', retailer: 'CT / HD', notes: 'Crown moulding angle capture. Check repeatability' },
  { item: 'Empire 48" Box Level', cat: 'Level', priority: 'P1', price: '$30–40', retailer: 'CT / HD', notes: 'Check accuracy vs laser reference. Drop-test durability' },
  { item: 'Empire/Irwin Combination Square', cat: 'Square', priority: 'P1', price: '$15–25', retailer: 'CT / HD', notes: 'Check against machined reference edge in store' },
];

// ============================================================================
// PPE — 12 items
// ============================================================================

const PPE = [
  { item: 'Dakota T-Max Winter Boots', cat: 'Footwear', priority: 'P0', price: '$140–180', retailer: "Mark's", notes: 'NB winter benchmark. 200g Thinsulate, comp toe, waterproof' },
  { item: 'Dakota WorkPro 3-Season Boots', cat: 'Footwear', priority: 'P1', price: '$120–160', retailer: "CT / Mark's", notes: 'Waterproof, insulated, CSA rated' },
  { item: 'Budget Non-Marking Indoor Shoe', cat: 'Footwear', priority: 'P1', price: '$50–80', retailer: "Mark's / HD", notes: 'Comp toe, slip-on speed. Client home floor protection' },
  { item: 'Mastercraft Gel Knee Pads', cat: 'Protection', priority: 'P0', price: '~$25', retailer: 'Canadian Tire', notes: 'Budget baseline. Test comfort at 2hr and 8hr' },
  { item: 'ProLock / CLC Gel Knee Pads', cat: 'Protection', priority: 'P0', price: '$35–50', retailer: 'Home Depot', notes: 'Mid-range. Better strap system' },
  { item: 'Watson Winter Work Gloves', cat: 'Hands', priority: 'P0', price: '$20–30', retailer: 'CT / HD', notes: 'Test dexterity vs warmth. Can you pick up a screw at -15°C?' },
  { item: 'Mechanix ColdWork (upgrade)', cat: 'Hands', priority: 'P0', price: '$35–55', retailer: 'HD / online', notes: 'Upgrade target. Touchscreen, waterproof membrane' },
  { item: '3M WorkTunes Connect', cat: 'Ears', priority: 'P1', price: '$40–50', retailer: 'CT / HD', notes: 'Bluetooth, AM/FM, NRR 24. Budget hearing protection' },
  { item: 'ISOtunes PRO 2.0 (upgrade)', cat: 'Ears', priority: 'P1', price: '$80–100', retailer: 'Online', notes: 'Active NC, BT 5.0, NRR 27. Test with BAFX sound meter' },
  { item: '3M 6300 Half-Face Respirator', cat: 'Breathing', priority: 'P0', price: '$30–40', retailer: 'CT / HD', notes: 'Already owned. Document as baseline' },
  { item: 'Pyramex Safety Glasses 3pk', cat: 'Eyes', priority: 'P2', price: '$10–18', retailer: 'CT / HD', notes: 'Budget. Test fog resistance walking cold→warm' },
  { item: 'Darn Tough Boot Socks (upgrade)', cat: 'Footwear', priority: 'P1', price: '$50–75/3pk', retailer: "Online / Mark's", notes: 'Merino wool, lifetime warranty, graduated compression' },
];

// ============================================================================
// LAB INSTRUMENTS — 10 items
// ============================================================================

const LAB_INSTRUMENTS = [
  { item: 'Budget Pin Moisture Meter', source: 'In-Store', priority: 'P1', price: '$25–40', retailer: 'CT / HD', notes: 'Test accuracy vs Wagner Orion 950 benchmark' },
  { item: 'Wagner Orion 950 (pinless)', source: 'Owned', priority: 'P0', price: 'Owned', retailer: '—', notes: 'REFERENCE INSTRUMENT. 12-point grid protocol' },
  { item: 'FLIR ONE Gen 3 (phone)', source: 'In-Store', priority: 'P1', price: '$250–300', retailer: 'Home Depot', notes: 'Phone-attached thermal camera. Insulation/leak content' },
  { item: 'BAFX 3370 Sound Meter', source: 'Owned', priority: 'P2', price: 'Owned', retailer: '—', notes: 'Owned. Underlayment IIC/STC testing' },
  { item: 'Mitutoyo 6" Digital Caliper', source: 'Owned', priority: 'P0', price: 'Owned', retailer: '—', notes: 'Owned. Universal deviation measurement' },
  { item: 'Budget IR Thermometer', source: 'In-Store', priority: 'P1', price: '$25–35', retailer: 'CT / HD', notes: 'Substrate temp verification. Compare to Fluke 62 MAX' },
  { item: 'Nix Mini 3 Colorimeter', source: 'Online', priority: 'P2', price: '$200–250', retailer: 'Online (Nix direct)', notes: 'Stain fade, paint coverage, yellowing. ΔE measurement' },
  { item: 'Digital Force Gauge 100N', source: 'Online', priority: 'P2', price: '$60–100', retailer: 'Amazon.ca', notes: 'Click engagement, adhesion pull, caulk stretch tests' },
  { item: 'SensorPush HT.w (x2)', source: 'Online', priority: 'P0', price: '$50–65 each', retailer: 'Amazon / direct', notes: 'Continuous temp/humidity monitoring per install site' },
  { item: 'SensorPush G1 WiFi Gateway', source: 'Online', priority: 'P0', price: '~$100', retailer: 'Amazon / direct', notes: 'Enables remote monitoring. One per location' },
];

// ============================================================================
// SITE MANAGEMENT — 10 items
// ============================================================================

const SITE_MGMT = [
  { item: 'Mastercraft 5-gal Wet/Dry Vac', priority: 'P0', price: '$60–80', retailer: 'Canadian Tire', notes: 'Budget baseline. Decent suction, basic filter. Good for rough cleanup' },
  { item: 'RIDGID 6-gal Wet/Dry Vac', priority: 'P0', price: '$80–100', retailer: 'Home Depot', notes: 'LIFETIME WARRANTY. When motor burns out, free replacement. Best budget value' },
  { item: 'Makita XCV11Z 18V LXT 2-Gal HEPA Vac', priority: 'P1', price: '$200–250 bare', retailer: 'HD / Kent', notes: 'Cordless on Makita 18V batteries OR corded. HEPA certified. Pairs with track saw' },
  { item: 'Festool CT 15 Dust Extractor', priority: 'P1', price: '$550–650', retailer: 'Festool dealer / online', notes: 'THE standard for tool-triggered extraction. Auto-start, HEPA, self-cleaning filter. Pairs with TS 55 and sanders. Investment piece — every finish job' },
  { item: 'Festool CT MIDI (compact)', priority: 'P2', price: '$650–750', retailer: 'Festool dealer / online', notes: 'Smaller footprint than CT 15 but same auto-start and HEPA. Better for transport between job sites' },
  { item: 'Budget Rechargeable Headlamp', priority: 'P1', price: '$15–25', retailer: 'CT / HD', notes: '300lm, hard hat strap. Test runtime vs claim' },
  { item: '50ft 12AWG Extension Cords (x2)', priority: 'P0', price: '$35–50', retailer: 'Anywhere', notes: 'Spec purchase. 12AWG SJTW outdoor, lighted end' },
  { item: 'Makita Folding Sawhorses', priority: 'P1', price: '$60–90/pair', retailer: 'HD / Kent', notes: "Heavier than budget but won't flex under sheet goods. Pair with track saw rail" },
  { item: 'Canvas Drop Cloth 4x12 + Poly', priority: 'P0', price: '$20–35', retailer: 'Anywhere', notes: 'Consumable. Canvas for paint, poly for dust' },
  { item: 'Makita Tool Bag / Veto Pro Pac (upgrade)', priority: 'P2', price: '$40–80 / $200+', retailer: 'HD / online', notes: 'Makita bag is solid. Veto Pro Pac is the upgrade — purpose-built for trades' },
];

// ============================================================================
// INVENTORY — 18 items (8 owned + 10 RIDGID purchasing)
// ============================================================================

const INVENTORY = [
  { id: 'OWN-001', item: 'Wagner Orion 950 Pinless Moisture Meter', brand: 'Wagner', category: 'Lab Instrument', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'Reference standard — pinless moisture baseline', notes: '12-point grid protocol. Primary reference instrument' },
  { id: 'OWN-002', item: 'BAFX 3370 Sound Level Meter', brand: 'BAFX', category: 'Lab Instrument', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'IIC/STC testing — underlayment & insulation', notes: 'Document serial number and calibration status' },
  { id: 'OWN-003', item: 'Mitutoyo 6" Digital Caliper', brand: 'Mitutoyo', category: 'Lab Instrument', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'Universal deviation measurement — tolerance testing', notes: 'Industrial reference grade. Photograph and document' },
  { id: 'OWN-004', item: '3M 6300 Half-Face Respirator', brand: '3M', category: 'PPE', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'Baseline respiratory protection', notes: 'Check filter dates. Document as PPE baseline' },
  { id: 'OWN-005', item: 'Stanley 99 Utility Knife', brand: 'Stanley', category: 'Hand Tool', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'Hand tool baseline', notes: 'Classic. Already owned' },
  { id: 'OWN-006', item: 'Swanson S0101 Speed Square', brand: 'Swanson', category: 'Measuring', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'Reference square — accuracy checks', notes: 'The standard. Already owned' },
  { id: 'OWN-007', item: 'Stanley PowerLock Tape Measures (x2)', brand: 'Stanley', category: 'Measuring', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'Baseline tape measures', notes: 'Two in rotation' },
  { id: 'OWN-008', item: 'Empire Combination Square', brand: 'Empire', category: 'Measuring', platform: '—', status: 'Owned' as const, condition: 'Good', pricePaid: null, source: '—', labsRole: 'Layout and depth marking', notes: 'Check against machined edge for accuracy' },
  { id: 'RDG-001', item: 'RIDGID 18V 1/2" Hammer Drill/Driver', brand: 'RIDGID', category: 'Cordless Power', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Drilling baseline — torque and speed testing', notes: 'Part of 5-piece kit. Lifetime Service Agreement. Register within 90 days' },
  { id: 'RDG-002', item: 'RIDGID 18V Impact Driver', brand: 'RIDGID', category: 'Cordless Power', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Fastening baseline — lag bolts, deck screws', notes: 'Part of 5-piece kit. Lifetime Service Agreement' },
  { id: 'RDG-003', item: 'RIDGID 18V 6-1/2" Circular Saw', brand: 'RIDGID', category: 'Cordless Power', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Cordless cut quality testing — framing and sheathing', notes: 'Part of 5-piece kit. Lifetime Service Agreement' },
  { id: 'RDG-004', item: 'RIDGID 18V Reciprocating Saw', brand: 'RIDGID', category: 'Cordless Power', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Demo and rough cut testing', notes: 'Part of 5-piece kit. Lifetime Service Agreement' },
  { id: 'RDG-005', item: 'RIDGID 18V LED Work Light', brand: 'RIDGID', category: 'Cordless Power', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Job site lighting — lumen and runtime testing', notes: 'Part of 5-piece kit. Lifetime Service Agreement' },
  { id: 'RDG-006', item: 'RIDGID 18V Brushless Oscillating Multi-Tool', brand: 'RIDGID', category: 'Cordless Power', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: 179, source: 'Home Depot', labsRole: 'Most versatile finish tool — jamb cuts, grout, metal trim, tile', notes: 'Add-on to 5-piece kit. Triggers free 6Ah battery promo. Brushless. Lifetime Service Agreement' },
  { id: 'RDG-007', item: 'RIDGID 18V 6.0Ah Battery (FREE)', brand: 'RIDGID', category: 'Battery', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: 0, source: 'Home Depot', labsRole: 'High-capacity battery — runtime testing across all RIDGID tools', notes: 'FREE with oscillating tool purchase. ~$80–100 value. Lifetime Service Agreement on battery too' },
  { id: 'RDG-008', item: 'RIDGID 18V 4.0Ah Battery (kit)', brand: 'RIDGID', category: 'Battery', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Standard runtime battery', notes: 'Included in 5-piece kit' },
  { id: 'RDG-009', item: 'RIDGID 18V 2.0Ah Battery (kit)', brand: 'RIDGID', category: 'Battery', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Compact battery — light tool use', notes: 'Included in 5-piece kit' },
  { id: 'RDG-010', item: 'RIDGID 18V Charger (kit)', brand: 'RIDGID', category: 'Charger', platform: 'RIDGID 18V', status: 'Purchasing' as const, condition: 'New', pricePaid: null, source: 'Home Depot', labsRole: 'Charge time baseline testing', notes: 'Included in 5-piece kit' },
];

// ============================================================================
// Seed function
// ============================================================================

export async function seedToolResearchData(
  services: Services,
  onProgress?: (message: string) => void,
): Promise<ToolResearchSeedResult> {
  const log = onProgress || (() => {});
  const result: ToolResearchSeedResult = { platforms: 0, researchItems: 0, inventoryItems: 0 };

  // Check if already seeded
  const existingPlatforms = await services.labs.toolResearch.getPlatforms();
  if (existingPlatforms.length > 0) {
    log(`Skipping tool research — ${existingPlatforms.length} platforms already exist`);
    return result;
  }

  log('Seeding tool research data...');

  // Seed platforms
  for (const p of PLATFORMS) {
    await services.labs.toolResearch.createPlatform(p);
    result.platforms++;
  }
  log(`  Created ${result.platforms} platforms`);

  // Seed research items by category
  const categoryItems: { category: ToolResearchCategory; items: Record<string, unknown>[] }[] = [
    { category: 'mitre_saw', items: MITRE_SAWS },
    { category: 'table_saw', items: TABLE_SAWS },
    { category: 'fastening', items: FASTENING },
    { category: 'measuring', items: MEASURING },
    { category: 'ppe', items: PPE },
    { category: 'lab_instrument', items: LAB_INSTRUMENTS },
    { category: 'site_mgmt', items: SITE_MGMT },
  ];

  for (const { category, items } of categoryItems) {
    for (const raw of items) {
      await services.labs.toolResearch.createResearchItem({
        category,
        item: raw.item as string,
        retailer: (raw.retailer as string) || undefined,
        type: (raw.type as string) || (raw.cat as string) || (raw.source as string) || undefined,
        specs: (raw.specs as string) || undefined,
        price: raw.price as string,
        priceNum: (raw.priceNum as number) || 0,
        priority: (raw.priority as string) || undefined,
        notes: raw.notes as string,
        cat: (raw.cat as string) || undefined,
        source: (raw.source as string) || undefined,
      });
      result.researchItems++;
    }
    log(`  Created ${items.length} ${category} items`);
  }

  // Seed inventory
  for (const inv of INVENTORY) {
    await services.labs.toolResearch.createInventoryItem(inv);
    result.inventoryItems++;
  }
  log(`  Created ${result.inventoryItems} inventory items`);

  log(`Tool research seed complete: ${result.platforms} platforms, ${result.researchItems} research items, ${result.inventoryItems} inventory items`);
  return result;
}
