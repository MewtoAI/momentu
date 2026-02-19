import { PDFDocument } from 'pdf-lib'
import { FORMAT_SPECS, AlbumFormat } from './types'

// Konva stage exporta páginas como base64 PNG em alta resolução
// Esta função combina os PNGs em um PDF com dimensões corretas em mm

export async function generateAlbumPDF(
  pageImages: string[],  // base64 PNG de cada página (já em alta resolução)
  format: AlbumFormat,
  purpose: 'print' | 'digital'
): Promise<Uint8Array> {
  const spec = FORMAT_SPECS[format]
  const pdfDoc = await PDFDocument.create()

  // Definir metadados
  pdfDoc.setTitle('Álbum Momentu')
  pdfDoc.setCreator('Momentu — momentu.app')

  for (const imageBase64 of pageImages) {
    // Converter base64 para Uint8Array
    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '')
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    const pngImage = await pdfDoc.embedPng(imageBytes)

    let pageWidthPt: number
    let pageHeightPt: number

    if (purpose === 'print' && spec.widthMm > 0) {
      // Converter mm para pontos PDF (1mm = 2.834645669 pts)
      // Incluir bleed nas dimensões da página
      const totalWidthMm = spec.widthMm + (spec.bleedMm * 2)
      const totalHeightMm = spec.heightMm + (spec.bleedMm * 2)
      pageWidthPt = totalWidthMm * 2.834645669
      pageHeightPt = totalHeightMm * 2.834645669
    } else {
      // Digital: usar pixels convertidos para pontos a 96dpi
      pageWidthPt = (spec.widthPx / 96) * 72
      pageHeightPt = (spec.heightPx / 96) * 72
    }

    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt])

    // Escalar imagem para preencher a página completamente
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt,
    })
  }

  return await pdfDoc.save()
}

// Calcula o pixelRatio necessário para exportar em resolução de impressão
export function getExportPixelRatio(
  displayWidth: number,  // largura do canvas no DOM em px
  format: AlbumFormat
): number {
  const spec = FORMAT_SPECS[format]
  return spec.widthPx / displayWidth
}

// Calcula resolução mínima de foto para um slot em determinado formato
export function getMinPhotoResolution(
  slotWidthFraction: number,  // largura do slot como fração (0-1) do canvas
  format: AlbumFormat
): number {
  const spec = FORMAT_SPECS[format]
  return Math.round(slotWidthFraction * spec.widthPx)
}

// Valida a qualidade de uma foto para um slot
export function validatePhotoQuality(
  photoWidth: number,
  photoHeight: number,
  slotWidthFraction: number,
  slotHeightFraction: number,
  format: AlbumFormat
): 'good' | 'warning' | 'poor' {
  const minW = getMinPhotoResolution(slotWidthFraction, format)
  const minH = getMinPhotoResolution(slotHeightFraction, format)

  const ratio = Math.min(photoWidth / minW, photoHeight / minH)

  if (ratio >= 0.8) return 'good'
  if (ratio >= 0.5) return 'warning'
  return 'poor'
}
