'use client'

import { useState, useRef, useEffect, useCallback, useReducer } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Circle, Transformer } from 'react-konva'
import { useRouter } from 'next/navigation'
import type Konva from 'konva'
import type {
  AlbumFormat,
  AlbumPurpose,
  PageType,
  PhotoSlot,
  TextSlot,
  PageLayout,
  TemplateElement,
  TemplateConfig,
} from '@/lib/types'
import { FORMAT_SPECS } from '@/lib/types'
import { validatePhotoQuality, getExportPixelRatio } from '@/lib/pdf-generator'

// ─── Page layout presets (fraction-based) ────────────────────────────────────

const PAGE_LAYOUTS: Record<PageType, PageLayout> = {
  cover: {
    photoSlots: [{ id: 'main', x: 0, y: 0, width: 1, height: 1 }],
    textSlots: [
      { id: 'title', x: 0.05, y: 0.68, width: 0.9, height: 0.13, defaultText: 'Seu Álbum', fontSize: 0.07, align: 'center', fontFamily: 'Playfair Display', color: '#FFFFFF' },
      { id: 'subtitle', x: 0.05, y: 0.83, width: 0.9, height: 0.08, defaultText: '2026', fontSize: 0.04, align: 'center', fontFamily: 'Inter', color: 'rgba(255,255,255,0.85)' },
    ],
  },
  photo_single: {
    photoSlots: [{ id: 'main', x: 0.05, y: 0.05, width: 0.9, height: 0.78 }],
    textSlots: [
      { id: 'caption', x: 0.05, y: 0.85, width: 0.9, height: 0.1, defaultText: 'Caption aqui...', fontSize: 0.035, align: 'center', fontFamily: 'Inter', color: '#5C5670' },
    ],
  },
  photo_double: {
    photoSlots: [
      { id: 'p1', x: 0.03, y: 0.07, width: 0.455, height: 0.62 },
      { id: 'p2', x: 0.515, y: 0.07, width: 0.455, height: 0.62 },
    ],
    textSlots: [
      { id: 'caption1', x: 0.03, y: 0.71, width: 0.455, height: 0.08, defaultText: 'Foto 1', fontSize: 0.033, align: 'center', fontFamily: 'Inter', color: '#5C5670' },
      { id: 'caption2', x: 0.515, y: 0.71, width: 0.455, height: 0.08, defaultText: 'Foto 2', fontSize: 0.033, align: 'center', fontFamily: 'Inter', color: '#5C5670' },
    ],
  },
  photo_triple: {
    photoSlots: [
      { id: 'p1', x: 0.03, y: 0.03, width: 0.94, height: 0.46 },
      { id: 'p2', x: 0.03, y: 0.52, width: 0.455, height: 0.46 },
      { id: 'p3', x: 0.515, y: 0.52, width: 0.455, height: 0.46 },
    ],
    textSlots: [],
  },
  photo_quad: {
    photoSlots: [
      { id: 'p1', x: 0.03, y: 0.03, width: 0.455, height: 0.455 },
      { id: 'p2', x: 0.515, y: 0.03, width: 0.455, height: 0.455 },
      { id: 'p3', x: 0.03, y: 0.515, width: 0.455, height: 0.455 },
      { id: 'p4', x: 0.515, y: 0.515, width: 0.455, height: 0.455 },
    ],
    textSlots: [],
  },
  text_focus: {
    photoSlots: [],
    textSlots: [
      { id: 'heading', x: 0.1, y: 0.3, width: 0.8, height: 0.2, defaultText: 'Um momento especial', fontSize: 0.065, align: 'center', fontFamily: 'Playfair Display', color: '#C9607A' },
      { id: 'body', x: 0.1, y: 0.52, width: 0.8, height: 0.3, defaultText: 'Escreva sua mensagem aqui...', fontSize: 0.04, align: 'center', fontFamily: 'Inter', color: '#5C5670' },
    ],
  },
  back_cover: {
    photoSlots: [],
    textSlots: [
      { id: 'closing', x: 0.05, y: 0.36, width: 0.9, height: 0.12, defaultText: 'com amor,', fontSize: 0.06, align: 'center', fontFamily: 'Playfair Display', color: '#FFFFFF' },
      { id: 'author', x: 0.05, y: 0.5, width: 0.9, height: 0.1, defaultText: 'Seu nome aqui', fontSize: 0.045, align: 'center', fontFamily: 'Inter', color: 'rgba(255,255,255,0.8)' },
      { id: 'brand', x: 0.05, y: 0.88, width: 0.9, height: 0.08, defaultText: 'feito com ❤️ no momentu', fontSize: 0.033, align: 'center', fontFamily: 'Inter', color: 'rgba(255,255,255,0.45)' },
    ],
  },
}

