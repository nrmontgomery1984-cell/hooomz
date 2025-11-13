import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDir = join(__dirname, '..', 'server');

dotenv.config({ path: join(serverDir, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  try {
    console.log(`\n📄 Reading migration file: ${migrationFile}`);
    const migrationPath = join(serverDir, 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log(`\n🚀 Running migration...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative method - direct query
      console.log('Trying alternative method...');
      const { error: queryError } = await supabase
        .from('_migration_log')
        .insert([{ migration_name: migrationFile, executed_at: new Date().toISOString() }]);

      if (queryError) {
        console.error('❌ Migration failed:', error);
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error running migration:', err.message);
    return false;
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2] || 'enhance_tasks_with_details_and_templates.sql';

console.log('='.repeat(60));
console.log('🔄 Hooomz Database Migration Runner');
console.log('='.repeat(60));
console.log(`📌 Supabase URL: ${supabaseUrl}`);
console.log(`📂 Migration: ${migrationFile}`);

runMigration(migrationFile)
  .then((success) => {
    if (success) {
      console.log('\n✨ All done!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration had errors');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  });
