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
  console.log('🌱 Hooomz Profile - Comprehensive Database Seeder\n')

  try {
    // Get first user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) throw userError
    if (!users || users.length === 0) {
      console.error('❌ No users found. Please create a user account first.')
      process.exit(1)
    }

    const userId = users[0].id
    const userEmail = users[0].email

    console.log(`👤 Seeding comprehensive data for: ${userEmail}\n`)

    // Delete existing data for this user
    console.log('🧹 Cleaning up existing data...')
    await supabase.from('homes').delete().eq('owner_id', userId)
    console.log('✅ Cleaned up\n')

    // Create 10 homes with diverse data
    console.log('🏠 Creating 10 homes...')
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
        },
        {
          owner_id: userId,
          address: '789 Pine Road, Calgary, AB T2P 3H9',
          year_built: 2018,
          sqft: 2400
        },
        {
          owner_id: userId,
          address: '321 Elm Street, Montreal, QC H3B 1A1',
          year_built: 2005,
          sqft: 1600
        },
        {
          owner_id: userId,
          address: '654 Birch Lane, Ottawa, ON K1P 5G4',
          year_built: 2020,
          sqft: 2200
        },
        {
          owner_id: userId,
          address: '987 Cedar Court, Halifax, NS B3H 1Y9',
          year_built: 2012,
          sqft: 1900
        },
        {
          owner_id: userId,
          address: '159 Willow Way, Winnipeg, MB R3C 2B2',
          year_built: 2016,
          sqft: 2100
        },
        {
          owner_id: userId,
          address: '753 Spruce Street, Edmonton, AB T5J 1E7',
          year_built: 2008,
          sqft: 1750
        },
        {
          owner_id: userId,
          address: '852 Ash Avenue, Victoria, BC V8W 1P8',
          year_built: 2019,
          sqft: 2300
        },
        {
          owner_id: userId,
          address: '951 Poplar Place, Saskatoon, SK S7K 0J5',
          year_built: 2014,
          sqft: 1850
        }
      ])
      .select()

    if (homesError) throw homesError
    console.log(`✅ Created ${homes.length} homes\n`)

    // Create rooms for each home
    console.log('🚪 Creating rooms...')
    const roomsData = []

    homes.forEach((home, index) => {
      const baseRooms = [
        { home_id: home.id, name: 'Living Room', floor: 1, notes: 'Main living space with large windows' },
        { home_id: home.id, name: 'Kitchen', floor: 1, notes: 'Modern kitchen with granite countertops' },
        { home_id: home.id, name: 'Master Bedroom', floor: 2, notes: 'Spacious master with walk-in closet' },
        { home_id: home.id, name: 'Master Bathroom', floor: 2, notes: 'En-suite with double vanity' },
        { home_id: home.id, name: 'Bedroom 2', floor: 2, notes: 'Guest bedroom' },
        { home_id: home.id, name: 'Bedroom 3', floor: 2, notes: 'Kids bedroom' },
        { home_id: home.id, name: 'Bathroom 2', floor: 2, notes: 'Hall bathroom with tub/shower combo' },
        { home_id: home.id, name: 'Dining Room', floor: 1, notes: 'Formal dining area' },
        { home_id: home.id, name: 'Laundry Room', floor: 1, notes: 'Dedicated laundry space' },
        { home_id: home.id, name: 'Garage', floor: 0, notes: '2-car garage' }
      ]

      // Add basement rooms for older homes
      if (home.year_built < 2015) {
        baseRooms.push(
          { home_id: home.id, name: 'Basement', floor: 0, notes: 'Finished basement with rec room' },
          { home_id: home.id, name: 'Storage Room', floor: 0, notes: 'Unfinished storage area' }
        )
      }

      roomsData.push(...baseRooms)
    })

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .insert(roomsData)
      .select()

    if (roomsError) throw roomsError
    console.log(`✅ Created ${rooms.length} rooms\n`)

    // Create comprehensive materials
    console.log('📦 Creating materials...')
    const materialsData = []

    homes.forEach((home) => {
      const homeRooms = rooms.filter(r => r.home_id === home.id)
      const livingRoom = homeRooms.find(r => r.name === 'Living Room')
      const kitchen = homeRooms.find(r => r.name === 'Kitchen')
      const masterBed = homeRooms.find(r => r.name === 'Master Bedroom')
      const masterBath = homeRooms.find(r => r.name === 'Master Bathroom')
      const bathroom2 = homeRooms.find(r => r.name === 'Bathroom 2')
      const dining = homeRooms.find(r => r.name === 'Dining Room')

      // Living room materials
      if (livingRoom) {
        materialsData.push(
          {
            home_id: home.id,
            room_id: livingRoom.id,
            category: 'flooring',
            brand: 'Armstrong',
            model: 'Prime Harvest Oak',
            color: 'Natural',
            supplier: 'Home Depot',
            purchase_date: '2023-06-15',
            purchase_price: 3500.00,
            notes: 'Engineered hardwood, 5-inch planks, installed professionally'
          },
          {
            home_id: home.id,
            room_id: livingRoom.id,
            category: 'paint',
            brand: 'Benjamin Moore',
            model: 'Regal Select',
            color: 'Simply White',
            supplier: 'Lowes',
            purchase_date: '2023-07-20',
            purchase_price: 150.00,
            notes: 'Eggshell finish, walls and ceiling'
          }
        )
      }

      // Kitchen materials
      if (kitchen) {
        materialsData.push(
          {
            home_id: home.id,
            room_id: kitchen.id,
            category: 'countertop',
            brand: 'Cambria',
            model: 'Quartz',
            color: 'Torquay',
            supplier: 'Kitchen & Bath Gallery',
            purchase_date: '2023-05-10',
            purchase_price: 4200.00,
            notes: '2cm thickness, polished finish, undermount sink cutout'
          },
          {
            home_id: home.id,
            room_id: kitchen.id,
            category: 'paint',
            brand: 'Sherwin Williams',
            model: 'Duration',
            color: 'Alabaster',
            supplier: 'Sherwin Williams Store',
            purchase_date: '2023-05-01',
            purchase_price: 180.00,
            notes: 'Satin finish, kitchen and trim'
          },
          {
            home_id: home.id,
            room_id: kitchen.id,
            category: 'tile',
            brand: 'Daltile',
            model: 'Subway Tile',
            color: 'White',
            supplier: 'Tile Shop',
            purchase_date: '2023-05-15',
            purchase_price: 800.00,
            notes: 'Backsplash, 3x6 inch tiles with gray grout'
          },
          {
            home_id: home.id,
            room_id: kitchen.id,
            category: 'fixture',
            brand: 'Kohler',
            model: 'Simplice',
            color: 'Stainless',
            supplier: 'Ferguson',
            purchase_date: '2023-06-01',
            purchase_price: 350.00,
            notes: 'Pull-down kitchen faucet with spray'
          }
        )
      }

      // Master bathroom materials
      if (masterBath) {
        materialsData.push(
          {
            home_id: home.id,
            room_id: masterBath.id,
            category: 'tile',
            brand: 'Daltile',
            model: 'Marble Attache',
            color: 'Calacatta',
            supplier: 'Tile Shop',
            purchase_date: '2023-04-12',
            purchase_price: 1800.00,
            notes: 'Floor and shower surround, 12x24 inch'
          },
          {
            home_id: home.id,
            room_id: masterBath.id,
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
            home_id: home.id,
            room_id: masterBath.id,
            category: 'fixture',
            brand: 'Delta',
            model: 'Linden',
            color: 'Chrome',
            supplier: 'Home Depot',
            purchase_date: '2023-08-05',
            purchase_price: 425.00,
            notes: 'Shower head and hand shower combo'
          }
        )
      }

      // Bedroom materials
      if (masterBed) {
        materialsData.push(
          {
            home_id: home.id,
            room_id: masterBed.id,
            category: 'flooring',
            brand: 'Shaw',
            model: 'Carpet Supreme',
            color: 'Soft Taupe',
            supplier: 'Carpet One',
            purchase_date: '2023-03-20',
            purchase_price: 1200.00,
            notes: 'Plush carpet with upgraded padding'
          },
          {
            home_id: home.id,
            room_id: masterBed.id,
            category: 'paint',
            brand: 'Behr',
            model: 'Premium Plus',
            color: 'Silver Drop',
            supplier: 'Home Depot',
            purchase_date: '2023-04-01',
            purchase_price: 85.00,
            notes: 'Flat finish, accent wall'
          }
        )
      }

      // Second bathroom materials
      if (bathroom2) {
        materialsData.push(
          {
            home_id: home.id,
            room_id: bathroom2.id,
            category: 'tile',
            brand: 'American Olean',
            model: 'Ceramic',
            color: 'Bone',
            supplier: 'Lowes',
            purchase_date: '2023-02-15',
            purchase_price: 950.00,
            notes: 'Floor tile, 12x12 inch with non-slip finish'
          }
        )
      }
    })

    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .insert(materialsData)
      .select()

    if (materialsError) throw materialsError
    console.log(`✅ Created ${materials.length} materials\n`)

    // Create comprehensive systems
    console.log('⚙️ Creating systems...')
    const systemsData = []

    homes.forEach((home) => {
      systemsData.push(
        // HVAC
        {
          home_id: home.id,
          type: 'HVAC',
          brand: home.year_built > 2015 ? 'Carrier' : 'Trane',
          model: home.year_built > 2015 ? 'Infinity 20' : 'XR16',
          serial: `HVAC${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: `${home.year_built}-03-15`,
          warranty_until: `${home.year_built + 10}-03-15`,
          notes: home.year_built > 2015 ? 'Central air conditioning and heating, 3-ton unit, high efficiency' : 'Central air, consider upgrade soon'
        },
        // Furnace
        {
          home_id: home.id,
          type: 'Furnace',
          brand: 'Lennox',
          model: home.year_built > 2015 ? 'Elite Series EL296V' : 'Merit Series',
          serial: `FURN${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: `${home.year_built}-03-15`,
          warranty_until: `${home.year_built + 10}-03-15`,
          notes: home.year_built > 2015 ? '96% efficiency, variable speed blower' : '80% efficiency, single stage'
        },
        // Water Heater
        {
          home_id: home.id,
          type: 'Water Heater',
          brand: 'Rheem',
          model: 'Performance Platinum',
          serial: `WH${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: `${home.year_built + 3}-06-20`,
          warranty_until: `${home.year_built + 13}-06-20`,
          notes: '50-gallon gas tank, basement location, self-cleaning'
        },
        // Electrical Panel
        {
          home_id: home.id,
          type: 'Electrical',
          brand: 'Square D',
          model: 'Homeline',
          serial: `EP${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: `${home.year_built}-01-10`,
          warranty_until: `${home.year_built + 5}-01-10`,
          notes: '200 amp main panel, 40 circuits'
        },
        // Roof
        {
          home_id: home.id,
          type: 'Roof',
          brand: 'GAF',
          model: 'Timberline HDZ',
          serial: `ROOF${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: `${Math.max(home.year_built, 2015)}-08-01`,
          warranty_until: `${Math.max(home.year_built, 2015) + 25}-08-01`,
          notes: 'Architectural shingles, Charcoal color, 25-year warranty'
        }
      )

      // Add garage door opener for homes with garages
      systemsData.push({
        home_id: home.id,
        type: 'Garage Door',
        brand: 'LiftMaster',
        model: '8500W',
        serial: `GD${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built + 2}-04-15`,
        warranty_until: `${home.year_built + 7}-04-15`,
        notes: 'WiFi-enabled opener, battery backup, MyQ app compatible'
      })
    })

    const { data: systems, error: systemsError } = await supabase
      .from('systems')
      .insert(systemsData)
      .select()

    if (systemsError) throw systemsError
    console.log(`✅ Created ${systems.length} systems\n`)

    // Create comprehensive maintenance tasks
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

    const maintenanceData = []

    homes.forEach((home) => {
      maintenanceData.push(
        // Monthly tasks
        {
          home_id: home.id,
          name: 'HVAC Filter Replacement',
          frequency: 'Monthly',
          next_due: futureDate(15),
          last_completed: pastDate(30),
          notes: 'Replace with 16x25x1 MERV 11 filter, check every 30 days'
        },
        {
          home_id: home.id,
          name: 'Test Smoke & CO Detectors',
          frequency: 'Monthly',
          next_due: futureDate(20),
          last_completed: pastDate(25),
          notes: 'Press test button on all detectors, replace batteries as needed'
        },
        // Quarterly tasks
        {
          home_id: home.id,
          name: 'Clean Refrigerator Coils',
          frequency: 'Quarterly',
          next_due: futureDate(60),
          last_completed: pastDate(30),
          notes: 'Vacuum coils on back or bottom of refrigerator'
        },
        {
          home_id: home.id,
          name: 'Test Garage Door Safety Features',
          frequency: 'Quarterly',
          next_due: futureDate(75),
          notes: 'Test auto-reverse on object and force settings'
        },
        // Bi-annual tasks
        {
          home_id: home.id,
          name: 'Gutter Cleaning',
          frequency: 'Bi-annually',
          next_due: futureDate(45),
          last_completed: pastDate(180),
          notes: 'Clean gutters before spring and fall, check downspouts for clogs'
        },
        {
          home_id: home.id,
          name: 'HVAC System Service',
          frequency: 'Bi-annually',
          next_due: futureDate(90),
          last_completed: pastDate(180),
          notes: 'Professional service before heating and cooling seasons'
        },
        {
          home_id: home.id,
          name: 'Dryer Vent Cleaning',
          frequency: 'Bi-annually',
          next_due: futureDate(120),
          notes: 'Clean lint from dryer vent pipe and exterior vent, fire prevention'
        },
        // Annual tasks
        {
          home_id: home.id,
          name: 'Water Heater Flush',
          frequency: 'Annually',
          next_due: futureDate(200),
          notes: 'Drain 2-3 gallons to remove sediment, extend tank life'
        },
        {
          home_id: home.id,
          name: 'Chimney Inspection',
          frequency: 'Annually',
          next_due: futureDate(250),
          notes: 'Professional inspection and cleaning if needed'
        },
        {
          home_id: home.id,
          name: 'Pest Control Treatment',
          frequency: 'Annually',
          next_due: futureDate(180),
          last_completed: pastDate(185),
          notes: 'Preventive treatment for ants, spiders, rodents'
        },
        {
          home_id: home.id,
          name: 'Deck/Patio Seal & Stain',
          frequency: 'Annually',
          next_due: futureDate(150),
          notes: 'Power wash and re-seal wooden deck, check for rot'
        },
        {
          home_id: home.id,
          name: 'Window Well Cleaning',
          frequency: 'Annually',
          next_due: futureDate(100),
          notes: 'Remove debris, check drainage, clean covers'
        }
      )
    })

    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance')
      .insert(maintenanceData)
      .select()

    if (maintenanceError) throw maintenanceError
    console.log(`✅ Created ${maintenance.length} maintenance tasks\n`)

    // Create comprehensive documents
    console.log('📄 Creating documents...')
    const documentsData = []

    homes.forEach((home) => {
      // Essential documents for each home
      documentsData.push(
        {
          home_id: home.id,
          category: 'Purchase',
          file_name: 'purchase_agreement.pdf',
          file_url: 'placeholder-url',
          file_size: 2048000
        },
        {
          home_id: home.id,
          category: 'Purchase',
          file_name: 'home_inspection_report.pdf',
          file_url: 'placeholder-url',
          file_size: 5120000
        },
        {
          home_id: home.id,
          category: 'Insurance',
          file_name: 'homeowners_insurance_policy.pdf',
          file_url: 'placeholder-url',
          file_size: 1024000
        },
        {
          home_id: home.id,
          category: 'Warranty',
          file_name: 'home_warranty.pdf',
          file_url: 'placeholder-url',
          file_size: 512000
        },
        {
          home_id: home.id,
          category: 'Tax',
          file_name: 'property_tax_2024.pdf',
          file_url: 'placeholder-url',
          file_size: 256000
        },
        {
          home_id: home.id,
          category: 'Improvement',
          file_name: 'renovation_permits.pdf',
          file_url: 'placeholder-url',
          file_size: 768000
        },
        {
          home_id: home.id,
          category: 'Manual',
          file_name: 'appliance_manuals.pdf',
          file_url: 'placeholder-url',
          file_size: 3072000
        },
        {
          home_id: home.id,
          category: 'Utility',
          file_name: 'utility_accounts.pdf',
          file_url: 'placeholder-url',
          file_size: 128000
        }
      )
    })

    const { data: documents, error: documentsError} = await supabase
      .from('documents')
      .insert(documentsData)
      .select()

    if (documentsError) throw documentsError
    console.log(`✅ Created ${documents.length} documents\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Comprehensive database seed complete!\n')
    console.log('📊 Summary:')
    console.log(`   • ${homes.length} homes`)
    console.log(`   • ${rooms.length} rooms`)
    console.log(`   • ${materials.length} materials`)
    console.log(`   • ${systems.length} systems`)
    console.log(`   • ${maintenance.length} maintenance tasks`)
    console.log(`   • ${documents.length} documents`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`✨ Log into the app as ${userEmail} to see all the data!\n`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.details) console.error('Details:', error.details)
    process.exit(1)
  }
}

seedDatabase()
