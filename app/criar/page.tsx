'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AlbumFormat, AlbumPurpose } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingState {
  purpose?: AlbumPurpose
  format?: AlbumFormat
  pageCount?: number
  price?: number
  templateId?: string
}

// ─── Templates list (must match konva-editor TEMPLATE_CONFIGS) ───────────────

const TEMPLATES = [
  { slug: 'amor-infinito',     name: 'Amor Infinito',     category: 'casal',      gradientFrom: '#C9184A', gradientTo: '#FF758F',   bgAccent: '#FFF0F3', textAccent: '#2D0914', description: 'Para eternizar sua história de amor', thumbnail: null },
  { slug: 'primeiro-sorriso',  name: 'Primeiro Sorriso',  category: 'bebe',       gradientFrom: '#B5D8CC', gradientTo: '#F9C9D4',   bgAccent: '#FEF9EF', textAccent: '#3A4A45', description: 'Do primeiro dia ao primeiro ano', thumbnail: null },
  { slug: 'nossa-familia',     name: 'Nossa Família',     category: 'familia',    gradientFrom: '#E07A5F', gradientTo: '#F2CC8F',   bgAccent: '#F4F1DE', textAccent: '#3D405B', description: 'Memórias que unem gerações', thumbnail: null },
  { slug: 'instante',          name: 'Instante',          category: 'minimalista',gradientFrom: '#1A1A2E', gradientTo: '#4A4A6E',   bgAccent: '#F5F5F8', textAccent: '#1A1A2E', description: 'Elegância no silêncio das imagens', thumbnail: null },
  { slug: 'mundo-afora',       name: 'Mundo Afora',       category: 'viagem',     gradientFrom: '#2D6A4F', gradientTo: '#74C69D',   bgAccent: '#D8F3DC', textAccent: '#1B4332', description: 'Aventuras que merecem ser guardadas', thumbnail: null },
  { slug: 'casamento-dourado', name: 'Casamento Dourado', category: 'casal',      gradientFrom: '#B8860B', gradientTo: '#F5DEB3',   bgAccent: '#FFFDF5', textAccent: '#3D2B00', description: 'Luxo e elegância para o dia mais especial', thumbnail: '/templates/casamento-dourado/thumbnail.jpg' },
  { slug: 'pequeno-universo',  name: 'Pequeno Universo',  category: 'bebe',       gradientFrom: '#B39DDB', gradientTo: '#E1BEE7',   bgAccent: '#F3E5F5', textAccent: '#311B92', description: 'Um universo de amor desde o primeiro dia', thumbnail: '/templates/pequeno-universo/thumbnail.jpg' },
  { slug: 'raizes',            name: 'Raízes',            category: 'familia',    gradientFrom: '#8D6E63', gradientTo: '#D7CCC8',   bgAccent: '#FBE9E7', textAccent: '#3E2723', description: 'Histórias que atravessam gerações', thumbnail: '/templates/raizes/thumbnail.jpg' },
  { slug: 'conquista',         name: 'Conquista',         category: 'formatura',  gradientFrom: '#1A237E', gradientTo: '#C9A84C',   bgAccent: '#E8EAF6', textAccent: '#0D0D2B', description: 'Celebre cada passo dessa jornada', thumbnail: '/templates/conquista/thumbnail.jpg' },
  { slug: 'doce-vida',         name: 'Doce Vida',         category: 'aniversario',gradientFrom: '#FF7043', gradientTo: '#FFD54F',   bgAccent: '#FFF8E1', textAccent: '#BF360C', description: 'Cada ano é motivo pra sorrir e comemorar', thumbnail: '/templates/doce-vida/thumbnail.jpg' },
]

type CategoryFilter = 'todos' | 'casal' | 'bebe' | 'familia' | 'formatura' | 'viagem' | 'minimalista' | 'aniversario'

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'casal', label: 'Casal' },
  { value: 'bebe', label: 'Bebê' },
  { value: 'familia', label: 'Família' },
  { value: 'formatura', label: 'Formatura' },
  { value: 'viagem', label: 'Viagem' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'aniversario', label: 'Aniversário' },
]

// ─── Price calc ───────────────────────────────────────────────────────────────

function calcPrice(pageCount: number): number {
  if (pageCount <= 16) return 14.90
  if (pageCount <= 24) return 19.90
  return 24.90
}

