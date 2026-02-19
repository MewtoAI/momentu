'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PIX_EXPIRY_SECONDS = 29 * 60 // 29 min
const PRICE_CENTS = 1490
const MOCK_PIX_CODE = 'momentu.pagamento.pix.exemplo.00020126580014br.gov.bcb.pix0136momentu-payment-mock000000052040000530398654051490'

interface AlbumData {
  albumId: string
  templateName: string
  templateEmoji: string
  themeLabel: string
  pageCount: number
  textContent: { title: string }
  templateId?: string
}

function useCountdown(initialSeconds: number, paused: boolean) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (paused || seconds <= 0) return
    const interval = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(interval)
  }, [seconds, paused])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const isExpiringSoon = seconds < 120
  return { formatted: `${mm}:${ss}`, isExpiringSoon, isExpired: seconds <= 0 }
}

function QRCodeGrid() {
  const rows = 21
  const cols = 21
  const pattern = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const inTL = r < 7 && c < 7
      const inTR = r < 7 && c >= cols - 7
      const inBL = r >= rows - 7 && c < 7
      if (inTL || inTR || inBL) {
        const rr = r < 7 ? r : r - (rows - 7)
        const cc = c < 7 ? c : c - (cols - 7)
        if (Math.abs(rr) === 0 || Math.abs(rr) === 6 || Math.abs(cc) === 0 || Math.abs(cc) === 6) return 1
        if (Math.abs(rr) >= 2 && Math.abs(rr) <= 4 && Math.abs(cc) >= 2 && Math.abs(cc) <= 4) return 1
        return 0
      }
      return ((r * 3 + c * 7 + r * c) % 3 === 0) ? 1 : 0
    })
  )
  return (
    <div style={{ display: 'inline-block', padding: 12, background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 7px)`, gap: 1 }}>
        {pattern.flat().map((cell, i) => (
          <div key={i} style={{ width: 7, height: 7, background: cell ? '#1A1A2E' : 'white', borderRadius: 1 }} />
        ))}
      </div>
    </div>
  )
}

export default function CheckoutPage({ params }: { params: { albumId: string } }) {
  const router = useRouter()
  const [album, setAlbum] = useState<AlbumData | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const { formatted, isExpiringSoon, isExpired } = useCountdown(PIX_EXPIRY_SECONDS, !showQR)

  useEffect(() => {
    try {
      const data = localStorage.getItem(`album-${params.albumId}`)
      if (data) setAlbum(JSON.parse(data))
    } catch { /* ignore */ }
  }, [params.albumId])

  const handleGeneratePix = useCallback(async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsLoading(false)
    setShowQR(true)
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(MOCK_PIX_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch { /* fallback */ }
  }, [])

  const handlePaymentConfirmed = useCallback(() => {
    localStorage.setItem('albumPaid', params.albumId)
    localStorage.setItem(`album-${params.albumId}-paid`, 'true')
    router.push(`/download/${params.albumId}`)
  }, [params.albumId, router])

  const priceFormatted = (PRICE_CENTS / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const albumTitle = album?.textContent?.title || 'Meu Álbum'
  const templateName = album?.templateName || 'Momentu'
  const pageCount = album?.pageCount || 10

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F5', fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <header
        style={{
          backgroundColor: 'rgba(250, 247, 245, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EDE8E6',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center">
          <Link
            href={`/preview/${params.albumId}`}
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-150"
            style={{ color: '#8C7B82' }}
          >
            <span className="text-base">←</span>
            <span>Voltar</span>
          </Link>
          <span
            className="mx-auto font-bold"
            style={{ color: '#C9607A', fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            momentu
          </span>
          <div className="w-16" />
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-screen-sm mx-auto px-4 py-6 flex flex-col gap-5">

        {/* RESUMO DO PEDIDO */}
        <section>
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#2C2125' }}>
            <span>📄</span> Resumo do Pedido
          </p>
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ border: '1px solid #EDE8E6', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(44,33,37,0.06)' }}
          >
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8C7B82' }}>Álbum</span>
                <span className="font-medium" style={{ color: '#2C2125' }}>&ldquo;{albumTitle}&rdquo;</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8C7B82' }}>Template</span>
                <span className="font-medium" style={{ color: '#2C2125' }}>{templateName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8C7B82' }}>Páginas</span>
                <span className="font-medium" style={{ color: '#2C2125' }}>{pageCount} páginas</span>
              </div>
              <div className="h-px my-1" style={{ backgroundColor: '#EDE8E6' }} />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold" style={{ color: '#2C2125' }}>Total</span>
                <span
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
                >
                  {priceFormatted}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PIX SECTION */}
        {!showQR ? (
          /* GERAR PIX */
          <section>
            <button
              onClick={handleGeneratePix}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 h-[52px] rounded-full font-semibold text-base text-white transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: isLoading ? '#A8A8A8' : '#52B788',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(82, 183, 136, 0.30)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <div className="spinner w-5 h-5 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  Gerando seu Pix...
                </>
              ) : (
                <><span>⚡</span> Pagar com Pix · R$14,90</>
              )}
            </button>
            <p className="text-center text-xs mt-3" style={{ color: '#8C7B82' }}>
              🔒 Pagamento seguro via Mercado Pago
            </p>
          </section>
        ) : isExpired ? (
          /* PIX EXPIRADO */
          <section
            className="rounded-[20px] p-5 text-center"
            style={{ backgroundColor: '#FFE5E7', border: '1px solid #E63946' }}
          >
            <p className="text-2xl mb-2">⏰</p>
            <p className="font-semibold text-sm" style={{ color: '#E63946' }}>Pix expirado</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#8C7B82' }}>O código Pix tem validade de 30 minutos.</p>
            <button
              onClick={() => { setShowQR(false) }}
              className="text-sm font-semibold px-5 py-2 rounded-full text-white"
              style={{ backgroundColor: '#C9607A' }}
            >
              Gerar novo código
            </button>
          </section>
        ) : (
          /* QR CODE ATIVO */
          <section>
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#52B788' }}>
              <span>💚</span> Pague com Pix
            </p>

            <div
              className="rounded-[20px] p-5 flex flex-col items-center gap-4"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(44,33,37,0.08)' }}
            >
              <QRCodeGrid />

              <p className="text-xs text-center leading-relaxed" style={{ color: '#8C7B82' }}>
                Escaneie o QR code com o app do seu banco
                <br />ou copie o código abaixo
              </p>

              {/* Copiar código */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-full font-semibold text-sm transition-all duration-150 active:scale-[0.98]"
                style={{
                  backgroundColor: copied ? '#D8F3DC' : 'transparent',
                  color: copied ? '#1B4332' : '#C9607A',
                  border: `1.5px solid ${copied ? '#52B788' : '#C9607A'}`,
                }}
              >
                {copied ? <><span>✓</span> Copiado!</> : <><span>📋</span> Copiar código Pix</>}
              </button>

              {/* Countdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm">⏱</span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: isExpiringSoon ? '#F4A261' : '#8C7B82' }}
                >
                  Expira em {formatted}
                </span>
                {isExpiringSoon && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: '#FEF3E2', color: '#9C4A12' }}
                  >
                    Urgente
                  </span>
                )}
              </div>
            </div>

            {/* Waiting indicator */}
            <div
              className="rounded-[20px] p-4 flex items-center gap-3 mt-3"
              style={{ backgroundColor: '#F7E8EC' }}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-3 h-3 rounded-full animate-ping absolute"
                  style={{ backgroundColor: '#C9607A', opacity: 0.4 }}
                />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C9607A' }} />
              </div>
              <p className="text-sm" style={{ color: '#A8485F' }}>
                Aguardando confirmação do pagamento...
              </p>
            </div>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-sm">🔒</span>
              <p className="text-xs" style={{ color: '#8C7B82' }}>
                Pagamento seguro via{' '}
                <span className="font-semibold" style={{ color: '#009EE3' }}>Mercado Pago</span>
              </p>
            </div>

            {/* MVP test button */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #EDE8E6' }}>
              <p className="text-xs text-center mb-3" style={{ color: '#8C7B82' }}>
                🧪 Modo MVP — Teste a confirmação:
              </p>
              <button
                onClick={handlePaymentConfirmed}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] font-semibold text-sm transition-all"
                style={{ backgroundColor: '#D8F3DC', color: '#1B4332', border: '1.5px solid #52B788' }}
              >
                ✓ Já paguei (Confirmar MVP)
              </button>
            </div>
          </section>
        )}

        {/* INFO PILLS */}
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: '⚡', text: 'Pix aprovado em segundos' },
            { icon: '📦', text: 'Download imediato' },
            { icon: '📅', text: '30 dias disponível' },
          ].map(item => (
            <div
              key={item.text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#FFFFFF', color: '#8C7B82', border: '1px solid #EDE8E6' }}
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
