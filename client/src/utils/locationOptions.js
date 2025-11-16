/**
 * Common room and location options for construction projects
 * Alphabetically sorted for easy selection
 */
export const LOCATION_OPTIONS = [
  'Attic',
  'Back Yard',
  'Basement',
  'Basement Bathroom',
  'Basement Bedroom',
  'Bathroom',
  'Bathroom 2',
  'Bathroom 3',
  'Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Bedroom 4',
  'Closet',
  'Deck',
  'Dining Room',
  'Driveway',
  'Exterior',
  'Exterior - Front',
  'Exterior - Left',
  'Exterior - Rear',
  'Exterior - Right',
  'Family Room',
  'Foyer',
  'Front Yard',
  'Garage',
  'Guest Bedroom',
  'Hallway',
  'Kitchen',
  'Laundry',
  'Living Room',
  'Master Bathroom',
  'Master Bedroom',
  'Mechanical Room',
  'Mudroom',
  'Office',
  'Pantry',
  'Patio',
  'Porch',
  'Powder Room',
  'Rec Room',
  'Roof',
  'Side Yard',
  'Stairway',
  'Storage Room',
  'Walk-in Closet'
]

/**
 * Location keywords sorted by length (longest first) for auto-detection
 * This ensures multi-word locations are matched before single words
 */
export const LOCATION_KEYWORDS = [...LOCATION_OPTIONS].sort((a, b) => b.length - a.length)
