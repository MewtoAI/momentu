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
  cropFocus?: 'top' | 'center' | 'bottom' | 'attention'
}

export interface TextOverlay {
  content: string
  subContent?: string
  position: 'top' | 'center' | 'bottom'
  color: string                                    // ex: "#ffffff" ou "#1a1a1a"
  background: 'none' | 'semi-dark' | 'semi-light' // overlay para garantir contraste
  fontSize: 'large' | 'medium' | 'small'
}

export interface PageComposition {
  pageIndex: number
  backgroundUrl: string
  photos: Array<{
    url: string
    slot: PhotoSlot
  }>
  textOverlay?: TextOverlay
}

/**
 * Baixa uma imagem de uma URL ou cria buffer de cor sólida para hex colors (#RRGGBB)
 */
async function downloadImage(url: string): Promise<Buffer> {
  // Fallback: hex color → gerar PNG sólido
  if (url.startsWith('#')) {
    const hex = url.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return sharp({
      create: { width: 1024, height: 1024, channels: 3, background: { r, g, b } }
    }).png().toBuffer()
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: ${response.status}`)
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
 * Mapeia cropFocus para position do sharp
 */
function toCropPosition(cropFocus?: string): string {
  switch (cropFocus) {
    case 'top':       return 'top'
    case 'bottom':    return 'bottom'
    case 'attention': return 'attention'
    case 'center':
    default:          return 'centre'
  }
}

/**
 * Processa uma foto para se encaixar perfeitamente no slot (object-fit: cover)
 * Usa cropFocus para evitar cortar cabeças/rostos importantes
 */
async function fitPhotoToSlot(
  photoBuffer: Buffer,
  slotDimensions: { width: number; height: number },
  cropFocus?: string
): Promise<Buffer> {
  const { width: slotWidth, height: slotHeight } = slotDimensions
  const position = toCropPosition(cropFocus)

  const processedBuffer = await sharp(photoBuffer)
    .resize(slotWidth, slotHeight, {
      fit: 'cover',
      position
    })
    .png()
    .toBuffer()

  return processedBuffer
}

/**
 * Cria um SVG com texto e contraste garantido pelo Diretor
 */
function createTextSVG(overlay: TextOverlay): string {
  const { content, subContent, position, color, background, fontSize: fontSizeKey } = overlay

  const mainSize  = fontSizeKey === 'large' ? 110 : fontSizeKey === 'medium' ? 76 : 56
  const subSize   = Math.round(mainSize * 0.45)
  const fontFamily = 'Georgia, serif'

  // Calcular área de texto (faixa horizontal)
  const bandHeight = position === 'center' ? PAGE_HEIGHT : Math.round(PAGE_HEIGHT * 0.22)
  let bandY = 0
  if (position === 'center') bandY = 0
  if (position === 'bottom')  bandY = PAGE_HEIGHT - bandHeight
  if (position === 'top')     bandY = 0

  // Quebrar texto em linhas
  const words = content.split(' ')
  const maxWordsPerLine = 5
  const lines: string[] = []
  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    lines.push(words.slice(i, i + maxWordsPerLine).join(' '))
  }

  const lineHeight  = mainSize * 1.35
  const blockHeight = lines.length * lineHeight + (subContent ? subSize * 2 : 0)
  const blockStartY = bandY + (bandHeight - blockHeight) / 2 + mainSize

  const mainLines = lines.map((line, i) =>
    `<text x="${PAGE_WIDTH / 2}" y="${Math.round(blockStartY + i * lineHeight)}" font-size="${mainSize}" font-family="${fontFamily}" font-weight="bold" fill="${color}" text-anchor="middle">${escapeXml(line)}</text>`
  ).join('\n')

  const subLine = subContent
    ? `<text x="${PAGE_WIDTH / 2}" y="${Math.round(blockStartY + lines.length * lineHeight + subSize)}" font-size="${subSize}" font-family="${fontFamily}" font-weight="normal" fill="${color}" text-anchor="middle" opacity="0.85">${escapeXml(subContent)}</text>`
    : ''

  // Background overlay para garantir contraste
  let bgRect = ''
  if (background === 'semi-dark') {
    bgRect = `<rect x="0" y="${bandY}" width="${PAGE_WIDTH}" height="${bandHeight}" fill="rgba(0,0,0,0.45)"/>`
  } else if (background === 'semi-light') {
    bgRect = `<rect x="0" y="${bandY}" width="${PAGE_WIDTH}" height="${bandHeight}" fill="rgba(255,255,255,0.55)"/>`
  }

  return `<svg width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  ${bgRect}
  ${mainLines}
  ${subLine}
</svg>`
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

    // 1. Baixar background e resolver para buffer PNG (evita lazy chain issues)
    const bgBuffer = await downloadImage(composition.backgroundUrl)
    const resolvedBg = await sharp(bgBuffer)
      .resize(PAGE_WIDTH, PAGE_HEIGHT, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer()

    // 2. Processar e compor cada foto nos slots
    const compositeOperations: Array<{ input: Buffer; top: number; left: number }> = []

    for (const photo of composition.photos) {
      try {
        const photoBuffer = await downloadImage(photo.url)
        const slotDimensions = calculateSlotDimensions(photo.slot)
        
        console.log(`    Fitting photo to slot: ${slotDimensions.width}x${slotDimensions.height} at (${slotDimensions.x}, ${slotDimensions.y}) cropFocus=${photo.slot.cropFocus || 'center'}`)

        const fittedPhotoBuffer = await fitPhotoToSlot(photoBuffer, {
          width: slotDimensions.width,
          height: slotDimensions.height
        }, photo.slot.cropFocus)

        compositeOperations.push({
          input: fittedPhotoBuffer,
          top: slotDimensions.y,
          left: slotDimensions.x
        })
      } catch (photoErr) {
        console.error(`    Failed to process photo ${photo.url}:`, photoErr)
      }
    }

    console.log(`    Compositing ${compositeOperations.length} photo(s) onto background`)

    // 3. Compor fotos sobre o background (background já é buffer PNG)
    let compositeInputs = [...compositeOperations]

    // 4. Adicionar textOverlay com contraste garantido
    if (composition.textOverlay?.content) {
      const textSVG = createTextSVG(composition.textOverlay)
      compositeInputs.push({
        input: Buffer.from(textSVG),
        top: 0,
        left: 0
      })
    }

    // 5. Gerar buffer final — uma única chamada composite sobre o background resolvido
    const finalBuffer = await sharp(resolvedBg)
      .composite(compositeInputs)
      .png({ quality: 90 })
      .toBuffer()

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
