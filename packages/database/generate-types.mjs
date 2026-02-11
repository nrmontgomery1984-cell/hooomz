/**
 * Generate TypeScript types from the live database schema.
 * Queries information_schema and pg_catalog to produce database.types.ts.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL env var required. Example:');
  console.error('  DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" node generate-types.mjs');
  process.exit(1);
}

const sql = postgres(dbUrl, {
  ssl: 'require',
  connection: { application_name: 'hooomz-typegen' },
});

// 1. Get all enum types
const enums = await sql`
  SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public'
  GROUP BY t.typname
  ORDER BY t.typname;
`;

// 2. Get all tables and columns
const columns = await sql`
  SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name IN (
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    )
  ORDER BY c.table_name, c.ordinal_position;
`;

// Map PostgreSQL types to TypeScript types
function pgToTs(col) {
  const { data_type, udt_name } = col;

  // Check if it's an enum
  const enumMatch = enums.find(e => e.typname === udt_name);
  if (enumMatch) return `Database['public']['Enums']['${udt_name}']`;

  // Array types
  if (data_type === 'ARRAY') {
    const baseType = udt_name.replace(/^_/, '');
    const enumArr = enums.find(e => e.typname === baseType);
    if (enumArr) return `Database['public']['Enums']['${baseType}'][]`;
    const mapped = mapSimpleType(baseType);
    return `${mapped}[]`;
  }

  return mapSimpleType(udt_name);
}

function mapSimpleType(udt) {
  switch (udt) {
    case 'uuid': return 'string';
    case 'text': case 'varchar': case 'char': case 'bpchar': case 'name': return 'string';
    case 'int2': case 'int4': case 'int8': case 'float4': case 'float8': case 'numeric': return 'number';
    case 'bool': return 'boolean';
    case 'json': case 'jsonb': return 'Json';
    case 'timestamptz': case 'timestamp': return 'string';
    case 'date': return 'string';
    case 'time': case 'timetz': return 'string';
    case 'interval': return 'string';
    case 'bytea': return 'string';
    default: return 'string';
  }
}

function isNullable(col) {
  return col.is_nullable === 'YES';
}

function hasDefault(col) {
  return col.column_default !== null;
}

// Group columns by table
const tableMap = new Map();
for (const col of columns) {
  if (!tableMap.has(col.table_name)) tableMap.set(col.table_name, []);
  tableMap.get(col.table_name).push(col);
}

// Build the output
let output = `/**
 * AUTO-GENERATED — DO NOT EDIT
 * Generated from live Supabase schema on ${new Date().toISOString().split('T')[0]}
 * Run: node packages/database/generate-types.mjs
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
`;

for (const [tableName, cols] of tableMap) {
  output += `      ${tableName}: {\n`;

  // Row type (what you get when you SELECT)
  output += `        Row: {\n`;
  for (const col of cols) {
    const tsType = pgToTs(col);
    const nullable = isNullable(col) ? ' | null' : '';
    output += `          ${col.column_name}: ${tsType}${nullable};\n`;
  }
  output += `        };\n`;

  // Insert type (what you send for INSERT)
  output += `        Insert: {\n`;
  for (const col of cols) {
    const tsType = pgToTs(col);
    const nullable = isNullable(col) ? ' | null' : '';
    const optional = (hasDefault(col) || isNullable(col)) ? '?' : '';
    output += `          ${col.column_name}${optional}: ${tsType}${nullable};\n`;
  }
  output += `        };\n`;

  // Update type (what you send for UPDATE — all optional)
  output += `        Update: {\n`;
  for (const col of cols) {
    const tsType = pgToTs(col);
    const nullable = isNullable(col) ? ' | null' : '';
    output += `          ${col.column_name}?: ${tsType}${nullable};\n`;
  }
  output += `        };\n`;

  output += `      };\n`;
}

output += `    };\n`;

// Views
output += `    Views: {\n      [_ in never]: never;\n    };\n`;

// Functions
output += `    Functions: {\n      [_ in never]: never;\n    };\n`;

// Enums
output += `    Enums: {\n`;
for (const e of enums) {
  output += `      ${e.typname}:\n`;
  output += e.values.map(v => `        | '${v}'`).join('\n');
  output += `;\n`;
}
output += `    };\n`;

output += `  };\n};\n`;

// Write the file
const outPath = join(import.meta.dirname, 'database.types.ts');
writeFileSync(outPath, output, 'utf-8');
console.log(`Generated ${outPath}`);
console.log(`  Tables: ${tableMap.size}`);
console.log(`  Enums: ${enums.length}`);

await sql.end();
