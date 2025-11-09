import { readFileSync } from 'fs'
import { supabase } from './src/utils/supabase.js'

/**
 * Run database migration to add product_image_url and manual_url columns
 */
async function runMigration() {
  try {
    console.log('🚀 Running migration: add_product_image_manual.sql')

    // Read the SQL file
    const sql = readFileSync('./migrations/add_product_image_manual.sql', 'utf-8')
    console.log('📄 SQL:', sql)

    // Run the migration by executing raw SQL
    // Since we can't use RPC for DDL, we'll use the REST API approach
    const { data, error } = await supabase.rpc('exec', { sql_query: sql }).catch(async () => {
      // If RPC doesn't work, try direct query
      console.log('⚠️  RPC not available, trying direct query approach...')

      // Execute each statement separately
      const statements = sql.split(';').filter(s => s.trim())

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`)
          // We need to use the direct database connection
          // For Supabase, migrations should be run via the SQL Editor in the dashboard
          console.log('⚠️  Please run this migration via Supabase SQL Editor:')
          console.log('1. Go to https://supabase.com/dashboard')
          console.log('2. Select your project')
          console.log('3. Go to SQL Editor')
          console.log('4. Paste and run the migration from: migrations/add_product_image_manual.sql')
          return
        }
      }
    })

    if (error) {
      console.error('❌ Migration failed:', error)
      console.log('\n📌 Please run the migration manually via Supabase SQL Editor:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Go to SQL Editor')
      console.log('4. Paste and run this SQL:\n')
      console.log(sql)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
    console.log('   - Added product_image_url column to materials table')
    console.log('   - Added manual_url column to materials table')
    console.log('   - Created indexes for better query performance')

    process.exit(0)
  } catch (err) {
    console.error('❌ Error running migration:', err.message)
    console.log('\n📌 Please run the migration manually via Supabase SQL Editor:')
    console.log('   Open the file: migrations/add_product_image_manual.sql')
    console.log('   And paste it into the Supabase SQL Editor')
    process.exit(1)
  }
}

runMigration()
