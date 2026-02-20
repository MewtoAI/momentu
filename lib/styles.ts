import { AlbumStyle } from './types'

export interface StyleConfig {
  name: string
  label: string
  backgroundPath: string  // para formato quadrado (adaptável)
  colors: {
    primary: string
    secondary: string
    bg: string
    text: string
  }
  font: string
  bodyFont: string
  // Layouts de página disponíveis para este estilo
  pageLayouts: PageLayoutConfig[]
}

export interface PageLayoutConfig {
  type: 'cover' | 'single' | 'double' | 'triple' | 'text_focus' | 'back_cover'
  // Posições das fotos como fração do canvas (0-1)
  photoSlots: { x: number; y: number; width: number; height: number }[]
  // Posições de texto
  textSlots: { x: number; y: number; width: number; height: number; defaultText: string; align: string }[]
}

export const STYLE_CONFIGS: Record<AlbumStyle, StyleConfig> = {
  romantic: {
    name: 'romantic',
    label: 'Romântico',
    backgroundPath: '/styles/romantic.svg',
    colors: { primary: '#C9607A', secondary: '#E8A4B4', bg: '#FDF5F7', text: '#2C1810' },
    font: 'Cormorant Garamond',
    bodyFont: 'Lato',
    pageLayouts: [
      {
        type: 'cover',
        photoSlots: [{ x: 0.1, y: 0.1, width: 0.8, height: 0.7 }],
        textSlots: [{ x: 0.1, y: 0.83, width: 0.8, height: 0.08, defaultText: 'Nosso Álbum', align: 'center' }]
      },
      {
        type: 'single',
        photoSlots: [{ x: 0.08, y: 0.08, width: 0.84, height: 0.75 }],
        textSlots: [{ x: 0.1, y: 0.86, width: 0.8, height: 0.06, defaultText: '', align: 'center' }]
      },
      {
        type: 'double',
        photoSlots: [
          { x: 0.05, y: 0.1, width: 0.43, height: 0.7 },
          { x: 0.52, y: 0.1, width: 0.43, height: 0.7 }
        ],
        textSlots: [{ x: 0.1, y: 0.84, width: 0.8, height: 0.06, defaultText: '', align: 'center' }]
      },
      {
        type: 'triple',
        photoSlots: [
          { x: 0.05, y: 0.05, width: 0.9, height: 0.4 },
          { x: 0.05, y: 0.5, width: 0.43, height: 0.38 },
          { x: 0.52, y: 0.5, width: 0.43, height: 0.38 }
        ],
        textSlots: []
      },
      {
        type: 'text_focus',
        photoSlots: [{ x: 0.15, y: 0.08, width: 0.7, height: 0.45 }],
        textSlots: [
          { x: 0.1, y: 0.57, width: 0.8, height: 0.12, defaultText: 'Um momento especial', align: 'center' },
          { x: 0.15, y: 0.72, width: 0.7, height: 0.18, defaultText: 'Escreva uma mensagem aqui...', align: 'center' }
        ]
      },
      {
        type: 'back_cover',
        photoSlots: [],
        textSlots: [
          { x: 0.1, y: 0.35, width: 0.8, height: 0.12, defaultText: 'momentu', align: 'center' },
          { x: 0.1, y: 0.52, width: 0.8, height: 0.08, defaultText: 'Feito com amor ♥', align: 'center' }
        ]
      }
    ]
  },

  classic: {
    name: 'classic',
    label: 'Clássico',
    backgroundPath: '/styles/classic.svg',
    colors: { primary: '#1A1A1A', secondary: '#444444', bg: '#FFFFFF', text: '#1A1A1A' },
    font: 'Playfair Display',
    bodyFont: 'Source Serif 4',
    pageLayouts: []
  },

  vibrant: {
    name: 'vibrant',
    label: 'Vibrante',
    backgroundPath: '/styles/vibrant.svg',
    colors: { primary: '#FF6B35', secondary: '#FFB347', bg: '#FFF8F0', text: '#1A1A1A' },
    font: 'Nunito',
    bodyFont: 'Nunito',
    pageLayouts: []
  },

  minimal: {
    name: 'minimal',
    label: 'Minimalista',
    backgroundPath: '/styles/minimal.svg',
    colors: { primary: '#1A1A1A', secondary: '#666666', bg: '#FAFAFA', text: '#1A1A1A' },
    font: 'Inter',
    bodyFont: 'Inter',
    pageLayouts: []
  },

  vintage: {
    name: 'vintage',
    label: 'Vintage',
    backgroundPath: '/styles/vintage.svg',
    colors: { primary: '#8B6914', secondary: '#C9A84C', bg: '#F5EED8', text: '#3D2B00' },
    font: 'Merriweather',
    bodyFont: 'Merriweather',
    pageLayouts: []
  },

  bohemian: {
    name: 'bohemian',
    label: 'Boêmio',
    backgroundPath: '/styles/bohemian.svg',
    colors: { primary: '#6B8F71', secondary: '#C5735A', bg: '#F4F1EC', text: '#2C2010' },
    font: 'Josefin Sans',
    bodyFont: 'Josefin Sans',
    pageLayouts: []
  }
}

// Para styles sem layouts definidos, usar os layouts do 'romantic' adaptados com as cores do estilo
export function getStyleLayouts(style: AlbumStyle): PageLayoutConfig[] {
  const config = STYLE_CONFIGS[style]
  if (config.pageLayouts.length > 0) return config.pageLayouts
  return STYLE_CONFIGS.romantic.pageLayouts
}
