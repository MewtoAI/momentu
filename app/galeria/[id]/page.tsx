'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { SparkleIcon } from '@/components/icons'
import { AlbumPagePreview } from '@/components/album-page-preview'
import { createClient } from '@/lib/supabase/client'
import type { AlbumStyle } from '@/lib/types'

const STYLE_LABELS: Record<string, string> = {
  romantic: 'Romântico',
  classic: 'Clássico',
  vibrant: 'Vibrante',
  minimal: 'Minimalista',
  vintage: 'Vintage',
  bohemian: 'Boêmio',
}

const OCCASION_LABELS: Record<string, string> = {
  wedding: 'Casamento',
  birthday: 'Aniversário',
  baby: 'Bebê',
  travel: 'Viagem',
  family: 'Família',
  graduation: 'Formatura',
  other: 'Outros',
}

const STYLE_COLORS: Record<string, string> = {
  romantic: 'bg-rose-100 text-rose-700',
  classic: 'bg-gray-100 text-gray-700',
  vibrant: 'bg-orange-100 text-orange-700',
  minimal: 'bg-slate-100 text-slate-700',
  vintage: 'bg-amber-100 text-amber-700',
  bohemian: 'bg-emerald-100 text-emerald-700',
}

interface GalleryAlbum {
  id: string
  title: string
  style: AlbumStyle
  occasion: string
  productType: string
  thumbnailUrl: string
  previewPages: any[] // Array de estruturas de página
  albumStructure?: any
}

export default function GalleryDetailPage() {
  const params = useParams()
  const albumId = params.id as string
  
  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('gallery_albums')
      .select('*')
      .eq('id', albumId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setAlbum({
            id: data.id,
            title: data.title,
            style: data.style as AlbumStyle,
            occasion: data.occasion,
            productType: data.product_type,
            thumbnailUrl: data.thumbnail_url,
            previewPages: data.preview_pages || [],
            albumStructure: data.album_structure || null,
          })
        }
        setLoading(false)
      })
  }, [albumId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <div className="text-center">
          <SparkleIcon size={40} color="#C9607A" animate />
          <p className="mt-4 text-[#2C1810]/60">Carregando álbum...</p>
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2C1810] mb-4">Álbum não encontrado</p>
          <Link href="/" className="text-[#C9607A] hover:underline">
            ← Voltar para galeria
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9607A" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="text-sm text-[#2C1810]/60">Galeria</span>
          </Link>
          <div className="flex items-center gap-2">
            <SparkleIcon size={20} color="#C9607A" animate />
            <span className="font-serif text-xl text-[#2C1810] tracking-tight">momentu</span>
          </div>
        </div>
      </header>

      {/* Album Header */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl md:text-4xl text-[#2C1810] mb-3">{album.title}</h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1 rounded-full ${STYLE_COLORS[album.style]}`}>
              {STYLE_LABELS[album.style]}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {OCCASION_LABELS[album.occasion] || album.occasion}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              {album.productType === 'print' ? 'Impresso' : 'Digital'}
            </span>
          </div>
        </div>
        <p className="text-center text-[#2C1810]/60 text-sm max-w-xl mx-auto">
          <SparkleIcon size={14} color="#C9607A" animate className="inline mr-1" />
          Álbum criado pela nossa AI. Cada página foi cuidadosamente planejada para contar uma história única.
        </p>
      </section>

      {/* Pages Preview */}
      <section className="max-w-3xl mx-auto px-4 pb-32 space-y-8">
        {album.previewPages.length > 0 ? (
          album.previewPages.map((page, index) => (
            <div key={index} className="max-w-md mx-auto">
              <AlbumPagePreview
                style={album.style}
                photos={page.photos || []}
                texts={page.texts || []}
                pageNumber={index + 1}
                isActive={true}
              />
              {page.caption && (
                <p className="mt-3 text-center text-sm text-[#2C1810]/60 italic">
                  {page.caption}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-[#2C1810]/40">Nenhuma página disponível para visualização.</p>
          </div>
        )}
      </section>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#C9607A]/10 py-4 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="font-serif text-lg text-[#2C1810]">Gostou deste álbum?</p>
            <p className="text-sm text-[#2C1810]/60">Crie o seu com as suas próprias fotos</p>
          </div>
          <Link
            href={`/criar?ref=${album.id}`}
            className="bg-[#C9607A] text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all hover:shadow-lg hover:shadow-[#C9607A]/20 flex items-center gap-2 whitespace-nowrap"
          >
            <SparkleIcon size={18} color="white" animate />
            Quero assim — Criar o meu
          </Link>
        </div>
      </div>
    </div>
  )
}
