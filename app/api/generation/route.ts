import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { planAlbum, PhotoMeta } from '@/lib/agents/curator'
import { STYLE_CONFIGS, getStyleLayouts } from '@/lib/styles'
import { AlbumStyle } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        width: 1000,   // Default — idealmente lemos dos metadados
        height: 1500,  // Assume portrait por padrão (safe default)
        isPortrait: true
      }
    })

    // 5. Rodar curator para planejar o álbum
    const questionnaire = session.questionnaire || {}
    const style = (questionnaire.style || 'romantic') as AlbumStyle
    const pageCount = type === 'sample' ? 2 : (session.page_count || 10)
    const groupings = session.groupings || []

    const pagePlan = planAlbum(photoMetas, questionnaire, groupings, pageCount)

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
      pageCount
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
