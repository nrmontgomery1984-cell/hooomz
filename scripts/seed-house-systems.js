import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../server/.env') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in server/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// House System Categories based on actual construction components
const HOUSE_SYSTEMS = {
  // HEATING & COOLING
  'HVAC System': { category: 'Heating & Cooling', typical_brands: ['Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman'] },
  'Furnace': { category: 'Heating & Cooling', typical_brands: ['Lennox', 'Carrier', 'Bryant', 'Trane'] },
  'Air Conditioner': { category: 'Heating & Cooling', typical_brands: ['Carrier', 'Trane', 'Rheem', 'Goodman'] },
  'Heat Pump': { category: 'Heating & Cooling', typical_brands: ['Carrier', 'Trane', 'Mitsubishi', 'Daikin'] },
  'Thermostat': { category: 'Heating & Cooling', typical_brands: ['Nest', 'Ecobee', 'Honeywell'] },

  // PLUMBING
  'Water Heater': { category: 'Plumbing', typical_brands: ['Rheem', 'AO Smith', 'Bradford White', 'Rinnai'] },
  'Water Softener': { category: 'Plumbing', typical_brands: ['Culligan', 'Kinetico', 'Fleck', 'Pelican'] },
  'Sump Pump': { category: 'Plumbing', typical_brands: ['Zoeller', 'Wayne', 'Superior Pump'] },
  'Well Pump': { category: 'Plumbing', typical_brands: ['Grundfos', 'Franklin', 'Goulds'] },
  'Septic System': { category: 'Plumbing', typical_brands: ['N/A'] },

  // ELECTRICAL
  'Electrical Panel': { category: 'Electrical', typical_brands: ['Square D', 'Siemens', 'GE', 'Cutler-Hammer'] },
  'Generator': { category: 'Electrical', typical_brands: ['Generac', 'Kohler', 'Briggs & Stratton', 'Honda'] },
  'Solar Panels': { category: 'Electrical', typical_brands: ['Tesla', 'LG', 'SunPower', 'Canadian Solar'] },

  // EXTERIOR ENVELOPE
  'Roof': { category: 'Exterior Envelope', typical_brands: ['CertainTeed', 'Owens Corning', 'GAF', 'IKO'] },
  'Siding': { category: 'Exterior Envelope', typical_brands: ['James Hardie', 'LP SmartSide', 'CertainTeed', 'Mastic'] },
  'Gutters & Downspouts': { category: 'Exterior Envelope', typical_brands: ['Aluminum', 'Copper', 'K-Guard'] },
  'Windows': { category: 'Exterior Envelope', typical_brands: ['Andersen', 'Pella', 'Marvin', 'Jeld-Wen'] },
  'Doors - Exterior': { category: 'Exterior Envelope', typical_brands: ['Therma-Tru', 'Masonite', 'Jeld-Wen', 'Pella'] },

  // WATER & AIR BARRIER
  'House Wrap': { category: 'Water & Air Barrier', typical_brands: ['Tyvek', 'Typar', 'ZIP System'] },
  'Vapor Barrier': { category: 'Water & Air Barrier', typical_brands: ['Poly sheeting', 'CertainTeed MemBrain'] },
  'Waterproofing': { category: 'Water & Air Barrier', typical_brands: ['Grace', 'Henry', 'Tremco'] },

  // STRUCTURAL
  'Foundation': { category: 'Structural', typical_brands: ['Poured Concrete', 'Block', 'Slab'] },
  'Framing': { category: 'Structural', typical_brands: ['Wood', 'Steel', 'Engineered Lumber'] },
  'Deck/Patio': { category: 'Structural', typical_brands: ['Trex', 'TimberTech', 'Azek', 'Pressure Treated'] },

  // INTERIOR FINISHES
  'Flooring System': { category: 'Interior Finishes', typical_brands: ['Hardwood', 'Tile', 'Carpet', 'LVP'] },
  'Drywall': { category: 'Interior Finishes', typical_brands: ['USG', 'National Gypsum', 'CertainTeed'] },
  'Insulation': { category: 'Interior Finishes', typical_brands: ['Owens Corning', 'Johns Manville', 'CertainTeed'] },
  'Interior Doors': { category: 'Interior Finishes', typical_brands: ['Masonite', 'Jeld-Wen', 'Molded', 'Solid Core'] },

  // APPLIANCES & FIXTURES
  'Kitchen Appliances': { category: 'Appliances', typical_brands: ['Whirlpool', 'GE', 'LG', 'Samsung', 'Bosch'] },
  'Washer/Dryer': { category: 'Appliances', typical_brands: ['Whirlpool', 'LG', 'Samsung', 'Maytag'] },
  'Garage Door System': { category: 'Garage', typical_brands: ['Chamberlain', 'LiftMaster', 'Genie', 'Clopay'] },

  // SAFETY & SECURITY
  'Smoke Detectors': { category: 'Safety', typical_brands: ['First Alert', 'Kidde', 'Nest Protect'] },
  'CO Detectors': { category: 'Safety', typical_brands: ['First Alert', 'Kidde', 'Nest'] },
  'Security System': { category: 'Safety', typical_brands: ['ADT', 'SimpliSafe', 'Ring', 'Vivint'] },
  'Fire Suppression': { category: 'Safety', typical_brands: ['Ansul', 'Pyro-Chem', 'Amerex'] }
}

