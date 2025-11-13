import supabase from '../src/utils/supabase.js'

const projectId = '66f444e1-b0ba-4995-85e2-beb402ea4d24'

// All tasks from the screenshots
const tasks = [
  // Screenshot 1 - Downstairs section
  { description: 'Downstairs', location: 'Downstairs' },
  { description: 'Flooring in washer / drier bath area', location: 'Downstairs' },
  { description: 'Baseboard', location: 'Downstairs' },
  { description: 'Window finish', location: 'Downstairs' },
  { description: 'Doors to install', location: 'Downstairs' },
  { description: 'Stairs and running boards', location: 'Downstairs' },
  { description: 'Handrail', location: 'Downstairs' },
  { description: 'Paint floor', location: 'Downstairs' },
  { description: 'Install W and D', location: 'Downstairs' },
  { description: 'Ryan to install heater', location: 'Downstairs' },
  { description: 'Mark had work to finish', location: 'Downstairs' },
  { description: 'Landing at enternace', location: 'Downstairs' },
  { description: 'Mail box - on counter. Needs Aztec', location: 'Exterior' },
  { description: 'Numbers - on counter. Needs Aztec', location: 'Exterior' },
  { description: 'I got covers for the holes alongside side door - take a look and comment. If they work. Need paint and install', location: 'Exterior' },
  { description: 'I will spray foam drier vent tomorrow. We then need some sort of cover for it', location: 'Downstairs' },

  // Screenshot 2 - Nathan section
  { description: 'Nathan', location: 'Interior' },
  { description: 'Been at Whitney all afternoon', location: 'Interior' },
  { description: 'Place has been cleaned top to bottom - all garbage removed and swept', location: 'Interior' },
  { description: 'All door upstairs drilled and door knobs installed', location: 'Upstairs' },

  // Screenshot 2 - Monday section
  { description: 'Window cleaning to take place', location: 'Interior' },
  { description: 'Upstairs to be 100% complete on Monday', location: 'Upstairs' },
  { description: 'Living room baseboard and quarter round', location: 'Living Room' },
  { description: 'All painting touched up including living room and kitchen windows', location: 'Interior' },
  { description: 'Hole in hall floor plugged', location: 'Hallway' },
  { description: 'Transition to kitchen installed', location: 'Kitchen' },
  { description: 'Living room window blinds installed', location: 'Living Room' },
  { description: 'Gear mechanism on master window installed', location: 'Master Bedroom' },
  { description: 'Paint inside of upstairs bathroom vanity', location: 'Bathroom' },
  { description: 'Change casing at kitchen to entrance - to all white', location: 'Kitchen' },
  { description: 'Downstairs', location: 'Downstairs' }
]

async function getCategoryAndSubcategory(description, location) {
  // Fetch all categories and subcategories
  const { data: categories, error } = await supabase
    .from('scope_categories')
    .select(`
      id,
      name,
      subcategories:scope_subcategories(id, name)
    `)
    .eq('project_id', projectId)
    .order('display_order')

  if (error || !categories) {
    console.error('Error fetching categories:', error)
    return null
  }

  // Simple prediction logic - match keywords
  const lowerDesc = description.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  const actionKeywords = {
    'baseboard': { category: 'Finish Carpentry', subcategory: 'Trim - Baseboards' },
    'flooring': { category: 'Flooring', subcategory: 'Flooring - Laminate' },
    'floor': { category: 'Flooring', subcategory: 'Flooring - Laminate' },
    'window': { category: 'Framing - Non structural', subcategory: 'Window - Standard' },
    'door': { category: 'Finish Carpentry', subcategory: 'Interior Doors - Swing' },
    'doors': { category: 'Finish Carpentry', subcategory: 'Interior Doors - Swing' },
    'stairs': { category: 'Stairs and Railing', subcategory: 'Treads' },
    'handrail': { category: 'Stairs and Railing', subcategory: 'Railing' },
    'railing': { category: 'Stairs and Railing', subcategory: 'Railing' },
    'paint': { category: 'Drywall and Paint', subcategory: 'Painting' },
    'heater': { category: 'HVAC', subcategory: 'Mini split' },
    'mail box': { category: 'Overhead', subcategory: 'Site cleaning' },
    'mailbox': { category: 'Overhead', subcategory: 'Site cleaning' },
    'numbers': { category: 'Overhead', subcategory: 'Site cleaning' },
    'foam': { category: 'Building Envelope', subcategory: 'Waterproofing' },
    'cleaning': { category: 'Overhead', subcategory: 'Site cleaning' },
    'garbage': { category: 'Overhead', subcategory: 'Garbage Removal' },
    'knobs': { category: 'Finish Carpentry', subcategory: 'Interior Doors - Swing' },
    'quarter round': { category: 'Finish Carpentry', subcategory: 'Trim - Baseboards' },
    'hole': { category: 'Drywall and Paint', subcategory: 'Drywall - Walls' },
    'transition': { category: 'Flooring', subcategory: 'Flooring - Laminate' },
    'blinds': { category: 'Finish Carpentry', subcategory: 'Interior Doors - Swing' },
    'vanity': { category: 'Millwork', subcategory: 'Vanity' },
    'casing': { category: 'Finish Carpentry', subcategory: 'Trim - Casing' },
    'landing': { category: 'Stairs and Railing', subcategory: 'Landing' },
    'running boards': { category: 'Stairs and Railing', subcategory: 'Nosing' }
  }

  // Find best keyword match
  for (const [keyword, match] of Object.entries(actionKeywords)) {
    if (lowerDesc.includes(keyword)) {
      const category = categories.find(c => c.name === match.category)
      if (category) {
        const subcategory = category.subcategories.find(s => s.name === match.subcategory)
        if (subcategory) {
          return { category_id: category.id, subcategory_id: subcategory.id }
        }
      }
    }
  }

  // Default to Overhead > Project Management if no match
  const overheadCat = categories.find(c => c.name === 'Overhead')
  if (overheadCat) {
    const pmSub = overheadCat.subcategories.find(s => s.name === 'Project Management')
    if (pmSub) {
      return { category_id: overheadCat.id, subcategory_id: pmSub.id }
    }
  }

  return null
}

async function restoreTasks() {
  console.log(`Starting task restoration for project ${projectId}`)
  console.log(`Total tasks to restore: ${tasks.length}\n`)

  let successCount = 0
  let failCount = 0

  for (const task of tasks) {
    try {
      console.log(`Processing: "${task.description}"`)

      // Get category and subcategory
      const match = await getCategoryAndSubcategory(task.description, task.location)

      if (!match) {
        console.error(`  ✗ Could not find category/subcategory match`)
        failCount++
        continue
      }

      // Insert task
      const { data, error } = await supabase
        .from('scope_items')
        .insert({
          subcategory_id: match.subcategory_id,
          description: task.description,
          location: task.location || null,
          status: 'pending',
          display_order: 999
        })
        .select()

      if (error) {
        console.error(`  ✗ Error inserting task:`, error.message)
        failCount++
      } else {
        console.log(`  ✓ Created successfully (Location: ${task.location || 'None'})`)
        successCount++
      }
    } catch (err) {
      console.error(`  ✗ Exception:`, err.message)
      failCount++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`✅ Restoration complete!`)
  console.log(`   Successfully created: ${successCount} tasks`)
  console.log(`   Failed: ${failCount} tasks`)
  console.log(`${'='.repeat(60)}`)
}

restoreTasks()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
