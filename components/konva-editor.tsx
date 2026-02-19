'use client'

import { useState, useRef, useEffect, useCallback, useReducer } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PageType = 'cover' | 'photo_single' | 'photo_double' | 'text_focus' | 'back_cover'

export interface PhotoSlot {
  x: number
  y: number
  width: number
  height: number
  url: string | null
}

export interface TextSlot {
  id: string
  x: number
  y: number
  maxWidth: number
  fontSize: number
  fill: string
  fontFamily: string
  text: string
  align: 'left' | 'center' | 'right'
  fontStyle?: string
}

export interface PageState {
  type: PageType
  bg: string
  bgGradient?: [string, string]
  photoSlots: PhotoSlot[]
  textSlots: TextSlot[]
}

// ─── Template Configs ─────────────────────────────────────────────────────────

interface TemplateConfig {
  color: string
  color2: string
  bg: string
  font: string
  bodyFont: string
  pages: Array<{
    type: PageType
    bg?: string
    bgGradient?: [string, string]
  }>
}

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'amor-infinito': {
    color: '#C9184A', color2: '#FF758F', bg: '#FFF0F3',
    font: 'Playfair Display', bodyFont: 'Lato',
    pages: [
      { type: 'cover', bgGradient: ['#C9184A', '#FF758F'] },
      { type: 'text_focus', bg: '#FFF0F3' },
      { type: 'photo_single', bg: '#FFF8F9' },
      { type: 'photo_double', bg: '#FFF0F3' },
      { type: 'photo_double', bg: '#FFF0F3' },
      { type: 'text_focus', bg: '#FFF0F3' },
      { type: 'photo_single', bg: '#FFF8F9' },
      { type: 'photo_double', bg: '#FFF0F3' },
      { type: 'photo_double', bg: '#FFF0F3' },
      { type: 'back_cover', bg: '#C9184A' },
    ],
  },
  'primeiro-sorriso': {
    color: '#B5D8CC', color2: '#F9C9D4', bg: '#FEF9EF',
    font: 'Nunito', bodyFont: 'Nunito Sans',
    pages: [
      { type: 'cover', bgGradient: ['#B5D8CC', '#F9C9D4'] },
      { type: 'text_focus', bg: '#FEF9EF' },
      { type: 'photo_single', bg: '#FEF9EF' },
      { type: 'text_focus', bg: '#FEF9EF' },
      { type: 'photo_double', bg: '#FEF9EF' },
      { type: 'photo_double', bg: '#FEF9EF' },
      { type: 'photo_single', bg: '#FEF9EF' },
      { type: 'text_focus', bg: '#FEF9EF' },
      { type: 'photo_double', bg: '#FEF9EF' },
      { type: 'photo_double', bg: '#FEF9EF' },
      { type: 'photo_single', bg: '#FEF9EF' },
      { type: 'back_cover', bg: '#B5D8CC' },
    ],
  },
  'nossa-familia': {
    color: '#E07A5F', color2: '#F2CC8F', bg: '#F4F1DE',
    font: 'Merriweather', bodyFont: 'Source Sans 3',
    pages: [
      { type: 'cover', bgGradient: ['#E07A5F', '#F2CC8F'] },
      { type: 'text_focus', bg: '#F4F1DE' },
      { type: 'photo_single', bg: '#F4F1DE' },
      { type: 'photo_double', bg: '#F4F1DE' },
      { type: 'photo_double', bg: '#F4F1DE' },
      { type: 'text_focus', bg: '#F4F1DE' },
      { type: 'photo_double', bg: '#F4F1DE' },
      { type: 'photo_double', bg: '#F4F1DE' },
      { type: 'photo_single', bg: '#F4F1DE' },
      { type: 'back_cover', bg: '#3D405B' },
    ],
  },
  'instante': {
    color: '#1A1A2E', color2: '#C9A84C', bg: '#F5F5F8',
    font: 'Cormorant Garamond', bodyFont: 'Inter',
    pages: [
      { type: 'cover', bg: '#FFFFFF' },
      { type: 'text_focus', bg: '#FFFFFF' },
      { type: 'photo_single', bg: '#FFFFFF' },
      { type: 'photo_double', bg: '#FFFFFF' },
      { type: 'photo_double', bg: '#FFFFFF' },
      { type: 'text_focus', bg: '#FFFFFF' },
      { type: 'photo_single', bg: '#FFFFFF' },
      { type: 'back_cover', bg: '#1A1A2E' },
    ],
  },
  'mundo-afora': {
    color: '#2D6A4F', color2: '#74C69D', bg: '#D8F3DC',
    font: 'Josefin Sans', bodyFont: 'Open Sans',
    pages: [
      { type: 'cover', bgGradient: ['#2D6A4F', '#74C69D'] },
      { type: 'text_focus', bg: '#D8F3DC' },
      { type: 'photo_double', bg: '#D8F3DC' },
      { type: 'photo_double', bg: '#D8F3DC' },
      { type: 'text_focus', bg: '#D8F3DC' },
      { type: 'photo_double', bg: '#D8F3DC' },
      { type: 'photo_double', bg: '#D8F3DC' },
      { type: 'text_focus', bg: '#D8F3DC' },
      { type: 'photo_double', bg: '#D8F3DC' },
      { type: 'photo_double', bg: '#D8F3DC' },
      { type: 'photo_single', bg: '#D8F3DC' },
      { type: 'back_cover', bg: '#2D6A4F' },
    ],
  },
  'casamento-dourado': {
    color: '#C9A84C', color2: '#E8D5A3', bg: '#FAF6EE',
    font: 'Cormorant Garamond', bodyFont: 'Lato',
    pages: [
      { type: 'cover', bgGradient: ['#C9A84C', '#E8D5A3'] },
      { type: 'text_focus', bg: '#FAF6EE' },
      { type: 'photo_single', bg: '#FAF6EE' },
      { type: 'photo_double', bg: '#FAF6EE' },
      { type: 'text_focus', bg: '#FAF6EE' },
      { type: 'photo_double', bg: '#FAF6EE' },
      { type: 'photo_single', bg: '#FAF6EE' },
      { type: 'text_focus', bg: '#FAF6EE' },
      { type: 'photo_double', bg: '#FAF6EE' },
      { type: 'back_cover', bg: '#C9A84C' },
    ],
  },
  'pequeno-universo': {
    color: '#9B72CF', color2: '#C3A8E0', bg: '#F4F0FF',
    font: 'Nunito', bodyFont: 'Nunito Sans',
    pages: [
      { type: 'cover', bgGradient: ['#9B72CF', '#C3A8E0'] },
      { type: 'text_focus', bg: '#F4F0FF' },
      { type: 'photo_single', bg: '#F4F0FF' },
      { type: 'photo_double', bg: '#F4F0FF' },
      { type: 'text_focus', bg: '#F4F0FF' },
      { type: 'photo_double', bg: '#F4F0FF' },
      { type: 'photo_single', bg: '#F4F0FF' },
      { type: 'text_focus', bg: '#F4F0FF' },
      { type: 'photo_double', bg: '#F4F0FF' },
      { type: 'back_cover', bg: '#9B72CF' },
    ],
  },
  'raizes': {
    color: '#8B5E3C', color2: '#D4956A', bg: '#F5EDD5',
    font: 'Merriweather', bodyFont: 'Source Sans 3',
    pages: [
      { type: 'cover', bgGradient: ['#8B5E3C', '#D4956A'] },
      { type: 'text_focus', bg: '#F5EDD5' },
      { type: 'photo_single', bg: '#F5EDD5' },
      { type: 'photo_double', bg: '#F5EDD5' },
      { type: 'text_focus', bg: '#F5EDD5' },
      { type: 'photo_double', bg: '#F5EDD5' },
      { type: 'photo_double', bg: '#F5EDD5' },
      { type: 'text_focus', bg: '#F5EDD5' },
      { type: 'photo_single', bg: '#F5EDD5' },
      { type: 'photo_double', bg: '#F5EDD5' },
      { type: 'photo_double', bg: '#F5EDD5' },
      { type: 'back_cover', bg: '#8B5E3C' },
    ],
  },
  'conquista': {
    color: '#1B2D5E', color2: '#C9A84C', bg: '#F0F3FA',
    font: 'Playfair Display', bodyFont: 'Inter',
    pages: [
      { type: 'cover', bgGradient: ['#1B2D5E', '#C9A84C'] },
      { type: 'text_focus', bg: '#F0F3FA' },
      { type: 'photo_single', bg: '#F0F3FA' },
      { type: 'photo_double', bg: '#F0F3FA' },
      { type: 'text_focus', bg: '#F0F3FA' },
      { type: 'photo_double', bg: '#F0F3FA' },
      { type: 'photo_single', bg: '#F0F3FA' },
      { type: 'text_focus', bg: '#F0F3FA' },
      { type: 'photo_double', bg: '#F0F3FA' },
      { type: 'back_cover', bg: '#1B2D5E' },
    ],
  },
  'doce-vida': {
    color: '#FF6B8A', color2: '#FFD166', bg: '#F0FBFF',
    font: 'Nunito', bodyFont: 'Open Sans',
    pages: [
      { type: 'cover', bgGradient: ['#FF6B8A', '#FFD166'] },
      { type: 'text_focus', bg: '#F0FBFF' },
      { type: 'photo_single', bg: '#F0FBFF' },
      { type: 'photo_double', bg: '#F0FBFF' },
      { type: 'text_focus', bg: '#F0FBFF' },
      { type: 'photo_double', bg: '#F0FBFF' },
      { type: 'photo_single', bg: '#F0FBFF' },
      { type: 'text_focus', bg: '#F0FBFF' },
      { type: 'photo_double', bg: '#F0FBFF' },
      { type: 'back_cover', bg: '#FF6B8A' },
    ],
  },
}

