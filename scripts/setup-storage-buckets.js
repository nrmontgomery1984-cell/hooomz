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

/**
 * Setup Supabase Storage Buckets for Hooomz Profile™
 *
 * Creates storage buckets for:
 * - materials: Photos of materials (flooring, paint, fixtures, etc.)
 * - systems: Photos of house systems (HVAC, appliances, serial numbers, etc.)
 * - documents: User-uploaded documents (PDFs, manuals, warranties)
 * - maintenance: Maintenance task photos (before/after, issues, etc.)
 */

const BUCKETS = [
  {
    name: 'materials',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  },
  {
    name: 'systems',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  },
  {
    name: 'documents',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
  },
  {
    name: 'maintenance',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  }
]

async function setupStorageBuckets() {
  console.log('🗄️  Setting up Supabase Storage Buckets...\n')

  for (const bucket of BUCKETS) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets()
      const bucketExists = existingBuckets?.find(b => b.name === bucket.name)

      if (bucketExists) {
        console.log(`✓ Bucket "${bucket.name}" already exists`)
        continue
      }

      // Create bucket
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      })

      if (error) {
        console.error(`❌ Error creating bucket "${bucket.name}":`, error.message)
        continue
      }

      console.log(`✓ Created bucket "${bucket.name}"`)
      console.log(`  - Public: ${bucket.public}`)
      console.log(`  - Max file size: ${bucket.fileSizeLimit / 1024 / 1024}MB`)
      console.log(`  - Allowed types: ${bucket.allowedMimeTypes.join(', ')}`)
      console.log()

    } catch (err) {
      console.error(`❌ Exception creating bucket "${bucket.name}":`, err.message)
    }
  }

  console.log('\n📋 Setting up storage policies...')
  await setupStoragePolicies()

  console.log('\n✅ Storage setup complete!')
}

/**
 * Setup Row Level Security (RLS) policies for storage buckets
 * Policies allow authenticated users to:
 * - Upload files to their own home folders
 * - Read all public files
 * - Delete their own files
 */
async function setupStoragePolicies() {
  const policies = [
    // Materials bucket policies
    {
      bucket: 'materials',
      name: 'Allow authenticated users to upload materials',
      definition: 'authenticated',
      operation: 'INSERT'
    },
    {
      bucket: 'materials',
      name: 'Allow public read access to materials',
      definition: 'true',
      operation: 'SELECT'
    },
    {
      bucket: 'materials',
      name: 'Allow users to delete their materials',
      definition: 'authenticated',
      operation: 'DELETE'
    },

    // Systems bucket policies
    {
      bucket: 'systems',
      name: 'Allow authenticated users to upload systems',
      definition: 'authenticated',
      operation: 'INSERT'
    },
    {
      bucket: 'systems',
      name: 'Allow public read access to systems',
      definition: 'true',
      operation: 'SELECT'
    },
    {
      bucket: 'systems',
      name: 'Allow users to delete their systems',
      definition: 'authenticated',
      operation: 'DELETE'
    },

    // Documents bucket policies
    {
      bucket: 'documents',
      name: 'Allow authenticated users to upload documents',
      definition: 'authenticated',
      operation: 'INSERT'
    },
    {
      bucket: 'documents',
      name: 'Allow public read access to documents',
      definition: 'true',
      operation: 'SELECT'
    },
    {
      bucket: 'documents',
      name: 'Allow users to delete their documents',
      definition: 'authenticated',
      operation: 'DELETE'
    },

    // Maintenance bucket policies
    {
      bucket: 'maintenance',
      name: 'Allow authenticated users to upload maintenance photos',
      definition: 'authenticated',
      operation: 'INSERT'
    },
    {
      bucket: 'maintenance',
      name: 'Allow public read access to maintenance photos',
      definition: 'true',
      operation: 'SELECT'
    },
    {
      bucket: 'maintenance',
      name: 'Allow users to delete their maintenance photos',
      definition: 'authenticated',
      operation: 'DELETE'
    }
  ]

  console.log('\n⚠️  Note: Storage policies must be created via Supabase Dashboard')
  console.log('Go to: Storage > Policies in your Supabase project\n')
  console.log('Create the following policies:\n')

  policies.forEach(policy => {
    console.log(`Bucket: ${policy.bucket}`)
    console.log(`  Policy Name: ${policy.name}`)
    console.log(`  Operation: ${policy.operation}`)
    console.log(`  Definition: ${policy.definition}`)
    console.log()
  })

  console.log('Or run this SQL in the SQL Editor:\n')
  console.log('-- Enable RLS on storage.objects')
  console.log('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\n')

  policies.forEach(policy => {
    const policyName = policy.name.toLowerCase().replace(/ /g, '_')
    console.log(`-- ${policy.name}`)
    console.log(`CREATE POLICY "${policyName}"`)
    console.log(`ON storage.objects FOR ${policy.operation}`)
    console.log(`TO ${policy.definition}`)
    console.log(`USING (bucket_id = '${policy.bucket}');`)
    console.log()
  })
}

// Run the setup
setupStorageBuckets().catch(console.error)
