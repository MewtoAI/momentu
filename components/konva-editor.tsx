'use client'

import { useState, useRef, useEffect, useCallback, useReducer } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Circle, Transformer } from 'react-konva'
import { useRouter } from 'next/navigation'
import {
  AlbumPage,
  AlbumFormat,
  AlbumPurpose,
  FORMAT_SPECS,
  PageType,
  PhotoSlot,
  TextSlot,
  PageLayout,
  TemplateConfig,
  TemplateElement,
} from '@/lib/types'
import { validatePhotoQuality } from '@/lib/pdf-generator'

// ─── Font Loader Hook ─────────────────────────────────────────────────────────

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
    Promise.all(
      fonts.map(f => document.fonts.load(`bold 20px "${f}"`))
    ).then(() => setLoaded(true)).catch(() => setLoaded(true))
  }, [fonts]) // eslint-disable-line react-hooks/exhaustive-deps
  return loaded
}

// ─── Page Layout Factory ──────────────────────────────────────────────────────

function buildPageLayouts(
  font: string,
  bodyFont: string,
  primaryColor: string,
  textColor: string
): Partial<Record<PageType, PageLayout>> {
  return {
    cover: {
      photoSlots: [{ id: 'cover-photo', x: 0, y: 0, width: 1, height: 1 }],
      textSlots: [
        { id: 'title', x: 0.033, y: 0.717, width: 0.933, height: 0.08, defaultText: 'Seu Álbum', fontSize: 0.073, align: 'center', fontFamily: font, color: '#FFFFFF' },
        { id: 'subtitle', x: 0.033, y: 0.810, width: 0.933, height: 0.06, defaultText: '2026', fontSize: 0.04, align: 'center', fontFamily: bodyFont, color: 'rgba(255,255,255,0.85)' },
      ],
    },
    photo_single: {
      photoSlots: [{ id: 'photo-1', x: 0.067, y: 0.067, width: 0.867, height: 0.75 }],
      textSlots: [
        { id: 'caption', x: 0.067, y: 0.847, width: 0.867, height: 0.05, defaultText: 'Caption aqui...', fontSize: 0.037, align: 'center', fontFamily: bodyFont, color: textColor },
      ],
    },
    photo_double: {
      photoSlots: [
        { id: 'photo-1', x: 0.027, y: 0.067, width: 0.46, height: 0.617 },
        { id: 'photo-2', x: 0.513, y: 0.067, width: 0.46, height: 0.617 },
      ],
      textSlots: [
        { id: 'caption1', x: 0.027, y: 0.7, width: 0.46, height: 0.05, defaultText: 'Foto 1', fontSize: 0.033, align: 'center', fontFamily: bodyFont, color: textColor },
        { id: 'caption2', x: 0.513, y: 0.7, width: 0.46, height: 0.05, defaultText: 'Foto 2', fontSize: 0.033, align: 'center', fontFamily: bodyFont, color: textColor },
      ],
    },
    photo_triple: {
      photoSlots: [
        { id: 'photo-1', x: 0.027, y: 0.04, width: 0.946, height: 0.43 },
        { id: 'photo-2', x: 0.027, y: 0.49, width: 0.46, height: 0.43 },
        { id: 'photo-3', x: 0.513, y: 0.49, width: 0.46, height: 0.43 },
      ],
      textSlots: [],
    },
    photo_quad: {
      photoSlots: [
        { id: 'photo-1', x: 0.027, y: 0.04, width: 0.46, height: 0.43 },
        { id: 'photo-2', x: 0.513, y: 0.04, width: 0.46, height: 0.43 },
        { id: 'photo-3', x: 0.027, y: 0.52, width: 0.46, height: 0.43 },
        { id: 'photo-4', x: 0.513, y: 0.52, width: 0.46, height: 0.43 },
      ],
      textSlots: [],
    },
    text_focus: {
      photoSlots: [],
      textSlots: [
        { id: 'heading', x: 0.067, y: 0.3, width: 0.867, height: 0.1, defaultText: 'Um momento especial', fontSize: 0.067, align: 'center', fontFamily: font, color: primaryColor },
        { id: 'body', x: 0.1, y: 0.45, width: 0.8, height: 0.15, defaultText: 'Escreva sua mensagem aqui...', fontSize: 0.04, align: 'center', fontFamily: bodyFont, color: textColor },
      ],
    },
    back_cover: {
      photoSlots: [],
      textSlots: [
        { id: 'closing', x: 0.067, y: 0.383, width: 0.867, height: 0.08, defaultText: 'com amor,', fontSize: 0.06, align: 'center', fontFamily: font, color: '#FFFFFF' },
        { id: 'author', x: 0.067, y: 0.5, width: 0.867, height: 0.06, defaultText: 'Seu nome aqui', fontSize: 0.047, align: 'center', fontFamily: bodyFont, color: 'rgba(255,255,255,0.80)' },
        { id: 'brand', x: 0.067, y: 0.883, width: 0.867, height: 0.04, defaultText: 'feito com ❤️ no momentu', fontSize: 0.033, align: 'center', fontFamily: bodyFont, color: 'rgba(255,255,255,0.45)' },
      ],
    },
  }
}