// ─── Layout Factory ───────────────────────────────────────────────────────────

function getPageLayout(
  type: PageType,
  color: string,
  headingFont: string,
  bodyFont: string,
): Pick<PageState, 'photoSlots' | 'textSlots'> {
  switch (type) {
    case 'cover':
      return {
        photoSlots: [{ x: 0, y: 0, width: 300, height: 300, url: null }],
        textSlots: [
          { id: 'title', x: 10, y: 215, maxWidth: 280, fontSize: 22, fill: '#FFFFFF', fontFamily: headingFont, text: 'Seu Álbum', align: 'center', fontStyle: 'bold' },
          { id: 'subtitle', x: 10, y: 248, maxWidth: 280, fontSize: 12, fill: 'rgba(255,255,255,0.85)', fontFamily: bodyFont, text: '2026', align: 'center' },
        ],
      }
    case 'photo_single':
      return {
        photoSlots: [{ x: 20, y: 20, width: 260, height: 225, url: null }],
        textSlots: [
          { id: 'caption', x: 20, y: 254, maxWidth: 260, fontSize: 11, fill: '#5C5670', fontFamily: bodyFont, text: 'Caption aqui...', align: 'center' },
        ],
      }
    case 'photo_double':
      return {
        photoSlots: [
          { x: 8, y: 20, width: 138, height: 185, url: null },
          { x: 154, y: 20, width: 138, height: 185, url: null },
        ],
        textSlots: [
          { id: 'caption1', x: 8, y: 210, maxWidth: 138, fontSize: 10, fill: '#5C5670', fontFamily: bodyFont, text: 'Foto 1', align: 'center' },
          { id: 'caption2', x: 154, y: 210, maxWidth: 138, fontSize: 10, fill: '#5C5670', fontFamily: bodyFont, text: 'Foto 2', align: 'center' },
        ],
      }
    case 'text_focus':
      return {
        photoSlots: [],
        textSlots: [
          { id: 'heading', x: 20, y: 90, maxWidth: 260, fontSize: 20, fill: color, fontFamily: headingFont, text: 'Um momento especial', align: 'center', fontStyle: 'bold' },
          { id: 'body', x: 30, y: 140, maxWidth: 240, fontSize: 12, fill: '#5C5670', fontFamily: bodyFont, text: 'Escreva sua mensagem aqui...', align: 'center' },
        ],
      }
    case 'back_cover':
      return {
        photoSlots: [],
        textSlots: [
          { id: 'closing', x: 20, y: 115, maxWidth: 260, fontSize: 18, fill: '#FFFFFF', fontFamily: headingFont, text: 'com amor,', align: 'center', fontStyle: 'italic' },
          { id: 'author', x: 20, y: 150, maxWidth: 260, fontSize: 14, fill: 'rgba(255,255,255,0.80)', fontFamily: bodyFont, text: 'Seu nome aqui', align: 'center' },
          { id: 'brand', x: 20, y: 265, maxWidth: 260, fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontFamily: bodyFont, text: 'feito com ❤️ no momentu', align: 'center' },
        ],
      }
    default:
      return { photoSlots: [], textSlots: [] }
  }
}

