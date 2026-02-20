/**
 * Background Generator Agent
 * Generates backgrounds for album pages using DALL-E 3
 */

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return openai
}

let supabase: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabase
}

export interface BackgroundRequest {
  pageIndex: number
  bgPrompt: string
  sessionId: string
}

export interface GeneratedBackground {
  pageIndex: number
  url: string
  localPath?: string
}

/**
 * Gera um background com DALL-E 3 e salva no Supabase Storage
 */
async function generateBackground(request: BackgroundRequest): Promise<GeneratedBackground | null> {
  try {
    console.log(`Generating background for page ${request.pageIndex}...`)
    
    // Gerar imagem com DALL-E 3
    const response = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt: request.bgPrompt,
      size: '1024x1024',
      quality: 'standard', // 'standard' é mais barato e suficiente para backgrounds
      style: 'natural',
      n: 1,
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      console.error(`DALL-E returned no image for page ${request.pageIndex}`)
      return null
    }

    // Baixar a imagem gerada
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error(`Failed to download DALL-E image for page ${request.pageIndex}`)
      return null
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })

    // Salvar no Supabase Storage
    const storagePath = `backgrounds/${request.sessionId}/page_${request.pageIndex}.png`
    
    const { error: uploadError } = await getSupabase().storage
      .from('assets')
      .upload(storagePath, imageBlob, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error(`Failed to upload background to storage:`, uploadError)
      return null
    }

    // Obter URL pública
    const { data: urlData } = getSupabase().storage
      .from('assets')
      .getPublicUrl(storagePath)

    return {
      pageIndex: request.pageIndex,
      url: urlData.publicUrl,
      localPath: storagePath
    }

  } catch (error) {
    console.error(`Error generating background for page ${request.pageIndex}:`, error)
    return null
  }
}

/**
 * Gera backgrounds para múltiplas páginas em paralelo
 */
export async function generateBackgrounds(
  requests: BackgroundRequest[],
  concurrencyLimit = 2 // DALL-E é caro, limitar concorrência
): Promise<GeneratedBackground[]> {
  const results: GeneratedBackground[] = []

  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit)
    const batchPromises = batch.map(req => generateBackground(req))
    const batchResults = await Promise.all(batchPromises)
    
    results.push(...batchResults.filter((r): r is GeneratedBackground => r !== null))
    
    console.log(`Background generation: ${results.length}/${requests.length} completed`)
  }

  return results
}

/**
 * Cria um background de fallback sólido baseado no estilo
 */
export function createFallbackBackground(style: string): string {
  const fallbackColors: Record<string, string> = {
    romantic: '#FFF5F7',     // rosa muito claro
    classic: '#FFFFFF',       // branco puro
    vintage: '#F5F1E8',       // bege envelhecido
    vibrant: '#FFF9E6',       // amarelo muito claro
    minimal: '#FAFAFA',       // cinza muito claro
    bohemian: '#F9F6F1',      // off-white quente
  }

  return fallbackColors[style] || fallbackColors.minimal
}
