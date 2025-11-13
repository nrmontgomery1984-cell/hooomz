import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDir = join(__dirname, '..', 'server');

// Load environment variables
dotenv.config({ path: join(serverDir, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addChecklistTestData() {
  console.log('='.repeat(70));
  console.log('🔄 Adding Test Checklist Data');
  console.log('='.repeat(70));

  try {
    // Step 1: Find a scope item (preferably "Install baseboard and quarter round")
    console.log('\n📋 Finding scope items...');
    const { data: scopeItems, error: itemsError } = await supabase
      .from('scope_items')
      .select('id, description, subcategory_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (itemsError) throw itemsError;

    console.log(`Found ${scopeItems.length} scope items:`);
    scopeItems.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.description} (ID: ${item.id})`);
    });

    if (scopeItems.length === 0) {
      console.log('\n⚠️  No scope items found. Please create some tasks first.');
      return;
    }

    // Use the first scope item for testing
    const testItem = scopeItems[0];
    console.log(`\n✅ Using: "${testItem.description}"`);

    // Step 2: Check if checklist items already exist
    const { data: existingChecklist, error: checkError } = await supabase
      .from('scope_item_checklist')
      .select('*')
      .eq('scope_item_id', testItem.id);

    if (checkError) throw checkError;

    if (existingChecklist && existingChecklist.length > 0) {
      console.log(`\n⚠️  This item already has ${existingChecklist.length} checklist items. Skipping.`);
      return;
    }

    // Step 3: Create sample checklist items (based on Trim Installation template)
    console.log('\n📝 Creating checklist items...');
    const checklistItems = [
      {
        scope_item_id: testItem.id,
        description: 'Verify all drywall and painting is complete',
        is_critical: true,
        display_order: 1
      },
      {
        scope_item_id: testItem.id,
        description: 'Check walls are straight and plumb',
        is_critical: true,
        display_order: 2
      },
      {
        scope_item_id: testItem.id,
        description: 'Measure and cut baseboards accurately',
        is_critical: false,
        display_order: 3
      },
      {
        scope_item_id: testItem.id,
        description: 'Use proper nail gun settings (18 gauge, 2" nails)',
        is_critical: false,
        display_order: 4
      },
      {
        scope_item_id: testItem.id,
        description: 'Caulk gaps between baseboard and wall',
        is_critical: false,
        display_order: 5
      },
      {
        scope_item_id: testItem.id,
        description: 'Fill nail holes with wood filler',
        is_critical: false,
        display_order: 6
      },
      {
        scope_item_id: testItem.id,
        description: 'Final inspection - no gaps or visible nails',
        is_critical: true,
        display_order: 7
      }
    ];

    const { data: insertedItems, error: insertError } = await supabase
      .from('scope_item_checklist')
      .insert(checklistItems)
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Created ${insertedItems.length} checklist items`);

    // Step 4: Add sample materials
    console.log('\n📦 Creating sample materials...');
    const materials = [
      {
        scope_item_id: testItem.id,
        name: 'Baseboard trim (3.5" MDF)',
        quantity: 120,
        unit: 'linear feet',
        notes: 'Pre-primed white'
      },
      {
        scope_item_id: testItem.id,
        name: 'Quarter round (3/4")',
        quantity: 120,
        unit: 'linear feet',
        notes: 'Match baseboard finish'
      },
      {
        scope_item_id: testItem.id,
        name: 'Brad nails (18 gauge, 2")',
        quantity: 1,
        unit: 'box',
        notes: 'For baseboard'
      },
      {
        scope_item_id: testItem.id,
        name: 'Finish nails (16 gauge, 1")',
        quantity: 1,
        unit: 'box',
        notes: 'For quarter round'
      },
      {
        scope_item_id: testItem.id,
        name: 'Wood filler',
        quantity: 1,
        unit: 'tube',
        notes: 'For nail holes'
      },
      {
        scope_item_id: testItem.id,
        name: 'Caulk (paintable)',
        quantity: 2,
        unit: 'tubes',
        notes: 'White latex caulk'
      }
    ];

    const { data: insertedMaterials, error: materialsError } = await supabase
      .from('scope_item_materials')
      .insert(materials)
      .select();

    if (materialsError) throw materialsError;
    console.log(`✅ Created ${insertedMaterials.length} material items`);

    // Step 5: Add sample tools
    console.log('\n🔧 Creating sample tools...');
    const tools = [
      {
        scope_item_id: testItem.id,
        name: 'Miter saw',
        notes: '10" or 12" compound miter saw'
      },
      {
        scope_item_id: testItem.id,
        name: 'Brad nailer (18 gauge)',
        notes: 'For baseboard installation'
      },
      {
        scope_item_id: testItem.id,
        name: 'Finish nailer (16 gauge)',
        notes: 'For quarter round'
      },
      {
        scope_item_id: testItem.id,
        name: 'Tape measure',
        notes: '25 ft minimum'
      },
      {
        scope_item_id: testItem.id,
        name: 'Speed square',
        notes: 'For marking angles'
      },
      {
        scope_item_id: testItem.id,
        name: 'Caulk gun',
        notes: 'Standard caulk gun'
      },
      {
        scope_item_id: testItem.id,
        name: 'Nail set',
        notes: 'For countersinking nails'
      }
    ];

    const { data: insertedTools, error: toolsError } = await supabase
      .from('scope_item_tools')
      .insert(tools)
      .select();

    if (toolsError) throw toolsError;
    console.log(`✅ Created ${insertedTools.length} tool items`);

    console.log('\n' + '='.repeat(70));
    console.log('✨ Test data created successfully!');
    console.log('='.repeat(70));
    console.log(`\n📌 Task ID: ${testItem.id}`);
    console.log(`📌 Task: ${testItem.description}`);
    console.log(`\n✅ Checklist: ${insertedItems.length} items`);
    console.log(`✅ Materials: ${insertedMaterials.length} items`);
    console.log(`✅ Tools: ${insertedTools.length} items`);
    console.log('\nNow open this task in the UI to see the checklist, materials, and tools!\n');

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
addChecklistTestData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  });
