// Copy and paste this entire script into your browser console while logged into the app
// This will populate your database with sample data

(async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  // Get Supabase client from the app
  const { supabase } = await import('/src/services/auth.js')

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ You must be logged in!')
      return
    }

    console.log(`👤 Seeding data for: ${user.email}\n`)

    // Create homes
    console.log('🏠 Creating homes...')
    const { data: homes } = await supabase
      .from('homes')
      .insert([
        {
          address: '123 Maple Street, Toronto, ON M5V 2T6',
          year_built: 2015,
          sqft: 2000
        },
        {
          address: '456 Oak Avenue, Vancouver, BC V6B 1A1',
          year_built: 2010,
          sqft: 1800
        }
      ])
      .select()

    console.log(`✅ Created ${homes.length} homes\n`)

    const home1 = homes[0]
    const home2 = homes[1]

    // Create rooms
    console.log('🚪 Creating rooms...')
    const { data: rooms } = await supabase
      .from('rooms')
      .insert([
        { home_id: home1.id, name: 'Living Room', floor: 1 },
        { home_id: home1.id, name: 'Kitchen', floor: 1 },
        { home_id: home1.id, name: 'Master Bedroom', floor: 2 },
        { home_id: home1.id, name: 'Bathroom', floor: 2 },
        { home_id: home2.id, name: 'Living Room', floor: 1 },
        { home_id: home2.id, name: 'Kitchen', floor: 1 }
      ])
      .select()

    console.log(`✅ Created ${rooms.length} rooms\n`)

    // Create materials
    console.log('📦 Creating materials...')
    const { data: materials } = await supabase
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

    console.log(`✅ Created ${materials.length} materials\n`)

    // Create systems
    console.log('⚙️ Creating systems...')
    const { data: systems } = await supabase
      .from('systems')
      .insert([
        {
          home_id: home1.id,
          type: 'HVAC',
          brand: 'Carrier',
          model: 'Infinity 20',
          install_date: '2015-03-15',
          warranty_until: '2025-03-15'
        },
        {
          home_id: home1.id,
          type: 'Water Heater',
          brand: 'Rheem',
          model: 'Performance Platinum',
          install_date: '2018-06-20',
          warranty_until: '2028-06-20'
        }
      ])
      .select()

    console.log(`✅ Created ${systems.length} systems\n`)

    // Create maintenance
    console.log('🔧 Creating maintenance tasks...')
    const futureDate = (days) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date.toISOString().split('T')[0]
    }

    const { data: maintenance } = await supabase
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
          home_id: home2.id,
          name: 'HVAC Service',
          frequency: 'Annually',
          next_due: futureDate(90)
        }
      ])
      .select()

    console.log(`✅ Created ${maintenance.length} maintenance tasks\n`)

    console.log('🎉 Database seeded successfully!\n')
    console.log('Summary:')
    console.log(`  • ${homes.length} homes`)
    console.log(`  • ${rooms.length} rooms`)
    console.log(`  • ${materials.length} materials`)
    console.log(`  • ${systems.length} systems`)
    console.log(`  • ${maintenance.length} maintenance tasks`)
    console.log('\n✨ Refresh your page to see the data!\n')

  } catch (error) {
    console.error('❌ Error:', error)
  }
})()
