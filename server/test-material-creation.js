import { supabase } from './src/utils/supabase.js'

async function testMaterialColumns() {
  console.log('🔍 Checking if product_image_url and manual_url columns exist...')

  try {
    // Try to select these columns
    const { data, error } = await supabase
      .from('materials')
      .select('id, product_image_url, manual_url')
      .limit(1)

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n❌ COLUMNS DO NOT EXIST')
        console.log('You need to run the migration in Supabase SQL Editor!')
        console.log('\nGo to: https://supabase.com/dashboard')
        console.log('SQL Editor → New Query → Paste this:\n')
        console.log('ALTER TABLE materials')
        console.log('ADD COLUMN IF NOT EXISTS product_image_url TEXT,')
        console.log('ADD COLUMN IF NOT EXISTS manual_url TEXT;')
        return false
      }
      throw error
    }

    console.log('✅ Columns exist!')
    console.log('Data:', data)
    return true
  } catch (err) {
    console.error('Error:', err.message)
    return false
  }
}

testMaterialColumns().then(() => process.exit(0))