function createInitialPages(templateId: string): PageState[] {
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['amor-infinito']
  return config.pages.map(pageCfg => {
    const layout = getPageLayout(pageCfg.type, config.color, config.font, config.bodyFont)
    return {
      type: pageCfg.type,
      bg: pageCfg.bg || config.bg,
      bgGradient: pageCfg.bgGradient,
      photoSlots: layout.photoSlots,
      textSlots: layout.textSlots,
    }
  })
}

// ─── Image cache utilities ────────────────────────────────────────────────────

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
  img.onerror = () => {
    delete imageCache[url]
  }
}

// ─── Konva Photo Slot Component ───────────────────────────────────────────────

interface KonvaPhotoSlotProps {
  slot: PhotoSlot
  index: number
  onPhotoClick: (idx: number) => void
  forceRender: () => void
}

function KonvaPhotoSlot({ slot, index, onPhotoClick, forceRender }: KonvaPhotoSlotProps) {
  useEffect(() => {
    if (slot.url && imageCache[slot.url] === undefined) {
      loadImageIntoCache(slot.url, forceRender)
    }
  }, [slot.url, forceRender])

  const img = slot.url ? imageCache[slot.url] : null
  const imageEl = (img && img !== 'loading') ? img : null

  if (imageEl) {
    return (
      <KonvaImage
        image={imageEl}
        x={slot.x}
        y={slot.y}
        width={slot.width}
        height={slot.height}
        onClick={() => onPhotoClick(index)}
        onTap={() => onPhotoClick(index)}
      />
    )
  }

  return (
    <Group onClick={() => onPhotoClick(index)} onTap={() => onPhotoClick(index)}>
      <Rect
        x={slot.x}
        y={slot.y}
        width={slot.width}
        height={slot.height}
        fill="#E8E4F0"
        cornerRadius={4}
      />
      <Text
        x={slot.x}
        y={slot.y + slot.height / 2 - 22}
        width={slot.width}
        text="📷"
        align="center"
        fontSize={22}
        fill="#8C7B82"
      />
      <Text
        x={slot.x}
        y={slot.y + slot.height / 2 + 5}
        width={slot.width}
        text="Tap para adicionar foto"
        align="center"
        fontSize={9}
        fill="#8C7B82"
      />
    </Group>
  )
}

