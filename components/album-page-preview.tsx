import Image from 'next/image'
import { STYLE_CONFIGS } from '@/lib/styles'
import type { AlbumStyle } from '@/lib/types'

interface PhotoSlot {
  url: string
  x: number
  y: number
  width: number
  height: number
}

interface TextSlot {
  text: string
  x: number
  y: number
  width: number
  height: number
  align: string
}

interface AlbumPagePreviewProps {
  style: AlbumStyle
  photos: PhotoSlot[]
  texts?: TextSlot[]
  pageNumber: number
  isActive?: boolean
}

export function AlbumPagePreview({
  style,
  photos,
  texts = [],
  pageNumber,
  isActive = true,
}: AlbumPagePreviewProps) {
  const styleConfig = STYLE_CONFIGS[style]
  const { colors, font, bodyFont } = styleConfig

  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        isActive ? 'border-white/80 shadow-2xl' : 'border-white/40 shadow-lg opacity-60'
      }`}
      style={{ backgroundColor: colors.bg }}
    >
      {/* Background pattern (subtle) */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${colors.primary} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Photo slots */}
      {photos.map((photo, i) => (
        <div
          key={i}
          className="absolute rounded-lg overflow-hidden shadow-md"
          style={{
            left: `${photo.x * 100}%`,
            top: `${photo.y * 100}%`,
            width: `${photo.width * 100}%`,
            height: `${photo.height * 100}%`,
          }}
        >
          <Image
            src={photo.url}
            alt={`Foto ${i + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ))}

      {/* Text slots */}
      {texts.map((textSlot, i) => (
        <div
          key={i}
          className="absolute flex items-center px-2"
          style={{
            left: `${textSlot.x * 100}%`,
            top: `${textSlot.y * 100}%`,
            width: `${textSlot.width * 100}%`,
            height: `${textSlot.height * 100}%`,
            justifyContent: textSlot.align,
            color: colors.text,
            fontFamily: i === 0 ? font : bodyFont,
            fontSize: i === 0 ? '1.5rem' : '0.875rem',
            fontWeight: i === 0 ? 600 : 400,
            textAlign: textSlot.align as 'left' | 'center' | 'right',
          }}
        >
          {textSlot.text}
        </div>
      ))}

      {/* Page number indicator */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{
          backgroundColor: `${colors.primary}20`,
          color: colors.primary,
        }}
      >
        Pg. {pageNumber}
      </div>

      {/* Style badge (only on first page) */}
      {pageNumber === 1 && (
        <div
          className="absolute bottom-2 right-2 text-[9px] font-medium uppercase tracking-wider opacity-60"
          style={{ color: colors.text }}
        >
          {styleConfig.label}
        </div>
      )}

      {/* Decorative corner (top left) */}
      <div
        className="absolute top-0 left-0 w-12 h-12 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, transparent 100%)`,
        }}
      />
    </div>
  )
}
