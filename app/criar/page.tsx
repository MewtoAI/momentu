'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SparkleIcon } from '@/components/icons'
import type {
  AlbumPurpose,
  AlbumStyle,
  AlbumOccasion,
  DigitalPlatform,
  AlbumQuestionnaire,
} from '@/lib/types'
import { PRINT_PRICING, DIGITAL_PRICE } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  step: number
  questionnaire: Partial<AlbumQuestionnaire>
  referenceAlbumId?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE_OPTIONS: {
  value: AlbumStyle
  label: string
  adjectives: string
  bg: string
}[] = [
  {
    value: 'romantic',
    label: 'Romântico',
    adjectives: 'Delicado • Floral • Elegante',
    bg: 'rgb(252,231,243)',
  },
  {
    value: 'classic',
    label: 'Clássico',
    adjectives: 'Atemporal • Limpo • Sofisticado',
    bg: 'rgb(241,245,249)',
  },
  {
    value: 'vibrant',
    label: 'Vibrante',
    adjectives: 'Colorido • Moderno • Alegre',
    bg: 'rgb(255,237,213)',
  },
  {
    value: 'minimal',
    label: 'Minimalista',
    adjectives: 'Clean • Focado • Minimalista',
    bg: 'rgb(248,250,252)',
  },
  {
    value: 'vintage',
    label: 'Vintage',
    adjectives: 'Nostálgico • Cálido • Texturizado',
    bg: 'rgb(254,243,199)',
  },
  {
    value: 'bohemian',
    label: 'Boêmio',
    adjectives: 'Orgânico • Natural • Artístico',
    bg: 'rgb(209,250,229)',
  },
]

const OCCASION_OPTIONS: {
  value: AlbumOccasion
  label: string
  emoji: string
}[] = [
  { value: 'wedding', label: 'Casamento', emoji: '💍' },
  { value: 'birthday', label: 'Aniversário', emoji: '🎂' },
  { value: 'baby', label: 'Bebê', emoji: '👶' },
  { value: 'travel', label: 'Viagem', emoji: '✈️' },
  { value: 'family', label: 'Família', emoji: '👨‍👩‍👧‍👦' },
  { value: 'graduation', label: 'Formatura', emoji: '🎓' },
  { value: 'other', label: 'Outro', emoji: '✨' },
]

const COLOR_PALETTE = [
  '#C9607A',
  '#E8A4B4',
  '#C9A84C',
  '#F5DEB3',
  '#8B7355',
  '#D4A5A5',
  '#7B9EA6',
  '#A8C5B8',
  '#9B72CF',
  '#C8A9D1',
  '#4A4A4A',
  '#B5B5B5',
]

const PRINT_PAGE_OPTIONS = [
  { pages: 10, price: 39.9, hint: 'Ideal para ~20 fotos' },
  { pages: 12, price: 44.9, hint: 'Ideal para ~25 fotos' },
  { pages: 15, price: 49.9, hint: 'Ideal para ~30 fotos' },
  { pages: 20, price: 59.9, hint: 'Ideal para ~40 fotos' },
]

const DIGITAL_PLATFORM_OPTIONS: {
  value: DigitalPlatform
  label: string
  emoji: string
  hint: string
}[] = [
  { value: 'instagram_feed', label: 'Instagram Feed', emoji: '📸', hint: 'Carrossel 1:1 • até 10 fotos' },
  { value: 'instagram_stories', label: 'Stories/Reels', emoji: '📱', hint: 'Vertical 9:16 • até 10 fotos' },
  { value: 'facebook', label: 'Facebook', emoji: '📘', hint: 'Álbum otimizado' },
  {
    value: 'all',
    label: 'Todos os formatos',
    emoji: '🌐',
    hint: 'Receba para todas as plataformas',
  },
]

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  initial: { x: 30, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
  exit: { x: -30, opacity: 0, transition: { duration: 0.2 } },
}

// ─── Total steps (depends on product type) ───────────────────────────────────

