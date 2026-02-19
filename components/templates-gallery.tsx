'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const TEMPLATES = [
  // ── ORIGINAIS ──
  {
    slug: 'amor-infinito',
    name: 'Amor Infinito',
    theme: 'casal' as const,
    themeLabel: 'Casal',
    pages: 10,
    price: 'R$14,90',
    gradientFrom: '#C9184A',
    gradientTo: '#FF758F',
    bgAccent: '#FFF0F3',
    textAccent: '#2D0914',
    description: 'Para eternizar sua história de amor',
    thumbnail: null,
  },
  {
    slug: 'primeiro-sorriso',
    name: 'Primeiro Sorriso',
    theme: 'bebe' as const,
    themeLabel: 'Bebê',
    pages: 12,
    price: 'R$14,90',
    gradientFrom: '#B5D8CC',
    gradientTo: '#F9C9D4',
    bgAccent: '#FEF9EF',
    textAccent: '#3A4A45',
    description: 'Do primeiro dia ao primeiro ano',
    thumbnail: null,
  },
  {
    slug: 'nossa-familia',
    name: 'Nossa Família',
    theme: 'familia' as const,
    themeLabel: 'Família',
    pages: 10,
    price: 'R$14,90',
    gradientFrom: '#E07A5F',
    gradientTo: '#F2CC8F',
    bgAccent: '#F4F1DE',
    textAccent: '#3D405B',
    description: 'Memórias que unem gerações',
    thumbnail: null,
  },
  {
    slug: 'instante',
    name: 'Instante',
    theme: 'minimalista' as const,
    themeLabel: 'Minimalista',
    pages: 8,
    price: 'R$14,90',
    gradientFrom: '#1A1A2E',
    gradientTo: '#4A4A6E',
    bgAccent: '#F5F5F8',
    textAccent: '#1A1A2E',
    description: 'Elegância no silêncio das imagens',
    thumbnail: null,
  },
  {
    slug: 'mundo-afora',
    name: 'Mundo Afora',
    theme: 'viagem' as const,
    themeLabel: 'Viagem',
    pages: 12,
    price: 'R$14,90',
    gradientFrom: '#2D6A4F',
    gradientTo: '#74C69D',
    bgAccent: '#D8F3DC',
    textAccent: '#1B4332',
    description: 'Aventuras que merecem ser guardadas',
    thumbnail: null,
  },
  // ── NOVOS ──
  {
    slug: 'casamento-dourado',
    name: 'Casamento Dourado',
    theme: 'casal' as const,
    themeLabel: 'Casal',
    pages: 10,
    price: 'R$14,90',
    gradientFrom: '#B8860B',
    gradientTo: '#F5DEB3',
    bgAccent: '#FFFDF5',
    textAccent: '#3D2B00',
    description: 'Luxo e elegância para o dia mais especial',
    thumbnail: '/templates/casamento-dourado/thumbnail.jpg',
  },
  {
    slug: 'pequeno-universo',
    name: 'Pequeno Universo',
    theme: 'bebe' as const,
    themeLabel: 'Bebê',
    pages: 10,
    price: 'R$14,90',
    gradientFrom: '#B39DDB',
    gradientTo: '#E1BEE7',
    bgAccent: '#F3E5F5',
    textAccent: '#311B92',
    description: 'Um universo de amor desde o primeiro dia',
    thumbnail: '/templates/pequeno-universo/thumbnail.jpg',
  },
  {
    slug: 'raizes',
    name: 'Raízes',
    theme: 'familia' as const,
    themeLabel: 'Família',
    pages: 12,
    price: 'R$14,90',
    gradientFrom: '#8D6E63',
    gradientTo: '#D7CCC8',
    bgAccent: '#FBE9E7',
    textAccent: '#3E2723',
    description: 'Histórias que atravessam gerações',
    thumbnail: '/templates/raizes/thumbnail.jpg',
  },
  {
    slug: 'conquista',
    name: 'Conquista',
    theme: 'formatura' as const,
    themeLabel: 'Formatura',
    pages: 10,
    price: 'R$14,90',
    gradientFrom: '#1A237E',
    gradientTo: '#C9A84C',
    bgAccent: '#E8EAF6',
    textAccent: '#0D0D2B',
    description: 'Celebre cada passo dessa jornada',
    thumbnail: '/templates/conquista/thumbnail.jpg',
  },
  {
    slug: 'doce-vida',
    name: 'Doce Vida',
    theme: 'aniversario' as const,
    themeLabel: 'Aniversário',
    pages: 10,
    price: 'R$14,90',
    gradientFrom: '#FF7043',
    gradientTo: '#FFD54F',
    bgAccent: '#FFF8E1',
    textAccent: '#BF360C',
    description: 'Cada ano é motivo pra sorrir e comemorar',
    thumbnail: '/templates/doce-vida/thumbnail.jpg',
  },
]