// ─── Page Canvas ──────────────────────────────────────────────────────────────

interface PageCanvasProps {
  page: PageState
  activeTextSlotId: string | null
  onPhotoSlotClick: (idx: number) => void
  onTextSlotClick: (id: string) => void
  forceRender: () => void
}

function PageCanvas({ page, activeTextSlotId, onPhotoSlotClick, onTextSlotClick, forceRender }: PageCanvasProps) {
  return (
    <Stage width={300} height={300}>
      <Layer>
        {/* Background */}
        {page.bgGradient ? (
          <Rect
            x={0} y={0} width={300} height={300}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 300, y: 300 }}
            fillLinearGradientColorStops={[0, page.bgGradient[0], 1, page.bgGradient[1]]}
          />
        ) : (
          <Rect x={0} y={0} width={300} height={300} fill={page.bg} />
        )}

        {/* Photo Slots */}
        {page.photoSlots.map((slot, i) => (
          <KonvaPhotoSlot
            key={`photo-${i}`}
            slot={slot}
            index={i}
            onPhotoClick={onPhotoSlotClick}
            forceRender={forceRender}
          />
        ))}

        {/* Cover overlay — dark gradient at bottom */}
        {page.type === 'cover' && (
          <Rect
            x={0} y={180} width={300} height={120}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: 120 }}
            fillLinearGradientColorStops={[0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.55)']}
          />
        )}

        {/* Text Slots */}
        {page.textSlots.map(slot => (
          <Group key={`text-group-${slot.id}`}>
            {activeTextSlotId === slot.id && (
              <Rect
                x={slot.x - 4}
                y={slot.y - 4}
                width={slot.maxWidth + 8}
                height={slot.fontSize + 14}
                fill="rgba(201,96,122,0.15)"
                cornerRadius={4}
              />
            )}
            <Text
              x={slot.x}
              y={slot.y}
              width={slot.maxWidth}
              text={slot.text}
              align={slot.align}
              fontSize={slot.fontSize}
              fill={slot.fill}
              fontFamily={slot.fontFamily}
              fontStyle={slot.fontStyle || 'normal'}
              onClick={() => onTextSlotClick(slot.id)}
              onTap={() => onTextSlotClick(slot.id)}
            />
          </Group>
        ))}
      </Layer>
    </Stage>
  )
}

