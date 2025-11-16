/**
 * Common room and location options for construction projects
 * Used for both dropdown selections and auto-detection from descriptions
 */

export const LOCATION_OPTIONS = {
  'Interior - Main Floor': [
    'Kitchen',
    'Living Room',
    'Dining Room',
    'Family Room',
    'Foyer',
    'Office',
    'Laundry',
    'Mudroom',
    'Powder Room',
    'Pantry'
  ],
  'Interior - Upper Floor': [
    'Master Bedroom',
    'Master Bathroom',
    'Bedroom 2',
    'Bedroom 3',
    'Bedroom 4',
    'Guest Bedroom',
    'Bathroom 2',
    'Bathroom 3',
    'Hallway'
  ],
  'Interior - Basement': [
    'Basement',
    'Rec Room',
    'Basement Bedroom',
    'Basement Bathroom',
    'Storage Room',
    'Mechanical Room'
  ],
  'Interior - Other': [
    'Attic',
    'Stairway',
    'Closet',
    'Walk-in Closet'
  ],
  'Exterior': [
    'Front Yard',
    'Back Yard',
    'Side Yard',
    'Driveway',
    'Garage',
    'Deck',
    'Patio',
    'Porch',
    'Roof',
    'Exterior - Front',
    'Exterior - Rear',
    'Exterior - Left',
    'Exterior - Right'
  ]
}

/**
 * Flattened list of all location keywords for auto-detection
 * Sorted by length (longest first) to match multi-word locations first
 */
export const LOCATION_KEYWORDS = Object.values(LOCATION_OPTIONS)
  .flat()
  .sort((a, b) => b.length - a.length)
