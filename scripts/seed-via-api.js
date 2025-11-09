import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../server/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in server/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Get all users to seed data for the first user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) throw userError
    if (!users || users.users.length === 0) {
      console.error('❌ No users found. Please create a user account first.')
      process.exit(1)
    }

    const userId = users.users[0].id
    const userEmail = users.users[0].email
    console.log(`👤 Seeding data for user: ${userEmail}\n`)

    // Create homes
    console.log('🏠 Creating homes...')
    const { data: homes, error: homesError } = await supabase
      .from('homes')
      .insert([
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
      ])
      .select()

    if (homesError) throw homesError
    console.log(`✅ Created ${homes.length} homes`)

    const home1 = homes[0]
    const home2 = homes[1]

    // Create rooms
    console.log('🚪 Creating rooms...')
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .insert([
        { home_id: home1.id, name: 'Living Room', floor: 1, notes: 'Main living space' },
        { home_id: home1.id, name: 'Kitchen', floor: 1, notes: 'Renovated in 2023' },
        { home_id: home1.id, name: 'Master Bedroom', floor: 2, notes: 'Walk-in closet' },
        { home_id: home1.id, name: 'Bathroom', floor: 2, notes: 'Full bath with tub' },
        { home_id: home2.id, name: 'Living Room', floor: 1 },
        { home_id: home2.id, name: 'Kitchen', floor: 1 }
      ])
      .select()

    if (roomsError) throw roomsError
    console.log(`✅ Created ${rooms.length} rooms`)

    // Create materials
    console.log('📦 Creating materials...')
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .insert([
        {
          home_id: home1.id,
          room_id: rooms[0].id,
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
          room_id: rooms[1].id,
          category: 'paint',
          brand: 'Benjamin Moore',
          model: 'Regal Select',
          color: 'Simply White',
          supplier: 'Lowes',
          purchase_date: '2023-07-20',
          purchase_price: 150.00,
          notes: 'Eggshell finish, walls and ceiling'
        },
        {
          home_id: home1.id,
          room_id: rooms[1].id,
          category: 'countertop',
          brand: 'Cambria',
          model: 'Quartz',
          color: 'Torquay',
          supplier: 'Kitchen & Bath Gallery',
          purchase_date: '2023-05-10',
          purchase_price: 4200.00,
          notes: '2cm thickness, polished finish'
        },
        {
          home_id: home1.id,
          room_id: rooms[3].id,
          category: 'fixture',
          brand: 'Kohler',
          model: 'Devonshire',
          color: 'Brushed Nickel',
          supplier: 'Ferguson',
          purchase_date: '2023-08-05',
          purchase_price: 250.00,
          notes: 'Bathroom faucet with drain assembly'
        },
        {
          home_id: home1.id,
          room_id: rooms[3].id,
          category: 'tile',
          brand: 'Daltile',
          model: 'Marble Attache',
          color: 'Calacatta',
          supplier: 'Tile Shop',
          purchase_date: '2023-04-12',
          purchase_price: 1800.00,
          notes: 'Bathroom floor and shower surround'
        },
        {
          home_id: home2.id,
          category: 'paint',
          brand: 'Sherwin Williams',
          model: 'Duration',
          color: 'Agreeable Gray',
          supplier: 'Sherwin Williams Store',
          purchase_price: 180.00,
          notes: 'Whole house interior'
        }
      ])
      .select()

    if (materialsError) throw materialsError
    console.log(`✅ Created ${materials.length} materials`)

    // Create systems
    console.log('⚙️ Creating systems...')
    const { data: systems, error: systemsError } = await supabase
      .from('systems')
      .insert([
        {
          home_id: home1.id,
          type: 'HVAC',
          brand: 'Carrier',
          model: 'Infinity 20',
          serial: 'CA123456789',
          install_date: '2015-03-15',
          warranty_until: '2025-03-15',
          notes: 'Central air conditioning and heating, 3-ton unit'
        },
        {
          home_id: home1.id,
          type: 'Water Heater',
          brand: 'Rheem',
          model: 'Performance Platinum',
          serial: 'RH987654321',
          install_date: '2018-06-20',
          warranty_until: '2028-06-20',
          notes: '50-gallon gas tank, basement location'
        },
        {
          home_id: home1.id,
          type: 'Furnace',
          brand: 'Lennox',
          model: 'Elite Series EL296V',
          serial: 'LN456789012',
          install_date: '2015-03-15',
          warranty_until: '2025-03-15',
          notes: '96% efficiency, variable speed'
        },
        {
          home_id: home2.id,
          type: 'HVAC',
          brand: 'Trane',
          model: 'XR16',
          install_date: '2010-05-10',
          warranty_until: '2020-05-10',
          notes: 'Out of warranty, consider replacement'
        }
      ])
      .select()

    if (systemsError) throw systemsError
    console.log(`✅ Created ${systems.length} systems`)

    // Create maintenance tasks
    console.log('🔧 Creating maintenance tasks...')
    const today = new Date()
    const futureDate = (days) => {
      const date = new Date(today)
      date.setDate(date.getDate() + days)
      return date.toISOString().split('T')[0]
    }
    const pastDate = (days) => {
      const date = new Date(today)
      date.setDate(date.getDate() - days)
      return date.toISOString().split('T')[0]
    }

    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance')
      .insert([
        {
          home_id: home1.id,
          name: 'HVAC Filter Replacement',
          frequency: 'Monthly',
          next_due: futureDate(15),
          last_completed: pastDate(30),
          notes: 'Replace with 16x25x1 MERV 11 filter'
        },
        {
          home_id: home1.id,
          name: 'Gutter Cleaning',
          frequency: 'Bi-annually',
          next_due: futureDate(45),
          last_completed: pastDate(180),
          notes: 'Clean before spring and fall, check downspouts'
        },
        {
          home_id: home1.id,
          name: 'Smoke Detector Battery',
          frequency: 'Annually',
          next_due: futureDate(120),
          last_completed: pastDate(245),
          notes: 'Test all detectors, replace 9V batteries'
        },
        {
          home_id: home1.id,
          name: 'Furnace Annual Service',
          frequency: 'Annually',
          next_due: futureDate(200),
          notes: 'Schedule before heating season'
        },
        {
          home_id: home2.id,
          name: 'HVAC Service',
          frequency: 'Annually',
          next_due: futureDate(90),
          notes: 'Annual tune-up and inspection'
        }
      ])
      .select()

    if (maintenanceError) throw maintenanceError
    console.log(`✅ Created ${maintenance.length} maintenance tasks\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Database seeded successfully!\n')
    console.log('📊 Summary:')
    console.log(`   • ${homes.length} homes`)
    console.log(`   • ${rooms.length} rooms`)
    console.log(`   • ${materials.length} materials`)
    console.log(`   • ${systems.length} systems`)
    console.log(`   • ${maintenance.length} maintenance tasks`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✨ Refresh your dashboard to see the sample data!\n')

  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    if (error.details) console.error('Details:', error.details)
    if (error.hint) console.error('Hint:', error.hint)
    process.exit(1)
  }
}

seedDatabase()
