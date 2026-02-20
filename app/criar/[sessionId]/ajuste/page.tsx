'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SparkleIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import type { PhotoAnnotation } from '@/lib/types'

// ─── Style gradients ──────────────────────────────────────────────────────────

const STYLE_GRADIENT: Record<string, string> = {
  romantic: 'from-rose-100 to-pink-200',
  classic: 'from-gray-100 to-slate-200',
  vibrant: 'from-orange-100 to-amber-200',
  minimal: 'from-slate-50 to-gray-100',
  vintage: 'from-amber-100 to-orange-100',
  bohemian: 'from-emerald-50 to-teal-100',
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  'Mais espaço aqui',
  'Foto maior',
  'Adicionar texto',
  'Cor mais vibrante',
  'Mais suave',
  'Centralizar',
  'Remover esta foto',
  'Adicionar ornamento',
]

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              step < current
                ? 'bg-[#C9607A] text-white'
                : step === current
                ? 'bg-[#C9607A] text-white ring-4 ring-[#C9607A]/20'
                : 'bg-[#2C1810]/10 text-[#2C1810]/30'
            }`}
          >
            {step < current ? '✓' : step}
          </div>
          {step < 3 && (
            <div
              className={`w-8 h-0.5 transition-all ${
                step < current ? 'bg-[#C9607A]' : 'bg-[#2C1810]/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Annotation pin ──────────────────────────────────────────────────────────

function AnnotationPin({
  x,
  y,
  index,
}: {
  x: number
  y: number
  index: number
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      <div className="w-6 h-6 bg-[#C9607A] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">
        {index}
      </div>
    </motion.div>
  )
}

// ─── Page canvas ─────────────────────────────────────────────────────────────

function PageCanvas({
  style,
  pageNumber,
  annotations,
  onTap,
}: {
  style: string
  pageNumber: number
  annotations: Array<PhotoAnnotation & { id: string }>
  onTap: (x: number, y: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const gradient = STYLE_GRADIENT[style] ?? 'from-rose-100 to-pink-200'

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    onTap(x, y)
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`relative w-full aspect-[3/4] rounded-2xl bg-gradient-to-br ${gradient} cursor-crosshair border border-white/60 shadow-md overflow-hidden select-none`}
    >
      {/* Page content placeholders */}
      <div className="absolute top-4 left-4 right-4 h-1 bg-white/40 rounded-full" />
      <div className="absolute top-8 left-4 right-4 bottom-20 flex flex-col gap-3">
        {pageNumber === 1 ? (
          <>
            <div className="flex-1 bg-white/25 rounded-xl border border-white/40 flex items-center justify-center">
              <span className="text-white/30 text-xs">Foto principal</span>
            </div>
            <div className="flex gap-3 h-20">
              <div className="flex-1 bg-white/15 rounded-xl border border-white/30" />
              <div className="flex-1 bg-white/20 rounded-xl border border-white/30" />
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-3 flex-1">
              <div className="flex-1 bg-white/20 rounded-xl border border-white/30" />
              <div className="flex-1 bg-white/15 rounded-xl border border-white/30" />
            </div>
            <div className="h-20 bg-white/25 rounded-xl border border-white/40" />
          </>
        )}
      </div>
      <div className="absolute bottom-5 left-4 right-4 space-y-1.5">
        <div className="h-1 bg-white/35 rounded-full w-3/4 mx-auto" />
        <div className="h-1 bg-white/25 rounded-full w-1/2 mx-auto" />
      </div>

      {/* Tap hint */}
      <div className="absolute top-3 left-3 bg-black/20 text-white text-[9px] px-2 py-0.5 rounded-full">
        Toque para anotar
      </div>

      {/* Annotation pins */}
      {annotations.map((ann, i) => (
        <AnnotationPin key={ann.id} x={ann.x} y={ann.y} index={i + 1} />
      ))}
    </div>
  )
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

function AnnotationSheet({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (note: string) => void
}) {
  const [note, setNote] = useState('')

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-5 pb-8 max-h-[70vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#2C1810]/15 rounded-full mx-auto mb-4" />

        <h3 className="font-serif text-lg text-[#2C1810] mb-3">
          O que você quer diferente aqui?
        </h3>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setNote((prev) => prev ? `${prev}, ${chip}` : chip)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                note.includes(chip)
                  ? 'bg-[#C9607A] text-white border-[#C9607A]'
                  : 'bg-white text-[#2C1810]/60 border-[#2C1810]/15 hover:border-[#C9607A]/40'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Descreva o que quer ajustar neste ponto..."
          className="w-full border border-[#2C1810]/15 rounded-2xl p-3 text-sm text-[#2C1810] placeholder-[#2C1810]/30 resize-none focus:outline-none focus:border-[#C9607A]/50 bg-[#FAF7F5]"
          rows={3}
          autoFocus
        />

        <div className="flex gap-3 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-[#2C1810]/15 text-sm text-[#2C1810]/50 hover:border-[#2C1810]/25 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (note.trim()) onSave(note.trim())
            }}
            disabled={!note.trim()}
            className="flex-1 py-3 rounded-full bg-[#C9607A] text-white text-sm font-medium hover:bg-[#b54d68] transition-all disabled:opacity-40"
          >
            Adicionar anotação
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Ajuste Page ──────────────────────────────────────────────────────────────

export default function AjustePage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [style] = useState('romantic')
  const [activePage, setActivePage] = useState(0)
  const [annotations, setAnnotations] = useState<
    Array<PhotoAnnotation & { id: string; pageIndex: number }>
  >([])
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null)
  const [generalNote, setGeneralNote] = useState('')
  const [showSheet, setShowSheet] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePageTap(x: number, y: number) {
    setPendingPos({ x, y })
    setShowSheet(true)
  }

  function handleSaveAnnotation(note: string) {
    if (!pendingPos) return
    setAnnotations((prev) => [
      ...prev,
      {
        id: `ann_${Date.now()}`,
        x: pendingPos.x,
        y: pendingPos.y,
        note,
        pageIndex: activePage,
      },
    ])
    setPendingPos(null)
    setShowSheet(false)
  }

  const currentPageAnnotations = annotations.filter(
    (a) => a.pageIndex === activePage
  )

  async function handleGenerate() {
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      // Save adjustment annotations
      const { error: sessionError } = await supabase
        .from('album_sessions')
        .update({
          adjustment_annotations: annotations.map(({ id: _, pageIndex: __, ...rest }) => rest),
          status: 'generating',
        })
        .eq('id', sessionId)

      if (sessionError) {
        throw new Error('Erro ao salvar ajustes. Tente novamente.')
      }

      // Create generation_job
      const { error: jobError } = await supabase
        .from('generation_jobs')
        .insert({
          session_id: sessionId,
          type: 'full',
          status: 'queued',
          general_note: generalNote || null,
        })

      if (jobError) {
        console.warn('Could not create generation job:', jobError.message)
      }

      router.push(`/criar/${sessionId}/gerando`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado.'
      setError(msg)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-[#2C1810]/50 hover:text-[#2C1810] transition-colors"
          >
            ← Voltar
          </button>
          <span className="font-serif text-base text-[#2C1810]">Ajuste final</span>
          <span className="text-xs text-[#2C1810]/40">
            {annotations.length > 0 ? `${annotations.length} nota${annotations.length !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-36">
        <StepIndicator current={3} />

        {/* Warning banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-5 flex gap-3 items-start"
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Esta é sua única oportunidade de pedir ajustes.</strong> Após confirmar a geração, não será possível alterar as instruções.
          </p>
        </motion.div>

        <div className="text-center mb-4">
          <h1 className="font-serif text-xl text-[#2C1810] mb-1">
            Quer ajustar algo?
          </h1>
          <p className="text-xs text-[#2C1810]/40">
            Toque na amostra para marcar pontos específicos
          </p>
        </div>

        {/* Page navigation tabs */}
        <div className="flex gap-2 mb-4">
          {['Página 1', 'Página 2'].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setActivePage(idx)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                activePage === idx
                  ? 'bg-[#C9607A] text-white'
                  : 'bg-white text-[#2C1810]/50 border border-[#2C1810]/10 hover:border-[#C9607A]/30'
              }`}
            >
              {label}
              {annotations.filter((a) => a.pageIndex === idx).length > 0 && (
                <span className={`ml-1.5 text-xs ${activePage === idx ? 'text-white/70' : 'text-[#C9607A]'}`}>
                  ({annotations.filter((a) => a.pageIndex === idx).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Page canvas */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="mb-5"
          >
            <PageCanvas
              style={style}
              pageNumber={activePage + 1}
              annotations={currentPageAnnotations}
              onTap={handlePageTap}
            />
          </motion.div>
        </AnimatePresence>

        {/* Annotations list */}
        {currentPageAnnotations.length > 0 && (
          <div className="mb-5 space-y-2">
            {currentPageAnnotations.map((ann, i) => (
              <div
                key={ann.id}
                className="flex items-start gap-3 bg-white rounded-xl p-3 border border-[#C9607A]/10"
              >
                <div className="w-5 h-5 bg-[#C9607A] text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-xs text-[#2C1810]/70 flex-1">{ann.note}</p>
                <button
                  onClick={() =>
                    setAnnotations((prev) => prev.filter((a) => a.id !== ann.id))
                  }
                  className="text-[#2C1810]/25 hover:text-rose-400 transition-colors text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* General note */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-[#2C1810]/50 mb-2 uppercase tracking-wide">
            Instrução geral para o álbum (opcional)
          </label>
          <textarea
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            placeholder="Ex: Prefiro cores mais neutras, deixe o estilo mais suave, destaque os momentos mais emotivos..."
            className="w-full border border-[#2C1810]/15 rounded-2xl p-3 text-sm text-[#2C1810] placeholder-[#2C1810]/30 resize-none focus:outline-none focus:border-[#C9607A]/50 bg-white"
            rows={3}
          />
        </div>

        {error && (
          <p className="text-rose-600 text-sm text-center mb-4">{error}</p>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAF7F5]/95 backdrop-blur border-t border-[#C9607A]/10 px-4 py-4 z-40">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowConfirmDialog(true)}
            className="w-full bg-[#C9607A] text-white py-4 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C9607A]/20"
          >
            <SparkleIcon size={18} color="white" animate />
            Gerar meu álbum completo →
          </motion.button>
        </div>
      </div>

      {/* Annotation bottom sheet */}
      <AnimatePresence>
        {showSheet && (
          <AnnotationSheet
            onClose={() => {
              setShowSheet(false)
              setPendingPos(null)
            }}
            onSave={handleSaveAnnotation}
          />
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => !saving && setShowConfirmDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
            >
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">✨</div>
                  <h2 className="font-serif text-xl text-[#2C1810] mb-2">
                    Tudo pronto para gerar!
                  </h2>
                  <p className="text-sm text-[#2C1810]/50 leading-relaxed">
                    Após confirmar, suas instruções serão enviadas à AI e a geração do álbum completo começará.{' '}
                    <strong className="text-[#2C1810]/70">Não será possível alterar depois.</strong>
                  </p>
                </div>

                {annotations.length > 0 && (
                  <div className="bg-[#FAF7F5] rounded-xl p-3 mb-4">
                    <p className="text-xs text-[#2C1810]/50 mb-1">Resumo das anotações:</p>
                    <ul className="space-y-1">
                      {annotations.slice(0, 3).map((ann, i) => (
                        <li key={ann.id} className="text-xs text-[#2C1810]/70 flex gap-1.5">
                          <span className="text-[#C9607A]">{i + 1}.</span>
                          <span className="line-clamp-1">{ann.note}</span>
                        </li>
                      ))}
                      {annotations.length > 3 && (
                        <li className="text-xs text-[#2C1810]/40">
                          +{annotations.length - 3} mais...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={saving}
                    className="w-full bg-[#C9607A] text-white py-3 rounded-full text-sm font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin">⟳</span>
                        Iniciando geração...
                      </>
                    ) : (
                      <>
                        <SparkleIcon size={16} color="white" />
                        Confirmar e gerar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={saving}
                    className="text-sm text-[#2C1810]/40 hover:text-[#2C1810]/60 transition-colors py-2"
                  >
                    Voltar e revisar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
