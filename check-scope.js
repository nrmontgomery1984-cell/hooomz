import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres.zbntvglgrtkhgbfxpnca:Hoomz2024!!@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
});

await client.connect();

// Get categories for the project
const categoriesResult = await client.query(`
  SELECT id, name, display_order
  FROM scope_categories
  WHERE project_id = '66f444e1-b0ba-4995-85e2-beb402ea4d24'
  ORDER BY display_order
`);

console.log('Categories found:', categoriesResult.rows.length);

for (const category of categoriesResult.rows) {
  console.log(`\nCategory: ${category.name}`);

  // Get subcategories for each category
  const subcategoriesResult = await client.query(`
    SELECT name, display_order
    FROM scope_subcategories
    WHERE category_id = $1
    ORDER BY display_order
  `, [category.id]);

  console.log(`  Subcategories (${subcategoriesResult.rows.length}):`);
  subcategoriesResult.rows.forEach(sub => {
    console.log(`    - ${sub.name}`);
  });
}

await client.end();
