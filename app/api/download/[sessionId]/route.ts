// TODO: usar páginas reais quando compositor estiver pronto

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  // TODO: Buscar session + generation_job done e usar páginas reais
  // Por ora retorna PDF placeholder via pdf-lib

  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4

    // Load font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()

    // Background (light rose)
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.98, 0.97, 0.96),
    })

    // Top bar
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width,
      height: 80,
      color: rgb(0.788, 0.376, 0.478), // #C9607A
    })

    // Title on top bar
    page.drawText('MOMENTU', {
      x: 40,
      y: height - 52,
      size: 28,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    page.drawText('AI Album', {
      x: 40,
      y: height - 72,
      size: 13,
      font,
      color: rgb(1, 1, 1),
    })

    // Main message
    page.drawText('Seu album Momentu esta sendo preparado...', {
      x: 40,
      y: height / 2 + 40,
      size: 20,
      font: boldFont,
      color: rgb(0.172, 0.094, 0.063), // #2C1810
    })

    page.drawText(
      'Este e um arquivo de demonstracao. Seu album completo estara disponivel em breve.',
      {
        x: 40,
        y: height / 2,
        size: 12,
        font,
        color: rgb(0.5, 0.4, 0.35),
        maxWidth: width - 80,
        lineHeight: 18,
      }
    )

    // Session ID
    page.drawText(`ID do pedido: ${sessionId}`, {
      x: 40,
      y: height / 2 - 50,
      size: 10,
      font,
      color: rgb(0.5, 0.4, 0.35),
    })

    page.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, {
      x: 40,
      y: height / 2 - 66,
      size: 10,
      font,
      color: rgb(0.5, 0.4, 0.35),
    })

    // Bottom decoration line
    page.drawLine({
      start: { x: 40, y: 80 },
      end: { x: width - 40, y: 80 },
      thickness: 1,
      color: rgb(0.788, 0.376, 0.478),
    })

    page.drawText('momentu.ai - Albums criados por inteligencia artificial', {
      x: 40,
      y: 55,
      size: 9,
      font,
      color: rgb(0.5, 0.4, 0.35),
    })

    const pdfBytes = await pdfDoc.save()

    // Convert Uint8Array to ArrayBuffer for Response compatibility
    const buffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    )

    return new Response(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="album-momentu-${sessionId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return new Response('Erro ao gerar PDF', { status: 500 })
  }
}
