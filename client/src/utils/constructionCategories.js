/**
 * Master Construction Categories and Subcategories
 * Based on CSI MasterFormat divisions and standard construction practice
 */

export const CONSTRUCTION_CATEGORIES = {
  'Site Work': [
    'Clearing', 'Demolition', 'Earthwork', 'Piling', 'Dewatering', 'Shoring',
    'Site Utilities', 'Roads & Walks', 'Site Improvements', 'Landscaping'
  ],
  'Concrete': [
    'Formwork', 'Reinforcing', 'Cast-in-Place Concrete', 'Precast Concrete',
    'Cementitious Decks'
  ],
  'Masonry': [
    'Mortar', 'Masonry Accessories', 'Unit Masonry', 'Stone', 'Masonry Restoration'
  ],
  'Metals': [
    'Structural Steel', 'Steel Joists', 'Metal Decking', 'Miscellaneous Metals',
    'Ornamental Metals'
  ],
  'Wood & Plastics': [
    'Rough Carpentry', 'Finish Carpentry', 'Architectural Woodwork',
    'Structural Plastics', 'Plastic Fabrications'
  ],
  'Thermal & Moisture Protection': [
    'Waterproofing', 'Dampproofing', 'Insulation', 'Shingles & Tiles',
    'Membrane Roofing', 'Flashing & Sheet Metal', 'Roof Accessories',
    'Sealants & Caulking'
  ],
  'Openings': [
    'Metal Doors & Frames', 'Wood Doors', 'Special Doors', 'Entrances & Storefronts',
    'Metal Windows', 'Wood Windows', 'Special Windows', 'Hardware & Specialties',
    'Glazing'
  ],
  'Finishes': [
    'Lath & Plaster', 'Gypsum Drywall', 'Tile', 'Terrazzo', 'Acoustical Treatment',
    'Ceiling Suspension Systems', 'Wood Flooring', 'Resilient Flooring',
    'Carpet', 'Special Flooring', 'Floor Treatment', 'Special Coatings',
    'Painting'
  ],
  'Specialties': [
    'Chalkboards', 'Compartments & Cubicles', 'Louvers & Vents', 'Grilles & Screens',
    'Service Wall Systems', 'Wall & Corner Guards', 'Access Flooring',
    'Specialty Modules', 'Pest Control', 'Fireplaces', 'Flagpoles',
    'Identifying Devices', 'Pedestrian Control Devices', 'Lockers',
    'Protective Covers', 'Postal Specialties', 'Partitions',
    'Scales', 'Wardrobe & Closet Specialties'
  ],
  'Equipment': [
    'Maintenance Equipment', 'Security & Vault Equipment', 'Teller Equipment',
    'Ecclesiastical Equipment', 'Library Equipment', 'Theater & Stage Equipment',
    'Instrumental Equipment', 'Registration Equipment', 'Checkroom Equipment',
    'Residential Equipment', 'Unit Kitchens', 'Darkroom Equipment',
    'Hood & Ventilation Equipment', 'Food Service Equipment',
    'Vending Equipment', 'Athletic Equipment', 'Industrial Equipment',
    'Laboratory Equipment', 'Planetarium Equipment', 'Observatory Equipment',
    'Office Equipment', 'Medical Equipment', 'Mortuary Equipment',
    'Navigation Equipment', 'Parking Equipment', 'Waste Handling Equipment',
    'Loading Dock Equipment', 'Detention Equipment', 'Residential Appliances',
    'Other Equipment'
  ],
  'Furnishings': [
    'Artwork', 'Cabinets & Fixtures', 'Window Treatment', 'Fabrics',
    'Furniture & Accessories', 'Rugs & Mats', 'Multiple Seating',
    'Interior Plants & Planters'
  ],
  'Special Construction': [
    'Air Supported Structures', 'Integrated Assemblies', 'Special Purpose Rooms',
    'Sound & Vibration Control', 'Radiation Protection', 'Insulated Rooms',
    'Incinerators', 'Waste Handling Systems', 'Swimming Pools',
    'Ice Rinks', 'Kennels & Shelters', 'Liquid & Gas Storage Tanks',
    'Filter Underdrains', 'Digester Covers', 'Oxygenation Systems',
    'Sludge Conditioning Systems', 'Thermal Sludge Conditioning',
    'Utility Control Systems', 'Industrial & Process Control Systems',
    'Building Automation Systems', 'Fire Suppression Systems',
    'Detention Equipment', 'Audio-Visual Equipment'
  ],
  'Conveying Systems': [
    'Elevators', 'Escalators', 'Moving Walks', 'Lifts', 'Turntables',
    'Scaffolding', 'Transportation Systems', 'Pneumatic Tube Systems',
    'Conveyors', 'Chutes'
  ],
  'Mechanical': [
    'Basic Mechanical Materials', 'Insulation', 'Water Supply & Treatment',
    'Waste Water Disposal', 'Plumbing Fixtures', 'Special Plumbing Systems',
    'Fire Protection', 'Fuel Systems', 'Power & Heat Generation',
    'Refrigeration', 'Heat Transfer', 'Air Handling', 'Air Distribution',
    'Controls & Instrumentation', 'Systems Testing & Balancing'
  ],
  'Electrical': [
    'Basic Electrical Materials', 'Power Generation', 'Power Transmission',
    'Service & Distribution', 'Lighting', 'Special Systems',
    'Communications', 'Heating & Cooling', 'Controls & Instrumentation',
    'Systems Testing & Balancing'
  ]
}

