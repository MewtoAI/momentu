import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sample albums with real Unsplash photos — fields match gallery_albums schema exactly
const GALLERY_ALBUMS = [
  {
    title: 'Casamento Sarah & João',
    style: 'romantic',
    occasion: 'wedding',
    product_type: 'print',
    thumbnail_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    preview_pages: JSON.stringify([
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80',
    ]),
    is_featured: true,
  },
  {
    title: 'Álbum da Família Silva',
    style: 'classic',
    occasion: 'family',
    product_type: 'print',
    thumbnail_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
    preview_pages: JSON.stringify([
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
      'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&q=80',
      'https://images.unsplash.com/photo-1542042161784-26ab9e041e89?w=800&q=80',
    ]),
    is_featured: true,
  },
  {
    title: 'Aventuras pela Europa',
    style: 'vibrant',
    occasion: 'travel',
    product_type: 'digital',
    thumbnail_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    preview_pages: JSON.stringify([
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    ]),
    is_featured: true,
  },
  {
    title: 'Aniversário de 30 anos — Ana',
    style: 'vintage',
    occasion: 'birthday',
    product_type: 'print',
    thumbnail_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
    preview_pages: JSON.stringify([
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    ]),
    is_featured: false,
  },
  {
    title: 'Primeiro Ano — Bernardo',
    style: 'minimal',
    occasion: 'baby',
    product_type: 'print',
    thumbnail_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
    preview_pages: JSON.stringify([
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80',
    ]),
    is_featured: true,
  },
  {
    title: 'Formatura 2025 — Turma de Medicina',
    style: 'classic',
    occasion: 'graduation',
    product_type: 'print',
    thumbnail_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
    preview_pages: JSON.stringify([
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      'https://images.unsplash.com/photo-1627556704302-624286467c65?w=800&q=80',
    ]),
    is_featured: false,
  },
]

async function seedGallery() {
  console.log('🌱 Seeding gallery_albums...')

  // Limpa registros antigos sem thumbnail real
  const { error: deleteError } = await supabase
    .from('gallery_albums')
    .delete()
    .is('thumbnail_url', null)

  if (deleteError) {
    console.log('ℹ️ Nada para limpar ou erro:', deleteError.message)
  }

  for (const album of GALLERY_ALBUMS) {
    const { data, error } = await supabase
      .from('gallery_albums')
      .insert(album)
      .select('id, title')
      .single()

    if (error) {
      console.error(`❌ Failed to seed ${album.title}:`, error.message)
    } else {
      console.log(`✅ Seeded: ${data.title} (${data.id})`)
    }
  }

  console.log('✨ Gallery seed complete!')
}

seedGallery().catch(console.error)
