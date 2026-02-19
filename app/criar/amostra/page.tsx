'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadIcon, SparkleIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

// ─── Photo Preview Card ───────────────────────────────────────────────────────

function PhotoPreview({
  file,
  onRemove,
}: {
  file: File
  onRemove: () => void
}) {
  const url = URL.createObjectURL(file)
  return (
    <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-[#C9607A]/30 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.name} className="w-full h-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-black/70 transition-colors"
        aria-label="Remover foto"
      >
        ×
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-[9px] px-1 py-0.5 truncate">
        {formatFileSize(file.size)}
      </div>
    </div>
  )
}

// ─── Upload Page ──────────────────────────────────────────────────────────────

export default function AmostraPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyUsed, setAlreadyUsed] = useState(false)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const slots = 2 - photos.length
      if (slots <= 0) return
      setPhotos((prev) => [...prev, ...accepted.slice(0, slots)])
    },
    [photos]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 2,
    disabled: photos.length >= 2 || loading,
  })

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleGenerate() {
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Check auth
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const returnUrl = encodeURIComponent('/criar/amostra')
        router.push(`/auth/login?returnUrl=${returnUrl}`)
        return
      }

      // Check free sample usage
      const { data: profile } = await supabase
        .from('users')
        .select('used_free_sample')
        .eq('id', user.id)
        .single()

      if (profile?.used_free_sample) {
        setAlreadyUsed(true)
        setLoading(false)
        return
      }

      // Get questionnaire from sessionStorage
      const questionnaire = JSON.parse(
        sessionStorage.getItem('momentu_questionnaire') ?? '{}'
      )

      // Create album_session
      const { data: session, error: sessionError } = await supabase
        .from('album_sessions')
        .insert({
          user_id: user.id,
          product_type: questionnaire.purpose ?? 'print',
          status: 'sample_requested',
          questionnaire,
          photo_count: photos.length,
        })
        .select('id')
        .single()

      if (sessionError || !session) {
        throw new Error('Erro ao criar sessão. Tente novamente.')
      }

      // Upload photos to Supabase Storage
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/${session.id}/sample_${i + 1}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(path, file, { upsert: true })

        if (uploadError) {
          console.warn('Upload warning:', uploadError.message)
        }
      }

      // Redirect to generating page
      router.push(`/criar/amostra/gerando?sessionId=${session.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
      setError(msg)
      setLoading(false)
    }
  }

  // ─── Already used modal ────────────────────────────────────────────────────
  if (alreadyUsed) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="font-serif text-xl text-[#2C1810] mb-2">
            Você já usou sua amostra gratuita
          </h2>
          <p className="text-sm text-[#2C1810]/50 mb-6">
            Deseja continuar com o álbum completo e receber um resultado ainda mais incrível?
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/checkout')}
              className="bg-[#C9607A] text-white py-3 rounded-full text-sm font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2"
            >
              <SparkleIcon size={16} color="white" animate />
              Continuar com álbum completo
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-[#2C1810]/40 hover:text-[#2C1810]/60 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
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
          <span className="font-serif text-base text-[#2C1810]">Prévia gratuita</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pt-12 pb-20">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-[#2C1810] mb-2">
            Escolha 2 fotos para ver como vai ficar
          </h1>
          <p className="text-sm text-[#2C1810]/50">
            Vamos criar uma prévia com essas fotos para você ver o estilo antes de decidir.
          </p>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
            isDragActive
              ? 'border-[#C9607A] bg-[#C9607A]/5'
              : 'border-[#2C1810]/15 bg-white hover:border-[#C9607A]/40 hover:bg-[#C9607A]/3'
          } ${photos.length >= 2 ? 'cursor-default opacity-80' : ''}`}
        >
          <input {...getInputProps()} />

          {photos.length < 2 && (
            <div className="flex flex-col items-center gap-3 mb-6">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <UploadIcon size={40} color="#C9607A" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-[#2C1810]/70">
                  {isDragActive ? 'Solte aqui!' : 'Arraste 2 fotos aqui'}
                </p>
                <p className="text-xs text-[#2C1810]/40 mt-0.5">
                  ou toque para selecionar
                </p>
              </div>
            </div>
          )}

          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="flex gap-3 justify-center flex-wrap">
              {photos.map((file, idx) => (
                <PhotoPreview
                  key={`${file.name}-${idx}`}
                  file={file}
                  onRemove={() => removePhoto(idx)}
                />
              ))}
              {photos.length < 2 && (
                <div className="w-28 h-28 rounded-xl border-2 border-dashed border-[#2C1810]/15 flex items-center justify-center text-[#2C1810]/30 text-sm">
                  + 1 foto
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-rose-600 text-sm text-center mt-4">{error}</p>
        )}

        {/* CTA */}
        <AnimatePresence>
          {photos.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-6"
            >
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-[#C9607A] text-white py-4 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C9607A]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-lg">⟳</span>
                    Preparando...
                  </>
                ) : (
                  <>
                    <SparkleIcon size={18} color="white" animate />
                    Gerar minha amostra gratuita
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy note */}
        <p className="text-center text-xs text-[#2C1810]/30 mt-6">
          🔒 Suas fotos são privadas e usadas apenas para criar seu álbum
        </p>
      </main>
    </div>
  )
}
