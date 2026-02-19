import { NextRequest, NextResponse } from 'next/server'
import { generateAlbumPDF } from '@/lib/pdf-generator'
import { AlbumFormat } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { pageImages, format, purpose } = await req.json()

    if (!pageImages?.length || !format) {
      return NextResponse.json({ error: 'pageImages e format são obrigatórios' }, { status: 400 })
    }

    const pdfBytes = await generateAlbumPDF(
      pageImages,
      format as AlbumFormat,
      purpose || 'digital'
    )

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="album-momentu.pdf"',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
