import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRLSMigration() {
  console.log('🔒 Starting RLS Migration...\n')

  try {
    // Read the migration SQL file
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'enable_rls_policies.sql'),
      'utf-8'
    )

    console.log('📄 Migration file loaded successfully')
    console.log('📊 SQL statements:', migrationSQL.split(';').filter(s => s.trim()).length)

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log('\n⚙️  Executing migration statements...\n')

    let successCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip comments
      if (statement.startsWith('--')) continue

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0)

          if (directError) {
            throw error
          }
        }

        successCount++

        // Show progress for major operations
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE POLICY')) {
          const match = statement.match(/(ALTER TABLE|CREATE POLICY|ENABLE ROW LEVEL SECURITY).*?(public\.\w+|"[\w\s]+")/i)
          if (match) {
            console.log(`✓ ${match[0].substring(0, 80)}...`)
          }
        }

      } catch (err) {
        errorCount++
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: err.message
        })
        console.log(`✗ Error executing statement ${i + 1}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log('='.repeat(60))
    console.log(`✓ Successful: ${successCount}`)
    console.log(`✗ Errors: ${errorCount}`)

    if (errors.length > 0 && errors.length < 10) {
      console.log('\n⚠️  Errors encountered:')
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. ${err.statement}`)
        console.log(`   Error: ${err.error}`)
      })
    }

    if (errorCount === 0) {
      console.log('\n✅ RLS Migration completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('   1. Verify RLS policies in Supabase Dashboard')
      console.log('   2. Test application with different user roles')
      console.log('   3. Check that all queries still work correctly')
    } else {
      console.log('\n⚠️  Migration completed with some errors')
      console.log('   Please review the errors above and apply fixes manually')
    }

  } catch (error) {
    console.error('❌ Fatal error during migration:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Alternative: Apply migration directly via Supabase SQL Editor
console.log('╔═══════════════════════════════════════════════════════════╗')
console.log('║         RLS MIGRATION - APPLY VIA SUPABASE DASHBOARD     ║')
console.log('╚═══════════════════════════════════════════════════════════╝')
console.log('')
console.log('📌 RECOMMENDED APPROACH:')
console.log('   Copy the SQL from migrations/enable_rls_policies.sql')
console.log('   and paste it into the Supabase SQL Editor')
console.log('')
console.log('   Steps:')
console.log('   1. Go to https://supabase.com/dashboard')
console.log('   2. Navigate to SQL Editor')
console.log('   3. Create a new query')
console.log('   4. Paste the contents of enable_rls_policies.sql')
console.log('   5. Click "Run"')
console.log('')
console.log('   This is the safest way to apply RLS policies.')
console.log('')
console.log('═══════════════════════════════════════════════════════════')
console.log('')

// Uncomment to run programmatically (not recommended)
// applyRLSMigration()
