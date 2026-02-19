'use client'

import { useState } from 'react'
import Link from 'next/link'

const TEMPLATES = [
  {
    slug: 'amor-infinito',
    name: 'Amor Infinito',
    theme: 'casal' as const,
    themeLabel: 'Casal',
    pages: 10,
    price: 'R$14,90',
    icon: '❤️',
    gradientFrom: '#C9184A',
    gradientTo: '#FF758F',
    bgAccent: '#FFF0F3',
    textAccent: '#2D0914',
    description: 'Para eternizar sua história de amor',
  },
  {
    slug: 'primeiro-sorriso',
    name: 'Primeiro Sorriso',
    theme: 'bebe' as const,
    themeLabel: 'Bebê',
    pages: 12,
    price: 'R$14,90',
    icon: '🍼',
    gradientFrom: '#B5D8CC',
    gradientTo: '#F9C9D4',
    bgAccent: '#FEF9EF',
    textAccent: '#3A4A45',
    description: 'Do primeiro dia ao primeiro ano',
  },
  {
    slug: 'nossa-familia',
    name: 'Nossa Família',
    theme: 'familia' as const,
    themeLabel: 'Família',
    pages: 10,
    price: 'R$14,90',
    icon: '🏡',
    gradientFrom: '#E07A5F',
    gradientTo: '#F2CC8F',
    bgAccent: '#F4F1DE',
    textAccent: '#3D405B',
    description: 'Memórias que unem gerações',
  },
  {
    slug: 'instante',
    name: 'Instante',
    theme: 'minimalista' as const,
    themeLabel: 'Minimalista',
    pages: 8,
    price: 'R$14,90',
    icon: '🖤',
    gradientFrom: '#1A1A2E',
    gradientTo: '#4A4A6E',
    bgAccent: '#F5F5F8',
    textAccent: '#1A1A2E',
    description: 'Elegância no silêncio das imagens',
  },
  {
    slug: 'mundo-afora',
    name: 'Mundo Afora',
    theme: 'viagem' as const,
    themeLabel: 'Viagem',
    pages: 12,
    price: 'R$14,90',
    icon: '🌿',
    gradientFrom: '#2D6A4F',
    gradientTo: '#74C69D',
    bgAccent: '#D8F3DC',
    textAccent: '#1B4332',
    description: 'Aventuras que merecem ser guardadas',
  },
]

type ThemeFilter = 'todos' | 'casal' | 'bebe' | 'familia' | 'minimalista' | 'viagem'

const FILTERS: { value: ThemeFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'casal', label: 'Casal' },
  { value: 'bebe', label: 'Bebê' },
  { value: 'familia', label: 'Família' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'viagem', label: 'Viagem' },
]

interface TemplateCardProps {
  slug: string
  name: string
  themeLabel: string
  pages: number
  price: string
  icon: string
  gradientFrom: string
  gradientTo: string
  bgAccent: string
  textAccent: string
  description: string
}

function TemplateCard({
  slug, name, themeLabel, pages, price, icon,
  gradientFrom, gradientTo, bgAccent, textAccent, description,
}: TemplateCardProps) {
  return (
    <div
      className="flex flex-col rounded-[20px] overflow-hidden bg-white transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 1px 3px rgba(44,33,37,0.06)' }}
    >
      <div
        className="relative h-32 flex flex-col items-center justify-center gap-1"
        style={{ background: `linear-gradient(145deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}
      >
        <span className="text-3xl">{icon}</span>
        <span
          className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}
        >
          {themeLabel}
        </span>
        <span
          className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.20)', color: '#FFFFFF' }}
        >
          {pages} páginas
        </span>
      </div>

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
            Criar <span>▶</span>
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
        style={{
          backgroundColor: 'rgba(250, 247, 245, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EDE8E6',
        }}
      >
        <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold"
            style={{ color: '#C9607A', fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            momentu
          </Link>
          <Link
            href="/"
            className="text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-150"
            style={{ color: '#C9607A', border: '1.5px solid #C9607A' }}
          >
            ← Voltar
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-screen-sm mx-auto px-4 pt-8 pb-16">
        <div className="mb-6">
          <h1
            className="text-[1.75rem] font-bold leading-tight"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
          >
            Escolha seu Template
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#8C7B82' }}>
            5 temas exclusivos a partir de R$14,90
          </p>
        </div>

        {/* FILTER CHIPS */}
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

        {/* TEMPLATE GRID */}
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#8C7B82' }}>
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">Nenhum template encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(t => (
              <TemplateCard key={t.slug} {...t} />
            ))}
          </div>
        )}

        {/* Bottom note */}
        <div className="mt-8 p-4 rounded-[20px] text-center" style={{ backgroundColor: '#F7E8EC' }}>
          <p className="text-sm font-medium" style={{ color: '#A8485F' }}>
            💡 Todos os templates incluem PDF pronto para impressão
          </p>
          <p className="text-xs mt-1" style={{ color: '#8C7B82' }}>
            Qualidade 300 DPI · Formato 20x20cm
          </p>
        </div>
      </main>
    </div>
  )
}