type ThemeFilter = 'todos' | 'casal' | 'bebe' | 'familia' | 'minimalista' | 'viagem' | 'formatura' | 'aniversario'

const FILTERS: { value: ThemeFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'casal', label: 'Casal' },
  { value: 'bebe', label: 'Bebê' },
  { value: 'familia', label: 'Família' },
  { value: 'formatura', label: 'Formatura' },
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'viagem', label: 'Viagem' },
]

interface TemplateItem {
  slug: string
  name: string
  theme: ThemeFilter
  themeLabel: string
  pages: number
  price: string
  gradientFrom: string
  gradientTo: string
  bgAccent: string
  textAccent: string
  description: string
  thumbnail: string | null
}

function TemplateCard({ slug, name, themeLabel, pages, price, gradientFrom, gradientTo, bgAccent, textAccent, description, thumbnail }: TemplateItem) {
  return (
    <div
      className="flex flex-col rounded-[20px] overflow-hidden bg-white transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 2px 8px rgba(44,33,37,0.10)' }}
    >
      {/* Thumb — foto real ou gradiente */}
      <div
        className="relative h-36 flex flex-col items-center justify-center overflow-hidden"
        style={!thumbnail ? { background: `linear-gradient(145deg, ${gradientFrom} 0%, ${gradientTo} 100%)` } : {}}
      >
        {thumbnail && (
          <Image
            src={thumbnail}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        )}
        {/* overlay escuro sutil para legibilidade dos badges */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.25) 100%)' }} />
        <span
          className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full z-10"
          style={{ backgroundColor: 'rgba(255,255,255,0.28)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}
        >
          {themeLabel}
        </span>
        <span
          className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.30)', color: '#FFFFFF' }}
        >
          {pages} páginas
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3" style={{ backgroundColor: bgAccent }}>
        <p
          className="font-bold text-sm leading-tight"
          style={{ color: textAccent, fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          {name}
        </p>
        <p className="text-[11px] mt-1 leading-snug flex-1" style={{ color: '#8C7B82' }}>
          {description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-sm" style={{ color: gradientFrom }}>{price}</span>
          <Link
            href={`/criar/${slug}`}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-all duration-150 active:scale-95"
            style={{ backgroundColor: gradientFrom, boxShadow: `0 2px 8px ${gradientFrom}40` }}
          >
            Criar ▶
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesGallery() {
  const [activeFilter, setActiveFilter] = useState<ThemeFilter>('todos')

  const filtered = activeFilter === 'todos'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.theme === activeFilter)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F5', fontFamily: 'Inter, sans-serif' }}>
      {/* HEADER */}
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: 'rgba(250,247,245,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EDE8E6' }}
      >
        <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold" style={{ color: '#C9607A', fontFamily: 'Playfair Display, Georgia, serif' }}>
            momentu
          </Link>
          <Link href="/" className="text-sm font-medium px-4 py-1.5 rounded-full" style={{ color: '#C9607A', border: '1.5px solid #C9607A' }}>
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-screen-sm mx-auto px-4 pt-8 pb-16">
        <div className="mb-6">
          <h1 className="text-[1.75rem] font-bold leading-tight" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}>
            Escolha seu Template
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#8C7B82' }}>
            {TEMPLATES.length} templates exclusivos · a partir de R$14,90
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => {
            const isActive = activeFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className="inline-flex items-center h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border"
                style={{
                  backgroundColor: isActive ? '#C9607A' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#8C7B82',
                  borderColor: isActive ? '#C9607A' : '#EDE8E6',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(t => <TemplateCard key={t.slug} {...t} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: '#8C7B82' }}>
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">Nenhum template encontrado</p>
          </div>
        )}

        <div className="mt-8 p-4 rounded-[20px] text-center" style={{ backgroundColor: '#F7E8EC' }}>
          <p className="text-sm font-medium" style={{ color: '#A8485F' }}>
            💡 Todos os templates incluem PDF pronto para impressão
          </p>
          <p className="text-xs mt-1" style={{ color: '#8C7B82' }}>Qualidade 300 DPI · Formato 20x20cm</p>
        </div>
      </main>
    </div>
  )
}
