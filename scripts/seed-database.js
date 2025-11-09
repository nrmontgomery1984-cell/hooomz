import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, '../server/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Get the current user (you need to be logged in)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ No authenticated user found. Please log in first.')
      console.log('💡 This script needs to run with your user token.')
      console.log('💡 Run it from the browser console instead, or update this script with your user ID.')
      process.exit(1)
    }

    const userId = user.id
    console.log(`👤 Seeding data for user: ${user.email}\n`)

    // Create sample homes
    console.log('🏠 Creating homes...')
    const homes = [
      {
        owner_id: userId,
        address: '123 Maple Street, Toronto, ON M5V 2T6',
        year_built: 2015,
        sqft: 2000
      },
      {
        owner_id: userId,
        address: '456 Oak Avenue, Vancouver, BC V6B 1A1',
        year_built: 2010,
        sqft: 1800
      }
    ]

    const { data: createdHomes, error: homesError } = await supabase
      .from('homes')
      .insert(homes)
      .select()

    if (homesError) throw homesError
    console.log(`✅ Created ${createdHomes.length} homes\n`)

    const home1 = createdHomes[0]
    const home2 = createdHomes[1]

    // Create rooms for home 1
    console.log('🚪 Creating rooms...')
    const rooms = [
      { home_id: home1.id, name: 'Living Room', floor: 1 },
      { home_id: home1.id, name: 'Kitchen', floor: 1 },
      { home_id: home1.id, name: 'Master Bedroom', floor: 2 },
      { home_id: home1.id, name: 'Bathroom', floor: 2 },
      { home_id: home2.id, name: 'Living Room', floor: 1 },
      { home_id: home2.id, name: 'Kitchen', floor: 1 }
    ]

    const { data: createdRooms, error: roomsError } = await supabase
      .from('rooms')
      .insert(rooms)
      .select()

    if (roomsError) throw roomsError
    console.log(`✅ Created ${createdRooms.length} rooms\n`)

    // Create materials
    console.log('📦 Creating materials...')
    const materials = [
      {
        home_id: home1.id,
        room_id: createdRooms[0].id,
        category: 'flooring',
        brand: 'Armstrong',
        model: 'Prime Harvest Oak',
        color: 'Natural',
        supplier: 'Home Depot',
        purchase_date: '2023-06-15',
        purchase_price: 3500.00,
        notes: 'Engineered hardwood, 5-inch planks'
      },
      {
        home_id: home1.id,
        room_id: createdRooms[1].id,
        category: 'paint',
        brand: 'Benjamin Moore',
        model: 'Regal Select',
        color: 'Simply White',
        supplier: 'Lowes',
        purchase_date: '2023-07-20',
        purchase_price: 150.00,
        notes: 'Eggshell finish'
      },
      {
        home_id: home1.id,
        room_id: createdRooms[1].id,
        category: 'countertop',
        brand: 'Cambria',
        model: 'Quartz',
        color: 'Torquay',
        supplier: 'Kitchen & Bath Gallery',
        purchase_date: '2023-05-10',
        purchase_price: 4200.00
      },
      {
        home_id: home1.id,
        room_id: createdRooms[2].id,
        category: 'fixture',
        brand: 'Kohler',
        model: 'Devonshire',
        color: 'Brushed Nickel',
        supplier: 'Ferguson',
        purchase_date: '2023-08-05',
        purchase_price: 250.00,
        notes: 'Bathroom faucet'
      },
      {
        home_id: home2.id,
        category: 'tile',
        brand: 'Daltile',
        model: 'Marble Attache',
        color: 'Calacatta',
        supplier: 'Tile Shop',
        purchase_date: '2023-04-12',
        purchase_price: 1800.00
      }
    ]

    const { data: createdMaterials, error: materialsError } = await supabase
      .from('materials')
      .insert(materials)
      .select()

    if (materialsError) throw materialsError
    console.log(`✅ Created ${createdMaterials.length} materials\n`)

    // Create systems
    console.log('⚙️ Creating systems...')
    const systems = [
      {
        home_id: home1.id,
        type: 'HVAC',
        brand: 'Carrier',
        model: 'Infinity 20',
        serial: 'CA123456789',
        install_date: '2015-03-15',
        warranty_until: '2025-03-15',
        notes: 'Central air conditioning and heating'
      },
      {
        home_id: home1.id,
        type: 'Water Heater',
        brand: 'Rheem',
        model: 'Performance Platinum',
        serial: 'RH987654321',
        install_date: '2018-06-20',
        warranty_until: '2028-06-20',
        notes: '50-gallon tank'
      },
      {
        home_id: home2.id,
        type: 'HVAC',
        brand: 'Lennox',
        model: 'Elite Series',
        install_date: '2010-05-10',
        warranty_until: '2020-05-10'
      }
    ]

    const { data: createdSystems, error: systemsError } = await supabase
      .from('systems')
      .insert(systems)
      .select()

    if (systemsError) throw systemsError
    console.log(`✅ Created ${createdSystems.length} systems\n`)

    // Create maintenance tasks
    console.log('🔧 Creating maintenance tasks...')
    const today = new Date()
    const futureDate = (days) => {
      const date = new Date(today)
      date.setDate(date.getDate() + days)
      return date.toISOString().split('T')[0]
    }

    const maintenance = [
      {
        home_id: home1.id,
        name: 'HVAC Filter Replacement',
        frequency: 'Monthly',
        next_due: futureDate(15),
        last_completed: futureDate(-30),
        notes: 'Replace with 16x25x1 MERV 11 filter'
      },
      {
        home_id: home1.id,
        name: 'Gutter Cleaning',
        frequency: 'Bi-annually',
        next_due: futureDate(45),
        notes: 'Clean before spring and fall'
      },
      {
        home_id: home1.id,
        name: 'Smoke Detector Battery',
        frequency: 'Annually',
        next_due: futureDate(120),
        last_completed: futureDate(-245)
      },
      {
        home_id: home2.id,
        name: 'HVAC Service',
        frequency: 'Annually',
        next_due: futureDate(90),
        notes: 'Annual tune-up and inspection'
      }
    ]

    const { data: createdMaintenance, error: maintenanceError } = await supabase
      .from('maintenance')
      .insert(maintenance)
      .select()

    if (maintenanceError) throw maintenanceError
    console.log(`✅ Created ${createdMaintenance.length} maintenance tasks\n`)

    console.log('🎉 Database seeded successfully!\n')
    console.log('Summary:')
    console.log(`  • ${createdHomes.length} homes`)
    console.log(`  • ${createdRooms.length} rooms`)
    console.log(`  • ${createdMaterials.length} materials`)
    console.log(`  • ${createdSystems.length} systems`)
    console.log(`  • ${createdMaintenance.length} maintenance tasks`)
    console.log('\n✨ Refresh your dashboard to see the data!\n')

  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    process.exit(1)
  }
}

seedDatabase()
