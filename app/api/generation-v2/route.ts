/**
 * Generation API v2 - Complete AI Pipeline
 * Orchestrates: Vision Analyzer → Creative Director → DALL-E Backgrounds → Compositor → PDF Assembler
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzePhotos, PhotoInput } from '@/lib/agents/vision-analyzer'
import { createStoryboard, DirectorInput } from '@/lib/agents/creative-director'
import { generateBackgrounds, BackgroundRequest, createFallbackBackground } from '@/lib/agents/bg-generator'
import { composePages, PageComposition, PhotoSlot } from '@/lib/agents/compositor'
import { assemblePDF } from '@/lib/agents/assembler'

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

    const isSample = type === 'sample'

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
    const pageCount = isSample ? 2 : (session.page_count || 10)
    
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        session_id: sessionId,
        type,
        status: 'processing',
        pages_total: pageCount,
        pages_done: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Erro ao criar job' }, { status: 500 })
    }

    console.log(`\n=== Starting AI Pipeline for session ${sessionId} ===`)
    console.log(`Type: ${type} | Pages: ${pageCount}`)

    // 3. Buscar fotos do Storage
    const { data: storageFiles } = await supabase.storage
      .from('photos')
      .list(`albums/${sessionId}`)

    if (!storageFiles || storageFiles.length === 0) {
      return NextResponse.json({ error: 'Nenhuma foto encontrada' }, { status: 404 })
    }

    // 4. Preparar inputs para Vision Analyzer
    const photoInputs: PhotoInput[] = storageFiles.map((file, i) => {
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(`albums/${sessionId}/${file.name}`)

      return {
        id: file.id || `photo_${i}`,
        url: urlData.publicUrl,
        width: 1500, // estimativa, Vision vai detectar
        height: 2000 // estimativa
      }
    })

    console.log(`\n→ AGENT 1: Vision Analyzer (analyzing ${photoInputs.length} photos)`)
    
    // 5. AGENTE 1: Vision Analyzer
    const analyzedPhotos = await analyzePhotos(photoInputs)
    console.log(`✓ Vision analysis complete: ${analyzedPhotos.length} photos analyzed`)

    // 6. AGENTE 2: Creative Director
    console.log(`\n→ AGENT 2: Creative Director (creating storyboard)`)
    
    const questionnaire = session.questionnaire || {}
    const directorInput: DirectorInput = {
      photos: analyzedPhotos,
      questionnaire: {
        occasion: questionnaire.occasion || 'memories',
        style: questionnaire.style || 'romantic',
        names: questionnaire.names,
        specialMessage: questionnaire.specialMessage,
        period: questionnaire.period
      },
      pageCount,
      isSample
    }

    const storyboard = await createStoryboard(directorInput)
    
    if (!storyboard) {
      return NextResponse.json({ error: 'Erro ao criar storyboard' }, { status: 500 })
    }

    console.log(`✓ Storyboard created: ${storyboard.pages.length} pages`)
    console.log(`  Title: "${storyboard.albumTitle}"`)
    console.log(`  Narrative: "${storyboard.narrative}"`)

    // 7. AGENTE 3: DALL-E Background Generator
    console.log(`\n→ AGENT 3: DALL-E Background Generator`)
    
    const bgRequests: BackgroundRequest[] = storyboard.pages.map(page => ({
      pageIndex: page.index,
      bgPrompt: page.bgPrompt,
      sessionId
    }))

    const generatedBackgrounds = await generateBackgrounds(bgRequests, 2) // concurrency limit
    console.log(`✓ Backgrounds generated: ${generatedBackgrounds.length}/${bgRequests.length}`)

    // Criar fallback backgrounds para páginas que falharam
    const bgMap = new Map(generatedBackgrounds.map(bg => [bg.pageIndex, bg.url]))
    const style = questionnaire.style || 'romantic'
    
    for (const page of storyboard.pages) {
      if (!bgMap.has(page.index)) {
        console.warn(`  Using fallback background for page ${page.index}`)
        // Para fallback, criar uma cor sólida simples (sem DALL-E)
        // Isso seria melhor feito com sharp criando uma imagem sólida, mas por simplicidade usamos uma cor
        bgMap.set(page.index, createFallbackBackground(style))
      }
    }

    // 8. COMPOSITOR: Compor cada página
    console.log(`\n→ COMPOSITOR: Composing pages`)
    
    const compositions: PageComposition[] = storyboard.pages.map(page => {
      // Mapear photoIds para URLs
      const photos = page.photoIds.map((photoId, slotIndex) => {
        const photo = analyzedPhotos.find(p => p.id === photoId)
        const slot = page.slots[slotIndex]
        
        return photo && slot ? {
          url: photo.url,
          slot
        } : null
      }).filter((p): p is { url: string; slot: PhotoSlot } => p !== null)

      // Preparar texto (capa ou caption)
      let text: PageComposition['text'] = undefined
      if (page.index === 0 && page.title) {
        // Capa
        text = {
          content: page.title,
          position: 'center',
          style: 'title'
        }
      } else if (page.caption) {
        // Página interior com caption
        text = {
          content: page.caption,
          position: 'bottom',
          style: 'caption'
        }
      }

      return {
        pageIndex: page.index,
        backgroundUrl: bgMap.get(page.index) || createFallbackBackground(style),
        photos,
        text
      }
    })

    const composedPageUrls = await composePages(compositions, sessionId)
    console.log(`✓ Pages composed: ${composedPageUrls.length}/${compositions.length}`)

    // 9. ASSEMBLER: Gerar PDF
    console.log(`\n→ ASSEMBLER: Generating PDF`)
    
    const pdfUrl = await assemblePDF({
      pageUrls: composedPageUrls,
      sessionId,
      format: 'print_20x20'
    })

    if (!pdfUrl) {
      return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
    }

    console.log(`✓ PDF assembled: ${pdfUrl}`)

    // 10. Atualizar job como concluído
    await supabase
      .from('generation_jobs')
      .update({
        status: 'done',
        pages_done: composedPageUrls.length,
        result_url: pdfUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    // 11. Atualizar session
    await supabase
      .from('album_sessions')
      .update({ 
        status: isSample ? 'sample_ready' : 'done',
        pdf_url: pdfUrl
      })
      .eq('id', sessionId)

    console.log(`\n=== Pipeline Complete ===\n`)

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      pdfUrl,
      pageUrls: composedPageUrls,
      storyboard: {
        title: storyboard.albumTitle,
        narrative: storyboard.narrative,
        pageCount: storyboard.pages.length
      }
    })

  } catch (error) {
    console.error('Pipeline error:', error)
    return NextResponse.json({ 
      error: 'Erro interno no pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId obrigatório' }, { status: 400 })
  }

  const { data: job } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  return NextResponse.json({ job })
}
