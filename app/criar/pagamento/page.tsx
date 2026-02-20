'use client'

// TODO: Integrar Mercado Pago Pix antes de produção

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SparkleIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import { PRINT_PRICING, DIGITAL_PRICE } from '@/lib/types'
import type { AlbumSession } from '@/lib/types'

// ─── Style labels ─────────────────────────────────────────────────────────────

const STYLE_LABEL: Record<string, string> = {
  romantic: 'Romântico',
  classic: 'Clássico',
  vibrant: 'Vibrante',
  minimal: 'Minimal',
  vintage: 'Vintage',
  bohemian: 'Boêmio',
}

const OCCASION_LABEL: Record<string, string> = {
  wedding: 'Casamento',
  birthday: 'Aniversário',
  baby: 'Bebê',
  travel: 'Viagem',
  family: 'Família',
  graduation: 'Formatura',
  other: 'Outro',
}

// ─── Inner component ──────────────────────────────────────────────────────────

function PagamentoInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<AlbumSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()

    supabase
      .from('album_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        if (data) setSession(data as AlbumSession)
        setLoading(false)
      })
  }, [sessionId])

  const style = session?.questionnaire?.style ?? 'romantic'
  const occasion = session?.questionnaire?.occasion
  const pageCount = session?.questionnaire?.pageCount ?? 15
  const purpose = session?.productType ?? 'print'
  const price =
    purpose === 'print'
      ? (PRINT_PRICING[pageCount] ?? PRINT_PRICING[15])
      : DIGITAL_PRICE

  async function handleConfirm() {
    if (!confirmed || !sessionId) return
    setProcessing(true)
    setError(null)

    try {
      const supabase = createClient()

      // TODO: Integrar Mercado Pago Pix antes de produção
      // Por ora: simular pagamento aprovado e avançar para upload

      const { error: updateError } = await supabase
        .from('album_sessions')
        .update({ status: 'uploading' })
        .eq('id', sessionId)

      if (updateError) {
        throw new Error('Erro ao processar pagamento. Tente novamente.')
      }

      router.push(`/criar/${sessionId}/upload`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
      setError(msg)
      setProcessing(false)
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <SparkleIcon size={32} color="#C9607A" animate />
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
          <span className="font-serif text-base text-[#2C1810]">Finalizar pedido</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 pb-32">
        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 border border-[#C9607A]/10 shadow-sm mb-4"
        >
          <h2 className="font-serif text-lg text-[#2C1810] mb-4">Resumo do pedido</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#2C1810]/50">Produto</span>
              <span className="text-[#2C1810] font-medium">
                Álbum {purpose === 'print' ? 'impresso' : 'digital'}
              </span>
            </div>

            {occasion && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#2C1810]/50">Ocasião</span>
                <span className="text-[#2C1810] font-medium">
                  {OCCASION_LABEL[occasion] ?? occasion}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-[#2C1810]/50">Estilo</span>
              <span className="text-[#2C1810] font-medium">
                {STYLE_LABEL[style] ?? style}
              </span>
            </div>

            {purpose === 'print' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#2C1810]/50">Páginas</span>
                <span className="text-[#2C1810] font-medium">{pageCount} páginas</span>
              </div>
            )}

            <div className="border-t border-dashed border-[#2C1810]/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#2C1810]">Total</span>
                <span className="font-serif text-xl text-[#C9607A]">
                  R${price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What's included */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-5 border border-[#C9607A]/10 shadow-sm mb-4"
        >
          <h2 className="font-serif text-lg text-[#2C1810] mb-3">O que está incluído</h2>
          <ul className="space-y-2">
            {[
              'Upload de até 40 fotos',
              'Design exclusivo gerado por AI',
              'Ajuste e anotações personalizadas',
              purpose === 'print'
                ? 'PDF print-ready para gráfica (300 DPI)'
                : 'Arquivos otimizados para redes sociais',
              'Download imediato após geração',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#2C1810]/70">
                <span className="text-[#C9607A] mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Non-refund warning */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6"
        >
          <div className="flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Política de não reembolso
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Por se tratar de um produto digital personalizado criado exclusivamente para você, <strong>não realizamos reembolsos</strong> após o início da geração. Certifique-se de que as informações estão corretas antes de confirmar.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Checkbox confirmation */}
        <motion.label
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-start gap-3 cursor-pointer mb-6"
        >
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                confirmed
                  ? 'bg-[#C9607A] border-[#C9607A]'
                  : 'border-[#2C1810]/25 bg-white'
              }`}
            >
              {confirmed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <p className="text-sm text-[#2C1810]/70 leading-relaxed">
            Li e concordo com a política de não reembolso. Entendo que este é um produto digital personalizado e que não haverá devolução após o pagamento.
          </p>
        </motion.label>

        {/* Error */}
        {error && (
          <p className="text-rose-600 text-sm text-center mb-4">{error}</p>
        )}

        {/* Payment note */}
        <p className="text-center text-xs text-[#2C1810]/30 mb-4">
          🔒 Pagamento seguro via Pix — processado pelo Mercado Pago
        </p>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAF7F5]/95 backdrop-blur border-t border-[#C9607A]/10 px-4 py-4 z-40">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: confirmed ? 0.97 : 1 }}
            onClick={handleConfirm}
            disabled={!confirmed || processing}
            className={`w-full py-4 rounded-full text-base font-medium transition-all flex items-center justify-center gap-2 ${
              confirmed
                ? 'bg-[#C9607A] text-white hover:bg-[#b54d68] shadow-lg shadow-[#C9607A]/20'
                : 'bg-[#2C1810]/10 text-[#2C1810]/30 cursor-not-allowed'
            } disabled:opacity-60`}
          >
            {processing ? (
              <>
                <span className="animate-spin text-lg">⟳</span>
                Processando...
              </>
            ) : (
              <>
                <SparkleIcon size={18} color={confirmed ? 'white' : 'rgba(44,24,16,0.3)'} />
                Confirmar e pagar — R${price.toFixed(2).replace('.', ',')}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PagamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
          <SparkleIcon size={32} color="#C9607A" animate />
        </div>
      }
    >
      <PagamentoInner />
    </Suspense>
  )
}
