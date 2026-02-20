'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadIcon, SparkleIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 40

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
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

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function Thumbnail({
  file,
  onRemove,
  uploading,
  uploaded,
}: {
  file: File
  onRemove: () => void
  uploading: boolean
  uploaded: boolean
}) {
  const url = URL.createObjectURL(file)

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#C9607A]/20 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.name} className="w-full h-full object-cover" />

      {/* Upload overlay */}
      {uploading && !uploaded && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="animate-spin text-white text-lg">⟳</span>
        </div>
      )}

      {/* Done overlay */}
      {uploaded && (
        <div className="absolute inset-0 bg-[#C9607A]/20 flex items-center justify-center">
          <div className="bg-[#C9607A] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            ✓
          </div>
        </div>
      )}

      {/* Remove button */}
      {!uploading && !uploaded && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-black/70 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ─── Upload Page ──────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const slots = MAX_PHOTOS - photos.length
      if (slots <= 0) return
      setPhotos((prev) => [...prev, ...accepted.slice(0, slots)])
    },
    [photos]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    disabled: photos.length >= MAX_PHOTOS || uploading,
    multiple: true,
  })

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleUpload() {
    if (photos.length < 2) return
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Upload each photo
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop() ?? 'jpg'
        const filename = `${Date.now()}_${i}.${ext}`
        const path = `albums/${sessionId}/${filename}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(path, file, { upsert: true })

        if (uploadError) {
          console.warn(`Upload warning for ${filename}:`, uploadError.message)
        }

        setUploadedIds((prev) => new Set(Array.from(prev).concat(file.name + i)))
        setProgress(Math.round(((i + 1) / photos.length) * 100))
      }

      // Update session
      const { error: sessionError } = await supabase
        .from('album_sessions')
        .update({
          photo_count: photos.length,
          status: 'grouping',
        })
        .eq('id', sessionId)

      if (sessionError) {
        throw new Error('Erro ao salvar progresso. Tente novamente.')
      }

      router.push(`/criar/${sessionId}/agrupamento`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
      setError(msg)
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-base text-[#2C1810]">Suas fotos</span>
          <span className="text-sm text-[#2C1810]/50">
            {photos.length}/{MAX_PHOTOS} fotos
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-32">
        <StepIndicator current={1} />

        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl text-[#2C1810] mb-1">
            Envie suas fotos
          </h1>
          <p className="text-sm text-[#2C1810]/50">
            Adicione até {MAX_PHOTOS} fotos. Quanto mais, melhor o álbum!
          </p>
        </div>

        {/* Progress bar during upload */}
        {uploading && (
          <div className="mb-4">
            <div className="h-2 bg-[#2C1810]/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#C9607A] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-center text-[#2C1810]/40 mt-1">
              Enviando... {progress}%
            </p>
          </div>
        )}

        {/* Dropzone */}
        {!uploading && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer mb-5 ${
              isDragActive
                ? 'border-[#C9607A] bg-[#C9607A]/5'
                : 'border-[#2C1810]/15 bg-white hover:border-[#C9607A]/40'
            } ${photos.length >= MAX_PHOTOS ? 'cursor-default opacity-70' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <UploadIcon size={36} color="#C9607A" />
              </motion.div>
              <p className="text-sm font-medium text-[#2C1810]/70">
                {isDragActive
                  ? 'Solte aqui!'
                  : photos.length >= MAX_PHOTOS
                  ? 'Limite de fotos atingido'
                  : 'Arraste ou toque para adicionar fotos'}
              </p>
              <p className="text-xs text-[#2C1810]/35">
                {photos.length} de {MAX_PHOTOS} fotos selecionadas
              </p>
            </div>
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-4 gap-2 mb-4"
          >
            <AnimatePresence>
              {photos.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Thumbnail
                    file={file}
                    onRemove={() => removePhoto(idx)}
                    uploading={uploading}
                    uploaded={uploadedIds.has(file.name + idx)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <p className="text-rose-600 text-sm text-center mb-4">{error}</p>
        )}

        {/* Tips */}
        <div className="bg-white rounded-2xl p-4 border border-[#2C1810]/8">
          <p className="text-xs font-medium text-[#2C1810]/50 mb-2">💡 Dicas para um álbum incrível</p>
          <ul className="space-y-1">
            {[
              'Use fotos nítidas e bem iluminadas',
              'Misture planos: close, paisagem e grupo',
              'Inclua fotos de diferentes momentos do dia',
            ].map((tip, i) => (
              <li key={i} className="text-xs text-[#2C1810]/40 flex gap-1.5">
                <span className="text-[#C9607A]">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAF7F5]/95 backdrop-blur border-t border-[#C9607A]/10 px-4 py-4 z-40">
        <div className="max-w-lg mx-auto">
          <AnimatePresence>
            {photos.length >= 2 && !uploading && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleUpload}
                className="w-full bg-[#C9607A] text-white py-4 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C9607A]/20"
              >
                <SparkleIcon size={18} color="white" animate />
                Continuar com {photos.length} foto{photos.length !== 1 ? 's' : ''}
              </motion.button>
            )}
            {photos.length < 2 && (
              <p className="text-center text-sm text-[#2C1810]/40 py-2">
                Adicione pelo menos 2 fotos para continuar
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