// ─── Page Type Label ──────────────────────────────────────────────────────────

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  cover: 'Capa',
  photo_single: 'Foto',
  photo_double: '2 Fotos',
  text_focus: 'Texto',
  back_cover: 'Contracapa',
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface KonvaEditorProps {
  templateId: string
}

export default function KonvaEditor({ templateId }: KonvaEditorProps) {
  const router = useRouter()
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['amor-infinito']

  const [albumTitle, setAlbumTitle] = useState(config.font === 'Playfair Display' ? 'Nosso Álbum' : 'Meu Álbum')
  const [activePage, setActivePage] = useState(0)
  const [pages, setPages] = useState<PageState[]>(() => {
    // Try to restore from localStorage
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(`editor-${templateId}`) : null
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return createInitialPages(templateId)
  })
  const [activeTextSlotId, setActiveTextSlotId] = useState<string | null>(null)
  const [activeToolTab, setActiveToolTab] = useState<'foto' | 'texto' | 'preview'>('foto')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const activePhotoSlotRef = useRef<number>(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, forceRender] = useReducer(x => x + 1, 0)

  // Auto-save to localStorage (debounce 1s)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`editor-${templateId}`, JSON.stringify(pages))
      } catch { /* ignore */ }
    }, 1000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [pages, templateId])

  // Handlers
  const handlePhotoSlotClick = useCallback((slotIndex: number) => {
    activePhotoSlotRef.current = slotIndex
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setPages(prev => {
        const updated = [...prev]
        const page = { ...updated[activePage] }
        const slots = [...page.photoSlots]
        slots[activePhotoSlotRef.current] = { ...slots[activePhotoSlotRef.current], url }
        page.photoSlots = slots
        updated[activePage] = page
        return updated
      })
      // Preload into cache
      loadImageIntoCache(url, forceRender)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [activePage, forceRender])

  const handleTextSlotClick = useCallback((slotId: string) => {
    setActiveTextSlotId(slotId)
    setActiveToolTab('texto')
  }, [])

  const handleTextChange = useCallback((slotId: string, newText: string) => {
    setPages(prev => {
      const updated = [...prev]
      const page = { ...updated[activePage] }
      page.textSlots = page.textSlots.map(s =>
        s.id === slotId ? { ...s, text: newText } : s
      )
      updated[activePage] = page
      return updated
    })
  }, [activePage])

  const handleFinalize = useCallback(() => {
    const albumId = `album-${Date.now()}`
    // Collect all photos
    const allPhotos: string[] = []
    pages.forEach(p => {
      p.photoSlots.forEach(slot => {
        if (slot.url) allPhotos.push(slot.url)
      })
    })
    const albumData = {
      albumId,
      templateId,
      templateName: Object.entries(TEMPLATE_CONFIGS).find(([k]) => k === templateId)?.[0] || templateId,
      templateEmoji: '📷',
      themeLabel: templateId.replace(/-/g, ' '),
      pageCount: pages.length,
      photos: allPhotos,
      textContent: {
        title: albumTitle,
        subtitle: '',
        date: new Date().toLocaleDateString('pt-BR'),
        message: 'com todo meu amor...',
      },
      pages,
      templateColor: config.color,
      templateColor2: config.color2,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(`album-${albumId}`, JSON.stringify(albumData))
    localStorage.setItem('currentAlbumId', albumId)
    router.push(`/preview/${albumId}`)
  }, [albumTitle, pages, templateId, config.color, config.color2, router])

  const currentPage = pages[activePage]
  const activeTextSlot = currentPage?.textSlots.find(s => s.id === activeTextSlotId) || null

  const PAGE_TYPE_COLORS: Record<PageType, string> = {
    cover: config.color,
    photo_single: '#8C7B82',
    photo_double: '#8C7B82',
    text_focus: config.color,
    back_cover: config.color,
  }

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100dvh', backgroundColor: '#FAF7F5', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-50 flex items-center px-4 gap-3"
        style={{
          height: 56,
          backgroundColor: 'rgba(250,247,245,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EDE8E6',
        }}
      >
        <button
          onClick={() => router.push('/templates')}
          className="text-sm font-medium flex-shrink-0"
          style={{ color: '#8C7B82', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Voltar
        </button>
        <input
          value={albumTitle}
          onChange={e => setAlbumTitle(e.target.value)}
          className="flex-1 text-sm font-semibold text-center bg-transparent outline-none"
          style={{ color: '#2C2125', minWidth: 0 }}
          placeholder="Nome do álbum"
        />
        <button
          onClick={handleFinalize}
          className="flex-shrink-0 text-sm font-semibold text-white px-4 h-9 rounded-full"
          style={{ backgroundColor: '#C9607A', boxShadow: '0 2px 8px rgba(201,96,122,0.25)', border: 'none', cursor: 'pointer' }}
        >
          Finalizar →
        </button>
      </header>

      {/* ── PAGE THUMBNAIL STRIP ── */}
      <div
        className="flex-shrink-0 overflow-x-auto px-3 py-2"
        style={{ borderBottom: '1px solid #EDE8E6', backgroundColor: '#FFFFFF' }}
      >
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          {pages.map((pg, i) => (
            <button
              key={i}
              onClick={() => { setActivePage(i); setActiveTextSlotId(null) }}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  border: activePage === i ? `2px solid ${config.color}` : '2px solid #EDE8E6',
                  background: pg.bgGradient
                    ? `linear-gradient(135deg, ${pg.bgGradient[0]}, ${pg.bgGradient[1]})`
                    : pg.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: pg.type === 'back_cover' || pg.type === 'cover' ? '#FFFFFF' : PAGE_TYPE_COLORS[pg.type],
                  boxShadow: activePage === i ? `0 0 0 2px ${config.color}33` : 'none',
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 9, color: activePage === i ? config.color : '#8C7B82', fontWeight: activePage === i ? 600 : 400 }}>
                {PAGE_TYPE_LABELS[pg.type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CANVAS AREA ── */}
      <div className="flex-1 flex flex-col items-center justify-center py-4" style={{ backgroundColor: '#ECEAF0' }}>
        <div
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            borderRadius: 4,
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          {currentPage && (
            <PageCanvas
              page={currentPage}
              activeTextSlotId={activeTextSlotId}
              onPhotoSlotClick={handlePhotoSlotClick}
              onTextSlotClick={handleTextSlotClick}
              forceRender={forceRender}
            />
          )}
        </div>
        <p className="text-xs mt-3" style={{ color: '#8C7B82' }}>
          Pág {activePage + 1} de {pages.length} · {PAGE_TYPE_LABELS[currentPage?.type || 'cover']}
        </p>

        {/* Navigation arrows */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => { setActivePage(Math.max(0, activePage - 1)); setActiveTextSlotId(null) }}
            disabled={activePage === 0}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1.5px solid #EDE8E6',
              backgroundColor: 'white',
              cursor: activePage === 0 ? 'not-allowed' : 'pointer',
              opacity: activePage === 0 ? 0.4 : 1,
              fontSize: 14,
            }}
          >
            ←
          </button>
          <div className="flex gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActivePage(i); setActiveTextSlotId(null) }}
                style={{
                  width: activePage === i ? 16 : 6,
                  height: 6,
                  borderRadius: 99,
                  border: 'none',
                  backgroundColor: activePage === i ? config.color : '#D4CCCB',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => { setActivePage(Math.min(pages.length - 1, activePage + 1)); setActiveTextSlotId(null) }}
            disabled={activePage === pages.length - 1}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1.5px solid #EDE8E6',
              backgroundColor: 'white',
              cursor: activePage === pages.length - 1 ? 'not-allowed' : 'pointer',
              opacity: activePage === pages.length - 1 ? 0.4 : 1,
              fontSize: 14,
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* ── BOTTOM TOOLBAR ── */}
      <div
        className="flex-shrink-0"
        style={{ borderTop: '1px solid #EDE8E6', backgroundColor: '#FFFFFF' }}
      >
        {/* Toolbar tabs */}
        <div className="flex" style={{ borderBottom: '1px solid #EDE8E6' }}>
          {([
            { id: 'foto', label: '📷 Foto' },
            { id: 'texto', label: '✏️ Texto' },
            { id: 'preview', label: '👁 Preview' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveToolTab(tab.id)}
              className="flex-1 py-3 text-xs font-semibold border-b-2 transition-all"
              style={{
                borderBottomColor: activeToolTab === tab.id ? config.color : 'transparent',
                color: activeToolTab === tab.id ? config.color : '#8C7B82',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeToolTab === tab.id ? config.color : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tool content */}
        <div style={{ minHeight: 80, padding: '12px 16px' }}>
          {activeToolTab === 'foto' && (
            <div>
              <p className="text-xs mb-2" style={{ color: '#8C7B82' }}>
                {currentPage?.photoSlots.length === 0
                  ? 'Esta página não tem slots de foto'
                  : `Toque nos slots de foto no canvas para adicionar (${currentPage?.photoSlots.length} slot${currentPage?.photoSlots.length !== 1 ? 's' : ''})`
                }
              </p>
              {currentPage?.photoSlots.length > 0 && (
                <div className="flex gap-2">
                  {currentPage.photoSlots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => handlePhotoSlotClick(i)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-[10px] transition-all"
                      style={{
                        backgroundColor: slot.url ? '#D8F3DC' : '#F7E8EC',
                        color: slot.url ? '#1B4332' : '#A8485F',
                        border: `1px solid ${slot.url ? '#52B788' : '#C9607A'}`,
                        cursor: 'pointer',
                      }}
                    >
                      {slot.url ? '✓ Foto ' : '+ Foto '}{i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeToolTab === 'texto' && (
            <div>
              {activeTextSlot ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold" style={{ color: '#2C2125' }}>
                    Editando: <span style={{ color: config.color }}>{activeTextSlot.id}</span>
                  </p>
                  <input
                    value={activeTextSlot.text}
                    onChange={e => handleTextChange(activeTextSlot.id, e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-[10px]"
                    style={{
                      border: `1.5px solid ${config.color}`,
                      outline: 'none',
                      color: '#2C2125',
                      backgroundColor: '#FFFFFF',
                    }}
                    placeholder="Digite o texto..."
                  />
                </div>
              ) : (
                <div>
                  <p className="text-xs mb-2" style={{ color: '#8C7B82' }}>
                    Toque em um texto no canvas para editar
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {currentPage?.textSlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => { handleTextSlotClick(slot.id); setActiveToolTab('texto') }}
                        className="text-xs px-2 py-1 rounded-[8px]"
                        style={{
                          backgroundColor: '#F7E8EC',
                          color: '#A8485F',
                          border: '1px solid #C9607A',
                          cursor: 'pointer',
                        }}
                      >
                        {slot.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeToolTab === 'preview' && (
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: '#8C7B82' }}>
                {pages.filter(p => p.photoSlots.some(s => s.url)).length} de {pages.filter(p => p.photoSlots.length > 0).length} páginas com foto
              </p>
              <button
                onClick={handleFinalize}
                className="text-sm font-semibold text-white px-4 py-2 rounded-full"
                style={{ backgroundColor: config.color, border: 'none', cursor: 'pointer' }}
              >
                Ver Preview →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
