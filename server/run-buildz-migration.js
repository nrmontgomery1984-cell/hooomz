import { readFileSync } from 'fs'
import supabase from './src/utils/supabase.js'

/**
 * Run Buildz time tracking migration
 */
async function runMigration() {
  try {
    console.log('🚀 Running migration: create_buildz_time_tracking.sql')

    // Read the SQL file
    const sql = readFileSync('./migrations/create_buildz_time_tracking.sql', 'utf-8')

    console.log('📄 Loaded migration file')
    console.log('⚠️  This migration must be run via Supabase SQL Editor')
    console.log('')
    console.log('📌 Steps to run migration:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Create a new query')
    console.log('5. Paste the contents of: server/migrations/create_buildz_time_tracking.sql')
    console.log('6. Click "Run" to execute the migration')
    console.log('')
    console.log('✅ This migration will create:')
    console.log('   - phases table with standard construction phases')
    console.log('   - categories table for work packages')
    console.log('   - sub_categories table for specific tasks')
    console.log('   - Enhanced time_entries with rounding, breaks, approval')
    console.log('   - payroll_settings table')
    console.log('   - budget_tracking table')
    console.log('   - activity_log table')
    console.log('   - Helper functions for time rounding and pay period calculation')

    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

runMigration()