/**
 * Detects category and subcategory from task description
 * Returns { category, subcategory } or null if no match found
 */
export const detectCategoryFromDescription = (description) => {
  if (!description) return null

  const desc = description.toLowerCase()

  // Check each category's subcategories for keyword matches
  for (const [category, subcategories] of Object.entries(CONSTRUCTION_CATEGORIES)) {
    for (const subcategory of subcategories) {
      const subLower = subcategory.toLowerCase()

      // Direct match
      if (desc.includes(subLower)) {
        return { category, subcategory }
      }

      // Check for common variations and keywords
      const keywords = getSubcategoryKeywords(subcategory)
      for (const keyword of keywords) {
        if (desc.includes(keyword.toLowerCase())) {
          return { category, subcategory }
        }
      }
    }
  }

  return null
}

/**
 * Gets common keywords associated with a subcategory
 */
function getSubcategoryKeywords(subcategory) {
  const keywordMap = {
    // Wood & Plastics
    'Rough Carpentry': ['framing', 'studs', 'joists', 'rafters', 'sheathing'],
    'Finish Carpentry': ['trim', 'molding', 'crown', 'baseboard', 'casing'],

    // Finishes
    'Gypsum Drywall': ['drywall', 'sheetrock', 'gypsum board', 'wallboard'],
    'Painting': ['paint', 'primer', 'stain', 'coating'],
    'Tile': ['ceramic', 'porcelain', 'backsplash', 'shower tile'],
    'Wood Flooring': ['hardwood', 'laminate', 'engineered wood'],
    'Carpet': ['carpeting', 'carpet pad'],

    // Mechanical
    'Plumbing Fixtures': ['toilet', 'sink', 'faucet', 'shower', 'tub', 'bathtub'],
    'HVAC': ['furnace', 'air conditioner', 'ac unit', 'ductwork', 'vents'],

    // Electrical
    'Lighting': ['light fixture', 'chandelier', 'recessed light', 'pendant'],
    'Service & Distribution': ['outlet', 'switch', 'panel', 'breaker', 'wiring'],

    // Openings
    'Metal Doors & Frames': ['door', 'door frame', 'threshold'],
    'Hardware & Specialties': ['doorknob', 'handle', 'lock', 'hinge'],
    'Metal Windows': ['window', 'window frame', 'sill'],
    'Glazing': ['glass', 'window pane'],

    // Thermal & Moisture Protection
    'Insulation': ['insulate', 'insulating', 'r-value'],
    'Membrane Roofing': ['roofing', 'roof membrane', 'shingles'],
    'Waterproofing': ['waterproof', 'moisture barrier'],
    'Sealants & Caulking': ['caulk', 'sealant', 'seal'],

    // Specialties
    'Cabinets & Fixtures': ['cabinet', 'vanity', 'countertop', 'shelf'],
  }

  return keywordMap[subcategory] || []
}