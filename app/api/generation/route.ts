import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { planAlbum, PhotoMeta } from '@/lib/agents/curator'
import { STYLE_CONFIGS, getStyleLayouts } from '@/lib/styles'
import { AlbumStyle } from '@/lib/types'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

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

/**
 * Extrai JSON de uma resposta que pode conter markdown code blocks
 */
function extractJSON(text: string): string {
  // Remove blocos de código markdown (```json ... ``` ou ``` ... ```)
  let cleaned = text.trim()
  
  // Tenta encontrar JSON dentro de code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }
  
  // Remove possíveis prefixos/sufixos não-JSON
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
  pageCount: number,
  isSample: boolean
): string {
  const occasion = questionnaire.occasion || 'memories'
  const style = questionnaire.style || 'romantic'
  const specialMessage = questionnaire.specialMessage || ''
  const names = questionnaire.names || ''
  const productType = questionnaire.productType || 'print'

  const photoDescriptions = photos.map((p, i) => ({
    id: p.id,
    url: p.url,
    isPortrait: p.isPortrait,
    index: i
  }))

  // Contexto emocional por ocasião
  const occasionContext: Record<string, string> = {
    wedding: `Este é o dia mais importante da vida de ${names || 'um casal apaixonado'}. Cada foto carrega a emoção de um momento único que nunca vai se repetir. O primeiro olhar, a troca de alianças, a dança, os abraços da família. Crie legendas que façam quem lê sentir um nó na garganta de emoção.`,
    birthday: `Uma celebração de vida! ${names ? `${names} está` : 'Alguém está'} comemorando mais um ano de conquistas, risadas e memórias. Capture a alegria, a gratidão pelo caminho percorrido e a esperança pelo futuro.`,
    baby: `Os primeiros momentos de uma nova vida. Cada foto é um tesouro - o primeiro sorriso, os dedinhos pequenos, o olhar cheio de descobertas. ${names ? `Bebê ${names}` : 'Este bebê'} está descobrindo o mundo, e estas fotos são a prova de que milagres existem.`,
    travel: `Aventuras que viram histórias para contar. ${names || 'Viajantes'} explorando o mundo, colecionando momentos únicos. Cada destino deixou uma marca na alma. Crie legendas que transportem o leitor para esses lugares.`,
    family: `Família é onde a vida começa e o amor nunca termina. ${names || 'Esta família'} está criando memórias que vão passar de geração em geração. Cada foto é um pedaço de história.`,
    graduation: `Anos de dedicação culminando neste momento. ${names || 'Um formando'} conquistou um sonho. Crie legendas que celebrem a jornada, o esforço e o orgulho desta conquista.`,
    other: `Momentos especiais merecem ser eternizados. ${names ? `Para ${names}` : 'Para quem vai receber este álbum'}, cada foto conta uma parte de uma história única.`
  }

  // Tom por estilo
  const styleGuidance: Record<string, string> = {
    romantic: 'Tom: suave, emocional, poético. Use metáforas delicadas. Evoque amor e ternura.',
    classic: 'Tom: elegante, atemporal, sofisticado. Linguagem refinada sem ser rebuscada.',
    vibrant: 'Tom: alegre, energético, cheio de vida. Exclamações são bem-vindas. Celebre a energia!',
    minimal: 'Tom: clean, contemplativo, frases curtas e impactantes. Menos é mais.',
    vintage: 'Tom: nostálgico, saudosista, como uma carta antiga. Evoque memórias.',
    bohemian: 'Tom: livre, artístico, autêntico. Celebre a singularidade e a liberdade.'
  }

  return `Você é um designer de álbuns de fotos profissional com talento especial para contar histórias através de imagens e palavras.

## CONTEXTO EMOCIONAL (MUITO IMPORTANTE)
${occasionContext[occasion] || occasionContext.other}

${specialMessage ? `\nMensagem especial do cliente: "${specialMessage}"` : ''}

## TOM E ESTILO
Estilo escolhido: ${style}
${styleGuidance[style] || styleGuidance.romantic}

## DADOS TÉCNICOS
- Ocasião: ${occasion}
- Estilo: ${style}
- Nomes: ${names || 'não especificado'}
- Tipo: ${productType === 'print' ? 'álbum impresso' : 'álbum digital'}
- Total de fotos disponíveis: ${photos.length}
- Total de páginas a criar: ${pageCount}
${isSample ? '- ATENÇÃO: Esta é uma AMOSTRA de 2 páginas (capa + 1 interior) para preview.' : ''}

## FOTOS DISPONÍVEIS
${JSON.stringify(photoDescriptions, null, 2)}

## REGRAS DE LAYOUT
1. Primeira página = capa (layoutType: "cover") com a foto mais impactante
2. Fotos paisagem funcionam bem em "single"
3. Fotos retrato combinam bem em "double" ou "triple"
4. A cada 4-5 páginas, inclua uma "text_focus" (página só com texto/frase marcante)
${!isSample ? '5. Última página = "back_cover" com mensagem de fechamento' : '5. Na amostra, apenas capa + 1 página interior'}
6. NUNCA repita a mesma foto em páginas diferentes
7. Crie uma narrativa visual - as páginas devem fluir como uma história

## REGRAS DE TEXTO (CRÍTICO!)
- TODOS os textos DEVEM ser em PORTUGUÊS DO BRASIL
- Captions devem ser ÚNICAS e MEMORÁVEIS - nada de frases genéricas como "Momento especial"
- Cada caption deve fazer o leitor SENTIR algo
- Use linguagem natural brasileira (não de Portugal)
- Para casamento: evoque o amor eterno, a escolha de uma vida juntos
- Para bebê: capture a inocência, o milagre da vida
- Para viagem: transporte o leitor para o momento
- Para família: celebre os laços que unem

## EXEMPLOS DE CAPTIONS RUINS (NÃO USE!)
❌ "Momento especial"
❌ "Memórias felizes"
❌ "Dia incrível"
❌ "Amor eterno"

## EXEMPLOS DE CAPTIONS BOAS
✅ "O segundo em que o sim saiu dos seus lábios, o mundo parou"
✅ "Dez dedinhos perfeitos. Um coração que já é nosso pra sempre."
✅ "Paris não estava pronta para a gente"
✅ "Avó e neta: 70 anos de diferença, o mesmo sorriso"

## FORMATO DE RESPOSTA
Retorne APENAS JSON válido, sem markdown, sem explicações:
{
  "pages": [
    {
      "index": 0,
      "layoutType": "cover",
      "photos": [{"id": "1", "url": "..."}],
      "title": "Título em português",
      "caption": "Legenda emocional em português",
      "mood": "romantic"
    }
  ],
  "albumTitle": "Título principal do álbum em português",
  "overallNarrative": "Uma frase que resume a história deste álbum"
}

layoutTypes disponíveis: cover, single, double, triple, text_focus, back_cover

RESPONDA APENAS COM O JSON.`
}

