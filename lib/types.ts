export type AlbumFormat =
  | 'print_20x20'    // 20×20cm, 2362×2362px @300dpi
  | 'print_a4'       // 21×30cm, 2480×3508px @300dpi
  | 'print_15x21'    // 15×21cm, 1772×2480px @300dpi
  | 'digital_square' // 1080×1080px
  | 'digital_story'  // 1080×1920px

export type AlbumPurpose = 'print' | 'digital'

export interface FormatSpec {
  widthPx: number
  heightPx: number
  widthMm: number
  heightMm: number
  bleedMm: number      // sangria
  safeZoneMm: number   // zona segura
  dpi: number
}

export const FORMAT_SPECS: Record<AlbumFormat, FormatSpec> = {
  print_20x20:    { widthPx: 2362, heightPx: 2362, widthMm: 200, heightMm: 200, bleedMm: 3, safeZoneMm: 5, dpi: 300 },
  print_a4:       { widthPx: 2480, heightPx: 3508, widthMm: 210, heightMm: 297, bleedMm: 3, safeZoneMm: 5, dpi: 300 },
  print_15x21:    { widthPx: 1772, heightPx: 2480, widthMm: 150, heightMm: 210, bleedMm: 3, safeZoneMm: 5, dpi: 300 },
  digital_square: { widthPx: 1080, heightPx: 1080, widthMm: 0, heightMm: 0, bleedMm: 0, safeZoneMm: 0, dpi: 96 },
  digital_story:  { widthPx: 1080, heightPx: 1920, widthMm: 0, heightMm: 0, bleedMm: 0, safeZoneMm: 0, dpi: 96 },
}

export type PageType =
  | 'cover'
  | 'photo_single'
  | 'photo_double'
  | 'photo_triple'
  | 'photo_quad'
  | 'text_focus'
  | 'back_cover'

export interface PhotoSlot {
  id: string
  x: number      // 0-1 (fraction of canvas width)
  y: number      // 0-1 (fraction of canvas height)
  width: number  // 0-1
  height: number // 0-1
}

export interface TextSlot {
  id: string
  x: number
  y: number
  width: number
  height: number   // 0-1 fractions
  defaultText: string
  fontSize: number // in canvas fraction units (e.g. 0.04 = 4% of canvas height)
  align: 'left' | 'center' | 'right'
  fontFamily: string
  color: string
}

export interface PageLayout {
  photoSlots: PhotoSlot[]
  textSlots: TextSlot[]
}

export interface TemplateElement {
  id: string
  type: 'icon' | 'sticker' | 'ornament'
  src: string       // path to SVG (e.g. /templates/casamento-dourado/elements/ring.svg)
  x: number         // 0-1 fraction
  y: number         // 0-1 fraction
  width: number     // 0-1 fraction
  height: number    // 0-1 fraction
  locked?: boolean  // if true: user cannot move/resize
}

export interface TemplateConfig {
  id: string
  name: string
  category: string[]
  formats: AlbumFormat[]

  // Background SVG path per format
  // Falls back to 'default' if specific format not found
  backgrounds: Partial<Record<AlbumFormat, string>> & { default?: string }

  thumbnail: string  // path to real rendered thumbnail

  font: string       // Google Font name for titles
  bodyFont: string   // Google Font name for body

  colors: {
    primary: string
    secondary: string
    accent?: string
    text: string
    bg: string
  }

  // Pre-positioned interactive elements per format
  elements: Partial<Record<AlbumFormat, TemplateElement[]>> & { default?: TemplateElement[] }

  // Page layouts per page type
  pages: Partial<Record<PageType, PageLayout>>
}

export interface AlbumPage {
  id: string
  type: PageType
  photos: Record<string, string>   // slotId → base64 data URL
  texts: Record<string, string>    // slotId → text content
  elements: TemplateElement[]      // current state of elements (after user edits)
}

export interface AlbumConfig {
  purpose: AlbumPurpose
  format: AlbumFormat
  templateId: string
  pages: AlbumPage[]
}
