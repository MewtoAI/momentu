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

/**
 * Extrai JSON de uma resposta que pode conter markdown code blocks
 */
function extractJSON(text: string): string {
  let cleaned = text.trim()
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
  }
  return cleaned
}

/**
 * Gera prompt emocional e contextual para a AI criar álbuns memoráveis
 */
function buildAlbumPrompt(
  photos: PhotoMeta[],
  questionnaire: any,
  pageCount: number
): string {
  const { occasion, style, specialMessage, names, productType } = questionnaire

  const photoDescriptions = photos.map((p, i) => ({
    id: p.id,
    url: p.url,
    isPortrait: p.isPortrait,
    index: i
  }))

  const occasionContext: Record<string, string> = {
    wedding: `Este é o dia mais importante da vida de ${names || 'um casal apaixonado'}. Cada foto carrega a emoção de um momento único. O primeiro olhar, a troca de alianças, a dança, os abraços da família. Crie legendas que façam quem lê sentir um nó na garganta.`,
    travel: `Aventuras que viram histórias para contar. ${names || 'Viajantes'} explorando o mundo, colecionando momentos únicos. Crie legendas que transportem o leitor para esses lugares.`,
    family: `Família é onde a vida começa e o amor nunca termina. ${names || 'Esta família'} está criando memórias que vão passar de geração em geração.`,
    baby: `Os primeiros momentos de uma nova vida. Cada foto é um tesouro. Este bebê está descobrindo o mundo.`,
    birthday: `Uma celebração de vida! Comemorando mais um ano de conquistas, risadas e memórias.`,
    graduation: `Anos de dedicação culminando neste momento. Uma conquista para celebrar.`,
  }

  const styleGuidance: Record<string, string> = {
    romantic: 'Tom: suave, emocional, poético. Evoque amor e ternura.',
    classic: 'Tom: elegante, atemporal, sofisticado.',
    vibrant: 'Tom: alegre, energético, cheio de vida!',
    minimal: 'Tom: clean, contemplativo, frases curtas e impactantes.',
    vintage: 'Tom: nostálgico, saudosista, como uma carta antiga.',
    bohemian: 'Tom: livre, artístico, autêntico.',
  }

  return `Você é um designer de álbuns de fotos profissional brasileiro com talento para contar histórias.

## CONTEXTO EMOCIONAL
${occasionContext[occasion] || 'Momentos especiais merecem ser eternizados.'}
${specialMessage ? `Mensagem do cliente: "${specialMessage}"` : ''}

## TOM E ESTILO
${styleGuidance[style] || styleGuidance.romantic}

## DADOS
- Ocasião: ${occasion}
- Estilo: ${style}
- Nomes: ${names || 'não especificado'}
- Tipo: ${productType}
- Fotos: ${photos.length}
- Páginas: ${pageCount}

## FOTOS DISPONÍVEIS
${JSON.stringify(photoDescriptions, null, 2)}

## REGRAS
1. Primeira página = capa (cover) com a foto mais impactante
2. Fotos paisagem em "single", retrato em "double" ou "triple"
3. NUNCA repita fotos
4. Crie narrativa visual

## REGRAS DE TEXTO (CRÍTICO!)
- TODOS os textos em PORTUGUÊS DO BRASIL
- Captions ÚNICAS e MEMORÁVEIS
- Nada de frases genéricas como "Momento especial" ou "Memórias felizes"

## EXEMPLOS BOAS CAPTIONS
✅ "O segundo em que o sim saiu dos seus lábios, o mundo parou"
✅ "Paris não estava pronta para a gente"
✅ "Avó e neta: 70 anos de diferença, o mesmo sorriso"

## FORMATO JSON (sem markdown!)
{
  "pages": [{"index": 0, "layoutType": "cover", "photos": [{"id": "1", "url": "..."}], "title": "...", "caption": "...", "mood": "..."}],
  "albumTitle": "...",
  "overallNarrative": "..."
}

layoutTypes: cover, single, double, triple, text_focus, back_cover

RESPONDA APENAS COM O JSON.`
}

async function planAlbumWithAI(
  photos: PhotoMeta[],
  questionnaire: any,
  pageCount: number
): Promise<AIAlbumPlan | null> {
  try {
    const prompt = buildAlbumPrompt(photos, questionnaire, pageCount)

    console.log(`\n🤖 Calling OpenAI (gpt-4o) for "${questionnaire.occasion}" album...`)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um designer de álbuns brasileiro. Responda APENAS com JSON válido, sem markdown. Todos os textos em português do Brasil.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })

    const responseText = completion.choices[0].message.content?.trim() || ''
    const jsonText = extractJSON(responseText)
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
