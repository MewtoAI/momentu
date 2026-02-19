import { NextRequest, NextResponse } from 'next/server'

// Must use nodejs runtime for @react-pdf/renderer
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title = 'Meu Album',
      subtitle = 'Momentu',
      pageCount = 8,
      templateColor = '#C9607A',
      templateColor2 = '#A8485F',
      templateId = '',
      pages = null,
      photos = [],
    } = body

    // Dynamic imports to avoid SSR issues
    const React = await import('react')
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { FullAlbumPDF } = await import('@/lib/pdf-document')

    const element = React.createElement(FullAlbumPDF, {
      title: String(title),
      subtitle: String(subtitle),
      pageCount: Number(pageCount),
      templateColor: String(templateColor),
      templateColor2: String(templateColor2),
      templateId: String(templateId),
      pages: Array.isArray(pages) ? pages : undefined,
      photos: Array.isArray(photos) ? photos : [],
    })

    // eslint-disable-next-line
    const pdfBuffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0])

    const safeTitle = String(title)
      .replace(/[^a-z0-9\s\-áàâãéèêíïóôõöúüç]/gi, '')
      .trim() || 'album'

    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}-momentu.pdf"`,
        'Content-Length': String(uint8Array.length),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Erro ao gerar PDF. Tente novamente.', details: errMsg },
      { status: 500 }
    )
  }
}