function getTotalSteps(purpose?: AlbumPurpose) {
  return 6
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

function CriarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refAlbumId = searchParams.get('ref') ?? undefined

  const [state, setState] = useState<WizardState>({
    step: 1,
    questionnaire: refAlbumId ? { referenceAlbumId: refAlbumId } : {},
    referenceAlbumId: refAlbumId,
  })

  const [specialMessage, setSpecialMessage] = useState('')
  const [referenceNotes, setReferenceNotes] = useState('')
  const [customOccasion, setCustomOccasion] = useState('')

  const { step, questionnaire } = state
  const totalSteps = 6
  const progress = (step / totalSteps) * 100

  function advance(patch: Partial<AlbumQuestionnaire>) {
    setState((prev) => ({
      ...prev,
      step: prev.step + 1,
      questionnaire: { ...prev.questionnaire, ...patch },
    }))
  }

  function goBack() {
    if (step > 1) setState((prev) => ({ ...prev, step: prev.step - 1 }))
  }

  function finish(patch?: Partial<AlbumQuestionnaire>) {
    const final: AlbumQuestionnaire = {
      ...questionnaire,
      ...patch,
      purpose: questionnaire.purpose!,
      specialMessage: specialMessage || undefined,
      referenceNotes: referenceNotes || undefined,
    }
    sessionStorage.setItem('momentu_questionnaire', JSON.stringify(final))
    router.push('/criar/amostra')
  }

  // ─── Step 1: Product ────────────────────────────────────────────────────────
  const Step1 = (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <h1 className="font-serif text-2xl text-[#2C1810] text-center">O que você quer criar?</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2">
        {(
          [
            {
              value: 'print' as AlbumPurpose,
              emoji: '📖',
              title: 'Álbum para imprimir na gráfica',
              desc: 'Arquivo PDF profissional, pronto para enviar para a gráfica',
              badge: 'Alta qualidade • 300 DPI • Print-ready',
            },
            {
              value: 'digital' as AlbumPurpose,
              emoji: '📱',
              title: 'Conteúdo para redes sociais',
              desc: 'Carrossel e Stories prontos para postar',
              badge: 'Instagram • TikTok • Facebook',
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => advance({ purpose: opt.value })}
            className="flex flex-col items-start gap-3 p-5 bg-white rounded-2xl border-2 border-[#2C1810]/8 hover:border-[#C9607A]/40 hover:shadow-md transition-all text-left group"
          >
            <span className="text-4xl">{opt.emoji}</span>
            <div>
              <p className="font-serif text-base text-[#2C1810] mb-1">{opt.title}</p>
              <p className="text-xs text-[#2C1810]/50 mb-3">{opt.desc}</p>
              <span className="text-[10px] bg-[#C9607A]/10 text-[#C9607A] px-2.5 py-1 rounded-full">
                {opt.badge}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Step 2: Occasion ───────────────────────────────────────────────────────
  const Step2 = (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <h1 className="font-serif text-2xl text-[#2C1810] text-center">
        Que momento você quer eternizar?
      </h1>
      <div className="grid grid-cols-3 gap-3 w-full mt-2">
        {OCCASION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              if (opt.value === 'other') {
                advance({ occasion: 'other' })
              } else {
                advance({ occasion: opt.value })
              }
            }}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-[#2C1810]/8 hover:border-[#C9607A]/40 hover:shadow-md transition-all"
          >
            <span className="text-3xl">{opt.emoji}</span>
            <span className="text-xs text-[#2C1810]/70 font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Step 3: Style ──────────────────────────────────────────────────────────
  const Step3 = (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <h1 className="font-serif text-2xl text-[#2C1810] text-center">
        Qual estilo te representa?
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mt-2">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => advance({ style: opt.value })}
            className="flex flex-col items-start gap-2 p-4 rounded-2xl border-2 border-transparent hover:border-[#C9607A]/40 hover:shadow-md transition-all text-left"
            style={{ backgroundColor: opt.bg }}
          >
            <p className="font-serif text-sm text-[#2C1810] font-medium">{opt.label}</p>
            <p className="text-[10px] text-[#2C1810]/50">{opt.adjectives}</p>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Step 4: Color ──────────────────────────────────────────────────────────
  const Step4 = (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <h1 className="font-serif text-2xl text-[#2C1810] text-center">
        Tem uma paleta de cor preferida?
      </h1>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {COLOR_PALETTE.map((hex) => (
          <button
            key={hex}
            onClick={() => advance({ colorPalette: hex })}
            className="w-11 h-11 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform hover:shadow-lg"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
        {/* Surprise */}
        <button
          onClick={() => advance({ colorPalette: 'surprise' })}
          className="w-11 h-11 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform hover:shadow-lg flex items-center justify-center text-base"
          style={{
            background:
              'conic-gradient(from 0deg, #C9607A, #C9A84C, #7B9EA6, #9B72CF, #A8C5B8, #C9607A)',
          }}
          title="Me surpreenda"
        >
          ✨
        </button>
      </div>
      <p className="text-xs text-[#2C1810]/40 text-center">
        Toque em uma cor ou deixe a AI decidir com ✨
      </p>
    </div>
  )

  // ─── Step 5a: Print pages ───────────────────────────────────────────────────
  const Step5Print = (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <h1 className="font-serif text-2xl text-[#2C1810] text-center">
        Quantas páginas no seu álbum?
      </h1>
      <div className="grid grid-cols-2 gap-4 w-full mt-2">
        {PRINT_PAGE_OPTIONS.map((opt) => (
          <button
            key={opt.pages}
            onClick={() => advance({ pageCount: opt.pages })}
            className="flex flex-col items-center gap-1 p-5 bg-white rounded-2xl border-2 border-[#2C1810]/8 hover:border-[#C9607A]/40 hover:shadow-md transition-all"
          >
            <span className="font-serif text-3xl text-[#C9607A] font-medium">{opt.pages}</span>
            <span className="text-xs text-[#2C1810]/50">páginas</span>
            <span className="text-lg font-semibold text-[#2C1810] mt-1">
              R${opt.price.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-[#2C1810]/40 mt-0.5">{opt.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Step 5b: Digital platform ──────────────────────────────────────────────
  const Step5Digital = (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <h1 className="font-serif text-2xl text-[#2C1810] text-center">
        Para qual plataforma?
      </h1>
      <div className="flex flex-col gap-3 w-full mt-2">
        {DIGITAL_PLATFORM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => advance({ platform: opt.value })}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-[#2C1810]/8 hover:border-[#C9607A]/40 hover:shadow-md transition-all text-left"
          >
            <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#2C1810]">{opt.label}</p>
              <p className="text-xs text-[#2C1810]/50">{opt.hint}</p>
            </div>
            {opt.value === 'all' && (
              <span className="text-[#C9607A] font-semibold text-sm flex-shrink-0">
                R${DIGITAL_PRICE.toFixed(2).replace('.', ',')}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Step 6: Message ────────────────────────────────────────────────────────
  const Step6 = (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <h1 className="font-serif text-2xl text-[#2C1810] text-center">
        Tem uma mensagem especial para incluir?
      </h1>

      {/* Reference notes (if came via gallery) */}
      {state.referenceAlbumId && (
        <div className="w-full bg-[#C9607A]/5 border border-[#C9607A]/20 rounded-2xl p-4">
          <p className="text-sm font-medium text-[#2C1810] mb-3">
            Você escolheu um álbum como referência. O que mais te agradou?
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-[#2C1810]/50 mb-1 block">O que quero igual:</label>
              <textarea
                value={referenceNotes}
                onChange={(e) => setReferenceNotes(e.target.value)}
                placeholder="Ex: As cores, o layout minimalista..."
                className="w-full text-sm text-[#2C1810] bg-white border border-[#2C1810]/10 rounded-xl p-3 resize-none focus:outline-none focus:border-[#C9607A]/40"
                rows={2}
                maxLength={200}
              />
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <textarea
          value={specialMessage}
          onChange={(e) => setSpecialMessage(e.target.value)}
          placeholder="Ex: Para a minha mãe, com todo o amor do mundo 💕"
          className="w-full text-sm text-[#2C1810] bg-white border-2 border-[#2C1810]/10 rounded-2xl p-4 resize-none focus:outline-none focus:border-[#C9607A]/40 transition-colors"
          rows={4}
          maxLength={200}
        />
        <div className="text-right text-xs text-[#2C1810]/30 mt-1">
          {specialMessage.length}/200
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
        <button
          onClick={() => finish()}
          className="flex-1 py-3 rounded-full border border-[#2C1810]/10 text-sm text-[#2C1810]/50 hover:border-[#2C1810]/20 transition-colors"
        >
          Pular
        </button>
        <button
          onClick={() => finish({ specialMessage })}
          className="flex-1 bg-[#C9607A] text-white py-3 rounded-full text-sm font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C9607A]/20"
        >
          <SparkleIcon size={16} color="white" animate />
          Criar minha amostra gratuita
        </button>
      </div>
    </div>
  )

  // ─── Render current step ────────────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 1:
        return Step1
      case 2:
        return Step2
      case 3:
        return Step3
      case 4:
        return Step4
      case 5:
        return questionnaire.purpose === 'digital' ? Step5Digital : Step5Print
      case 6:
        return Step6
      default:
        return Step1
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-[#2C1810]/5 fixed top-0 left-0 right-0 z-50">
        <motion.div
          className="h-full bg-[#C9607A]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10 pt-1">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={goBack}
            className={`flex items-center gap-1.5 text-sm text-[#2C1810]/50 hover:text-[#2C1810] transition-colors ${
              step === 1 ? 'invisible' : ''
            }`}
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-2">
            <SparkleIcon size={16} color="#C9607A" animate />
            <span className="font-serif text-base text-[#2C1810] tracking-tight">momentu</span>
          </div>
          <div className="text-xs text-[#2C1810]/30">
            {step}/{totalSteps}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center pt-12 pb-20 px-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-lg"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ─── Export (wraps with Suspense for useSearchParams) ─────────────────────────

export default function CriarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
          <SparkleIcon size={32} color="#C9607A" animate />
        </div>
      }
    >
      <CriarInner />
    </Suspense>
  )
}
