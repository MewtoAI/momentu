/**
 * Compositor Agent
 * Composes final album pages: background + photos in slots + text overlays
 */

import sharp from 'sharp'
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

// Dimensões base para álbum quadrado 20x20cm @ 300dpi
const PAGE_WIDTH = 2362
const PAGE_HEIGHT = 2362

export interface PhotoSlot {
  x: number        // Posição X relativa (0-1)
  y: number        // Posição Y relativa (0-1)
  w: number        // Largura relativa (0-1)
  h: number        // Altura relativa (0-1)
  ratio: 'portrait' | 'landscape' | 'square' | 'auto'
}

export interface PageComposition {
  pageIndex: number
  backgroundUrl: string
  photos: Array<{
    url: string
    slot: PhotoSlot
  }>
  text?: {
    content: string
    position: 'top' | 'bottom' | 'center'
    style: 'title' | 'caption' | 'body'
  }
}

/**
 * Baixa uma imagem de uma URL e retorna o buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Calcula dimensões do slot em pixels
 */
function calculateSlotDimensions(slot: PhotoSlot): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.round(slot.x * PAGE_WIDTH),
    y: Math.round(slot.y * PAGE_HEIGHT),
    width: Math.round(slot.w * PAGE_WIDTH),
    height: Math.round(slot.h * PAGE_HEIGHT)
  }
}

/**
 * Processa uma foto para se encaixar perfeitamente no slot (object-fit: cover)
 */
async function fitPhotoToSlot(photoBuffer: Buffer, slotDimensions: { width: number; height: number }): Promise<Buffer> {
  const { width: slotWidth, height: slotHeight } = slotDimensions

  // Obter dimensões da foto original
  const metadata = await sharp(photoBuffer).metadata()
  const photoWidth = metadata.width || 1000
  const photoHeight = metadata.height || 1000

  // Calcular qual dimensão limita (para fazer cover)
  const photoRatio = photoWidth / photoHeight
  const slotRatio = slotWidth / slotHeight

  let resizeWidth: number
  let resizeHeight: number

  if (photoRatio > slotRatio) {
    // Foto é mais larga que o slot → altura limita
    resizeHeight = slotHeight
    resizeWidth = Math.round(slotHeight * photoRatio)
  } else {
    // Foto é mais alta que o slot → largura limita
    resizeWidth = slotWidth
    resizeHeight = Math.round(slotWidth / photoRatio)
  }

  // Resize e crop centralizado
  const processedBuffer = await sharp(photoBuffer)
    .resize(resizeWidth, resizeHeight, {
      fit: 'cover',
      position: 'center'
    })
    .extract({
      left: Math.round((resizeWidth - slotWidth) / 2),
      top: Math.round((resizeHeight - slotHeight) / 2),
      width: slotWidth,
      height: slotHeight
    })
    .toBuffer()

  return processedBuffer
}

/**
 * Cria um SVG com texto para overlay
 */
function createTextSVG(text: string, position: 'top' | 'bottom' | 'center', style: 'title' | 'caption' | 'body'): string {
  const fontSize = style === 'title' ? 120 : style === 'caption' ? 60 : 80
  const fontFamily = style === 'title' ? 'Playfair Display, serif' : 'Lato, sans-serif'
  const fontWeight = style === 'title' ? 'bold' : 'normal'
  
  let y = PAGE_HEIGHT / 2 // center
  if (position === 'top') y = 200
  if (position === 'bottom') y = PAGE_HEIGHT - 200

  // Quebrar texto em linhas se for muito longo
  const words = text.split(' ')
  const maxWordsPerLine = 6
  const lines: string[] = []
  
  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    lines.push(words.slice(i, i + maxWordsPerLine).join(' '))
  }

  const lineHeight = fontSize * 1.3
  const startY = y - ((lines.length - 1) * lineHeight) / 2

  const textElements = lines.map((line, i) => {
    const lineY = startY + (i * lineHeight)
    return `<text x="${PAGE_WIDTH / 2}" y="${lineY}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" fill="#333333" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`
  }).join('\n')

  return `
    <svg width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}">
      ${textElements}
    </svg>
  `
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Compõe uma página completa
 */
export async function composePage(composition: PageComposition, sessionId: string): Promise<string | null> {
  try {
    console.log(`Composing page ${composition.pageIndex}...`)

    // 1. Baixar e processar background
    const bgBuffer = await downloadImage(composition.backgroundUrl)
    
    // Resize background para as dimensões da página
    let pageImage = sharp(bgBuffer)
      .resize(PAGE_WIDTH, PAGE_HEIGHT, { fit: 'cover', position: 'center' })

    // 2. Processar e compor cada foto
    const compositeOperations: Array<{ input: Buffer; top: number; left: number }> = []

    for (const photo of composition.photos) {
      const photoBuffer = await downloadImage(photo.url)
      const slotDimensions = calculateSlotDimensions(photo.slot)
      
      const fittedPhotoBuffer = await fitPhotoToSlot(photoBuffer, {
        width: slotDimensions.width,
        height: slotDimensions.height
      })

      compositeOperations.push({
        input: fittedPhotoBuffer,
        top: slotDimensions.y,
        left: slotDimensions.x
      })
    }

    // 3. Aplicar todas as composições de foto
    if (compositeOperations.length > 0) {
      pageImage = pageImage.composite(compositeOperations)
    }

    // 4. Adicionar texto se houver
    if (composition.text && composition.text.content) {
      const textSVG = createTextSVG(
        composition.text.content,
        composition.text.position,
        composition.text.style
      )
      
      pageImage = pageImage.composite([{
        input: Buffer.from(textSVG),
        top: 0,
        left: 0
      }])
    }

    // 5. Gerar buffer final
    const finalBuffer = await pageImage.png({ quality: 90 }).toBuffer()

    // 6. Salvar no Supabase Storage
    const storagePath = `pdfs/${sessionId}/page_${composition.pageIndex}.png`
    
    const { error: uploadError } = await getSupabase().storage
      .from('assets')
      .upload(storagePath, finalBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error(`Failed to upload composed page:`, uploadError)
      return null
    }

    // 7. Retornar URL pública
    const { data: urlData } = getSupabase().storage
      .from('assets')
      .getPublicUrl(storagePath)

    console.log(`Page ${composition.pageIndex} composed successfully`)
    return urlData.publicUrl

  } catch (error) {
    console.error(`Error composing page ${composition.pageIndex}:`, error)
    return null
  }
}

/**
 * Compõe múltiplas páginas em sequência (não paralelizar para não explodir memória)
 */
export async function composePages(compositions: PageComposition[], sessionId: string): Promise<string[]> {
  const results: string[] = []

  for (const composition of compositions) {
    const pageUrl = await composePage(composition, sessionId)
    if (pageUrl) {
      results.push(pageUrl)
    } else {
      console.error(`Failed to compose page ${composition.pageIndex}, skipping...`)
    }
  }

  return results
}
