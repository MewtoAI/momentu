import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createBuckets() {
  console.log('🪣 Creating storage buckets...')

  const buckets = [
    {
      id: 'photos',
      name: 'photos',
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    },
    {
      id: 'pdfs',
      name: 'pdfs',
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/pdf'],
    },
  ]

  for (const bucket of buckets) {
    // Check if bucket already exists
    const { data: existing } = await supabase.storage.getBucket(bucket.id)

    if (existing) {
      console.log(`✓ Bucket '${bucket.id}' already exists`)
      continue
    }

    // Create bucket
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    })

    if (error) {
      console.error(`❌ Failed to create bucket '${bucket.id}':`, error.message)
    } else {
      console.log(`✅ Created bucket: ${bucket.id}`)
    }
  }

  console.log('✨ Storage setup complete!')
}

createBuckets().catch(console.error)
