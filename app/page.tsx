'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SparkleIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import type { GalleryAlbum } from '@/lib/types'

const OCCASION_LABELS: Record<string, string> = {
  all: 'Todos',
  wedding: 'Casamento',
  birthday: 'Aniversário',
  baby: 'Bebê',
  travel: 'Viagem',
  family: 'Família',
  graduation: 'Formatura',
  other: 'Outros',
}

const STYLE_LABELS: Record<string, string> = {
  romantic: 'Romântico',
  classic: 'Clássico',
  vibrant: 'Vibrante',
  minimal: 'Minimalista',
  vintage: 'Vintage',
  bohemian: 'Boêmio',
}

const STYLE_COLORS: Record<string, string> = {
  romantic: 'bg-rose-100 text-rose-700',
  classic: 'bg-gray-100 text-gray-700',
  vibrant: 'bg-orange-100 text-orange-700',
  minimal: 'bg-slate-100 text-slate-700',
  vintage: 'bg-amber-100 text-amber-700',
  bohemian: 'bg-emerald-100 text-emerald-700',
}

const STYLE_GRADIENT: Record<string, string> = {
  romantic: 'from-rose-100 to-pink-200',
  classic: 'from-gray-100 to-slate-200',
  vibrant: 'from-orange-100 to-amber-200',
  minimal: 'from-slate-50 to-gray-100',
  vintage: 'from-amber-100 to-orange-100',
  bohemian: 'from-emerald-50 to-teal-100',
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function GalleryCard({ album }: { album: GalleryAlbum }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#2C1810]/5">
      {/* Thumbnail */}
      <div className={`aspect-square bg-gradient-to-br ${STYLE_GRADIENT[album.style]} relative overflow-hidden`}>
        {album.thumbnailUrl ? (
          <Image
            src={album.thumbnailUrl}
            alt={album.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <SparkleIcon size={48} color="#C9607A" />
          </div>
        )}
        {album.isFeatured && (
          <div className="absolute top-2 right-2 bg-[#C9A84C] text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">
            Destaque
          </div>
        )}
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-serif text-sm text-[#2C1810] mb-1 line-clamp-1">{album.title}</p>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STYLE_COLORS[album.style]}`}>
            {STYLE_LABELS[album.style]}
          </span>
          <Link
            href={`/criar?ref=${album.id}`}
            className="text-[#C9607A] text-xs font-medium hover:underline"
          >
            Quero assim →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [gallery, setGallery] = useState<GalleryAlbum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('gallery_albums')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setGallery(data.map((a) => ({
            id: a.id,
            title: a.title,
            style: a.style,
            occasion: a.occasion,
            productType: a.product_type,
            thumbnailUrl: a.thumbnail_url,
            previewPages: a.preview_pages || [],
            isFeatured: a.is_featured,
          })))
        }
        setLoading(false)
      })
  }, [])

  const filtered = loading
    ? []
    : activeFilter === 'all'
    ? gallery
    : gallery.filter((a) => a.occasion === activeFilter)

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparkleIcon size={20} color="#C9607A" animate />
            <span className="font-serif text-xl text-[#2C1810] tracking-tight">momentu</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-[#2C1810]/60 hover:text-[#2C1810] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/criar"
              className="bg-[#C9607A] text-white text-sm px-4 py-2 rounded-full hover:bg-[#b54d68] transition-colors flex items-center gap-1.5"
            >
              Criar meu álbum
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#C9607A]/10 text-[#C9607A] text-xs px-3 py-1 rounded-full mb-6">
          <SparkleIcon size={14} color="#C9607A" animate />
          Criado por inteligência artificial
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-[#2C1810] leading-tight mb-4">
          Seu álbum,
          <br />
          <span className="text-[#C9607A]">criado pela nossa AI</span>
        </h1>
        <p className="text-[#2C1810]/60 text-lg max-w-xl mx-auto mb-8">
          Você sobe as fotos. A gente transforma em um álbum que vai fazer você chorar de emoção.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/criar"
            className="bg-[#C9607A] text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all hover:shadow-lg hover:shadow-[#C9607A]/20 flex items-center gap-2"
          >
            <SparkleIcon size={18} color="white" animate />
            Criar meu álbum
          </Link>
          <span className="text-sm text-[#2C1810]/40">✨ Amostra gratuita para novos usuários</span>
        </div>
      </section>

      {/* Galeria */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-[#2C1810] mb-2">Álbuns criados pela nossa AI</h2>
          <p className="text-[#2C1810]/50 text-sm">Cada um é único. O seu também será.</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {['all', 'wedding', 'baby', 'birthday', 'travel', 'family', 'graduation'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-all ${
                activeFilter === filter
                  ? 'bg-[#C9607A] text-white'
                  : 'bg-white text-[#2C1810]/60 border border-[#2C1810]/10 hover:border-[#C9607A]/30'
              }`}
            >
              {OCCASION_LABELS[filter]}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#2C1810]/5 animate-pulse">
                <div className="aspect-square bg-[#FAF7F5]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#FAF7F5] rounded w-3/4" />
                  <div className="h-2 bg-[#FAF7F5] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((album) => (
              <GalleryCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-[#2C1810]/30 text-sm border-t border-[#2C1810]/5">
        © Momentu AI 2026
      </footer>
    </div>
  )
}