// ─── Template Configs ─────────────────────────────────────────────────────────

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'amor-infinito': {
    id: 'amor-infinito', name: 'Amor Infinito', category: ['casal'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/amor-infinito/bg.svg' },
    thumbnail: '',
    font: 'Playfair Display', bodyFont: 'Lato',
    colors: { primary: '#C9184A', secondary: '#FF758F', text: '#5C5670', bg: '#FFF0F3' },
    elements: { default: [] },
    pages: buildPageLayouts('Playfair Display', 'Lato', '#C9184A', '#5C5670'),
  },
  'primeiro-sorriso': {
    id: 'primeiro-sorriso', name: 'Primeiro Sorriso', category: ['bebe'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/primeiro-sorriso/bg.svg' },
    thumbnail: '',
    font: 'Nunito', bodyFont: 'Nunito Sans',
    colors: { primary: '#B5D8CC', secondary: '#F9C9D4', text: '#3A4A45', bg: '#FEF9EF' },
    elements: { default: [] },
    pages: buildPageLayouts('Nunito', 'Nunito Sans', '#B5D8CC', '#3A4A45'),
  },
  'nossa-familia': {
    id: 'nossa-familia', name: 'Nossa Família', category: ['familia'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/nossa-familia/bg.svg' },
    thumbnail: '',
    font: 'Merriweather', bodyFont: 'Source Sans 3',
    colors: { primary: '#E07A5F', secondary: '#F2CC8F', text: '#3D405B', bg: '#F4F1DE' },
    elements: { default: [] },
    pages: buildPageLayouts('Merriweather', 'Source Sans 3', '#E07A5F', '#3D405B'),
  },
  'instante': {
    id: 'instante', name: 'Instante', category: ['minimalista'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/instante/bg.svg' },
    thumbnail: '',
    font: 'Cormorant Garamond', bodyFont: 'Inter',
    colors: { primary: '#1A1A2E', secondary: '#C9A84C', text: '#1A1A2E', bg: '#F5F5F8' },
    elements: { default: [] },
    pages: buildPageLayouts('Cormorant Garamond', 'Inter', '#1A1A2E', '#1A1A2E'),
  },
  'mundo-afora': {
    id: 'mundo-afora', name: 'Mundo Afora', category: ['viagem'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/mundo-afora/bg.svg' },
    thumbnail: '',
    font: 'Josefin Sans', bodyFont: 'Open Sans',
    colors: { primary: '#2D6A4F', secondary: '#74C69D', text: '#1B4332', bg: '#D8F3DC' },
    elements: { default: [] },
    pages: buildPageLayouts('Josefin Sans', 'Open Sans', '#2D6A4F', '#1B4332'),
  },
  'casamento-dourado': {
    id: 'casamento-dourado', name: 'Casamento Dourado', category: ['casal'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/casamento-dourado/bg.svg' },
    thumbnail: '/templates/casamento-dourado/thumbnail.jpg',
    font: 'Cormorant Garamond', bodyFont: 'Lato',
    colors: { primary: '#C9A84C', secondary: '#E8D5A3', text: '#3D2B00', bg: '#FFFDF5' },
    elements: { default: [] },
    pages: buildPageLayouts('Cormorant Garamond', 'Lato', '#C9A84C', '#3D2B00'),
  },
  'pequeno-universo': {
    id: 'pequeno-universo', name: 'Pequeno Universo', category: ['bebe'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/pequeno-universo/bg.svg' },
    thumbnail: '/templates/pequeno-universo/thumbnail.jpg',
    font: 'Nunito', bodyFont: 'Nunito Sans',
    colors: { primary: '#9B72CF', secondary: '#C3A8E0', text: '#311B92', bg: '#F4F0FF' },
    elements: { default: [] },
    pages: buildPageLayouts('Nunito', 'Nunito Sans', '#9B72CF', '#311B92'),
  },
  'raizes': {
    id: 'raizes', name: 'Raízes', category: ['familia'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/raizes/bg.svg' },
    thumbnail: '/templates/raizes/thumbnail.jpg',
    font: 'Merriweather', bodyFont: 'Source Sans 3',
    colors: { primary: '#8B5E3C', secondary: '#D4956A', text: '#3E2723', bg: '#F5EDD5' },
    elements: { default: [] },
    pages: buildPageLayouts('Merriweather', 'Source Sans 3', '#8B5E3C', '#3E2723'),
  },
  'conquista': {
    id: 'conquista', name: 'Conquista', category: ['formatura'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/conquista/bg.svg' },
    thumbnail: '/templates/conquista/thumbnail.jpg',
    font: 'Playfair Display', bodyFont: 'Inter',
    colors: { primary: '#1B2D5E', secondary: '#C9A84C', text: '#0D0D2B', bg: '#F0F3FA' },
    elements: { default: [] },
    pages: buildPageLayouts('Playfair Display', 'Inter', '#1B2D5E', '#0D0D2B'),
  },
  'doce-vida': {
    id: 'doce-vida', name: 'Doce Vida', category: ['aniversario'],
    formats: ['print_20x20', 'print_a4', 'print_15x21', 'digital_square', 'digital_story'],
    backgrounds: { default: '/templates/doce-vida/bg.svg' },
    thumbnail: '/templates/doce-vida/thumbnail.jpg',
    font: 'Nunito', bodyFont: 'Open Sans',
    colors: { primary: '#FF6B8A', secondary: '#FFD166', text: '#BF360C', bg: '#F0FBFF' },
    elements: { default: [] },
    pages: buildPageLayouts('Nunito', 'Open Sans', '#FF6B8A', '#BF360C'),
  },
}

// ─── Page Type Labels / Helpers ───────────────────────────────────────────────

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  cover: 'Capa',
  photo_single: '1 Foto',
  photo_double: '2 Fotos',
  photo_triple: '3 Fotos',
  photo_quad: '4 Fotos',
  text_focus: 'Texto',
  back_cover: 'Contracapa',
}

const CHANGEABLE_PAGE_TYPES: PageType[] = ['photo_single', 'photo_double', 'photo_triple', 'photo_quad', 'text_focus']

// ─── Init Pages ───────────────────────────────────────────────────────────────

function initPages(
  pageCount: number,
  templateId: string,
  format: AlbumFormat,
  templateElements: Record<string, TemplateElement[]>
): AlbumPage[] {
  const config = TEMPLATE_CONFIGS[templateId]
  const elements: TemplateElement[] =
    templateElements[format] ||
    templateElements['default'] ||
    config?.elements?.[format] ||
    config?.elements?.['default'] ||
    []

  const pageTypes: PageType[] = ['cover']
  for (let i = 1; i < pageCount - 1; i++) {
    if (i % 4 === 0) pageTypes.push('text_focus')
    else if (i % 2 === 0) pageTypes.push('photo_double')
    else pageTypes.push('photo_single')
  }
  pageTypes.push('back_cover')

  return pageTypes.map((type, i) => ({
    id: `page-${i}`,
    type,
    photos: {},
    texts: {},
    elements: elements.map(el => ({ ...el, id: `${el.id}-p${i}` })),
  }))
}

// ─── Background Layer ─────────────────────────────────────────────────────────

interface BackgroundLayerProps {
  templateId: string
  format: AlbumFormat
  colors: TemplateConfig['colors']
  width: number
  height: number
}

function BackgroundLayer({ templateId, format, colors, width, height }: BackgroundLayerProps) {
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    setBgImage(null)
    const tryLoad = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

    tryLoad(`/templates/${templateId}/${format}/bg.svg`)
      .catch(() => tryLoad(`/templates/${templateId}/bg.svg`))
      .then(img => setBgImage(img))
      .catch(() => setBgImage(null))
  }, [templateId, format])

  if (bgImage) {
    return <KonvaImage image={bgImage} x={0} y={0} width={width} height={height} listening={false} />
  }

  return <Rect x={0} y={0} width={width} height={height} fill={colors.bg || '#FAF7F5'} listening={false} />
}

// ─── Konva Photo Slot ─────────────────────────────────────────────────────────

interface KonvaPhotoSlotProps {
  slot: PhotoSlot
  photo: string | undefined
  quality: 'good' | 'warning' | 'poor' | undefined
  displayWidth: number
  displayHeight: number
  templateColor: string
  templateBg: string
  purpose: AlbumPurpose
  onPhotoClick: () => void
}

function KonvaPhotoSlot({
  slot, photo, quality, displayWidth, displayHeight,
  templateColor, templateBg, purpose, onPhotoClick,
}: KonvaPhotoSlotProps) {
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null)

  const x = slot.x * displayWidth
  const y = slot.y * displayHeight
  const w = slot.width * displayWidth
  const h = slot.height * displayHeight

  useEffect(() => {
    if (!photo) { setPhotoImage(null); return }
    const img = new window.Image()
    img.onload = () => setPhotoImage(img)
    img.src = photo
  }, [photo])

  const qualityColor =
    quality === 'good' ? '#22C55E' :
    quality === 'warning' ? '#F59E0B' :
    quality === 'poor' ? '#EF4444' : null

  return (
    <Group onClick={onPhotoClick} onTap={onPhotoClick}>
      {photoImage ? (
        <KonvaImage
          image={photoImage}
          x={x} y={y} width={w} height={h}
          clipX={x} clipY={y} clipWidth={w} clipHeight={h}
        />
      ) : (
        <Group>
          <Rect
            x={x} y={y} width={w} height={h}
            fill={templateBg}
            stroke={templateColor}
            strokeWidth={1}
            opacity={0.5}
            dash={[5, 3]}
          />
          <Text
            text="📷"
            x={x + w / 2 - 12}
            y={y + h / 2 - 20}
            fontSize={Math.min(24, w * 0.15)}
          />
          <Text
            text="Toque para adicionar foto"
            x={x + 4}
            y={y + h / 2 + 8}
            width={w - 8}
            fontSize={Math.max(9, Math.min(12, w * 0.07))}
            fill={templateColor}
            align="center"
            opacity={0.7}
          />
        </Group>
      )}
      {purpose === 'print' && qualityColor && (
        <Circle x={x + w - 8} y={y + 8} radius={6} fill={qualityColor} />
      )}
    </Group>
  )
}

// ─── Draggable Element ────────────────────────────────────────────────────────

interface DraggableElementProps {
  element: TemplateElement
  displayWidth: number
  displayHeight: number
  isSelected: boolean
  shapeRef?: React.RefObject<any>
  onSelect: () => void
  onChange: (updates: Partial<TemplateElement>) => void
  onDelete: () => void
}

function DraggableElement({
  element, displayWidth, displayHeight,
  isSelected, shapeRef, onSelect, onChange, onDelete,
}: DraggableElementProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const internalRef = useRef<any>(null)
  const ref = shapeRef || internalRef

  useEffect(() => {
    if (!element.src) return
    const img = new window.Image()
    img.onload = () => setImage(img)
    img.src = element.src
  }, [element.src])

  const x = element.x * displayWidth
  const y = element.y * displayHeight
  const w = element.width * displayWidth
  const h = element.height * displayHeight

  const handleDragEnd = (e: any) => {
    onChange({
      x: e.target.x() / displayWidth,
      y: e.target.y() / displayHeight,
    })
  }

  const handleTransformEnd = () => {
    const node = ref.current
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    onChange({
      x: node.x() / displayWidth,
      y: node.y() / displayHeight,
      width: (node.width() * scaleX) / displayWidth,
      height: (node.height() * scaleY) / displayHeight,
    })
  }

  const sharedProps = {
    ref,
    x, y, width: w, height: h,
    draggable: !element.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    opacity: isSelected ? 0.9 : 1,
  }

  return (
    <Group>
      {image ? (
        <KonvaImage {...sharedProps} image={image} />
      ) : (
        <Rect
          {...sharedProps}
          fill="rgba(201,96,122,0.15)"
          stroke="rgba(201,96,122,0.4)"
          strokeWidth={1}
        />
      )}
      {isSelected && !element.locked && (
        <Group x={x + w - 14} y={y - 14} onClick={onDelete} onTap={onDelete}>
          <Circle radius={12} fill="#FF4444" />
          <Text text="✕" x={-6} y={-8} fontSize={14} fill="white" fontStyle="bold" />
        </Group>
      )}
    </Group>
  )
}

// ─── Page Canvas ──────────────────────────────────────────────────────────────

interface PageCanvasProps {
  page: AlbumPage
  config: TemplateConfig
  format: AlbumFormat
  purpose: AlbumPurpose
  displayWidth: number
  displayHeight: number
  selectedElementId: string | null
  photoQualities: Record<string, 'good' | 'warning' | 'poor'>
  onSelectElement: (id: string | null) => void
  onPhotoClick: (slotId: string) => void
  onTextClick: (slotId: string, currentText: string) => void
  onElementChange: (elementId: string, updates: Partial<TemplateElement>) => void
  onElementDelete: (elementId: string) => void
}

function PageCanvas({
  page, config, format, purpose, displayWidth, displayHeight,
  selectedElementId, photoQualities,
  onSelectElement, onPhotoClick, onTextClick, onElementChange, onElementDelete,
}: PageCanvasProps) {
  const transformerRef = useRef<any>(null)
  const selectedRef = useRef<any>(null)

  useEffect(() => {
    if (transformerRef.current) {
      if (selectedRef.current && selectedElementId) {
        transformerRef.current.nodes([selectedRef.current])
      } else {
        transformerRef.current.nodes([])
      }
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedElementId])

  const layout = config.pages[page.type]

  return (
    <Stage
      width={displayWidth}
      height={displayHeight}
      onMouseDown={e => { if (e.target === e.target.getStage()) onSelectElement(null) }}
      onTouchStart={e => { if (e.target === e.target.getStage()) onSelectElement(null) }}
    >
      {/* Layer 0: Background SVG — não interativo */}
      <Layer listening={false}>
        <BackgroundLayer
          templateId={config.id}
          format={format}
          colors={config.colors}
          width={displayWidth}
          height={displayHeight}
        />
      </Layer>

      {/* Layer 1: Photo slots */}
      <Layer>
        {(layout?.photoSlots || []).map(slot => (
          <KonvaPhotoSlot
            key={slot.id}
            slot={slot}
            photo={page.photos[slot.id]}
            quality={photoQualities[`${page.id}-${slot.id}`]}
            displayWidth={displayWidth}
            displayHeight={displayHeight}
            templateColor={config.colors.primary}
            templateBg={config.colors.bg}
            purpose={purpose}
            onPhotoClick={() => onPhotoClick(slot.id)}
          />
        ))}
      </Layer>

      {/* Layer 2: Template elements (draggable/resizable) */}
      <Layer>
        {page.elements.map(el => (
          <DraggableElement
            key={el.id}
            element={el}
            displayWidth={displayWidth}
            displayHeight={displayHeight}
            isSelected={selectedElementId === el.id}
            shapeRef={selectedElementId === el.id ? selectedRef : undefined}
            onSelect={() => onSelectElement(el.id)}
            onChange={updates => onElementChange(el.id, updates)}
            onDelete={() => { onSelectElement(null); onElementDelete(el.id) }}
          />
        ))}
      </Layer>

      {/* Layer 3: Text slots */}
      <Layer>
        {(layout?.textSlots || []).map(slot => {
          const text = page.texts[slot.id] !== undefined ? page.texts[slot.id] : slot.defaultText
          const x = slot.x * displayWidth
          const y = slot.y * displayHeight
          const w = slot.width * displayWidth
          const fontSize = Math.max(8, slot.fontSize * displayHeight)
          return (
            <Text
              key={slot.id}
              x={x} y={y} width={w}
              text={text}
              fontSize={fontSize}
              fontFamily={slot.fontFamily || config.font}
              fill={slot.color || config.colors.text}
              align={slot.align}
              onClick={() => onTextClick(slot.id, text)}
              onTap={() => onTextClick(slot.id, text)}
              listening={true}
            />
          )
        })}
      </Layer>

      {/* Layer 4: Transformer */}
      <Layer>
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox
            return newBox
          }}
          rotateEnabled={false}
          borderStroke="#C9607A"
          anchorStroke="#C9607A"
          anchorFill="white"
          anchorSize={10}
        />
      </Layer>
    </Stage>
  )
}

// ─── Quality Indicator ────────────────────────────────────────────────────────

function QualityBanner({ qualities }: { qualities: Record<string, 'good' | 'warning' | 'poor'> }) {
  const values = Object.values(qualities)
  if (values.length === 0) return null
  const hasPoor = values.includes('poor')
  const hasWarning = values.includes('warning')
  if (!hasPoor && !hasWarning) return null

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 mx-4 mt-2 rounded-xl text-xs font-medium"
      style={{
        backgroundColor: hasPoor ? '#FEE2E2' : '#FEF3C7',
        color: hasPoor ? '#991B1B' : '#92400E',
      }}
    >
      <span>{hasPoor ? '⚠️' : '💛'}</span>
      <span>
        {hasPoor
          ? 'Algumas fotos podem ficar desfocadas na impressão'
          : 'Qualidade de algumas fotos pode ser melhorada'}
      </span>
    </div>
  )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface KonvaEditorProps {
  templateId: string
}

export default function KonvaEditor({ templateId }: KonvaEditorProps) {
  const router = useRouter()

  // ── Config from sessionStorage ──
  const [albumPurpose, setAlbumPurpose] = useState<AlbumPurpose>('print')
  const [albumFormat, setAlbumFormat] = useState<AlbumFormat>('print_20x20')
  const [pageCount, setPageCount] = useState(16)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('momentu_album_config')
      if (saved) {
        const cfg = JSON.parse(saved)
        setAlbumPurpose(cfg.purpose || 'print')
        setAlbumFormat(cfg.format || 'print_20x20')
        setPageCount(cfg.pageCount || 16)
      }
    } catch { /* ignore */ }
  }, [])

  // ── Template config ──
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['amor-infinito']
  const fontsLoaded = useFontLoader([config.font, config.bodyFont])

  // ── Template elements (from elements.json) ──
  const [templateElements, setTemplateElements] = useState<Record<string, TemplateElement[]>>({})
  useEffect(() => {
    if (!templateId) return
    fetch(`/templates/${templateId}/elements.json`)
      .then(r => r.json())
      .then(data => setTemplateElements(data))
      .catch(() => {})
  }, [templateId])

  // ── Canvas display size ──
  const spec = FORMAT_SPECS[albumFormat]
  const aspectRatio = spec.widthPx / spec.heightPx
  const [displayWidth, setDisplayWidth] = useState(300)
  const [displayHeight, setDisplayHeight] = useState(300)

  useEffect(() => {
    const updateSize = () => {
      const maxW = Math.min(window.innerWidth - 32, 500)
      setDisplayWidth(maxW)
      setDisplayHeight(Math.round(maxW / aspectRatio))
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [aspectRatio])

  // ── Album state ──
  const [albumTitle, setAlbumTitle] = useState('Meu Álbum')
  const [pages, setPages] = useState<AlbumPage[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [photoQualities, setPhotoQualities] = useState<Record<string, 'good' | 'warning' | 'poor'>>({})
  const [editingTextSlotId, setEditingTextSlotId] = useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = useState('')
  const [showPageTypeMenu, setShowPageTypeMenu] = useState(false)
  const [, forceRender] = useReducer(x => x + 1, 0)

  // active photo slot being replaced
  const activePhotoSlotRef = useRef<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Initialize pages when format/templateElements are ready ──
  useEffect(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem(`editor-v2-${templateId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setPages(parsed.pages || [])
        setAlbumTitle(parsed.albumTitle || 'Meu Álbum')
        return
      }
    } catch { /* ignore */ }

    setPages(initPages(pageCount, templateId, albumFormat, templateElements))
  }, [pageCount, templateId, albumFormat, templateElements]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ──
  useEffect(() => {
    if (pages.length === 0) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`editor-v2-${templateId}`, JSON.stringify({ pages, albumTitle }))
      } catch { /* ignore */ }
    }, 1000)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [pages, albumTitle, templateId])

  // ── Handlers ──

  const updatePage = useCallback((idx: number, updater: (p: AlbumPage) => AlbumPage) => {
    setPages(prev => {
      const updated = [...prev]
      updated[idx] = updater(updated[idx])
      return updated
    })
  }, [])

  const handlePhotoClick = useCallback((slotId: string) => {
    activePhotoSlotRef.current = slotId
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    const dataUrl = await new Promise<string>(resolve => {
      reader.onload = ev => resolve(ev.target!.result as string)
      reader.readAsDataURL(file)
    })

    const img = new window.Image()
    await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = dataUrl })

    // Photo quality validation (print only)
    if (albumPurpose === 'print') {
      const slotId = activePhotoSlotRef.current
      const layout = config.pages[pages[currentPageIndex]?.type]
      const slot = layout?.photoSlots.find(s => s.id === slotId)
      if (slot) {
        const q = validatePhotoQuality(img.naturalWidth, img.naturalHeight, slot.width, slot.height, albumFormat)
        setPhotoQualities(prev => ({ ...prev, [`${pages[currentPageIndex].id}-${slotId}`]: q }))
      }
    }

    updatePage(currentPageIndex, page => ({
      ...page,
      photos: { ...page.photos, [activePhotoSlotRef.current]: dataUrl },
    }))
    forceRender()
  }, [albumPurpose, albumFormat, config, pages, currentPageIndex, updatePage, forceRender])

  const handleTextClick = useCallback((slotId: string, currentText: string) => {
    setEditingTextSlotId(slotId)
    setEditingTextValue(currentText)
    setSelectedElementId(null)
  }, [])

  const handleTextSave = useCallback(() => {
    if (!editingTextSlotId) return
    updatePage(currentPageIndex, page => ({
      ...page,
      texts: { ...page.texts, [editingTextSlotId]: editingTextValue },
    }))
    setEditingTextSlotId(null)
  }, [editingTextSlotId, editingTextValue, currentPageIndex, updatePage])

  const handleElementChange = useCallback((elementId: string, updates: Partial<TemplateElement>) => {
    updatePage(currentPageIndex, page => ({
      ...page,
      elements: page.elements.map(el => el.id === elementId ? { ...el, ...updates } : el),
    }))
  }, [currentPageIndex, updatePage])

  const handleElementDelete = useCallback((elementId: string) => {
    updatePage(currentPageIndex, page => ({
      ...page,
      elements: page.elements.filter(el => el.id !== elementId),
    }))
  }, [currentPageIndex, updatePage])

  const handleAddPage = useCallback(() => {
    const newPage: AlbumPage = {
      id: `page-${Date.now()}`,
      type: 'photo_single',
      photos: {},
      texts: {},
      elements: [],
    }
    setPages(prev => {
      const updated = [...prev]
      updated.splice(currentPageIndex + 1, 0, newPage)
      return updated
    })
    setCurrentPageIndex(i => i + 1)
  }, [currentPageIndex])

  const handleChangePageType = useCallback((type: PageType) => {
    updatePage(currentPageIndex, page => ({ ...page, type, photos: {}, texts: {} }))
    setShowPageTypeMenu(false)
  }, [currentPageIndex, updatePage])

  const handleFinalize = useCallback(() => {
    const albumId = `album-${Date.now()}`
    const allPhotos: string[] = []
    pages.forEach(p => {
      Object.values(p.photos).forEach(ph => { if (ph) allPhotos.push(ph) })
    })
    const albumData = {
      albumId, templateId,
      albumTitle, albumFormat, albumPurpose,
      pageCount: pages.length,
      photos: allPhotos,
      pages,
      templateColor: config.colors.primary,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(`album-${albumId}`, JSON.stringify(albumData))
    localStorage.setItem('currentAlbumId', albumId)
    router.push(`/preview/${albumId}`)
  }, [pages, templateId, albumTitle, albumFormat, albumPurpose, config, router])

  const currentPage = pages[currentPageIndex]
  const canGoBack = currentPageIndex > 0
  const canGoNext = currentPageIndex < pages.length - 1
  const isLocked = currentPage?.type === 'cover' || currentPage?.type === 'back_cover'

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
          onClick={() => router.push('/criar')}
          className="flex-shrink-0 text-sm font-medium"
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
          style={{
            backgroundColor: '#C9607A',
            boxShadow: '0 2px 8px rgba(201,96,122,0.25)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Finalizar →
        </button>
      </header>

      {/* ── CANVAS AREA ── */}
      <div
        className="flex-1 flex flex-col items-center py-4"
        style={{ backgroundColor: '#E8E5EE', overflowY: 'auto' }}
        onClick={() => { setSelectedElementId(null); setShowPageTypeMenu(false) }}
      >
        {/* Canvas */}
        <div
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            borderRadius: 4,
            overflow: 'hidden',
            lineHeight: 0,
          }}
          onClick={e => e.stopPropagation()}
        >
          {pages.length === 0 || !fontsLoaded ? (
            <div
              style={{
                width: displayWidth,
                height: displayHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: config.colors.bg,
              }}
            >
              <span style={{ color: '#8C7B82', fontSize: 13 }}>Carregando…</span>
            </div>
          ) : currentPage ? (
            <PageCanvas
              page={currentPage}
              config={config}
              format={albumFormat}
              purpose={albumPurpose}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
              selectedElementId={selectedElementId}
              photoQualities={photoQualities}
              onSelectElement={setSelectedElementId}
              onPhotoClick={handlePhotoClick}
              onTextClick={handleTextClick}
              onElementChange={handleElementChange}
              onElementDelete={handleElementDelete}
            />
          ) : null}
        </div>

        {/* Quality banner */}
        {albumPurpose === 'print' && (
          <div className="w-full" style={{ maxWidth: displayWidth + 32 }}>
            <QualityBanner qualities={photoQualities} />
          </div>
        )}

        {/* Format badge */}
        <div
          className="mt-2 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: 'rgba(201,96,122,0.12)', color: '#C9607A' }}
        >
          {albumFormat.replace('_', ' ').toUpperCase()} · {albumPurpose === 'print' ? '300 DPI' : '1080px'}
        </div>
      </div>

      {/* ── TEXT EDIT MODAL ── */}
      {editingTextSlotId && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={handleTextSave}
        >
          <div
            className="w-full p-4 rounded-t-2xl"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: '#8C7B82' }}>
              Editando texto
            </p>
            <textarea
              autoFocus
              value={editingTextValue}
              onChange={e => setEditingTextValue(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-xl resize-none"
              style={{
                border: `1.5px solid ${config.colors.primary}`,
                outline: 'none',
                color: '#2C2125',
                backgroundColor: '#FAFAFA',
                fontFamily: config.bodyFont,
              }}
              placeholder="Digite o texto..."
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setEditingTextSlotId(null)}
                className="flex-1 py-3 rounded-full text-sm font-semibold"
                style={{ border: `1.5px solid #EDE8E6`, color: '#8C7B82', background: 'white', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleTextSave}
                className="flex-1 py-3 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: config.colors.primary, border: 'none', cursor: 'pointer' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE TYPE MENU ── */}
      {showPageTypeMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowPageTypeMenu(false)}
        >
          <div
            className="w-full p-4 rounded-t-2xl"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: '#8C7B82' }}>
              Tipo de página
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CHANGEABLE_PAGE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleChangePageType(type)}
                  className="py-3 rounded-xl text-sm font-medium"
                  style={{
                    backgroundColor: currentPage?.type === type ? config.colors.primary : '#F5F5F5',
                    color: currentPage?.type === type ? '#FFFFFF' : '#2C2125',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {PAGE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER NAVIGATION ── */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: '1px solid #EDE8E6',
          backgroundColor: '#FFFFFF',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Page navigation row */}
        <div className="flex items-center px-4 py-3 gap-2">
          <button
            onClick={() => { setCurrentPageIndex(i => Math.max(0, i - 1)); setSelectedElementId(null) }}
            disabled={!canGoBack}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid #EDE8E6',
              backgroundColor: 'white',
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              opacity: canGoBack ? 1 : 0.35,
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ←
          </button>

          {/* Page dots (max 12 visible) */}
          <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
            <span className="text-xs font-semibold" style={{ color: '#2C2125', whiteSpace: 'nowrap' }}>
              Pág {currentPageIndex + 1}/{pages.length}
            </span>
            <div className="flex gap-1 ml-2" style={{ maxWidth: 120, overflow: 'hidden' }}>
              {pages.slice(0, 12).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentPageIndex(i); setSelectedElementId(null) }}
                  style={{
                    flexShrink: 0,
                    width: currentPageIndex === i ? 16 : 6,
                    height: 6,
                    borderRadius: 99,
                    border: 'none',
                    backgroundColor: currentPageIndex === i ? config.colors.primary : '#D4CCCB',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => { setCurrentPageIndex(i => Math.min(pages.length - 1, i + 1)); setSelectedElementId(null) }}
            disabled={!canGoNext}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid #EDE8E6',
              backgroundColor: 'white',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              opacity: canGoNext ? 1 : 0.35,
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            →
          </button>
        </div>

        {/* Actions row */}
        <div
          className="flex items-center gap-2 px-4 pb-3"
          style={{ borderTop: '1px solid #F0EDE9' }}
        >
          <button
            onClick={handleAddPage}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
            style={{
              border: `1.5px solid ${config.colors.primary}`,
              color: config.colors.primary,
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            + Nova pág
          </button>

          <button
            onClick={() => !isLocked && setShowPageTypeMenu(true)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
            style={{
              border: '1.5px solid #EDE8E6',
              color: isLocked ? '#C4B8BC' : '#2C2125',
              backgroundColor: 'transparent',
              cursor: isLocked ? 'not-allowed' : 'pointer',
            }}
          >
            Tipo: {PAGE_TYPE_LABELS[currentPage?.type || 'photo_single']} ▾
          </button>

          <button
            onClick={handleFinalize}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white"
            style={{
              backgroundColor: config.colors.primary,
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${config.colors.primary}44`,
            }}
          >
            Finalizar ✓
          </button>
        </div>
      </div>
    </div>
  )
}