// ─── Template Configs (new v2 format) ─────────────────────────────────────────

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'amor-infinito': {
    id: 'amor-infinito', name: 'Amor Infinito', category: ['casal'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '',
    font: 'Playfair Display', bodyFont: 'Lato',
    colors: { primary: '#C9184A', secondary: '#FF758F', text: '#2D0914', bg: '#FFF0F3' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'primeiro-sorriso': {
    id: 'primeiro-sorriso', name: 'Primeiro Sorriso', category: ['bebe'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '',
    font: 'Nunito', bodyFont: 'Nunito Sans',
    colors: { primary: '#B5D8CC', secondary: '#F9C9D4', text: '#3A4A45', bg: '#FEF9EF' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'nossa-familia': {
    id: 'nossa-familia', name: 'Nossa Família', category: ['familia'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '',
    font: 'Merriweather', bodyFont: 'Source Sans 3',
    colors: { primary: '#E07A5F', secondary: '#F2CC8F', text: '#3D405B', bg: '#F4F1DE' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'instante': {
    id: 'instante', name: 'Instante', category: ['minimalista'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '',
    font: 'Cormorant Garamond', bodyFont: 'Inter',
    colors: { primary: '#1A1A2E', secondary: '#C9A84C', text: '#1A1A2E', bg: '#F5F5F8' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'mundo-afora': {
    id: 'mundo-afora', name: 'Mundo Afora', category: ['viagem'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '',
    font: 'Josefin Sans', bodyFont: 'Open Sans',
    colors: { primary: '#2D6A4F', secondary: '#74C69D', text: '#1B4332', bg: '#D8F3DC' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'casamento-dourado': {
    id: 'casamento-dourado', name: 'Casamento Dourado', category: ['casal'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '/templates/casamento-dourado/thumbnail.jpg',
    font: 'Cormorant Garamond', bodyFont: 'Lato',
    colors: { primary: '#C9A84C', secondary: '#E8D5A3', text: '#3D2B00', bg: '#FAF6EE' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'pequeno-universo': {
    id: 'pequeno-universo', name: 'Pequeno Universo', category: ['bebe'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '/templates/pequeno-universo/thumbnail.jpg',
    font: 'Nunito', bodyFont: 'Nunito Sans',
    colors: { primary: '#9B72CF', secondary: '#C3A8E0', text: '#311B92', bg: '#F4F0FF' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'raizes': {
    id: 'raizes', name: 'Raízes', category: ['familia'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '/templates/raizes/thumbnail.jpg',
    font: 'Merriweather', bodyFont: 'Source Sans 3',
    colors: { primary: '#8B5E3C', secondary: '#D4956A', text: '#3E2723', bg: '#F5EDD5' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'conquista': {
    id: 'conquista', name: 'Conquista', category: ['formatura'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '/templates/conquista/thumbnail.jpg',
    font: 'Playfair Display', bodyFont: 'Inter',
    colors: { primary: '#1B2D5E', secondary: '#C9A84C', text: '#0D0D2B', bg: '#F0F3FA' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
  'doce-vida': {
    id: 'doce-vida', name: 'Doce Vida', category: ['aniversario'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: {}, thumbnail: '/templates/doce-vida/thumbnail.jpg',
    font: 'Nunito', bodyFont: 'Open Sans',
    colors: { primary: '#FF6B8A', secondary: '#FFD166', text: '#BF360C', bg: '#F0FBFF' },
    elements: { default: [] }, pages: PAGE_LAYOUTS,
  },
}

// Background gradient colors for solid fallback (per template)
const TEMPLATE_GRADIENTS: Record<string, [string, string]> = {
  'amor-infinito':    ['#C9184A', '#FF758F'],
  'primeiro-sorriso': ['#B5D8CC', '#F9C9D4'],
  'nossa-familia':    ['#E07A5F', '#F2CC8F'],
  'instante':         ['#1A1A2E', '#4A4A6E'],
  'mundo-afora':      ['#2D6A4F', '#74C69D'],
  'casamento-dourado':['#C9A84C', '#E8D5A3'],
  'pequeno-universo': ['#9B72CF', '#C3A8E0'],
  'raizes':           ['#8B5E3C', '#D4956A'],
  'conquista':        ['#1B2D5E', '#C9A84C'],
  'doce-vida':        ['#FF6B8A', '#FFD166'],
}

// ─── Page State ───────────────────────────────────────────────────────────────

interface AlbumPageState {
  id: string
  type: PageType
  photos: Record<string, string>      // slotId → data URL
  texts: Record<string, string>       // slotId → text content
  elements: TemplateElement[]         // interactive elements
}

// ─── Display dimensions ───────────────────────────────────────────────────────

const DISPLAY_WIDTH = 340

function getDisplayDimensions(format: AlbumFormat): { w: number; h: number } {
  const spec = FORMAT_SPECS[format]
  const ratio = spec.heightPx / spec.widthPx
  return { w: DISPLAY_WIDTH, h: Math.round(DISPLAY_WIDTH * ratio) }
}

// ─── Font Loader ──────────────────────────────────────────────────────────────

function useFontLoader(fonts: string[]): boolean {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    fonts.forEach(font => {
      const id = `gfont-${font.replace(/\s/g, '-')}`
      if (!document.getElementById(id)) {
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s/g, '+')}:ital,wght@0,400;0,700;1,400&display=swap`
        document.head.appendChild(link)
      }
    })
    Promise.all(fonts.map(f => document.fonts.load(`bold 20px "${f}"`))).then(() => setLoaded(true)).catch(() => setLoaded(true))
  }, [fonts]) // eslint-disable-line react-hooks/exhaustive-deps
  return loaded
}

// ─── Image Cache ──────────────────────────────────────────────────────────────

const imageCache: Record<string, HTMLImageElement | 'loading'> = {}

function loadImageIntoCache(url: string, onLoad: () => void): void {
  if (imageCache[url]) return
  imageCache[url] = 'loading'
  const img = new window.Image()
  img.src = url
  img.onload = () => {
    imageCache[url] = img
    onLoad()
  }
  img.onerror = () => { delete imageCache[url] }
}

// ─── BackgroundLayer component ────────────────────────────────────────────────

interface BackgroundLayerProps {
  templateId: string
  format: AlbumFormat
  pageType: PageType
  width: number
  height: number
  forceRender: () => void
}

function BackgroundLayer({ templateId, format, pageType, width, height, forceRender }: BackgroundLayerProps) {
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['amor-infinito']
  const gradients = TEMPLATE_GRADIENTS[templateId] || ['#C9607A', '#A8485F']

  useEffect(() => {
    setBgImage(null)
    // Try format-specific SVG first
    const formatSrc = `/templates/${templateId}/${format}/bg.svg`
    const img = new window.Image()
    img.src = formatSrc
    img.onload = () => { setBgImage(img); forceRender() }
    img.onerror = () => {
      // Fallback: generic template bg
      const fb = new window.Image()
      fb.src = `/templates/${templateId}/bg.svg`
      fb.onload = () => { setBgImage(fb); forceRender() }
      // If both fail: stay null → solid color fallback rendered below
    }
  }, [templateId, format, forceRender])

  if (bgImage) {
    return <KonvaImage image={bgImage} x={0} y={0} width={width} height={height} />
  }

  // Solid/gradient fallback
  const isCoverOrBack = pageType === 'cover' || pageType === 'back_cover'

  if (isCoverOrBack) {
    return (
      <Rect
        x={0} y={0} width={width} height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: height }}
        fillLinearGradientColorStops={[0, gradients[0], 1, gradients[1]]}
      />
    )
  }

  return <Rect x={0} y={0} width={width} height={height} fill={config.colors.bg} />
}

// ─── KonvaPhotoSlot component ─────────────────────────────────────────────────

interface KonvaPhotoSlotProps {
  slot: PhotoSlot
  photo?: string
  displayWidth: number
  displayHeight: number
  format: AlbumFormat
  quality?: 'good' | 'warning' | 'poor'
  templateColor: string
  templateBg: string
  onPhotoClick: () => void
  forceRender: () => void
}

function KonvaPhotoSlot({ slot, photo, displayWidth, displayHeight, format: _format, quality, templateColor, templateBg, onPhotoClick, forceRender }: KonvaPhotoSlotProps) {
  const x = slot.x * displayWidth
  const y = slot.y * displayHeight
  const w = slot.width * displayWidth
  const h = slot.height * displayHeight

  useEffect(() => {
    if (photo && imageCache[photo] === undefined) {
      loadImageIntoCache(photo, forceRender)
    }
  }, [photo, forceRender])

  const cachedImg = photo ? imageCache[photo] : null
  const imageEl = (cachedImg && cachedImg !== 'loading') ? cachedImg : null

  // Quality indicator color
  const qualityColor = quality === 'poor' ? '#FF4444' : quality === 'warning' ? '#FFB300' : null

  return (
    <Group>
      {imageEl ? (
        <KonvaImage
          image={imageEl}
          x={x} y={y} width={w} height={h}
          onClick={onPhotoClick}
          onTap={onPhotoClick}
        />
      ) : (
        <Group onClick={onPhotoClick} onTap={onPhotoClick}>
          <Rect x={x} y={y} width={w} height={h} fill={templateBg} cornerRadius={4} />
          <Text
            x={x} y={y + h / 2 - 20} width={w}
            text="📷"
            align="center" fontSize={24} fill={templateColor}
          />
          <Text
            x={x} y={y + h / 2 + 8} width={w}
            text="Toque para adicionar"
            align="center" fontSize={10} fill={templateColor} opacity={0.7}
          />
        </Group>
      )}

      {/* Quality indicator badge (top-right) */}
      {qualityColor && imageEl && (
        <Group>
          <Circle x={x + w - 10} y={y + 10} radius={8} fill={qualityColor} />
          <Text x={x + w - 15} y={y + 4} text="!" fontSize={10} fill="white" fontStyle="bold" width={10} align="center" />
        </Group>
      )}

      {/* Cover dark overlay */}
    </Group>
  )
}

// ─── DraggableElement component ───────────────────────────────────────────────

interface DraggableElementProps {
  element: TemplateElement
  displayWidth: number
  displayHeight: number
  isSelected: boolean
  onSelect: () => void
  onChange: (props: Partial<TemplateElement>) => void
  onDelete: () => void
  forceRender: () => void
}

function DraggableElement({ element, displayWidth, displayHeight, isSelected, onSelect, onChange, onDelete, forceRender }: DraggableElementProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const shapeRef = useRef<Konva.Image>(null)

  useEffect(() => {
    const img = new window.Image()
    img.src = element.src
    img.onload = () => { setImage(img); forceRender() }
  }, [element.src, forceRender])

  const x = element.x * displayWidth
  const y = element.y * displayHeight
  const w = element.width * displayWidth
  const h = element.height * displayHeight

  return (
    <Group>
      <KonvaImage
        ref={shapeRef}
        image={image ?? undefined}
        x={x} y={y} width={w} height={h}
        draggable={!element.locked}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={e => onChange({
          x: e.target.x() / displayWidth,
          y: e.target.y() / displayHeight,
        })}
        onTransformEnd={() => {
          const node = shapeRef.current
          if (!node) return
          onChange({
            x: node.x() / displayWidth,
            y: node.y() / displayHeight,
            width: (node.width() * node.scaleX()) / displayWidth,
            height: (node.height() * node.scaleY()) / displayHeight,
          })
          node.scaleX(1)
          node.scaleY(1)
        }}
      />
      {isSelected && !element.locked && (
        <Group x={x + w - 12} y={y - 12} onClick={onDelete} onTap={onDelete}>
          <Circle radius={12} fill="#FF4444" />
          <Text text="×" x={-7} y={-9} fontSize={18} fill="white" fontStyle="bold" />
        </Group>
      )}
    </Group>
  )
}

// ─── KonvaTextSlot component ──────────────────────────────────────────────────

interface KonvaTextSlotProps {
  slot: TextSlot
  text: string
  displayWidth: number
  displayHeight: number
  config: TemplateConfig
  onEdit: () => void
}

function KonvaTextSlot({ slot, text, displayWidth, displayHeight, config, onEdit }: KonvaTextSlotProps) {
  const x = slot.x * displayWidth
  const y = slot.y * displayHeight
  const w = slot.width * displayWidth
  const fontSize = Math.max(8, Math.round(slot.fontSize * displayHeight))
  const fontFamily = slot.fontFamily || config.font

  return (
    <Text
      x={x} y={y} width={w}
      text={text || slot.defaultText}
      fontSize={fontSize}
      fill={slot.color}
      fontFamily={fontFamily}
      align={slot.align}
      onClick={onEdit}
      onTap={onEdit}
    />
  )
}

// ─── Page Type Label ──────────────────────────────────────────────────────────

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  cover: 'Capa',
  photo_single: '1 Foto',
  photo_double: '2 Fotos',
  photo_triple: '3 Fotos',
  photo_quad: '4 Fotos',
  text_focus: 'Texto',
  back_cover: 'Contracapa',
}

// ─── Page Type Options for switcher ──────────────────────────────────────────

const PAGE_TYPE_OPTIONS: PageType[] = ['photo_single', 'photo_double', 'photo_triple', 'photo_quad', 'text_focus']

// ─── Initial pages factory ────────────────────────────────────────────────────

function createInitialPages(templateId: string, pageCount: number): AlbumPageState[] {
  const pages: AlbumPageState[] = []
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['amor-infinito']
  const elements = config.elements?.default ?? []

  // Cover
  pages.push({ id: `page-cover`, type: 'cover', photos: {}, texts: {}, elements })

  // Content pages
  const contentCount = Math.max(1, pageCount - 2)
  const contentTypes: PageType[] = ['photo_single', 'photo_double', 'text_focus', 'photo_double', 'photo_single', 'text_focus', 'photo_double']
  for (let i = 0; i < contentCount; i++) {
    pages.push({
      id: `page-${i + 1}`,
      type: contentTypes[i % contentTypes.length],
      photos: {}, texts: {}, elements: [],
    })
  }

  // Back cover
  pages.push({ id: `page-back`, type: 'back_cover', photos: {}, texts: {}, elements })

  return pages
}

// ─── File to DataURL helper ───────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Main Editor Component ────────────────────────────────────────────────────

interface KonvaEditorProps {
  templateId: string
}

export default function KonvaEditor({ templateId }: KonvaEditorProps) {
  const router = useRouter()
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['amor-infinito']

  // Read onboarding config from sessionStorage
  const [format, setFormat] = useState<AlbumFormat>('print_20x20')
  const [purpose, setPurpose] = useState<AlbumPurpose>('print')
  const [pageCount, setPageCount] = useState(16)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('momentu_album_config')
      if (saved) {
        const cfg = JSON.parse(saved)
        if (cfg.format) setFormat(cfg.format)
        if (cfg.purpose) setPurpose(cfg.purpose)
        if (cfg.pageCount) setPageCount(cfg.pageCount)
      }
    } catch { /* ignore */ }
  }, [])

  const dims = getDisplayDimensions(format)
  const displayWidth = dims.w
  const displayHeight = dims.h

  const fontsLoaded = useFontLoader([config.font, config.bodyFont])

  const [albumTitle, setAlbumTitle] = useState('Meu Álbum')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [pages, setPages] = useState<AlbumPageState[]>([])
  const [photoQualities, setPhotoQualities] = useState<Record<string, 'good' | 'warning' | 'poor'>>({})
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [activeTextSlotId, setActiveTextSlotId] = useState<string | null>(null)
  const [showPageTypeMenu, setShowPageTypeMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showQualityToast, setShowQualityToast] = useState(false)
  const [, forceRender] = useReducer(x => x + 1, 0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSlotIdRef = useRef<string>('main')
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize pages
  useEffect(() => {
    const tryRestore = () => {
      try {
        const saved = localStorage.getItem(`editor-v2-${templateId}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.pages) return parsed.pages as AlbumPageState[]
        }
      } catch { /* ignore */ }
      return null
    }

    const restored = tryRestore()
    setPages(restored ?? createInitialPages(templateId, pageCount))
  }, [templateId, pageCount])

  // Auto-save
  useEffect(() => {
    if (!pages.length) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try { localStorage.setItem(`editor-v2-${templateId}`, JSON.stringify({ pages, albumTitle })) } catch { /* ignore */ }
    }, 1000)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [pages, albumTitle, templateId])

  // Attach transformer to selected element
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    if (!selectedElementId) {
      transformerRef.current.nodes([])
      return
    }
    const stage = stageRef.current
    const shape = stage.findOne(`#el-${selectedElementId}`)
    if (shape) {
      transformerRef.current.nodes([shape])
    } else {
      transformerRef.current.nodes([])
    }
  }, [selectedElementId, currentPageIndex])

  const currentPage = pages[currentPageIndex]
  const currentLayout = currentPage ? (config.pages[currentPage.type] ?? PAGE_LAYOUTS[currentPage.type] ?? PAGE_LAYOUTS.photo_single) : PAGE_LAYOUTS.photo_single

  // ── Photo upload handler ──────────────────────────────────────────────────

  const handlePhotoSlotClick = useCallback((slotId: string) => {
    activeSlotIdRef.current = slotId
    fileInputRef.current?.click()
    setSelectedElementId(null)
    setActiveTextSlotId(null)
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const dataUrl = await fileToDataUrl(file)
    const slotId = activeSlotIdRef.current

    // Check image quality for print
    const img = new window.Image()
    img.src = dataUrl
    await new Promise<void>(resolve => { img.onload = () => resolve() })

    const slot = currentLayout.photoSlots.find(s => s.id === slotId)
    if (slot && purpose === 'print') {
      const quality = validatePhotoQuality(img.width, img.height, slot.width, slot.height, format)
      setPhotoQualities(prev => ({ ...prev, [`${currentPageIndex}-${slotId}`]: quality }))
      if (quality === 'poor') {
        setShowQualityToast(true)
        setTimeout(() => setShowQualityToast(false), 4000)
      }
    }

    // Cache and update
    loadImageIntoCache(dataUrl, forceRender)
    setPages(prev => {
      const next = [...prev]
      const pg = { ...next[currentPageIndex] }
      pg.photos = { ...pg.photos, [slotId]: dataUrl }
      next[currentPageIndex] = pg
      return next
    })
  }, [currentLayout.photoSlots, purpose, format, currentPageIndex, forceRender])

  // ── Text editing ──────────────────────────────────────────────────────────

  const openTextEditor = useCallback((slotId: string) => {
    setActiveTextSlotId(slotId)
    setSelectedElementId(null)
  }, [])

  const handleTextChange = useCallback((slotId: string, val: string) => {
    setPages(prev => {
      const next = [...prev]
      const pg = { ...next[currentPageIndex] }
      pg.texts = { ...pg.texts, [slotId]: val }
      next[currentPageIndex] = pg
      return next
    })
  }, [currentPageIndex])

  // ── Element management ────────────────────────────────────────────────────

  const updateElement = useCallback((elementId: string, props: Partial<TemplateElement>) => {
    setPages(prev => {
      const next = [...prev]
      const pg = { ...next[currentPageIndex] }
      pg.elements = pg.elements.map(el => el.id === elementId ? { ...el, ...props } : el)
      next[currentPageIndex] = pg
      return next
    })
  }, [currentPageIndex])

  const deleteElement = useCallback((elementId: string) => {
    setPages(prev => {
      const next = [...prev]
      const pg = { ...next[currentPageIndex] }
      pg.elements = pg.elements.filter(el => el.id !== elementId)
      next[currentPageIndex] = pg
      return next
    })
    setSelectedElementId(null)
  }, [currentPageIndex])

  // ── Page management ───────────────────────────────────────────────────────

  const addPage = useCallback(() => {
    const newPage: AlbumPageState = {
      id: `page-${Date.now()}`,
      type: 'photo_single',
      photos: {}, texts: {}, elements: [],
    }
    setPages(prev => {
      const next = [...prev]
      // Insert before back_cover if exists
      const backIdx = next.findIndex(p => p.type === 'back_cover')
      if (backIdx >= 0) {
        next.splice(backIdx, 0, newPage)
      } else {
        next.push(newPage)
      }
      return next
    })
    // Navigate to the new page (back_cover is typically last, new page is before it)
    setCurrentPageIndex(prev => prev + 1)
  }, [])

  const changePageType = useCallback((type: PageType) => {
    setPages(prev => {
      const next = [...prev]
      next[currentPageIndex] = { ...next[currentPageIndex], type }
      return next
    })
    setShowPageTypeMenu(false)
    setActiveTextSlotId(null)
    setSelectedElementId(null)
  }, [currentPageIndex])

  // ── High-res export ───────────────────────────────────────────────────────

  const exportAllPages = useCallback(async (): Promise<string[]> => {
    if (!stageRef.current) return []
    const spec = FORMAT_SPECS[format]
    const pixelRatio = getExportPixelRatio(displayWidth, format)
    const pageImages: string[] = []

    const originalIdx = currentPageIndex

    for (let i = 0; i < pages.length; i++) {
      setCurrentPageIndex(i)
      await new Promise(resolve => setTimeout(resolve, 150))
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio, mimeType: 'image/png' })
      if (dataUrl) pageImages.push(dataUrl)
    }

    setCurrentPageIndex(originalIdx)
    return pageImages
  }, [format, displayWidth, currentPageIndex, pages.length])

  const handleFinalize = useCallback(async () => {
    setIsExporting(true)
    try {
      const pageImages = await exportAllPages()
      const albumId = `album-${Date.now()}`
      const albumData = {
        albumId, templateId, format, purpose,
        albumTitle, pageCount: pages.length,
        pageImages,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem(`album-${albumId}`, JSON.stringify(albumData))
      localStorage.setItem('currentAlbumId', albumId)
      router.push(`/preview/${albumId}`)
    } finally {
      setIsExporting(false)
    }
  }, [exportAllPages, albumTitle, templateId, format, purpose, pages.length, router])

  // ── Deselect on stage click ───────────────────────────────────────────────

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedElementId(null)
    }
  }, [])

  if (!pages.length || !currentPage) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F5' }}>
        <p style={{ color: '#8C7B82', fontSize: 14 }}>Carregando editor...</p>
      </div>
    )
  }

  const activeTextSlot = currentLayout.textSlots.find(s => s.id === activeTextSlotId) ?? null

  return (
    <div
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F5', fontFamily: 'Inter, sans-serif' }}
      onClick={() => { if (showPageTypeMenu) setShowPageTypeMenu(false) }}
    >
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center px-4 gap-2"
        style={{
          height: 56, zIndex: 50,
          backgroundColor: 'rgba(250,247,245,0.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EDE8E6',
        }}
      >
        <button
          onClick={() => router.push('/templates')}
          style={{ color: '#8C7B82', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, flexShrink: 0 }}
        >
          ←
        </button>

        {isEditingTitle ? (
          <input
            autoFocus
            value={albumTitle}
            onChange={e => setAlbumTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
            style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#2C2125', background: 'none', border: 'none', outline: 'none' }}
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#2C2125', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {albumTitle} ✏️
          </button>
        )}

        <button
          onClick={handleFinalize}
          disabled={isExporting}
          style={{
            flexShrink: 0, height: 36, padding: '0 14px',
            borderRadius: 99, backgroundColor: '#C9607A',
            color: '#FFFFFF', fontSize: 13, fontWeight: 700,
            border: 'none', cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.6 : 1,
          }}
        >
          {isExporting ? '⏳' : '↓ Baixar'}
        </button>
      </header>

      {/* ── CANVAS AREA ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: '#DDDBE5', padding: '16px 0', minHeight: 0, overflow: 'hidden' }}
      >
        <div style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)', lineHeight: 0, borderRadius: 2, overflow: 'hidden' }}>
          {!fontsLoaded ? (
            <div style={{ width: displayWidth, height: displayHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: config.colors.bg }}>
              <p style={{ fontSize: 12, color: '#8C7B82' }}>Carregando...</p>
            </div>
          ) : (
            <Stage
              ref={stageRef}
              width={displayWidth}
              height={displayHeight}
              onClick={handleStageClick}
            >
              {/* Layer 0: Background — não interativo */}
              <Layer listening={false}>
                <BackgroundLayer
                  templateId={templateId}
                  format={format}
                  pageType={currentPage.type}
                  width={displayWidth}
                  height={displayHeight}
                  forceRender={forceRender}
                />
                {/* Cover overlay */}
                {currentPage.type === 'cover' && (
                  <Rect
                    x={0} y={displayHeight * 0.55} width={displayWidth} height={displayHeight * 0.45}
                    fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                    fillLinearGradientEndPoint={{ x: 0, y: displayHeight * 0.45 }}
                    fillLinearGradientColorStops={[0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.55)']}
                  />
                )}
              </Layer>

              {/* Layer 1: Photo slots */}
              <Layer>
                {currentLayout.photoSlots.map(slot => (
                  <KonvaPhotoSlot
                    key={slot.id}
                    slot={slot}
                    photo={currentPage.photos[slot.id]}
                    displayWidth={displayWidth}
                    displayHeight={displayHeight}
                    format={format}
                    quality={photoQualities[`${currentPageIndex}-${slot.id}`]}
                    templateColor={config.colors.primary}
                    templateBg={config.colors.bg}
                    onPhotoClick={() => handlePhotoSlotClick(slot.id)}
                    forceRender={forceRender}
                  />
                ))}
              </Layer>

              {/* Layer 2: Template elements (draggable) */}
              <Layer>
                {currentPage.elements.map(el => (
                  <DraggableElement
                    key={el.id}
                    element={el}
                    displayWidth={displayWidth}
                    displayHeight={displayHeight}
                    isSelected={selectedElementId === el.id}
                    onSelect={() => setSelectedElementId(el.id)}
                    onChange={props => updateElement(el.id, props)}
                    onDelete={() => deleteElement(el.id)}
                    forceRender={forceRender}
                  />
                ))}
              </Layer>

              {/* Layer 3: Text slots */}
              <Layer>
                {currentLayout.textSlots.map(slot => (
                  <KonvaTextSlot
                    key={slot.id}
                    slot={slot}
                    text={currentPage.texts[slot.id] ?? slot.defaultText}
                    displayWidth={displayWidth}
                    displayHeight={displayHeight}
                    config={config}
                    onEdit={() => openTextEditor(slot.id)}
                  />
                ))}
              </Layer>

              {/* Layer 4: Transformer */}
              <Layer>
                <Transformer ref={transformerRef} />
              </Layer>
            </Stage>
          )}
        </div>
      </div>

      {/* ── TEXT EDIT PANEL (appears when text slot is tapped) ───────────── */}
      {activeTextSlot && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
            backgroundColor: '#FFFFFF', borderTop: `2px solid ${config.colors.primary}`,
            padding: '12px 16px 24px',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontSize: 12, fontWeight: 600, color: '#2C2125' }}>
              Editando: <span style={{ color: config.colors.primary }}>{activeTextSlot.id}</span>
            </p>
            <button onClick={() => setActiveTextSlotId(null)} style={{ color: '#8C7B82', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
          <input
            autoFocus
            value={currentPage.texts[activeTextSlot.id] ?? activeTextSlot.defaultText}
            onChange={e => handleTextChange(activeTextSlot.id, e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              border: `1.5px solid ${config.colors.primary}`, outline: 'none',
              fontSize: 15, color: '#2C2125', fontFamily: activeTextSlot.fontFamily,
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* ── QUALITY TOAST ─────────────────────────────────────────────── */}
      {showQualityToast && (
        <div
          style={{
            position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
            backgroundColor: '#FF4444', color: '#FFFFFF', borderRadius: 12,
            padding: '10px 18px', fontSize: 13, fontWeight: 600, maxWidth: 300, textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          ⚠️ Foto pequena — pode ficar borrada na impressão
        </div>
      )}

      {/* ── BOTTOM BAR ─────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #EDE8E6', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Page indicator */}
        <div
          className="flex items-center justify-between px-4"
          style={{ height: 40, borderBottom: '1px solid #EDE8E6' }}
        >
          <p style={{ fontSize: 12, color: '#8C7B82', fontWeight: 500 }}>
            Página {currentPageIndex + 1}/{pages.length}
          </p>
          <div className="flex gap-1.5 items-center">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPageIndex(i); setActiveTextSlotId(null); setSelectedElementId(null) }}
                style={{
                  width: currentPageIndex === i ? 18 : 6, height: 6,
                  borderRadius: 99, border: 'none', padding: 0,
                  backgroundColor: currentPageIndex === i ? config.colors.primary : '#D4CCCB',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#8C7B82' }}>{PAGE_TYPE_LABELS[currentPage.type]}</p>
        </div>

        {/* Navigation + actions */}
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Prev */}
          <button
            onClick={() => { setCurrentPageIndex(i => Math.max(0, i - 1)); setActiveTextSlotId(null); setSelectedElementId(null) }}
            disabled={currentPageIndex === 0}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid #EDE8E6', backgroundColor: '#FFFFFF',
              fontSize: 16, cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentPageIndex === 0 ? 0.4 : 1, flexShrink: 0,
            }}
          >←</button>

          {/* Page type switcher */}
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={e => { e.stopPropagation(); setShowPageTypeMenu(v => !v) }}
              style={{
                width: '100%', height: 36, borderRadius: 18,
                border: '1.5px solid #EDE8E6', backgroundColor: '#F9F7F5',
                fontSize: 12, fontWeight: 600, color: '#5C5670', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {PAGE_TYPE_LABELS[currentPage.type]} ▾
            </button>
            {showPageTypeMenu && (
              <div
                style={{
                  position: 'absolute', bottom: 44, left: 0, right: 0, zIndex: 60,
                  backgroundColor: '#FFFFFF', borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  overflow: 'hidden', border: '1px solid #EDE8E6',
                }}
                onClick={e => e.stopPropagation()}
              >
                {PAGE_TYPE_OPTIONS.map(type => (
                  <button
                    key={type}
                    onClick={() => changePageType(type)}
                    style={{
                      display: 'block', width: '100%', padding: '12px 16px',
                      textAlign: 'left', fontSize: 13, fontWeight: currentPage.type === type ? 700 : 400,
                      color: currentPage.type === type ? config.colors.primary : '#2C2125',
                      backgroundColor: currentPage.type === type ? `${config.colors.primary}11` : 'transparent',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {PAGE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add page */}
          <button
            onClick={addPage}
            style={{
              height: 36, padding: '0 12px', borderRadius: 18,
              border: `1.5px solid ${config.colors.primary}`,
              backgroundColor: 'transparent', color: config.colors.primary,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            + Página
          </button>

          {/* Next */}
          <button
            onClick={() => { setCurrentPageIndex(i => Math.min(pages.length - 1, i + 1)); setActiveTextSlotId(null); setSelectedElementId(null) }}
            disabled={currentPageIndex === pages.length - 1}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid #EDE8E6', backgroundColor: '#FFFFFF',
              fontSize: 16, cursor: currentPageIndex === pages.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentPageIndex === pages.length - 1 ? 0.4 : 1, flexShrink: 0,
            }}
          >→</button>
        </div>

        {/* Finalize bar */}
        <div className="px-4 pb-2">
          <button
            onClick={handleFinalize}
            disabled={isExporting}
            style={{
              width: '100%', height: 48, borderRadius: 24,
              backgroundColor: config.colors.primary,
              color: '#FFFFFF', fontSize: 15, fontWeight: 700,
              border: 'none', cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
              boxShadow: `0 4px 16px ${config.colors.primary}44`,
            }}
          >
            {isExporting ? 'Exportando... ⏳' : `Finalizar álbum — Baixar PDF →`}
          </button>
        </div>
      </div>
    </div>
  )
}
