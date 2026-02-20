import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

    // 1. Check if PDF already exists in storage
    const { data: storageFile } = await supabase.storage
      .from('pdfs')
      .list(`albums/${sessionId}`, {
        limit: 1,
        search: 'album.pdf',
      })

    if (storageFile && storageFile.length > 0) {
      // PDF exists, serve it
      const { data: pdfData } = await supabase.storage
        .from('pdfs')
        .download(`albums/${sessionId}/album.pdf`)

      if (pdfData) {
        return new NextResponse(pdfData, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="momentu-album-${sessionId.slice(0, 8)}.pdf"`,
          },
        })
      }
    }

    // 2. If not exists, check if generation is done
    const { data: job } = await supabase
      .from('generation_jobs')
      .select('result_url, status')
      .eq('session_id', sessionId)
      .eq('type', 'full')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!job || job.status !== 'done') {
      return NextResponse.json(
        { error: 'Álbum ainda não foi gerado' },
        { status: 404 }
      )
    }

    // 3. Generate PDF on-the-fly (placeholder implementation)
    // TODO: Implement real PDF generation with album structure
    const placeholderPDF = await generatePlaceholderPDF(sessionId)

    // 4. Save to storage
    await supabase.storage
      .from('pdfs')
      .upload(`albums/${sessionId}/album.pdf`, placeholderPDF, {
        contentType: 'application/pdf',
        upsert: true,
      })

    // 5. Serve the PDF
    return new NextResponse(Buffer.from(placeholderPDF), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="momentu-album-${sessionId.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Erro ao baixar PDF' }, { status: 500 })
  }
}

async function generatePlaceholderPDF(sessionId: string): Promise<Uint8Array> {
  // Simple placeholder PDF using pdf-lib
  const { PDFDocument, rgb } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()

  pdfDoc.setTitle('Álbum Momentu')
  pdfDoc.setCreator('Momentu — momentu.app')

  const page = pdfDoc.addPage([595, 842]) // A4
  page.drawText('Seu álbum Momentu', {
    x: 50,
    y: 800,
    size: 24,
    color: rgb(0.79, 0.38, 0.48), // #C9607A
  })

  page.drawText(`Session ID: ${sessionId}`, {
    x: 50,
    y: 760,
    size: 12,
    color: rgb(0.17, 0.09, 0.06), // #2C1810
  })

  page.drawText('Este é um PDF de demonstração.', {
    x: 50,
    y: 720,
    size: 12,
    color: rgb(0.5, 0.5, 0.5),
  })

  page.drawText('A renderização completa com fotos será implementada em breve.', {
    x: 50,
    y: 700,
    size: 12,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}