async function seedHouseSystems() {
  try {
    console.log('🏠 Seeding House Systems...\n')

    // Get all homes
    const { data: homes, error: homesError } = await supabase
      .from('homes')
      .select('*')

    if (homesError) throw homesError

    if (!homes || homes.length === 0) {
      console.log('❌ No homes found. Please run seed-comprehensive.js first')
      return
    }

    console.log(`📊 Found ${homes.length} homes\n`)

    // Clear existing systems
    console.log('🗑️  Clearing existing systems...')
    const { error: deleteError } = await supabase
      .from('systems')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) throw deleteError
    console.log('✅ Cleared existing systems\n')

    // Create systems for each home
    console.log('⚙️  Creating house systems...')
    const systemsData = []

    homes.forEach((home, index) => {
      const homeAge = new Date().getFullYear() - home.year_built
      const isNewer = homeAge < 10
      const isMid = homeAge >= 10 && homeAge < 20

      // HEATING & COOLING
      systemsData.push({
        home_id: home.id,
        type: 'HVAC System',
        brand: isNewer ? 'Carrier' : (isMid ? 'Trane' : 'Lennox'),
        model: isNewer ? 'Infinity 20 Heat Pump' : (isMid ? 'XV18 TruComfort' : 'Elite Series'),
        serial: `HVAC${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-05-15`,
        warranty_until: `${home.year_built + 10}-05-15`,
        notes: `Central ${isNewer ? 'heat pump with variable speed' : 'AC and heat'} system, covers entire home`
      })

      systemsData.push({
        home_id: home.id,
        type: 'Thermostat',
        brand: isNewer ? 'Nest' : (isMid ? 'Ecobee' : 'Honeywell'),
        model: isNewer ? 'Learning Thermostat' : (isMid ? 'SmartThermostat' : 'T6 Pro'),
        serial: `THERM${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-05-20`,
        warranty_until: `${home.year_built + 2}-05-20`,
        notes: `${isNewer ? 'Smart thermostat with WiFi' : 'Programmable thermostat'}, zone control`
      })

      // PLUMBING
      systemsData.push({
        home_id: home.id,
        type: 'Water Heater',
        brand: 'Rheem',
        model: isNewer ? 'Performance Platinum' : 'Professional Classic',
        serial: `WH${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-06-01`,
        warranty_until: `${home.year_built + (isNewer ? 12 : 6)}-06-01`,
        notes: `${isNewer ? '50' : '40'} gallon, ${isNewer ? 'hybrid electric' : 'gas'} water heater`
      })

      // ELECTRICAL
      systemsData.push({
        home_id: home.id,
        type: 'Electrical Panel',
        brand: 'Square D',
        model: `${isNewer ? '200' : '150'} Amp Main Panel`,
        serial: `PANEL${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-03-01`,
        warranty_until: `${home.year_built + 25}-03-01`,
        notes: `${isNewer ? '200' : '150'} amp service, ${isNewer ? '40' : '24'} circuit panel`
      })

      // EXTERIOR ENVELOPE
      systemsData.push({
        home_id: home.id,
        type: 'Roof',
        brand: 'CertainTeed',
        model: 'Landmark Pro',
        serial: `ROOF${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: index % 3 === 0 ? `${home.year_built + 5}-08-15` : `${home.year_built}-04-01`,
        warranty_until: index % 3 === 0 ? `${home.year_built + 35}-08-15` : `${home.year_built + 30}-04-01`,
        notes: `Architectural shingles, ${index % 3 === 0 ? 'replaced 5 years after construction' : 'original roof'}, lifetime warranty`
      })

      systemsData.push({
        home_id: home.id,
        type: 'Windows',
        brand: isNewer ? 'Andersen' : 'Pella',
        model: isNewer ? '400 Series' : 'ThermaStar',
        serial: `WIN${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-03-10`,
        warranty_until: `${home.year_built + 20}-03-10`,
        notes: `${isNewer ? 'Double-hung vinyl windows' : 'Single-hung vinyl'}, ${isNewer ? 'Low-E glass' : 'Standard insulated glass'}`
      })

      systemsData.push({
        home_id: home.id,
        type: 'Siding',
        brand: home.sqft > 2500 ? 'James Hardie' : (isMid ? 'LP SmartSide' : 'CertainTeed'),
        model: home.sqft > 2500 ? 'HardiePlank' : (isMid ? 'Cedar Strand' : 'Cedar Impressions'),
        serial: `SID${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-03-15`,
        warranty_until: `${home.year_built + 30}-03-15`,
        notes: `${home.sqft > 2500 ? 'Fiber cement siding' : 'Engineered wood siding'}, full house exterior`
      })

      systemsData.push({
        home_id: home.id,
        type: 'Gutters & Downspouts',
        brand: 'Aluminum',
        model: '5-inch K-Style',
        serial: `GUTT${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-04-10`,
        warranty_until: `${home.year_built + 20}-04-10`,
        notes: 'Seamless aluminum gutters, 6 downspouts with extensions'
      })

      // STRUCTURAL
      systemsData.push({
        home_id: home.id,
        type: 'Foundation',
        brand: 'Poured Concrete',
        model: `${home.sqft > 3000 ? '10-inch' : '8-inch'} walls`,
        serial: `FOUND${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-01-15`,
        warranty_until: `${home.year_built + 50}-01-15`,
        notes: `${home.sqft > 3000 ? 'Full basement' : 'Crawl space'}, waterproofed exterior`
      })

      // INTERIOR FINISHES
      systemsData.push({
        home_id: home.id,
        type: 'Insulation',
        brand: 'Owens Corning',
        model: isNewer ? 'R-30 Attic, R-19 Walls' : 'R-21 Attic, R-13 Walls',
        serial: `INSUL${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-02-20`,
        warranty_until: `${home.year_built + 50}-02-20`,
        notes: `Fiberglass batt insulation, ${isNewer ? 'upgraded R-value' : 'standard code'}`
      })

      // GARAGE
      if (index % 2 === 0) {
        systemsData.push({
          home_id: home.id,
          type: 'Garage Door System',
          brand: 'LiftMaster',
          model: isNewer ? '8500W Elite Series' : '8360W',
          serial: `GAR${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: index % 4 === 0 ? `${home.year_built + 3}-09-01` : `${home.year_built}-04-05`,
          warranty_until: index % 4 === 0 ? `${home.year_built + 8}-09-01` : `${home.year_built + 5}-04-05`,
          notes: `${index % 4 === 0 ? 'Replaced opener 3 years after construction, ' : ''}WiFi enabled, battery backup`
        })
      }

      // SAFETY
      systemsData.push({
        home_id: home.id,
        type: 'Smoke Detectors',
        brand: isNewer ? 'Nest Protect' : 'First Alert',
        model: isNewer ? '2nd Generation' : 'OneLink',
        serial: `SMOKE${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: index % 3 === 0 ? `${home.year_built + 2}-03-01` : `${home.year_built}-04-15`,
        warranty_until: index % 3 === 0 ? `${home.year_built + 12}-03-01` : `${home.year_built + 10}-04-15`,
        notes: `${isNewer ? 'Smart interconnected detectors' : 'Hardwired with battery backup'}, all levels`
      })

      systemsData.push({
        home_id: home.id,
        type: 'CO Detectors',
        brand: isNewer ? 'Nest' : 'Kidde',
        model: isNewer ? 'Protect (combo)' : 'Nighthawk',
        serial: `CO${Math.random().toString(36).substring(7).toUpperCase()}`,
        install_date: `${home.year_built}-04-15`,
        warranty_until: `${home.year_built + 7}-04-15`,
        notes: 'Carbon monoxide detectors on all levels near bedrooms'
      })

      // OPTIONAL SYSTEMS (some homes)
      if (index % 3 === 0) {
        systemsData.push({
          home_id: home.id,
          type: 'Security System',
          brand: 'SimpliSafe',
          model: 'Gen 3',
          serial: `SEC${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: `${home.year_built + 1}-06-01`,
          warranty_until: `${home.year_built + 4}-06-01`,
          notes: 'Wireless security system, 8 sensors, doorbell camera, monitored'
        })
      }

      if (isNewer && index % 4 === 0) {
        systemsData.push({
          home_id: home.id,
          type: 'Solar Panels',
          brand: 'Tesla',
          model: 'Solar Roof',
          serial: `SOLAR${Math.random().toString(36).substring(7).toUpperCase()}`,
          install_date: `${home.year_built + 2}-07-15`,
          warranty_until: `${home.year_built + 27}-07-15`,
          notes: '8.2 kW system, Powerwall battery backup, net metering enabled'
        })
      }
    })

    const { data: systems, error: systemsError } = await supabase
      .from('systems')
      .insert(systemsData)
      .select()

    if (systemsError) throw systemsError
    console.log(`✅ Created ${systems.length} systems across ${homes.length} homes\n`)

    // Show breakdown
    const systemTypes = {}
    systems.forEach(s => {
      systemTypes[s.type] = (systemTypes[s.type] || 0) + 1
    })

    console.log('📊 System Breakdown:')
    Object.entries(systemTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })

    console.log('\n✅ House systems seeding complete!')

  } catch (error) {
    console.error('❌ Error seeding house systems:', error)
    throw error
  }
}

seedHouseSystems()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
