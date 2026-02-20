/**
 * PDF Assembler Agent
 * Combines composed page PNGs into final PDF
 */

import { PDFDocument } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabase
}

// Dimensões para álbum quadrado 20x20cm @ 300dpi
const PAGE_SIZE_MM = 200 // 20cm
const MM_TO_POINTS = 2.834645669

export interface AssemblerInput {
  pageUrls: string[]
  sessionId: string
  format?: 'print_20x20' | 'digital'
}

/**
 * Baixa uma imagem de uma URL e retorna o buffer
 */
async function downloadImage(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

/**
 * Cria PDF a partir de páginas PNG
 */
export async function assemblePDF(input: AssemblerInput): Promise<string | null> {
  try {
    console.log(`Assembling PDF with ${input.pageUrls.length} pages...`)

    const pdfDoc = await PDFDocument.create()

    // Metadados
    pdfDoc.setTitle('Álbum Momentu')
    pdfDoc.setCreator('Momentu — momentu.app')
    pdfDoc.setProducer('Momentu AI Pipeline')

    // Calcular dimensões da página em pontos
    const pageSizePt = PAGE_SIZE_MM * MM_TO_POINTS

    // Processar cada página
    for (let i = 0; i < input.pageUrls.length; i++) {
      const pageUrl = input.pageUrls[i]
      console.log(`  Adding page ${i + 1}/${input.pageUrls.length}...`)

      // Baixar imagem
      const imageBytes = await downloadImage(pageUrl)

      // Embed PNG
      const pngImage = await pdfDoc.embedPng(imageBytes)

      // Criar página
      const page = pdfDoc.addPage([pageSizePt, pageSizePt])

      // Desenhar imagem ocupando toda a página
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pageSizePt,
        height: pageSizePt,
      })
    }

    // Gerar PDF
    const pdfBytes = await pdfDoc.save()

    // Salvar no Supabase Storage
    const storagePath = `pdfs/${input.sessionId}/album.pdf`
    
    const { error: uploadError } = await getSupabase().storage
      .from('assets')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Failed to upload PDF to storage:', uploadError)
      return null
    }

    // Obter URL pública
    const { data: urlData } = getSupabase().storage
      .from('assets')
      .getPublicUrl(storagePath)

    console.log('PDF assembled successfully')
    return urlData.publicUrl

  } catch (error) {
    console.error('Error assembling PDF:', error)
    return null
  }
}
