'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SparkleIcon, AlbumIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import { PRINT_PRICING, DIGITAL_PRICE } from '@/lib/types'
import type { AlbumSession, AlbumStyle } from '@/lib/types'
import { STYLE_CONFIGS } from '@/lib/styles'

// ─── Style gradients ──────────────────────────────────────────────────────────

const STYLE_GRADIENT: Record<string, string> = {
  romantic: 'from-rose-100 to-pink-200',
  classic: 'from-gray-100 to-slate-200',
  vibrant: 'from-orange-100 to-amber-200',
  minimal: 'from-slate-50 to-gray-100',
  vintage: 'from-amber-100 to-orange-100',
  bohemian: 'from-emerald-50 to-teal-100',
}

const STYLE_LABEL: Record<string, string> = {
  romantic: 'Romântico',
  classic: 'Clássico',
  vibrant: 'Vibrante',
  minimal: 'Minimal',
  vintage: 'Vintage',
  bohemian: 'Boêmio',
}

// ─── Sample Page Placeholder ──────────────────────────────────────────────────

function SamplePagePlaceholder({
  style,
  pageNumber,
  isActive,
}: {
  style: string
  pageNumber: number
  isActive: boolean
}) {
  const gradient = STYLE_GRADIENT[style] ?? 'from-rose-100 to-pink-200'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActive ? 1 : 0.4, scale: isActive ? 1 : 0.92 }}
      transition={{ duration: 0.4 }}
      className={`relative w-full aspect-[3/4] rounded-2xl bg-gradient-to-br ${gradient} shadow-lg overflow-hidden border border-white/60`}
    >
      {/* Top decoration */}
      <div className="absolute top-4 left-4 right-4 h-1 bg-white/40 rounded-full" />

      {/* Photo placeholder slots */}
      <div className="absolute top-8 left-4 right-4 bottom-20 flex flex-col gap-3">
        {pageNumber === 1 ? (
          <>
            {/* Large photo slot */}
            <div className="flex-1 bg-white/30 rounded-xl border border-white/50 flex items-center justify-center">
              <AlbumIcon size={32} color="rgba(255,255,255,0.6)" />
            </div>
            {/* Two small slots */}
            <div className="flex gap-3 h-24">
              <div className="flex-1 bg-white/20 rounded-xl border border-white/40" />
              <div className="flex-1 bg-white/25 rounded-xl border border-white/40" />
            </div>
          </>
        ) : (
          <>
            {/* Two medium slots */}
            <div className="flex gap-3 flex-1">
              <div className="flex-1 bg-white/25 rounded-xl border border-white/40" />
              <div className="flex-1 bg-white/20 rounded-xl border border-white/40" />
            </div>
            {/* One wide slot */}
            <div className="bg-white/30 rounded-xl border border-white/50 h-24 flex items-center justify-center">
              <div className="w-16 h-1 bg-white/50 rounded-full" />
            </div>
          </>
        )}
      </div>

      {/* Bottom text placeholder */}
      <div className="absolute bottom-6 left-4 right-4 space-y-2">
        <div className="h-1 bg-white/40 rounded-full w-3/4 mx-auto" />
        <div className="h-1 bg-white/30 rounded-full w-1/2 mx-auto" />
      </div>

      {/* Page indicator */}
      <div className="absolute top-3 right-3 bg-white/70 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
        Pg. {pageNumber}
      </div>

      {/* Style badge */}
      {pageNumber === 1 && (
        <div className="absolute bottom-2 right-3 text-[9px] text-white/60 font-medium uppercase tracking-wider">
          {STYLE_LABEL[style] ?? style}
        </div>
      )}
    </motion.div>
  )
}

// ─── Inner component ──────────────────────────────────────────────────────────

function PreviewInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<AlbumSession | null>(null)
  const [albumStructure, setAlbumStructure] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState(0)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()

    Promise.all([
      supabase
        .from('album_sessions')
        .select('*')
        .eq('id', sessionId)
        .single(),
      supabase
        .from('generation_jobs')
        .select('result_url, status')
        .eq('session_id', sessionId)
        .eq('status', 'done')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]).then(([sessionRes, jobRes]) => {
      if (sessionRes.data) setSession(sessionRes.data as AlbumSession)
      if (jobRes.data?.result_url) {
        try {
          setAlbumStructure(JSON.parse(jobRes.data.result_url))
        } catch {
          // ignore parse errors
        }
      }
      setLoading(false)
    })
  }, [sessionId])

  // Use real album structure data when available, fallback to session questionnaire
  const style = (albumStructure?.style as AlbumStyle) ?? session?.questionnaire?.style ?? 'romantic'
  const pageCount =
    (albumStructure?.pageCount as number) ??
    session?.questionnaire?.pageCount ??
    15
  const purpose = session?.productType ?? 'print'
  const price =
    purpose === 'print'
      ? (PRINT_PRICING[pageCount] ?? PRINT_PRICING[15])
      : DIGITAL_PRICE

  const styleLabel = STYLE_CONFIGS[style as AlbumStyle]?.label ?? STYLE_LABEL[style] ?? style

  async function handleReject() {
    setRejecting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('users')
          .update({ used_free_sample: true })
          .eq('id', user.id)
      }

      router.push('/')
    } catch {
      router.push('/')
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <SparkleIcon size={32} color="#C9607A" animate />
          <p className="text-sm text-[#2C1810]/50">Carregando prévia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-[#2C1810]/50 hover:text-[#2C1810] transition-colors"
          >
            ← Voltar
          </button>
          <span className="font-serif text-base text-[#2C1810]">Sua amostra gratuita</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 pb-24">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <SparkleIcon size={20} color="#C9607A" animate />
            <span className="text-xs font-medium text-[#C9607A] uppercase tracking-widest">
              Amostra pronta
            </span>
          </div>
          <h1 className="font-serif text-2xl text-[#2C1810]">
            Veja como vai ficar seu álbum
          </h1>
          <p className="text-sm text-[#2C1810]/50 mt-1">
            Estilo {styleLabel} · {pageCount} páginas
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative mb-4">
          <div className="flex gap-4">
            {[1, 2].map((pageNum, idx) => (
              <div
                key={pageNum}
                className="flex-1 cursor-pointer"
                onClick={() => setActivePage(idx)}
              >
                <SamplePagePlaceholder
                  style={style}
                  pageNumber={pageNum}
                  isActive={activePage === idx}
                />
              </div>
            ))}
          </div>

          {/* Page dots */}
          <div className="flex justify-center gap-2 mt-3">
            {[0, 1].map((i) => (
              <button
                key={i}
                onClick={() => setActivePage(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activePage === i ? 'bg-[#C9607A] w-4' : 'bg-[#C9607A]/25'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-xs text-amber-800 text-center leading-relaxed">
            ✨ Esta é uma prévia do estilo e layout. O álbum final usará <strong>todas as suas fotos</strong> com design exclusivo gerado pela AI.
          </p>
        </div>

        {/* Price info */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-[#C9607A]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#2C1810]/40 uppercase tracking-wide">Álbum completo</p>
              <p className="font-serif text-[#2C1810] text-lg">
                {pageCount} páginas · Estilo {styleLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-serif text-[#C9607A]">
                R${price.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAF7F5]/95 backdrop-blur border-t border-[#C9607A]/10 px-4 py-4 z-40">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/criar/pagamento?sessionId=${sessionId}`)}
            className="w-full bg-[#C9607A] text-white py-4 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C9607A]/20"
          >
            <SparkleIcon size={18} color="white" animate />
            Quero esse álbum! — R${price.toFixed(2).replace('.', ',')}
          </motion.button>

          <button
            onClick={() => setShowRejectModal(true)}
            className="text-sm text-[#2C1810]/40 hover:text-[#2C1810]/60 transition-colors text-center py-1"
          >
            Não é isso que quero
          </button>
        </div>
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {showRejectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowRejectModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 pb-10"
            >
              <h2 className="font-serif text-xl text-[#2C1810] mb-2 text-center">
                Tem certeza?
              </h2>
              <p className="text-sm text-[#2C1810]/50 text-center mb-6">
                Cada amostra é única e criada especialmente para você. Ao sair, você perde acesso a esta prévia e não poderá gerar outra gratuitamente.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="w-full bg-[#C9607A] text-white py-3 rounded-full text-sm font-medium hover:bg-[#b54d68] transition-all"
                >
                  Voltar e ver minha amostra
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="w-full text-sm text-[#2C1810]/40 hover:text-[#2C1810]/60 transition-colors py-2 disabled:opacity-50"
                >
                  {rejecting ? 'Saindo...' : 'Não, obrigado — sair'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
          <SparkleIcon size={32} color="#C9607A" animate />
        </div>
      }
    >
      <PreviewInner />
    </Suspense>
  )
}
