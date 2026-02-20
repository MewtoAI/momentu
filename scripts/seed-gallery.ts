import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sample albums with real Unsplash photos (public URLs — no API key needed)
const GALLERY_ALBUMS = [
  {
    id: 'sample-wedding-romantic',
    style: 'romantic',
    occasion: 'wedding',
    title: 'Casamento Sarah & João',
    description: 'Um dia inesquecível cheio de amor e celebração',
    page_count: 15,
    photo_count: 24,
    thumbnail_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    preview_pages: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80',
    ],
    created_at: new Date('2025-12-15').toISOString(),
    is_featured: true,
  },
  {
    id: 'sample-family-classic',
    style: 'classic',
    occasion: 'family',
    title: 'Álbum da Família Silva',
    description: 'Momentos preciosos em família',
    page_count: 12,
    photo_count: 18,
    thumbnail_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
    preview_pages: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
      'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&q=80',
      'https://images.unsplash.com/photo-1542042161784-26ab9e041e89?w=800&q=80',
    ],
    created_at: new Date('2025-11-20').toISOString(),
    is_featured: true,
  },
  {
    id: 'sample-travel-vibrant',
    style: 'vibrant',
    occasion: 'travel',
    title: 'Aventuras pela Europa',
    description: 'Três semanas explorando cidades incríveis',
    page_count: 20,
    photo_count: 32,
    thumbnail_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    preview_pages: [
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&q=80',
    ],
    created_at: new Date('2026-01-10').toISOString(),
    is_featured: true,
  },
  {
    id: 'sample-birthday-vintage',
    style: 'vintage',
    occasion: 'birthday',
    title: 'Aniversário de 30 anos — Ana',
    description: 'Celebração especial com amigos e família',
    page_count: 10,
    photo_count: 15,
    thumbnail_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
    preview_pages: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    ],
    created_at: new Date('2025-10-05').toISOString(),
    is_featured: false,
  },
]

async function seedGallery() {
  console.log('🌱 Seeding gallery_albums...')

  for (const album of GALLERY_ALBUMS) {
    const { error } = await supabase
      .from('gallery_albums')
      .upsert(album, { onConflict: 'id' })

    if (error) {
      console.error(`❌ Failed to seed ${album.id}:`, error.message)
    } else {
      console.log(`✅ Seeded: ${album.title}`)
    }
  }

  console.log('✨ Gallery seed complete!')
}

seedGallery().catch(console.error)
