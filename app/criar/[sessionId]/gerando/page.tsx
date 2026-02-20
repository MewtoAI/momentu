'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GeneratingAnimation } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const POLL_INTERVAL_MS = 5000

const MESSAGES = [
  'Analisando suas fotos...',
  'Criando o design exclusivo...',
  'Compondo as páginas...',
  'Aplicando os detalhes finais...',
  'Harmonizando as cores...',
  'Finalizando os layouts...',
]

// ─── Gerando Page ─────────────────────────────────────────────────────────────

export default function GerandoPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [messageIdx, setMessageIdx] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [progress, setProgress] = useState<{ pagesDone: number; pagesTotal: number } | null>(null)
  const [photoCount, setPhotoCount] = useState<number | null>(null)

  const startRef = useRef(Date.now())
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const msgRef = useRef<NodeJS.Timeout | null>(null)

  // Trigger full generation immediately
  useEffect(() => {
    if (!sessionId) return

    fetch('/api/generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type: 'full' })
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          router.push(`/criar/${sessionId}/pronto`)
        }
      })
      .catch(err => console.error('Generation failed:', err))
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch photo count from session for display
  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()
    supabase
      .from('album_sessions')
      .select('photo_count')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        if (data?.photo_count) setPhotoCount(data.photo_count)
      })
  }, [sessionId])

  // Rotate messages
  useEffect(() => {
    msgRef.current = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % MESSAGES.length)
    }, 4000)

    return () => {
      if (msgRef.current) clearInterval(msgRef.current)
    }
  }, [])

  // Poll generation_jobs status
  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()

    async function poll() {
      if (Date.now() - startRef.current > TIMEOUT_MS) {
        setTimedOut(true)
        if (pollRef.current) clearInterval(pollRef.current)
        return
      }

      try {
        const { data: job } = await supabase
          .from('generation_jobs')
          .select('status, pages_done, pages_total')
          .eq('session_id', sessionId)
          .eq('type', 'full')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!job) return

        // Update progress
        if (job.pages_done && job.pages_total) {
          setProgress({ pagesDone: job.pages_done, pagesTotal: job.pages_total })
        }

        if (job.status === 'done') {
          if (pollRef.current) clearInterval(pollRef.current)
          router.push(`/criar/${sessionId}/pronto`)
        } else if (job.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setTimedOut(true)
        }
      } catch {
        // Silent fail — keep polling
      }
    }

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
            A geração está demorando mais do que o esperado
          </h2>
          <p className="text-sm text-[#2C1810]/50 mb-6 leading-relaxed">
            Nossa equipe foi notificada e seu álbum continuará sendo processado. Você receberá uma notificação quando estiver pronto. Entre em contato com o suporte se precisar de ajuda.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`https://wa.me/5511999999999?text=Olá!%20Tive%20um%20problema%20com%20a%20geração%20do%20álbum.%20SessionID:%20${sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#C9607A] text-white py-3 rounded-full text-sm font-medium hover:bg-[#b54d68] transition-all"
            >
              Falar com suporte
            </a>
            <button
              onClick={() => {
                setTimedOut(false)
                startRef.current = Date.now()
              }}
              className="text-sm text-[#2C1810]/40 hover:text-[#2C1810]/60 transition-colors"
            >
              Continuar aguardando
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Generating UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center px-4">
      {/* Main animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <GeneratingAnimation size={160} />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-serif text-2xl text-[#2C1810] text-center mb-2"
      >
        Criando seu álbum
      </motion.h1>

      {/* Photo count */}
      {photoCount && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[#2C1810]/40 mb-6 text-center"
        >
          {photoCount} foto{photoCount !== 1 ? 's' : ''} sendo compostas
        </motion.p>
      )}

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center overflow-hidden mb-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-[#2C1810]/60 text-center"
          >
            {MESSAGES[messageIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Page progress */}
      {progress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl px-5 py-3 mb-6 border border-[#C9607A]/10 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[#2C1810]/8 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#C9607A] rounded-full"
                animate={{
                  width: `${(progress.pagesDone / progress.pagesTotal) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-[#2C1810]/50 whitespace-nowrap">
              Página {progress.pagesDone} de {progress.pagesTotal}
            </span>
          </div>
        </motion.div>
      )}

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {MESSAGES.map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            animate={{
              backgroundColor:
                i <= messageIdx % MESSAGES.length
                  ? '#C9607A'
                  : 'rgba(201,96,122,0.2)',
              scale: i === messageIdx % MESSAGES.length ? 1.4 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <p className="text-xs text-[#2C1810]/30 text-center max-w-xs leading-relaxed">
        Isso pode levar alguns minutos. Não feche esta tela. Você será redirecionado automaticamente quando o álbum estiver pronto.
      </p>
    </div>
  )
}