async function planAlbumWithAI(
  photos: PhotoMeta[],
  questionnaire: any,
  pageCount: number,
  isSample: boolean
): Promise<AIAlbumPlan | null> {
  const maxRetries = 2
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const prompt = buildAlbumPrompt(photos, questionnaire, pageCount, isSample)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um designer de álbuns de fotos profissional brasileiro. Responda APENAS com JSON válido, sem markdown, sem explicações. Todos os textos devem ser em português do Brasil.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Levemente menor para JSON mais confiável
        max_tokens: 3000,
      }, {
        timeout: 60000, // 60 segundos timeout
      })

      const responseText = completion.choices[0].message.content?.trim() || ''
      
      if (!responseText) {
        console.error(`AI returned empty response (attempt ${attempt + 1})`)
        continue
      }

      const jsonText = extractJSON(responseText)
      
      let aiPlan: AIAlbumPlan
      try {
        aiPlan = JSON.parse(jsonText)
      } catch (parseError) {
        console.error(`JSON parse error (attempt ${attempt + 1}):`, parseError)
        console.error('Raw response:', responseText.substring(0, 500))
        continue
      }
      
      // Validar estrutura
      if (!aiPlan.pages || !Array.isArray(aiPlan.pages) || aiPlan.pages.length === 0) {
        console.error(`Invalid AI response structure (attempt ${attempt + 1}):`, aiPlan)
        continue
      }

      // Validar que cada página tem fotos válidas
      for (const page of aiPlan.pages) {
        if (!page.photos || !Array.isArray(page.photos)) {
          page.photos = []
        }
        // Garantir que os IDs de foto existem
        page.photos = page.photos.filter(p => 
          photos.some(original => original.id === p.id)
        )
      }

      return aiPlan

    } catch (error) {
      console.error(`AI planning error (attempt ${attempt + 1}):`, error)
      if (attempt === maxRetries) {
        return null
      }
      // Espera antes de retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, type } = await req.json()

    if (!sessionId || !type) {
      return NextResponse.json({ error: 'sessionId e type obrigatórios' }, { status: 400 })
    }

    // 1. Buscar session
    const { data: session, error: sessionError } = await supabase
      .from('album_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session não encontrada' }, { status: 404 })
    }

    // 2. Criar job
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        session_id: sessionId,
        type,
        status: 'processing',
        pages_total: type === 'sample' ? 2 : (session.page_count || 10),
        pages_done: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Erro ao criar job' }, { status: 500 })
    }

    // 3. Buscar fotos do Storage
    const { data: storageFiles } = await supabase.storage
      .from('photos')
      .list(`albums/${sessionId}`)

    // 4. Gerar URLs públicas das fotos
    const photoMetas: PhotoMeta[] = (storageFiles || []).map((file, i) => {
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(`albums/${sessionId}/${file.name}`)

      return {
        id: file.id || String(i),
        url: urlData.publicUrl,
        width: 1000,
        height: 1500,
        isPortrait: true
      }
    })

    const questionnaire = session.questionnaire || {}
    const style = (questionnaire.style || 'romantic') as AlbumStyle
    const pageCount = type === 'sample' ? 2 : (session.page_count || 10)
    const isSample = type === 'sample'

    // 5. Tentar AI primeiro, fallback para curator
    let pagePlan
    const aiPlan = await planAlbumWithAI(photoMetas, questionnaire, pageCount, isSample)
    
    if (aiPlan) {
      // Converter AI plan para formato do curator
      pagePlan = aiPlan.pages.map(page => ({
        index: page.index,
        layoutType: page.layoutType,
        photos: page.photos.map(p => photoMetas.find(pm => pm.id === p.id) || photoMetas[0]),
        textHints: [page.caption || page.title || ''].filter(Boolean)
      }))
    } else {
      // Fallback: usar curator tradicional
      console.warn('AI planning failed, falling back to curator')
      const groupings = session.groupings || []
      pagePlan = planAlbum(photoMetas, questionnaire, groupings, pageCount)
    }

    // 6. Montar estrutura de resposta para o frontend renderizar
    const styleConfig = STYLE_CONFIGS[style]
    const layouts = getStyleLayouts(style)

    const albumStructure = {
      sessionId,
      jobId: job.id,
      style,
      styleConfig: {
        backgroundPath: styleConfig.backgroundPath,
        colors: styleConfig.colors,
        font: styleConfig.font,
        bodyFont: styleConfig.bodyFont,
      },
      pages: pagePlan.map(plan => {
        const layout = layouts.find(l => l.type === plan.layoutType) || layouts[0]
        return {
          index: plan.index,
          layoutType: plan.layoutType,
          layout,
          photos: plan.photos.map(p => ({ id: p.id, url: p.url })),
          textHints: plan.textHints,
          adjustmentAnnotations: session.adjustment_annotations || []
        }
      }),
      format: session.format || 'print_20x20',
      pageCount,
      aiGenerated: aiPlan !== null
    }

    // 7. Atualizar job como concluído
    await supabase
      .from('generation_jobs')
      .update({
        status: 'done',
        pages_done: pageCount,
        result_url: JSON.stringify(albumStructure),
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    // 8. Atualizar session
    await supabase
      .from('album_sessions')
      .update({ status: type === 'sample' ? 'sample_ready' : 'done' })
      .eq('id', sessionId)

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      albumStructure
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: 'Erro interno na geração' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) return NextResponse.json({ error: 'jobId obrigatório' }, { status: 400 })

  const { data: job } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  return NextResponse.json({ job })
}
