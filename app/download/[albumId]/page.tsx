'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface AlbumData {
  albumId: string
  templateId: string
  templateName: string
  templateEmoji: string
  themeLabel: string
  pageCount: number
  photos: string[]
  textContent: {
    title: string
    subtitle: string
    date: string
    message: string
  }
  pages?: PageState[]
  templateColor?: string
  templateColor2?: string
}

interface PhotoSlot {
  x: number
  y: number
  width: number
  height: number
  url: string | null
}

interface TextSlot {
  id: string
  text: string
}

interface PageState {
  type: string
  bg: string
  bgGradient?: [string, string]
  photoSlots: PhotoSlot[]
  textSlots: TextSlot[]
}

const TEMPLATE_GRADIENTS: Record<string, { from: string; to: string; icon: string }> = {
  'amor-infinito': { from: '#C9184A', to: '#FF758F', icon: '❤️' },
  'primeiro-sorriso': { from: '#B5D8CC', to: '#F9C9D4', icon: '🍼' },
  'nossa-familia': { from: '#E07A5F', to: '#F2CC8F', icon: '🏡' },
  'instante': { from: '#1A1A2E', to: '#4A4A6E', icon: '🖤' },
  'mundo-afora': { from: '#2D6A4F', to: '#74C69D', icon: '🌿' },
}

const LOADING_MESSAGES = [
  'Criando seu álbum com carinho... 💕',
  'Organizando cada memória no lugar certo...',
  'Montando as páginas do seu álbum...',
  'Aplicando os detalhes finais...',
  'Quase lá! Seu álbum ficou lindo!',
  'Preparando seu arquivo para download...',
]

