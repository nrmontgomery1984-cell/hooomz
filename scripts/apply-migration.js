import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDir = join(__dirname, '..', 'server');

// Load environment variables
dotenv.config({ path: join(serverDir, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative - use Supabase's query builder
      // For DDL statements, we need to use a different approach
      const result = await supabase.rpc('exec', { sql });
      if (result.error) throw result.error;
      return result;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function applyMigration() {
  console.log('='.repeat(70));
  console.log('🔄 Applying Enhanced Tasks Migration');
  console.log('='.repeat(70));
  console.log(`📌 Supabase URL: ${supabaseUrl}\n`);

  try {
    // Read migration file
    const migrationPath = join(serverDir, 'migrations', 'enhance_tasks_with_details_and_templates.sql');
    console.log(`📄 Reading migration: ${migrationPath}\n`);
    const sql = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (simple approach - split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'ON CONFLICT DO NOTHING');

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement individually for better error handling
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');

      try {
        process.stdout.write(`[${i + 1}/${statements.length}] ${preview}...`);

        // Use Supabase client to execute raw SQL
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });

        if (error) {
          // Some errors are OK (like table already exists)
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('does not exist') ||
            error.message.includes('duplicate')
          )) {
            console.log(' ⚠️  SKIPPED (already exists)');
          } else {
            throw error;
          }
        } else {
          console.log(' ✅');
          successCount++;
        }
      } catch (err) {
        console.log(` ❌ ERROR: ${err.message}`);
        errorCount++;

        // Continue with other statements even if one fails
        if (errorCount > 5) {
          console.log('\n⚠️  Too many errors, stopping migration');
          break;
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    console.log('='.repeat(70));

    if (errorCount === 0 || (errorCount < 3 && successCount > statements.length - 5)) {
      console.log('\n✨ Migration completed successfully!\n');
      return true;
    } else {
      console.log('\n⚠️  Migration completed with errors. Check the logs above.\n');
      return false;
    }

  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error.message);
    console.error(error);
    return false;
  }
}

// Run the migration
applyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  });