function pageHint(pageCount: number): string {
  const photoCount = Math.round(pageCount * 1.5)
  return `${pageCount} páginas = espaço para ~${photoCount} fotos`
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
            style={{
              width: 28, height: 28,
              backgroundColor: i + 1 <= step ? '#C9607A' : '#EDE8E6',
              color: i + 1 <= step ? '#FFFFFF' : '#8C7B82',
            }}
          >
            {i + 1 < step ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className="h-0.5 transition-all duration-300"
              style={{
                width: 40,
                backgroundColor: i + 1 < step ? '#C9607A' : '#EDE8E6',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Purpose ──────────────────────────────────────────────────────────

function Step1Purpose({ onSelect }: { onSelect: (purpose: AlbumPurpose) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center" style={{ color: '#2C2125', fontFamily: 'Playfair Display, Georgia, serif' }}>
        Para que é seu álbum?
      </h2>
      <p className="text-sm text-center mb-2" style={{ color: '#8C7B82' }}>
        Isso define a qualidade e o formato do arquivo final
      </p>

      {/* Print card */}
      <button
        onClick={() => onSelect('print')}
        className="w-full flex flex-col items-start p-5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] text-left"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#EDE8E6', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: 32 }}>📖</span>
          <div>
            <p className="font-bold text-base" style={{ color: '#2C2125' }}>Para imprimir na gráfica</p>
            <p className="text-xs mt-0.5" style={{ color: '#8C7B82' }}>Arquivo PDF profissional, pronto para enviar para a gráfica</p>
          </div>
        </div>
        <span
          className="text-[11px] font-semibold px-3 py-1 rounded-full mt-1"
          style={{ backgroundColor: '#F7E8EC', color: '#C9607A' }}
        >
          Alta qualidade • 300 DPI • Print-ready
        </span>
      </button>

      {/* Digital card */}
      <button
        onClick={() => onSelect('digital')}
        className="w-full flex flex-col items-start p-5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] text-left"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#EDE8E6', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: 32 }}>📱</span>
          <div>
            <p className="font-bold text-base" style={{ color: '#2C2125' }}>Para guardar digitalmente</p>
            <p className="text-xs mt-0.5" style={{ color: '#8C7B82' }}>Compartilhar, salvar e presentear em alta resolução</p>
          </div>
        </div>
        <span
          className="text-[11px] font-semibold px-3 py-1 rounded-full mt-1"
          style={{ backgroundColor: '#E8F5E9', color: '#2D6A4F' }}
        >
          1080px • Redes sociais • WhatsApp
        </span>
      </button>
    </div>
  )
}

// ─── Step 2A: Print Size ──────────────────────────────────────────────────────

function Step2APrintSize({ onSelect }: { onSelect: (format: AlbumFormat) => void }) {
  const options: { format: AlbumFormat; label: string; sublabel: string; badge: string; hint?: string; aspect: [number, number] }[] = [
    { format: 'print_20x20', label: '20×20 cm', sublabel: 'Quadrado', badge: 'Popular ⭐', hint: 'O mais pedido nas gráficas', aspect: [1, 1] },
    { format: 'print_a4',    label: 'A4 · 21×30', sublabel: 'Retrato', badge: 'Clássico', aspect: [210, 297] },
    { format: 'print_15x21', label: '15×21 cm',   sublabel: 'Mini',    badge: 'Compacto', aspect: [150, 210] },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center" style={{ color: '#2C2125', fontFamily: 'Playfair Display, Georgia, serif' }}>
        Qual o tamanho do álbum?
      </h2>

      <div className="flex gap-3 mt-2">
        {options.map(opt => {
          const [w, h] = opt.aspect
          const maxH = 96
          const maxW = 80
          const ratio = w / h
          const displayH = Math.min(maxH, maxW / ratio)
          const displayW = displayH * ratio

          return (
            <button
              key={opt.format}
              onClick={() => onSelect(opt.format)}
              className="flex-1 flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-150 active:scale-95"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#EDE8E6', cursor: 'pointer' }}
            >
              {/* Visual aspect ratio representation */}
              <div className="flex items-end justify-center" style={{ height: maxH + 8 }}>
                <div
                  className="rounded-sm"
                  style={{
                    width: displayW,
                    height: displayH,
                    background: 'linear-gradient(145deg, #C9607A22, #C9607A55)',
                    border: '1.5px solid #C9607A88',
                  }}
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: '#2C2125' }}>{opt.label}</p>
                <p className="text-xs" style={{ color: '#8C7B82' }}>{opt.sublabel}</p>
                <span
                  className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                  style={{ backgroundColor: '#F7E8EC', color: '#C9607A' }}
                >
                  {opt.badge}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-center mt-2" style={{ color: '#8C7B82' }}>
        💡 Dúvida? O 20×20cm é o mais pedido nas gráficas.
      </p>
    </div>
  )
}

// ─── Step 2B: Digital Format ──────────────────────────────────────────────────

function Step2BDigitalFormat({ onSelect }: { onSelect: (format: AlbumFormat) => void }) {
  const options: { format: AlbumFormat; label: string; sublabel: string; desc: string; aspect: [number, number] }[] = [
    { format: 'digital_square', label: 'Quadrado 1:1', sublabel: 'Instagram Feed', desc: '1080×1080px', aspect: [1, 1] },
    { format: 'digital_story',  label: 'Story 9:16',   sublabel: 'Instagram/TikTok', desc: '1080×1920px', aspect: [9, 16] },
    // Digital landscape not in FORMAT_SPECS but we keep the UI note
  ]

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center" style={{ color: '#2C2125', fontFamily: 'Playfair Display, Georgia, serif' }}>
        Escolha o formato
      </h2>

      <div className="flex gap-3 mt-2 justify-center">
        {options.map(opt => {
          const [w, h] = opt.aspect
          const maxH = 100
          const maxW = 70
          const ratio = w / h
          const displayH = Math.min(maxH, maxW / ratio)
          const displayW = displayH * ratio

          return (
            <button
              key={opt.format}
              onClick={() => onSelect(opt.format)}
              className="flex flex-col items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all duration-150 active:scale-95"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#EDE8E6', cursor: 'pointer', minWidth: 110 }}
            >
              <div className="flex items-center justify-center" style={{ height: maxH + 8, width: maxW + 8 }}>
                <div
                  className="rounded-sm"
                  style={{
                    width: displayW,
                    height: displayH,
                    background: 'linear-gradient(145deg, #2D6A4F22, #2D6A4F55)',
                    border: '1.5px solid #2D6A4F88',
                  }}
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: '#2C2125' }}>{opt.label}</p>
                <p className="text-xs" style={{ color: '#8C7B82' }}>{opt.sublabel}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#8C7B82' }}>{opt.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3: Page Count ───────────────────────────────────────────────────────

const PAGE_COUNT_OPTIONS = [8, 12, 16, 20, 24, 30]

function Step3PageCount({
  selected,
  onSelect,
  onContinue,
}: {
  selected: number
  onSelect: (n: number) => void
  onContinue: () => void
}) {
  const price = calcPrice(selected)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center" style={{ color: '#2C2125', fontFamily: 'Playfair Display, Georgia, serif' }}>
        Quantas páginas você quer?
      </h2>
      <p className="text-sm text-center" style={{ color: '#8C7B82' }}>
        Recomendamos 16 páginas (~24 fotos)
      </p>

      {/* Page count chips */}
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {PAGE_COUNT_OPTIONS.map(n => (
          <button
            key={n}
            onClick={() => onSelect(n)}
            className="px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-150"
            style={{
              backgroundColor: selected === n ? '#C9607A' : '#FFFFFF',
              borderColor: selected === n ? '#C9607A' : '#EDE8E6',
              color: selected === n ? '#FFFFFF' : '#8C7B82',
              cursor: 'pointer',
            }}
          >
            {n}{selected === n ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-center" style={{ color: '#8C7B82' }}>
        {pageHint(selected)}
      </p>

      {/* Pricing */}
      <div
        className="p-4 rounded-2xl text-center mt-2"
        style={{ backgroundColor: '#F7E8EC' }}
      >
        <p className="text-3xl font-bold" style={{ color: '#C9607A' }}>
          R$ {price.toFixed(2).replace('.', ',')}
        </p>
        <p className="text-xs mt-1" style={{ color: '#A8485F' }}>
          {selected <= 16 ? 'até 16 páginas' : selected <= 24 ? `até 24 páginas (+R$ 5,00)` : `até 30 páginas (+R$ 10,00)`}
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-full font-bold text-white transition-all duration-150 active:scale-[0.98]"
        style={{ backgroundColor: '#C9607A', boxShadow: '0 4px 16px rgba(201,96,122,0.3)', cursor: 'pointer', border: 'none' }}
      >
        Continuar →
      </button>
    </div>
  )
}

// ─── Step 4: Template Selection ───────────────────────────────────────────────

function Step4Templates({
  onSelect,
}: {
  onSelect: (templateId: string) => void
}) {
  const [filter, setFilter] = useState<CategoryFilter>('todos')

  const filtered = filter === 'todos' ? TEMPLATES : TEMPLATES.filter(t => t.category === filter)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center" style={{ color: '#2C2125', fontFamily: 'Playfair Display, Georgia, serif' }}>
        Escolha seu estilo
      </h2>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORY_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="flex-shrink-0 h-8 px-3 rounded-full text-xs font-medium border transition-all duration-150"
            style={{
              backgroundColor: filter === f.value ? '#C9607A' : '#FFFFFF',
              borderColor: filter === f.value ? '#C9607A' : '#EDE8E6',
              color: filter === f.value ? '#FFFFFF' : '#8C7B82',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(t => (
          <button
            key={t.slug}
            onClick={() => onSelect(t.slug)}
            className="flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-150 active:scale-[0.97] hover:-translate-y-0.5"
            style={{ boxShadow: '0 2px 8px rgba(44,33,37,0.10)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            {/* Thumbnail */}
            <div
              className="relative h-28 flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${t.gradientFrom}, ${t.gradientTo})`,
              }}
            >
              {t.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.thumbnail} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.25) 100%)' }} />
              <span
                className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full z-10"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}
              >
                {t.category}
              </span>
            </div>
            {/* Info */}
            <div className="flex flex-col p-2.5" style={{ backgroundColor: t.bgAccent }}>
              <p className="font-bold text-sm leading-tight" style={{ color: t.textAccent, fontFamily: 'Playfair Display, Georgia, serif' }}>
                {t.name}
              </p>
              <p className="text-[10px] mt-0.5 leading-snug" style={{ color: '#8C7B82' }}>
                {t.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8" style={{ color: '#8C7B82' }}>
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm">Nenhum template encontrado</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function CriarPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<OnboardingState>({
    pageCount: 16,
    price: 14.90,
  })
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  const goNext = useCallback(() => {
    setDirection('forward')
    setStep(s => s + 1)
  }, [])

  const goBack = useCallback(() => {
    setDirection('back')
    setStep(s => Math.max(1, s - 1))
  }, [])

  const handlePurpose = useCallback((purpose: AlbumPurpose) => {
    setState(s => ({ ...s, purpose }))
    goNext()
  }, [goNext])

  const handleFormat = useCallback((format: AlbumFormat) => {
    setState(s => ({ ...s, format }))
    goNext()
  }, [goNext])

  const handlePageCount = useCallback((pageCount: number) => {
    setState(s => ({ ...s, pageCount, price: calcPrice(pageCount) }))
  }, [])

  const handlePageCountContinue = useCallback(() => {
    goNext()
  }, [goNext])

  const handleTemplateSelect = useCallback((templateId: string) => {
    const finalState = { ...state, templateId }
    // Save to sessionStorage
    try {
      sessionStorage.setItem('momentu_album_config', JSON.stringify(finalState))
    } catch { /* ignore */ }
    router.push(`/criar/${templateId}`)
  }, [state, router])

  // Determine which step 2 to show
  const actualStep = step === 2 && state.purpose === 'digital' ? '2B' : step === 2 ? '2A' : String(step)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F5', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center px-4"
        style={{
          height: 56,
          backgroundColor: 'rgba(250,247,245,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EDE8E6',
        }}
      >
        {step > 1 ? (
          <button
            onClick={goBack}
            className="text-sm font-medium"
            style={{ color: '#8C7B82', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Voltar
          </button>
        ) : (
          <Link href="/" className="text-sm font-medium" style={{ color: '#8C7B82' }}>
            ← Início
          </Link>
        )}
        <div className="flex-1 text-center">
          <span className="text-xl font-bold" style={{ color: '#C9607A', fontFamily: 'Playfair Display, Georgia, serif' }}>
            momentu
          </span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      <main className="max-w-screen-sm mx-auto px-4 pt-6 pb-16">
        <ProgressBar step={step} />

        {/* Animated step content */}
        <div
          key={step}
          style={{
            animation: `slideIn${direction === 'forward' ? 'Right' : 'Left'} 0.25s ease-out`,
          }}
        >
          {step === 1 && (
            <Step1Purpose onSelect={handlePurpose} />
          )}
          {step === 2 && actualStep === '2A' && (
            <Step2APrintSize onSelect={handleFormat} />
          )}
          {step === 2 && actualStep === '2B' && (
            <Step2BDigitalFormat onSelect={handleFormat} />
          )}
          {step === 3 && (
            <Step3PageCount
              selected={state.pageCount ?? 16}
              onSelect={handlePageCount}
              onContinue={handlePageCountContinue}
            />
          )}
          {step === 4 && (
            <Step4Templates onSelect={handleTemplateSelect} />
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
