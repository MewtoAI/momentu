'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PhotoStackIcon, SparkleIcon, MagicWandIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import type { AlbumSession, PhotoGrouping } from '@/lib/types'

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoItem {
  id: string
  index: number
  url: string
}

interface GroupItem {
  id: string
  photoIds: string[]
}

// ─── Photo Thumbnail ──────────────────────────────────────────────────────────

function PhotoThumbnail({
  photo,
  selected,
  onToggle,
}: {
  photo: PhotoItem
  selected: boolean
  onToggle: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onToggle}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
        selected
          ? 'border-[#C9607A] ring-2 ring-[#C9607A]/30'
          : 'border-transparent'
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#C9607A]/10 to-pink-100 flex items-center justify-center`}
      >
        <span className="text-[#C9607A]/40 text-xl font-serif">{photo.index + 1}</span>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-[#C9607A] text-white rounded-full flex items-center justify-center text-xs">
          ✓
        </div>
      )}

      {/* Photo number label */}
      <div className="absolute bottom-1 left-1 bg-black/30 text-white text-[9px] px-1 py-0.5 rounded">
        #{photo.index + 1}
      </div>
    </motion.button>
  )
}

// ─── Group Stack ──────────────────────────────────────────────────────────────

function GroupStack({
  group,
  onUngroup,
}: {
  group: GroupItem
  onUngroup: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileTap={{ scale: 0.92 }}
      onClick={onUngroup}
      className="relative aspect-square flex items-center justify-center"
    >
      {/* Stack visual: offset layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-200 rounded-xl opacity-40 transform rotate-[-8deg]" />
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-200 rounded-xl opacity-60 transform rotate-[-4deg]" />
      <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-pink-300 rounded-xl border-2 border-[#C9607A]/40 flex flex-col items-center justify-center gap-1">
        <PhotoStackIcon size={20} color="#C9607A" grouped />
        <span className="text-[9px] text-[#C9607A] font-medium leading-tight text-center">
          {group.photoIds.length} fotos
        </span>
        <span className="text-[8px] text-[#C9607A]/60 leading-none">Mesma página</span>
      </div>
    </motion.button>
  )
}

// ─── Agrupamento Page ─────────────────────────────────────────────────────────

export default function AgrupamentoPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<AlbumSession | null>(null)
  const [mode, setMode] = useState<'choose' | 'auto' | 'custom'>('choose')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [saving, setSaving] = useState(false)
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
        if (data) {
          setSession(data as AlbumSession)
          // Generate placeholder photos based on photo_count
          const count = (data as AlbumSession).photoCount ?? 0
          const items: PhotoItem[] = Array.from({ length: count }, (_, i) => ({
            id: `photo_${i}`,
            index: i,
            url: '',
          }))
          setPhotos(items)
        }
      })
  }, [sessionId])

  const photoCount = session?.photoCount ?? 0
  const groupedPhotoIds = new Set(groups.flatMap((g) => g.photoIds))
  const ungroupedPhotos = photos.filter((p) => !groupedPhotoIds.has(p.id))

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleGroup() {
    if (selected.size < 2) return
    const photoIds = Array.from(selected)
    const newGroup: GroupItem = {
      id: `group_${Date.now()}`,
      photoIds,
    }
    setGroups((prev) => [...prev, newGroup])
    setSelected(new Set())
  }

  function handleUngroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
  }

  async function handleConfirm(isAuto = false) {
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      const groupings: PhotoGrouping[] = isAuto
        ? []
        : groups.map((g, i) => ({
            pageIndex: i,
            photoIds: g.photoIds,
          }))

      const { error: updateError } = await supabase
        .from('album_sessions')
        .update({
          groupings,
          status: 'adjusting',
        })
        .eq('id', sessionId)

      if (updateError) {
        throw new Error('Erro ao salvar agrupamentos. Tente novamente.')
      }

      router.push(`/criar/${sessionId}/ajuste`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado.'
      setError(msg)
      setSaving(false)
    }
  }

  // ─── Choose mode ────────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-[#FAF7F5]">
        <header className="sticky top-0 z-40 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
            <span className="font-serif text-base text-[#2C1810]">Organizar fotos</span>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 pt-6 pb-12">
          <StepIndicator current={2} />

          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl text-[#2C1810] mb-2">
              Como quer organizar as fotos?
            </h1>
            <p className="text-sm text-[#2C1810]/50">
              {photoCount} foto{photoCount !== 1 ? 's' : ''} enviada{photoCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Auto card */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleConfirm(true)}
              className="bg-[#C9607A] text-white rounded-3xl p-6 text-left shadow-lg shadow-[#C9607A]/20"
            >
              <div className="flex items-start gap-4">
                <MagicWandIcon size={32} color="rgba(255,255,255,0.9)" animate />
                <div>
                  <h2 className="font-serif text-lg mb-1">Deixa com a gente ✨</h2>
                  <p className="text-sm text-white/75 leading-relaxed">
                    Nossa AI vai distribuir suas fotos nas páginas de forma inteligente e harmoniosa. Recomendado!
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs text-white font-medium">
                    <SparkleIcon size={12} color="white" />
                    Recomendado
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Custom card */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('custom')}
              className="bg-white rounded-3xl p-6 text-left border-2 border-[#2C1810]/10 hover:border-[#C9607A]/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <PhotoStackIcon size={32} color="#C9607A" />
                <div>
                  <h2 className="font-serif text-lg text-[#2C1810] mb-1">
                    Quero customizar
                  </h2>
                  <p className="text-sm text-[#2C1810]/50 leading-relaxed">
                    Escolha quais fotos vão juntas na mesma página. Ideal para quem quer controle total da narrativa.
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
        </main>
      </div>
    )
  }

  // ─── Custom grouping mode ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/90 backdrop-blur border-b border-[#C9607A]/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setMode('choose')}
            className="text-sm text-[#2C1810]/50 hover:text-[#2C1810] transition-colors"
          >
            ← Voltar
          </button>
          <span className="font-serif text-base text-[#2C1810]">Agrupar fotos</span>
          <span className="text-xs text-[#2C1810]/40">
            {selected.size > 0 ? `${selected.size} selecionada${selected.size !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-36">
        <StepIndicator current={2} />

        <p className="text-center text-sm text-[#2C1810]/50 mb-4">
          Toque para selecionar fotos que vão na mesma página
        </p>

        {/* Groups section */}
        {groups.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-[#2C1810]/40 uppercase tracking-wider mb-2">
              Grupos criados ({groups.length})
            </p>
            <div className="grid grid-cols-4 gap-2">
              <AnimatePresence>
                {groups.map((group) => (
                  <GroupStack
                    key={group.id}
                    group={group}
                    onUngroup={() => handleUngroup(group.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
            <p className="text-xs text-center text-[#2C1810]/30 mt-2">
              Toque em uma pilha para desfazer o grupo
            </p>
          </div>
        )}

        {/* Ungrouped photos */}
        {ungroupedPhotos.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-[#2C1810]/40 uppercase tracking-wider mb-2">
              Fotos individuais ({ungroupedPhotos.length})
            </p>
            <div className="grid grid-cols-4 gap-2">
              <AnimatePresence>
                {ungroupedPhotos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <PhotoThumbnail
                      photo={photo}
                      selected={selected.has(photo.id)}
                      onToggle={() => toggleSelect(photo.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {error && (
          <p className="text-rose-600 text-sm text-center mb-4">{error}</p>
        )}

        {ungroupedPhotos.length === 0 && photos.length === 0 && (
          <div className="text-center py-8 text-[#2C1810]/30">
            <p className="text-sm">Carregando fotos...</p>
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAF7F5]/95 backdrop-blur border-t border-[#C9607A]/10 px-4 py-4 z-40">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Group selected button */}
          <AnimatePresence>
            {selected.size >= 2 && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGroup}
                className="w-full bg-white border-2 border-[#C9607A] text-[#C9607A] py-3 rounded-full text-sm font-medium hover:bg-[#C9607A]/5 transition-all flex items-center justify-center gap-2"
              >
                <PhotoStackIcon size={16} color="#C9607A" />
                Agrupar {selected.size} fotos selecionadas na mesma página
              </motion.button>
            )}
          </AnimatePresence>

          {/* Confirm button */}
          <button
            onClick={() => handleConfirm(false)}
            disabled={saving}
            className="w-full bg-[#C9607A] text-white py-4 rounded-full text-base font-medium hover:bg-[#b54d68] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C9607A]/20 disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="animate-spin">⟳</span>
                Salvando...
              </>
            ) : (
              <>
                <SparkleIcon size={18} color="white" />
                Confirmar organização
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
