'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GeneratingAnimation } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'

// ─── Rotating messages ────────────────────────────────────────────────────────

const MESSAGES = [
  'Analisando suas fotos...',
  'Escolhendo o estilo perfeito...',
  'Criando o design personalizado...',
  'Quase pronto...',
]

const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const POLL_INTERVAL_MS = 3000

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function GerandoInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [messageIdx, setMessageIdx] = useState(0)
  const [timedOut, setTimedOut] = useState(false)

  const startRef = useRef(Date.now())
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const msgRef = useRef<NodeJS.Timeout | null>(null)

  // Rotate messages every 3s
  useEffect(() => {
    msgRef.current = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % MESSAGES.length)
    }, POLL_INTERVAL_MS)

    return () => {
      if (msgRef.current) clearInterval(msgRef.current)
    }
  }, [])

  // Poll generation_jobs status
  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()

    async function poll() {
      // Check timeout
      if (Date.now() - startRef.current > TIMEOUT_MS) {
        setTimedOut(true)
        if (pollRef.current) clearInterval(pollRef.current)
        return
      }

      try {
        const { data: job } = await supabase
          .from('generation_jobs')
          .select('status, result_url')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!job) return

        if (job.status === 'done') {
          if (pollRef.current) clearInterval(pollRef.current)
          router.push(`/criar/amostra/preview?sessionId=${sessionId}`)
        } else if (job.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setTimedOut(true) // reuse timeout UI
        }
      } catch {
        // Silent fail — keep polling
      }
    }

    // Start polling
    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [sessionId, router])

  // ─── Timeout / Error UI ────────────────────────────────────────────────────
  if (timedOut) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="font-serif text-xl text-[#2C1810] mb-2">
            Algo demorou mais que o esperado
          </h2>
          <p className="text-sm text-[#2C1810]/50 mb-6">
            Nossa equipe já foi notificada. Tente novamente em alguns minutos ou entre em contato
            com o suporte.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`https://wa.me/5511999999999?text=Olá!%20Tive%20um%20problema%20com%20a%20geração%20da%20amostra.%20SessionID:%20${sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#C9607A] text-white py-3 rounded-full text-sm font-medium hover:bg-[#b54d68] transition-all"
            >
              Falar com suporte
            </a>
            <button
              onClick={() => router.push('/criar/amostra')}
              className="text-sm text-[#2C1810]/40 hover:text-[#2C1810]/60 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading UI ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center px-4">
      {/* Generating animation */}
      <div className="mb-8">
        <GeneratingAnimation size={120} />
      </div>

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="font-serif text-lg text-[#2C1810] text-center"
          >
            {MESSAGES[messageIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      <p className="text-xs text-[#2C1810]/30 mt-4 text-center">
        Isso pode levar até 2 minutos. Não feche esta tela.
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {MESSAGES.map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            animate={{
              backgroundColor:
                i <= messageIdx ? '#C9607A' : 'rgba(201,96,122,0.2)',
              scale: i === messageIdx ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page (wraps with Suspense for useSearchParams) ───────────────────────────

export default function GerandoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
          <GeneratingAnimation size={80} />
        </div>
      }
    >
      <GerandoInner />
    </Suspense>
  )
}
