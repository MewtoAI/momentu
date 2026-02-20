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

async function planAlbumWithAI(
  photos: PhotoMeta[],
  questionnaire: any,
  pageCount: number,
  isSample: boolean
): Promise<AIAlbumPlan | null> {
  try {
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

    const prompt = `You are a professional photo album designer. You will receive information about a user's photos and create an album layout plan.

User's questionnaire:
- Occasion: ${occasion}
- Style: ${style}
- Special message: ${specialMessage}
- Names: ${names}
- Product type: ${productType}

Available photos (${photos.length} total):
${JSON.stringify(photoDescriptions, null, 2)}

Create a ${pageCount}-page album. ${isSample ? 'This is a 2-page SAMPLE (cover + 1 page) to preview before purchase.' : 'This is the full album.'}

Rules:
1. First page is always the cover (layoutType: "cover") with the best/most representative photo
2. Mix layouts creatively based on photo orientations
3. Generate meaningful captions in Portuguese (pt-BR) based on the occasion and style
4. For wedding: romantic, emotional captions. For travel: adventurous. For baby: tender.
5. Landscape photos work best as "single". Portrait photos can be "double" or "triple".
6. Every 4-5 pages, include a "text_focus" page with a quote or message.
7. Last page is "back_cover" (only for full albums, not sample).
8. For sample (2 pages): just cover + 1 interior page with best photos.
9. Choose photos that tell a story — chronological or emotional flow.
10. Use different photos on each page — don't repeat.

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
    
    // Validate the response has required structure
    if (!aiPlan.pages || !Array.isArray(aiPlan.pages) || aiPlan.pages.length === 0) {
      console.error('Invalid AI response structure:', aiPlan)
      return null
    }

    return aiPlan

  } catch (error) {
    console.error('AI planning error:', error)
    return null
  }
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
