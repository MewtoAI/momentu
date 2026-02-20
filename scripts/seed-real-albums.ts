#!/usr/bin/env tsx
/**
 * Seed script - Cria 3 álbuns exemplo reais usando fotos do Unsplash + AI
 * Roda com: npx tsx scripts/seed-real-albums.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

interface PhotoMeta {
  id: string
  url: string
  isPortrait: boolean
}

interface AIAlbumPlan {
  pages: Array<{
    index: number
    layoutType: 'cover' | 'single' | 'double' | 'triple' | 'text_focus' | 'back_cover'
    photos: Array<{ id: string; url: string }>
    title?: string
    caption?: string
    mood?: string
  }>
  albumTitle: string
  overallNarrative?: string
}

// Fotos do Unsplash por tema
const ALBUM_TEMPLATES = [
  {
    title: 'Sarah & João',
    occasion: 'wedding',
    style: 'romantic',
    productType: 'print',
    specialMessage: 'O dia mais feliz das nossas vidas',
    names: 'Sarah e João',
    photos: [
      { id: '1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', isPortrait: false },
      { id: '2', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800', isPortrait: true },
      { id: '3', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800', isPortrait: false },
      { id: '4', url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800', isPortrait: true },
      { id: '5', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800', isPortrait: false },
      { id: '6', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800', isPortrait: true },
      { id: '7', url: 'https://images.unsplash.com/photo-1594735512664-6f7b27f1e14a?w=800', isPortrait: false },
      { id: '8', url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800', isPortrait: true },
    ],
  },
  {
    title: 'Aventura pela Europa',
    occasion: 'travel',
    style: 'vibrant',
    productType: 'digital',
    specialMessage: 'As melhores memórias da nossa viagem dos sonhos',
    names: 'Marina e Pedro',
    photos: [
      { id: '1', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', isPortrait: false },
      { id: '2', url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800', isPortrait: true },
      { id: '3', url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800', isPortrait: false },
      { id: '4', url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800', isPortrait: true },
      { id: '5', url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800', isPortrait: false },
      { id: '6', url: 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=800', isPortrait: true },
      { id: '7', url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', isPortrait: false },
      { id: '8', url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800', isPortrait: false },
    ],
  },
  {
    title: 'Nossa Família',
    occasion: 'family',
    style: 'classic',
    productType: 'print',
    specialMessage: 'Momentos preciosos em família',
    names: 'Família Silva',
    photos: [
      { id: '1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800', isPortrait: false },
      { id: '2', url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800', isPortrait: true },
      { id: '3', url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800', isPortrait: false },
      { id: '4', url: 'https://images.unsplash.com/photo-1540479859555-17af45c78602?w=800', isPortrait: true },
      { id: '5', url: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=800', isPortrait: false },
      { id: '6', url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800', isPortrait: true },
    ],
  },
]

async function planAlbumWithAI(
  photos: PhotoMeta[],
  questionnaire: any,
  pageCount: number
): Promise<AIAlbumPlan | null> {
  try {
    const { occasion, style, specialMessage, names, productType } = questionnaire

    const photoDescriptions = photos.map((p, i) => ({
      id: p.id,
      url: p.url,
      isPortrait: p.isPortrait,
      index: i
    }))

    const prompt = `You are a professional photo album designer. You will receive information about a user's photos and create an album layout plan.

User's questionnaire:
- Occasion: ${occasion}
- Style: ${style}
- Special message: ${specialMessage}
- Names: ${names}
- Product type: ${productType}

Available photos (${photos.length} total):
${JSON.stringify(photoDescriptions, null, 2)}

Create a ${pageCount}-page album for the gallery showcase.

Rules:
1. First page is always the cover (layoutType: "cover") with the best/most representative photo
2. Mix layouts creatively based on photo orientations
3. Generate meaningful captions in Portuguese (pt-BR) based on the occasion and style
4. For wedding: romantic, emotional captions. For travel: adventurous. For family: tender.
5. Landscape photos work best as "single". Portrait photos can be "double" or "triple".
6. Every 4-5 pages, include a "text_focus" page with a quote or message.
7. Last page is "back_cover"
8. Choose photos that tell a story — chronological or emotional flow.
9. Use different photos on each page — don't repeat.

Return ONLY valid JSON matching this schema:
{
  "pages": [
    {
      "index": 0,
      "layoutType": "cover",
      "photos": [{"id": "...", "url": "..."}],
      "title": "Album title",
      "caption": "Subtitle or date",
      "mood": "romantic/adventurous/tender/etc"
    }
  ],
  "albumTitle": "Main album title",
  "overallNarrative": "Brief description of the album story"
}

Available layoutTypes: cover, single, double, triple, text_focus, back_cover

Return ONLY the JSON. No markdown, no explanation, no \`\`\`json blocks.`

    console.log(`\n🤖 Calling OpenAI (gpt-4o) for "${questionnaire.occasion}" album...`)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional photo album designer AI. You respond ONLY with valid JSON, no markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0].message.content?.trim() || ''
    
    // Remove markdown code blocks if present
    let jsonText = responseText
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }

    const aiPlan: AIAlbumPlan = JSON.parse(jsonText)
    
    if (!aiPlan.pages || !Array.isArray(aiPlan.pages) || aiPlan.pages.length === 0) {
      console.error('❌ Invalid AI response structure')
      return null
    }

    console.log(`✅ AI generated ${aiPlan.pages.length} pages`)
    return aiPlan

  } catch (error) {
    console.error('❌ AI planning error:', error)
    return null
  }
}

function convertAIPlanToPreviewPages(aiPlan: AIAlbumPlan): any[] {
  return aiPlan.pages.slice(0, 4).map(page => {
    // Converter para formato esperado pelo AlbumPagePreview
    const photos = page.photos.map((p, idx) => {
      // Layout simplificado baseado no tipo
      let x = 0.1, y = 0.1, width = 0.8, height = 0.8
      
      if (page.layoutType === 'cover') {
        x = 0.1
        y = 0.15
        width = 0.8
        height = 0.6
      } else if (page.layoutType === 'double' && idx === 0) {
        x = 0.05
        y = 0.1
        width = 0.42
        height = 0.7
      } else if (page.layoutType === 'double' && idx === 1) {
        x = 0.53
        y = 0.1
        width = 0.42
        height = 0.7
      } else if (page.layoutType === 'triple') {
        if (idx === 0) { x = 0.05; y = 0.1; width = 0.9; height = 0.35 }
        if (idx === 1) { x = 0.05; y = 0.48; width = 0.42; height = 0.45 }
        if (idx === 2) { x = 0.53; y = 0.48; width = 0.42; height = 0.45 }
      }

      return {
        url: p.url,
        x,
        y,
        width,
        height
      }
    })

    const texts: any[] = []
    if (page.title) {
      texts.push({
        text: page.title,
        x: 0.1,
        y: page.layoutType === 'cover' ? 0.8 : 0.85,
        width: 0.8,
        height: 0.1,
        align: 'center'
      })
    }
    if (page.caption && page.layoutType === 'cover') {
      texts.push({
        text: page.caption,
        x: 0.1,
        y: 0.88,
        width: 0.8,
        height: 0.08,
        align: 'center'
      })
    }

    return {
      photos,
      texts,
      caption: page.caption
    }
  })
}

async function seedAlbum(template: typeof ALBUM_TEMPLATES[0]) {
  console.log(`\n📸 Creating album: "${template.title}"`)
  
  const pageCount = 4 // Gerar 4 páginas para amostra
  
  const questionnaire = {
    occasion: template.occasion,
    style: template.style,
    specialMessage: template.specialMessage,
    names: template.names,
    productType: template.productType,
  }

  const aiPlan = await planAlbumWithAI(template.photos, questionnaire, pageCount)
  
  if (!aiPlan) {
    console.error(`❌ Failed to generate AI plan for "${template.title}"`)
    return
  }

  const previewPages = convertAIPlanToPreviewPages(aiPlan)
  const thumbnailUrl = aiPlan.pages[0]?.photos[0]?.url || template.photos[0].url

  const { data, error } = await supabase
    .from('gallery_albums')
    .insert({
      title: aiPlan.albumTitle || template.title,
      style: template.style,
      occasion: template.occasion,
      product_type: template.productType,
      thumbnail_url: thumbnailUrl,
      preview_pages: previewPages,
      is_featured: false,
    })
    .select()

  if (error) {
    console.error(`❌ Error inserting album:`, error)
  } else {
    console.log(`✅ Album created: ${data[0].id}`)
  }
}

async function main() {
  console.log('🌱 Seeding real gallery albums with AI...\n')

  for (const template of ALBUM_TEMPLATES) {
    await seedAlbum(template)
    // Pequena pausa entre chamadas para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n✨ Seed complete!')
}

main().catch(console.error)
