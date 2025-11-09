import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { supabase } from '../src/utils/supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Run SQL migration file
 * Usage: node run-migration.js <migration-file.sql>
 */
async function runMigration() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('❌ Please provide a migration file name')
    console.error('Usage: node run-migration.js <migration-file.sql>')
    process.exit(1)
  }

  const migrationPath = join(__dirname, migrationFile)

  try {
    console.log(`📄 Reading migration file: ${migrationFile}`)
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Running migration...')
    console.log('SQL:', sql)

    // Execute raw SQL using Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
    if (data) {
      console.log('Result:', data)
    }

  } catch (err) {
    console.error('❌ Error running migration:', err.message)
    process.exit(1)
  }
}

runMigration()
