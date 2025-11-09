import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import readline from 'readline'

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function seedDatabase() {
  console.log('🌱 Hooomz Profile - Database Seeder\n')
  console.log('This will create sample data for a specific user.\n')

  try {
    // List all users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) throw userError
    if (!users || users.length === 0) {
      console.error('❌ No users found. Please create a user account first.')
      process.exit(1)
    }

    console.log('📋 Available users:')
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
    })
    console.log()

    const answer = await askQuestion(`Select user (1-${users.length}) or press Enter for user 1: `)
    const selectedIndex = answer.trim() ? parseInt(answer) - 1 : 0

    if (selectedIndex < 0 || selectedIndex >= users.length) {
      console.error('❌ Invalid selection')
      rl.close()
      process.exit(1)
    }

    const userId = users[selectedIndex].id
    const userEmail = users[selectedIndex].email

    rl.close()

    console.log(`\n👤 Seeding data for: ${userEmail}\n`)

    // Delete existing data for this user (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning up existing data...')
    await supabase.from('homes').delete().eq('owner_id', userId)
    console.log('✅ Cleaned up\n')

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
          notes: 'Eggshell finish'
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
          purchase_price: 4200.00
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
          purchase_price: 250.00
        },
        {
          home_id: home2.id,
          category: 'tile',
          brand: 'Daltile',
          model: 'Marble',
          color: 'Calacatta',
          supplier: 'Tile Shop',
          purchase_price: 1800.00
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
          brand: 'Trane',
          model: 'XR16',
          install_date: '2010-05-10',
          warranty_until: '2020-05-10'
        }
      ])
      .select()

    if (systemsError) throw systemsError
    console.log(`✅ Created ${systems.length} systems`)

    // Create maintenance
    console.log('🔧 Creating maintenance tasks...')
    const futureDate = (days) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date.toISOString().split('T')[0]
    }

    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance')
      .insert([
        {
          home_id: home1.id,
          name: 'HVAC Filter Replacement',
          frequency: 'Monthly',
          next_due: futureDate(15)
        },
        {
          home_id: home1.id,
          name: 'Gutter Cleaning',
          frequency: 'Bi-annually',
          next_due: futureDate(45)
        },
        {
          home_id: home1.id,
          name: 'Smoke Detector Battery',
          frequency: 'Annually',
          next_due: futureDate(120)
        },
        {
          home_id: home2.id,
          name: 'HVAC Service',
          frequency: 'Annually',
          next_due: futureDate(90)
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
    console.log(`✨ Log into the app as ${userEmail} to see the data!\n`)

  } catch (error) {
    rl.close()
    console.error('❌ Error:', error.message)
    if (error.details) console.error('Details:', error.details)
    process.exit(1)
  }
}

seedDatabase()
