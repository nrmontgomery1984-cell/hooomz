import supabase from '../src/utils/supabase.js'

// Proper scope structure from spreadsheet
const scopeStructure = {
  'Design and Planning': ['Siding', 'Permits', 'Design', 'Scheduling', 'Budgeting', 'Engineering', 'Permit fees', 'Atlantic Home Warranty', 'Energy Evaluation', 'Land purchase', 'NB power incentives'],
  'Excavation': ['Grub Land', 'Excavation', 'Curb cut', 'Backfill', 'Excavation', 'Backfill/rough grade', 'Locate'],
  'Foundation': ['Formwork', 'Concrete', 'Foundation Walls', 'Technopost', 'Concrete stairs'],
  'Framing - Structural': ['Framing - Walls', 'Framing - slip wall', 'Bracing', 'Sheathing - Walls', 'Sheathing - Roof', 'Framing - Roof', 'Install Beam - SPF', 'Install Beam - LVL', 'Install Beam - Steel', 'Framing - Rake walls', 'Floor', 'Sub-floor'],
  'Framing - Non structural': ['Partition walls', 'Sub-floor', 'Insulation - Floor', 'Strapping', 'Stair stringers', 'Overhead doors', 'Window - Standard', 'Window - Oversize', 'Door - Swing', 'Door - Patio', 'Opening Prep'],
  'Building Envelope': ['WRB', 'Rainscreen', 'Siding - Vinyl', 'Siding - Hardie', 'Siding - Wood', 'Soffit and Fascia', 'Membrane - Textile', 'Membrane - High heat', 'Waterproofing'],
  'Drywall and Paint': ['Insulation - Cavities', 'Insulation - Exterior', 'Insulation - Attic', 'Drywall - Walls', 'Drywall - Ceiling', 'Drywall - Taping', 'Painting', 'Painting - Smell/stain sealing'],
  'Flooring': ['Flooring - Ditra', 'Flooring - Ditra heat', 'Flooring - Tile', 'Flooring - Laminate', 'Flooring - Hardwood', 'Flooring - Carpet', 'Flooring - LVT', 'Concrete floor paint', 'Flooring - Puzzle mat'],
  'Finish Carpentry': ['Trim - Casing', 'Trim - Baseboards', 'Trim - Other', 'Interior Doors - Swing', 'Interior Doors - Pocket', 'Interior Doors - Double', 'Interior Door - Closet', 'Shelving - Closet'],
  'Siding': ['Siding - Vinyl', 'Siding - Hardie', 'Siding - Wood'],
  'Roofing': ['Roofing - Asphalt (3:12-6:12)', 'Roofing - Asphalt (7:12-12:12)', 'Roofing - Metal (3:12-6:12)', 'Roofing - Metal (7:12-12:12)', 'Gutters', 'Gutter with guard'],
  'Masonry': ['Parging', 'Stone/Masonry'],
  'Plumbing': ['Toilet', 'Shower - Acrylic base', 'Shower - Fixtures', 'Bathtub', 'Bathtub - Fixtures', 'Hose bib', 'Sump pump', 'Wash box', 'Sink - Bathroom', 'Sink - Kitchen', 'Sink - Bar', 'Sink - Laundry', 'Dishwasher', 'Aux. water line', 'Disconnect plumbing'],
  'Electrical': ['Pot light', 'Pendant light', 'Sconce light', 'Ceiling fan', 'Exterior light - Sconce', 'Exterior light - Soffit', 'Baseboard heater', 'Receptacle', 'Receptacle - GFCI', 'Receptacle - Specialty', 'Switch', 'Bathroom exhaust', 'Kitchen exhaust', 'Panel change/upgrade', 'Doorbell', 'Undercabinet lighting', '220v Outlet', 'Disconnect electrical', 'Remove copper', 'Remove knob and tube'],
  'HVAC': ['Ductwork', 'Mini split', 'Air exchanger', 'Fireplace'],
  'Landscaping': ['Grading', 'Sod', 'Planting', 'Hydro seed'],
  'Overhead': ['Snow removal', 'Temporary Fencing', 'Garbage Removal', 'Site cleaning', 'Porta potty', 'Error margin', 'Project Management', 'Material moving', 'Site meeting'],
  'Hardscaping': ['Paving stones', 'Deck - Grade', 'Deck - 2\' - 6\'', 'Deck - 6\'  and above', 'Deck Stairs', 'Porch roof', 'Railing', 'Fence', 'Shed/baby barn'],
  'Millwork': ['Kitchen - Base', 'Kitchen - Upper', 'Pantry', 'Vanity', 'Bar', 'Custom shelving', 'Panel box out', 'Countertop', 'Laundry - Base', 'Laundry - Upper', 'Walk-in Closet'],
  'Tile': ['Backsplash', 'Floor', 'Wall', 'Shower - walls', 'Shower - Base', 'Shower doors', 'Mortar, Grout, Trims'],
  'Stairs and Railing': ['Treads', 'Risers', 'Landing', 'Railing', 'Nosing', 'Skirting', 'Stringer']
}

async function importScopeStructure() {
  const projectId = '66f444e1-b0ba-4995-85e2-beb402ea4d24'

  console.log('Starting scope structure import (PRESERVING EXISTING STRUCTURE)...')
  console.log('Project ID:', projectId)

  // Check what exists
  const { data: existingCategories, error: fetchError } = await supabase
    .from('scope_categories')
    .select('id, name')
    .eq('project_id', projectId)

  if (fetchError) {
    console.error('Error fetching existing categories:', fetchError)
    return
  }

  console.log(`\nFound ${existingCategories?.length || 0} existing categories`)

  // Only add missing categories
  let categoryOrder = existingCategories?.length || 0

  for (const [categoryName, subcategories] of Object.entries(scopeStructure)) {
    // Check if category already exists
    const existing = existingCategories?.find(c => c.name === categoryName)

    if (existing) {
      console.log(`\n✓ Category "${categoryName}" already exists, skipping...`)
      continue
    }

    // Insert new category
    const { data: category, error: catError } = await supabase
      .from('scope_categories')
      .insert({
        project_id: projectId,
        name: categoryName,
        display_order: categoryOrder++
      })
      .select()
      .single()

    if (catError) {
      console.error(`Error inserting category "${categoryName}":`, catError)
      continue
    }

    console.log(`\n✓ Created category: ${categoryName}`)

    // Insert subcategories
    const subcategoryInserts = subcategories.map((subName, index) => ({
      category_id: category.id,
      name: subName,
      display_order: index
    }))

    const { error: subError } = await supabase
      .from('scope_subcategories')
      .insert(subcategoryInserts)

    if (subError) {
      console.error(`Error inserting subcategories for "${categoryName}":`, subError)
    } else {
      console.log(`  ✓ Created ${subcategories.length} subcategories`)
    }
  }

  console.log('\n✅ Import complete!')
}

// Run the import
importScopeStructure()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
