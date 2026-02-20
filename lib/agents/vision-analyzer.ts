/**
 * Vision Analyzer Agent
 * Analyzes photos using GPT-4o Vision to extract content, emotion, type, quality, and suggested slot
 */

import OpenAI from 'openai'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return openai
}

export interface PhotoInput {
  id: string
  url: string
  width: number
  height: number
}

export interface PhotoAnalysis {
  content: string       // "casal se beijando ao pôr do sol"
  emotion: string       // "muito emocional, romântico"
  type: 'key_moment' | 'contextual' | 'portrait' | 'detail' | 'landscape_scene'
  quality: 'excellent' | 'good' | 'usable'
  suggestedSlot: 'portrait' | 'landscape' | 'square'
}

export interface AnalyzedPhoto extends PhotoInput {
  isPortrait: boolean
  analysis: PhotoAnalysis
}

const VISION_PROMPT = `Analise esta foto para um álbum de memórias.

Responda APENAS com JSON válido neste formato exato:
{
  "content": "descrição do que está na foto (máximo 20 palavras em português)",
  "emotion": "sentimento predominante que a foto evoca",
  "type": "key_moment" | "contextual" | "portrait" | "detail" | "landscape_scene",
  "quality": "excellent" | "good" | "usable",
  "suggestedSlot": "portrait" | "landscape" | "square"
}

Critérios:
- content: descreva objetivamente o que vê (pessoas, lugares, ações)
- emotion: qual emoção a foto transmite (alegria, romance, nostalgia, etc)
- type: 
  * key_moment = momento marcante (beijo, troca de alianças, primeiro olhar)
  * contextual = cena que contextualiza (igreja, decoração, paisagem)
  * portrait = retrato de pessoa(s), foco em expressões
  * detail = detalhes (anéis, flores, detalhes da roupa)
  * landscape_scene = paisagem ampla, cenário
- quality: avalie nitidez, composição, iluminação
- suggestedSlot: baseado na composição, qual formato funciona melhor
  * portrait = 2:3 ou 3:4 (vertical)
  * landscape = 3:2 ou 4:3 (horizontal)
  * square = 1:1 (quadrado ou funciona bem cortado)

Responda APENAS com o JSON, sem markdown, sem explicações.`

/**
 * Analisa uma única foto com GPT-4o Vision
 */
async function analyzePhoto(photo: PhotoInput): Promise<AnalyzedPhoto | null> {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: VISION_PROMPT
            },
            {
              type: 'image_url',
              image_url: {
                url: photo.url,
                detail: 'low' // 'low' é mais barato e suficiente para análise de álbum
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3, // Baixa temperatura para respostas mais consistentes
    })

    const responseText = completion.choices[0].message.content?.trim() || ''
    
    if (!responseText) {
      console.error(`Vision analysis returned empty for photo ${photo.id}`)
      return null
    }

    // Extrair JSON (pode vir com ou sem markdown)
    let jsonText = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    const analysis: PhotoAnalysis = JSON.parse(jsonText)

    // Validar campos obrigatórios
    if (!analysis.content || !analysis.emotion || !analysis.type || !analysis.quality || !analysis.suggestedSlot) {
      console.error(`Invalid analysis structure for photo ${photo.id}:`, analysis)
      return null
    }

    // Determinar se é portrait baseado nas dimensões
    const isPortrait = photo.height > photo.width

    return {
      ...photo,
      isPortrait,
      analysis
    }

  } catch (error) {
    console.error(`Error analyzing photo ${photo.id}:`, error)
    return null
  }
}

/**
 * Analisa um array de fotos em paralelo (com limite de concorrência)
 */
export async function analyzePhotos(photos: PhotoInput[]): Promise<AnalyzedPhoto[]> {
  const CONCURRENCY_LIMIT = 3 // Processar 3 fotos por vez para não explodir a API

  const results: AnalyzedPhoto[] = []
  
  for (let i = 0; i < photos.length; i += CONCURRENCY_LIMIT) {
    const batch = photos.slice(i, i + CONCURRENCY_LIMIT)
    const batchPromises = batch.map(photo => analyzePhoto(photo))
    const batchResults = await Promise.all(batchPromises)
    
    // Filtrar nulls e adicionar aos resultados
    results.push(...batchResults.filter((r): r is AnalyzedPhoto => r !== null))
    
    console.log(`Vision analysis: ${results.length}/${photos.length} photos analyzed`)
  }

  // Fallback para fotos que falharam: usar metadados básicos
  const analyzedIds = new Set(results.map(r => r.id))
  const failedPhotos = photos.filter(p => !analyzedIds.has(p.id))
  
  for (const photo of failedPhotos) {
    const isPortrait = photo.height > photo.width
    results.push({
      ...photo,
      isPortrait,
      analysis: {
        content: 'Momento especial',
        emotion: 'memória preciosa',
        type: 'contextual',
        quality: 'good',
        suggestedSlot: isPortrait ? 'portrait' : (photo.width === photo.height ? 'square' : 'landscape')
      }
    })
  }

  return results
}
