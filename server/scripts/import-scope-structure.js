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

  console.log('Starting scope structure import...')
  console.log('Project ID:', projectId)

  // First, delete existing categories and subcategories for this project
  console.log('\n1. Cleaning up existing data...')

  const { data: existingCategories, error: fetchError } = await supabase
    .from('scope_categories')
    .select('id')
    .eq('project_id', projectId)

  if (fetchError) {
    console.error('Error fetching existing categories:', fetchError)
    return
  }

  if (existingCategories && existingCategories.length > 0) {
    const categoryIds = existingCategories.map(c => c.id)

    // Delete subcategories first (due to foreign key)
    const { error: deleteSubError } = await supabase
      .from('scope_subcategories')
      .delete()
      .in('category_id', categoryIds)

    if (deleteSubError) {
      console.error('Error deleting subcategories:', deleteSubError)
      return
    }

    // Then delete categories
    const { error: deleteCatError } = await supabase
      .from('scope_categories')
      .delete()
      .eq('project_id', projectId)

    if (deleteCatError) {
      console.error('Error deleting categories:', deleteCatError)
      return
    }

    console.log(`✓ Deleted ${existingCategories.length} existing categories and their subcategories`)
  }

  // Now insert the correct structure
  console.log('\n2. Importing new scope structure...')

  let categoryOrder = 0

  for (const [categoryName, subcategories] of Object.entries(scopeStructure)) {
    // Insert category
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
  console.log(`Imported ${Object.keys(scopeStructure).length} categories`)
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
