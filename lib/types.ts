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

// ─── Momentu AI Types ─────────────────────────────────────────────────────────

export type AlbumStyle = 'romantic' | 'classic' | 'vibrant' | 'minimal' | 'vintage' | 'bohemian'
export type AlbumOccasion = 'wedding' | 'birthday' | 'baby' | 'travel' | 'family' | 'graduation' | 'other'
export type AlbumSessionStatus =
  | 'questionnaire'
  | 'sample_requested'
  | 'sample_ready'
  | 'paid'
  | 'uploading'
  | 'grouping'
  | 'adjusting'
  | 'generating'
  | 'done'
  | 'abandoned'

export type DigitalPlatform = 'instagram_feed' | 'instagram_stories' | 'tiktok' | 'facebook' | 'all'

export interface AlbumQuestionnaire {
  purpose: AlbumPurpose
  occasion?: AlbumOccasion
  style?: AlbumStyle
  colorPalette?: string       // hex color or 'surprise'
  pageCount?: number          // print only
  platform?: DigitalPlatform  // digital only
  captionOnPhotos?: 'yes' | 'no' | 'first_only'  // digital only
  specialMessage?: string
  referenceAlbumId?: string
  referenceNotes?: string
}

export interface PhotoAnnotation {
  x: number    // 0-1 fraction of image width
  y: number    // 0-1 fraction of image height
  note: string // user's instruction
}

export interface AlbumSession {
  id: string
  userId: string
  productType: AlbumPurpose
  status: AlbumSessionStatus
  questionnaire: AlbumQuestionnaire
  photoCount: number
  pageCount?: number
  format?: AlbumFormat
  price?: number
  groupings: PhotoGrouping[]
  adjustmentAnnotations: PhotoAnnotation[]
  createdAt: string
  updatedAt: string
}

export interface PhotoGrouping {
  pageIndex: number
  photoIds: string[]  // photos in this page
}

export interface GalleryAlbum {
  id: string
  title: string
  style: AlbumStyle
  occasion: AlbumOccasion
  productType: AlbumPurpose
  thumbnailUrl: string
  previewPages: string[]
  isFeatured: boolean
}

// Pricing
export const PRINT_PRICING: Record<number, number> = {
  10: 39.90,
  12: 44.90,
  15: 49.90,
  20: 59.90,
}

export const DIGITAL_PRICE = 29.90
