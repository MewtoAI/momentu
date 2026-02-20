'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckIcon, SparkleIcon, AlbumIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import type { AlbumSession } from '@/lib/types'

// ─── Style gradients ──────────────────────────────────────────────────────────

const STYLE_GRADIENT: Record<string, string> = {
  romantic: 'from-rose-100 to-pink-200',
  classic: 'from-gray-100 to-slate-200',
  vibrant: 'from-orange-100 to-amber-200',
  minimal: 'from-slate-50 to-gray-100',
  vintage: 'from-amber-100 to-orange-100',
  bohemian: 'from-emerald-50 to-teal-100',
}

// ─── Print info cards ─────────────────────────────────────────────────────────

const PRINT_TIPS = [
  {
    icon: '🖨️',
    title: 'Gráfica local',
    description:
      'Leve o arquivo PDF a qualquer gráfica e peça impressão em papel fotográfico 300g. Diga que é print-ready.',
  },
  {
    icon: '📦',
    title: 'Impressão online',
    description:
      'Serviços como Printi, Graficart ou Shutterfly aceitam o PDF direto. Peça acabamento fosco para um toque premium.',
  },
  {
    icon: '✨',
    title: 'Dica de qualidade',
    description:
      'Para álbuns de casamento, prefira papel couché fosco 180g. Para fotos de família, brilhante 150g é ótimo.',
  },
]

// ─── Pronto Page ──────────────────────────────────────────────────────────────

export default function ProntoPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<AlbumSession | null>(null)
  const [copied, setCopied] = useState(false)

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
      })
  }, [sessionId])

  const style = session?.questionnaire?.style ?? 'romantic'
  const pageCount = session?.questionnaire?.pageCount ?? 15
  const gradient = STYLE_GRADIENT[style] ?? 'from-rose-100 to-pink-200'

  async function handleShare() {
    const url = `${window.location.origin}/criar/${sessionId}/pronto`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Meu álbum Momentu',
          text: 'Veja o álbum que criei com o Momentu AI! 📸',
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <span className="font-serif text-base text-[#2C1810]">Seu álbum está pronto</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 pb-16">
        {/* Hero check + title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="mb-4">
            <CheckIcon size={64} color="#C9607A" animate />
          </div>
          <h1 className="font-serif text-3xl text-[#2C1810] mb-2">
            Seu álbum está pronto! 🎉
          </h1>
          <p className="text-sm text-[#2C1810]/50 max-w-xs leading-relaxed">
            Seu álbum foi gerado com sucesso. Baixe o PDF e leve para impressão ou compartilhe com quem você ama.
          </p>
        </motion.div>

        {/* Page preview scroll */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-xs font-medium text-[#2C1810]/40 uppercase tracking-wider mb-3">
            Prévia das páginas
          </p>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4">
            {Array.from({ length: Math.min(pageCount, 8) }, (_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className={`flex-shrink-0 w-24 h-32 rounded-xl bg-gradient-to-br ${gradient} border border-white/60 shadow-sm flex items-end justify-center pb-2`}
              >
                <span className="text-[9px] text-white/50 font-medium">Pg. {i + 1}</span>
              </motion.div>
            ))}
            {pageCount > 8 && (
              <div className="flex-shrink-0 w-24 h-32 rounded-xl bg-[#2C1810]/8 flex items-center justify-center">
                <span className="text-xs text-[#2C1810]/30">+{pageCount - 8}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 mb-8"
        >
          {/* Download PDF */}
          <a
            href={`/api/download/${sessionId}`}
            download="album-momentu.pdf"
            className="w-full bg-[#C9607A] text-white py-4 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C9607A]/20"
          >
            <span className="text-lg">⬇</span>
            Baixar PDF para impressão
          </a>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full bg-white text-[#C9607A] py-4 rounded-full text-base font-medium border-2 border-[#C9607A]/30 hover:border-[#C9607A] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">🔗</span>
            {copied ? 'Link copiado! ✓' : 'Compartilhar prévia'}
          </button>
        </motion.div>

        {/* How to print */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="font-serif text-lg text-[#2C1810] mb-3">Como imprimir</h2>
          <div className="space-y-3">
            {PRINT_TIPS.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.08 }}
                className="bg-white rounded-2xl p-4 border border-[#2C1810]/8 flex gap-4 items-start"
              >
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-sm font-medium text-[#2C1810] mb-0.5">{tip.title}</p>
                  <p className="text-xs text-[#2C1810]/50 leading-relaxed">{tip.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Album info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl p-4 border border-[#C9607A]/10 mb-8 flex items-center gap-3"
        >
          <AlbumIcon size={28} color="#C9607A" />
          <div>
            <p className="text-sm font-medium text-[#2C1810]">
              Álbum {pageCount} páginas
            </p>
            <p className="text-xs text-[#2C1810]/40">
              Gerado em {new Date().toLocaleDateString('pt-BR')} · ID: {sessionId.slice(0, 8)}
            </p>
          </div>
        </motion.div>

        {/* CTA - create another */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <p className="text-sm text-[#2C1810]/40 mb-3">
            Adorou o resultado? Crie mais álbuns para cada momento especial!
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-sm text-[#C9607A] font-medium hover:text-[#b54d68] transition-colors"
          >
            <SparkleIcon size={16} color="#C9607A" />
            Criar outro álbum →
          </button>
        </motion.div>
      </main>
    </div>
  )
}