export default function DownloadPage({ params }: { params: { albumId: string } }) {
  const [album, setAlbum] = useState<AlbumData | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [pdfDownloading, setPdfDownloading] = useState(false)
  const [sharecopied, setShareCopied] = useState(false)

  useEffect(() => {
    try {
      const data = localStorage.getItem(`album-${params.albumId}`)
      if (data) setAlbum(JSON.parse(data))
      const paid = localStorage.getItem('albumPaid') === params.albumId
        || localStorage.getItem(`album-${params.albumId}-paid`) === 'true'
      setIsPaid(paid)
    } catch { /* ignore */ }
    setIsLoading(false)
  }, [params.albumId])

  useEffect(() => {
    if (isPaid && !isReady) {
      setIsGenerating(true)
      const interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length)
      }, 2000)
      const timeout = setTimeout(() => {
        clearInterval(interval)
        setIsGenerating(false)
        setIsReady(true)
      }, 6000)
      return () => { clearInterval(interval); clearTimeout(timeout) }
    }
  }, [isPaid, isReady])

  const handleDownloadPDF = useCallback(async () => {
    if (pdfDownloading || !album) return
    setPdfDownloading(true)
    try {
      const payload = {
        albumId: params.albumId,
        title: album.textContent?.title || 'Meu Álbum',
        subtitle: album.textContent?.subtitle || '',
        pageCount: album.pageCount || 8,
        templateId: album.templateId,
        templateColor: album.templateColor || '#C9607A',
        templateColor2: album.templateColor2 || '#A8485F',
        pages: album.pages || null,
        photos: album.photos || [],
      }
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${album.textContent?.title || 'album'}-momentu.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Erro ao gerar PDF. Tente novamente.')
      }
    } catch {
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setPdfDownloading(false)
    }
  }, [params.albumId, album, pdfDownloading])

  const handleDownloadJPGs = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080)
    grad.addColorStop(0, '#FAF7F5')
    grad.addColorStop(1, '#F7E8EC')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1080)
    ctx.fillStyle = '#2C2125'
    ctx.font = 'bold 72px serif'
    ctx.textAlign = 'center'
    ctx.fillText(album?.textContent?.title || 'Meu Álbum', 540, 480)
    ctx.fillStyle = '#C9607A'
    ctx.font = '400 36px serif'
    ctx.fillText('momentu', 540, 560)
    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${album?.textContent?.title || 'album'}-capa.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [album])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `Álbum "${album?.textContent?.title}" - Momentu`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 3000)
      }
    } catch { /* ignore */ }
  }, [album])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F5' }}>
        <div className="spinner w-10 h-10 rounded-full" style={{ border: '3px solid #EDE8E6', borderTopColor: '#C9607A' }} />
      </div>
    )
  }

  if (!isPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAF7F5' }}>
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}>
            Pagamento não encontrado
          </h2>
          <p className="text-sm mb-6" style={{ color: '#8C7B82' }}>
            Complete o pagamento para acessar o download.
          </p>
          <Link
            href={`/checkout/${params.albumId}`}
            className="inline-flex items-center justify-center h-11 px-6 rounded-full text-white font-semibold text-sm"
            style={{ backgroundColor: '#C9607A', boxShadow: '0 4px 16px rgba(201,96,122,0.25)' }}
          >
            Ir para pagamento →
          </Link>
        </div>
      </div>
    )
  }

  const tg = TEMPLATE_GRADIENTS[album?.templateId || ''] || { from: '#C9607A', to: '#A8485F', icon: '📷' }
  const albumTitle = album?.textContent?.title || 'Meu Álbum'
  const templateName = album?.templateName || 'Momentu'
  const pageCount = album?.pageCount || 8

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF7F5', fontFamily: 'Inter, sans-serif' }}>
      <main className="max-w-screen-sm mx-auto w-full px-4 py-10 flex flex-col gap-6 flex-1">

        {/* GENERATING STATE */}
        {isGenerating && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-14 h-14 rounded-full border-4 spinner"
              style={{ borderColor: '#EDE8E6', borderTopColor: '#C9607A' }}
            />
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#2C2125' }}>Preparando seus arquivos...</p>
              <p className="text-sm mt-1 min-h-[20px]" style={{ color: '#C9607A' }}>
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {[
                { done: true, text: '✓ Pagamento confirmado' },
                { done: true, text: '✓ Processando páginas...' },
                { done: false, text: '⏳ Gerando PDF em alta qualidade...' },
                { done: false, text: '⏳ Comprimindo arquivos...' },
              ].map(step => (
                <div key={step.text} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: step.done ? '#52B788' : '#D4CCCB' }} />
                  <p className="text-xs" style={{ color: step.done ? '#52B788' : '#8C7B82', fontWeight: step.done ? 600 : 400 }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* READY STATE */}
        {isReady && (
          <>
            {/* Celebration header */}
            <section className="text-center pt-4">
              <div className="text-5xl mb-4 bounce-gentle">🎉</div>
              <h1
                className="text-[1.875rem] font-bold leading-tight"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
              >
                Seu álbum está pronto!
              </h1>
              <p className="text-base mt-2 leading-relaxed" style={{ color: '#8C7B82' }}>
                Download disponível por 30 dias ❤️
              </p>
              <div className="flex justify-center gap-2 mt-3 text-lg">
                {'🌸✨🎊💫🎈'.split('').map((char, i) => (
                  <span key={i}>{char}</span>
                ))}
              </div>
            </section>

            {/* Album preview */}
            <div
              className="flex items-center gap-4 rounded-[20px] overflow-hidden bg-white"
              style={{ boxShadow: '0 4px 12px rgba(44,33,37,0.08)' }}
            >
              <div
                className="w-24 h-24 flex-shrink-0 flex items-center justify-center text-4xl"
                style={{ background: `linear-gradient(135deg, ${tg.from} 0%, ${tg.to} 100%)` }}
              >
                {tg.icon}
              </div>
              <div className="flex-1 py-3 pr-4">
                <p
                  className="font-bold text-sm leading-tight"
                  style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
                >
                  &ldquo;{albumTitle}&rdquo;
                </p>
                <p className="text-xs mt-1" style={{ color: '#8C7B82' }}>
                  {pageCount} páginas · {templateName}
                </p>
                <div
                  className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}
                >
                  <span>✓</span> Pronto para download
                </div>
              </div>
            </div>

            {/* Download buttons */}
            <section className="flex flex-col gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfDownloading}
                className="w-full flex items-center justify-center gap-2 h-[52px] rounded-full font-semibold text-[1.0625rem] text-white transition-all duration-150 active:scale-[0.98]"
                style={{
                  backgroundColor: pdfDownloading ? '#A8A8A8' : '#C9607A',
                  boxShadow: pdfDownloading ? 'none' : '0 4px 16px rgba(201, 96, 122, 0.30)',
                  cursor: pdfDownloading ? 'not-allowed' : 'pointer',
                }}
              >
                {pdfDownloading ? (
                  <><div className="spinner w-5 h-5 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Gerando PDF...</>
                ) : (
                  <><span>⬇</span><span>Baixar PDF</span></>
                )}
              </button>

              <button
                onClick={handleDownloadJPGs}
                className="w-full flex items-center justify-center gap-2 h-[52px] rounded-full font-semibold text-[1.0625rem] transition-all duration-150 active:scale-[0.98]"
                style={{ backgroundColor: 'transparent', color: '#C9607A', border: '1.5px solid #C9607A' }}
              >
                <span>📸</span><span>Baixar JPGs</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 h-[52px] rounded-full font-semibold text-[1.0625rem] transition-all duration-150 active:scale-[0.98]"
                style={{ backgroundColor: 'transparent', color: '#2C2125', border: '1.5px solid #D4CCCB' }}
              >
                <span>{sharecopied ? '✓' : '🔗'}</span>
                <span>{sharecopied ? 'Link copiado!' : 'Compartilhar Link'}</span>
              </button>
            </section>

            {/* Divider */}
            <div className="h-px" style={{ backgroundColor: '#EDE8E6' }} />

            {/* Expiry warning */}
            <div
              className="rounded-[20px] p-4 flex items-start gap-3"
              style={{ backgroundColor: '#FEF3E2', border: '1px solid #F4A261' }}
            >
              <span className="text-lg flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#9C4A12' }}>Salve seus arquivos agora!</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#8C7B82' }}>
                  Seu álbum fica disponível por 30 dias. Após isso, os arquivos são removidos automaticamente.
                </p>
              </div>
            </div>

            {/* Quality badges */}
            <div className="flex gap-3 justify-center flex-wrap">
              {[
                { icon: '🖨️', text: 'PDF 300 DPI' },
                { icon: '📐', text: 'Formato 20×20cm' },
                { icon: '🎨', text: 'Pronto para gráfica' },
              ].map(item => (
                <div
                  key={item.text}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#FFFFFF', color: '#8C7B82', border: '1px solid #EDE8E6' }}
                >
                  <span>{item.icon}</span><span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA bottom */}
            <div className="text-center pb-6">
              <p className="text-sm mb-3" style={{ color: '#8C7B82' }}>
                Gostou? Crie outro álbum para presentear! 🎁
              </p>
              <Link
                href="/templates"
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: '#C9607A' }}
              >
                Criar novo álbum →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
