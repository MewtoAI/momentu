"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Momentu — Checkout Pix
// Layout: resumo à esquerda + QR Code à direita (desktop)
// Mobile: stack vertical
// Preço: R$14,90 com âncora R$80 riscado
// Timer: 15 minutos de expiração do Pix
// 3 passos visuais de instrução
// ─────────────────────────────────────────────────────────────────────────────

const PIX_EXPIRY_MINUTES = 15;
const PRICE_REAL = 14.9;
const PRICE_ANCHOR = 80;
const DISCOUNT_PCT = Math.round(((PRICE_ANCHOR - PRICE_REAL) / PRICE_ANCHOR) * 100);

type CheckoutStep = "summary" | "qrcode" | "confirmed";

const MOCK_PIX_CODE =
  "00020126330014BR.GOV.BCB.PIX0111momentu00000520400005303986540514.905802BR5913Momentu App6009SAO PAULO62070503***6304ABCD";

interface AlbumSummary {
  templateName: string;
  templateEmoji: string;
  themeLabel: string;
  pageCount: number;
}

const ALBUM: AlbumSummary = {
  templateName: "Amor Infinito",
  templateEmoji: "💕",
  themeLabel: "Casal",
  pageCount: 10,
};

// CheckIcon reserved for future use
// function CheckIcon({ size = 20, color = "#6CB99A" }: { size?: number; color?: string }) { ... }

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function QRCodePlaceholder() {
  // Simulated QR code using a grid pattern
  const rows = 21;
  const cols = 21;
  // Deterministic pattern for visual demo
  const pattern = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      // Corners (finder patterns)
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= cols - 7;
      const inBottomLeft = r >= rows - 7 && c < 7;
      if (inTopLeft || inTopRight || inBottomLeft) {
        const rr = r < 7 ? r : r - (rows - 7);
        const cc = c < 7 ? c : c - (cols - 7);
        const ar = Math.abs(rr), ac = Math.abs(cc);
        if (ar === 0 || ar === 6 || ac === 0 || ac === 6) return 1;
        if (ar >= 2 && ar <= 4 && ac >= 2 && ac <= 4) return 1;
        return 0;
      }
      // Data (pseudo-random but deterministic)
      return ((r * 3 + c * 7 + r * c) % 3 === 0) ? 1 : 0;
    })
  );

  return (
    <div
      style={{
        display: "inline-block",
        padding: 16,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 8px)`,
          gap: 1,
        }}
      >
        {pattern.flat().map((cell, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              background: cell ? "#1E1B24" : "white",
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Timer({ initialSeconds, onExpire }: { initialSeconds: number; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onExpire]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = (seconds / initialSeconds) * 100;
  const isUrgent = seconds < 60;

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 99,
          background: isUrgent ? "rgba(232,165,80,0.12)" : "rgba(108,185,154,0.10)",
          border: `1px solid ${isUrgent ? "rgba(232,165,80,0.30)" : "rgba(108,185,154,0.25)"}`,
          marginBottom: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke={isUrgent ? "#E8A550" : "#6CB99A"} strokeWidth="1.5" fill="none" />
          <path d="M7 4v3l2 1.5" stroke={isUrgent ? "#E8A550" : "#6CB99A"} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: isUrgent ? "#E8A550" : "#5C5670",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
        <span style={{ fontSize: 12, color: "#9B94AE" }}>
          {isUrgent ? "⚠️ Expirando!" : "para expirar"}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 3,
          borderRadius: 99,
          background: "#E8E8E8",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 99,
            background: isUrgent
              ? "linear-gradient(90deg, #E8A550, #D4696A)"
              : "linear-gradient(90deg, #6CB99A, #4DA885)",
            transition: "width 1s linear",
          }}
        />
      </div>
    </div>
  );
}

export default function CheckoutPix({ albumId = "demo" }: { albumId?: string }) {
  const [step, setStep] = useState<CheckoutStep>("summary");
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePix = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setStep("qrcode");
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(MOCK_PIX_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, []);

  const handleExpire = useCallback(() => {
    setIsExpired(true);
  }, []);

  const handleNewCode = useCallback(() => {
    setIsExpired(false);
    setStep("qrcode");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 80% 20%, rgba(212,165,187,0.10) 0%, transparent 50%), #FAF8F5",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        .spinner { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          background: "rgba(250,248,245,0.80)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,165,187,0.15)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <Link
          href={`/criar/${ALBUM.templateName.toLowerCase().replace(/ /g, "-")}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            color: "#5C5670",
            textDecoration: "none",
          }}
        >
          ← Voltar
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#6CB99A",
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L2 4v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5V4L7 1z" fill="none" stroke="#6CB99A" strokeWidth="1.5" />
            <path d="M4.5 7l2 2 3-3" stroke="#6CB99A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Pagamento seguro
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Progress steps */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          {[
            { label: "Template", done: true },
            { label: "Fotos", done: true },
            { label: "Personalizar", done: true },
            { label: "Pagar", done: false, active: true },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: s.done
                      ? "linear-gradient(135deg, #D4A5BB, #B8AACF)"
                      : s.active
                      ? "white"
                      : "#E8E8E8",
                    border: s.active ? "2px solid #D4A5BB" : "none",
                    fontSize: 12,
                    fontWeight: 700,
                    color: s.done ? "white" : s.active ? "#D4A5BB" : "#A8A8A8",
                    boxShadow: s.active ? "0 0 0 4px rgba(212,165,187,0.15)" : undefined,
                  }}
                >
                  {s.done ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: s.active ? 600 : 400,
                    color: s.active ? "#D4A5BB" : s.done ? "#5C5670" : "#A8A8A8",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < 3 && (
                <div
                  style={{
                    width: 40,
                    height: 1.5,
                    background: i < 3 ? "rgba(212,165,187,0.30)" : "#E8E8E8",
                    margin: "0 4px",
                    marginBottom: 20,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
          className="checkout-grid"
        >
          <style>{`
            @media (max-width: 640px) {
              .checkout-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          {/* ── LEFT: Album Summary ── */}
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 4px 20px rgba(180,150,180,0.10)",
              border: "1px solid rgba(212,165,187,0.12)",
              height: "fit-content",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#1E1B24",
                marginBottom: 20,
              }}
            >
              Seu álbum
            </h2>

            {/* Album thumbnail placeholder */}
            <div
              style={{
                width: "100%",
                aspectRatio: "4/3",
                borderRadius: 16,
                background: "linear-gradient(135deg, #FFF0F3, #FFD6E0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                fontSize: 48,
              }}
            >
              {ALBUM.templateEmoji}
            </div>

            {/* Template info */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#D4A5BB",
                  background: "rgba(212,165,187,0.12)",
                  padding: "4px 10px",
                  borderRadius: 99,
                  marginBottom: 6,
                  letterSpacing: "0.06em",
                }}
              >
                {ALBUM.themeLabel.toUpperCase()}
              </div>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#1E1B24",
                  marginBottom: 4,
                }}
              >
                {ALBUM.templateName}
              </p>
              <p style={{ fontSize: 13, color: "#9B94AE" }}>
                {ALBUM.pageCount} páginas
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(212,165,187,0.15)", marginBottom: 16 }} />

            {/* Includes */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "#5C5670", marginBottom: 10, letterSpacing: "0.06em" }}>
              INCLUSO NO SEU PEDIDO
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "📄", text: "PDF em alta resolução (300 DPI)" },
                { icon: "🖼️", text: "JPG por página (Stories & WhatsApp)" },
                { icon: "⬇️", text: "Download disponível por 30 dias" },
                { icon: "⚡", text: "Pagamento por Pix — instantâneo" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: "#5C5670" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Payment ── */}
          <div>
            {/* Price tag */}
            <div
              style={{
                background: "white",
                borderRadius: 24,
                padding: 24,
                marginBottom: 16,
                boxShadow: "0 4px 20px rgba(180,150,180,0.10)",
                border: "1px solid rgba(212,165,187,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, color: "#9B94AE" }}>
                  Gráficas cobram:
                </span>
                <span
                  style={{
                    fontSize: 16,
                    color: "#9B94AE",
                    textDecoration: "line-through",
                    fontWeight: 500,
                  }}
                >
                  R${PRICE_ANCHOR.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div
                style={{
                  background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                    SEU PREÇO
                  </p>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 36,
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1,
                    }}
                  >
                    R${PRICE_REAL.toFixed(2).replace(".", ",")}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.80)", marginTop: 2 }}>
                    por álbum completo
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.20)",
                    borderRadius: 12,
                    padding: "8px 12px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
                    -{DISCOUNT_PCT}%
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.80)" }}>
                    desconto
                  </p>
                </div>
              </div>

              <p
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "#6CB99A",
                  fontWeight: 500,
                }}
              >
                ✓ Você economiza R${(PRICE_ANCHOR - PRICE_REAL).toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* ── STEP: Generate Pix ── */}
            {step === "summary" && (
              <div className="fade-in">
                <button
                  onClick={handleGeneratePix}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    borderRadius: 16,
                    background: isLoading
                      ? "rgba(108,185,154,0.40)"
                      : "linear-gradient(135deg, #6CB99A, #4DA885)",
                    color: "white",
                    fontSize: 16,
                    fontWeight: 700,
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 20px rgba(108,185,154,0.30)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    transition: "all 0.2s ease",
                  }}
                >
                  {isLoading ? (
                    <>
                      <div
                        className="spinner"
                        style={{
                          width: 20,
                          height: 20,
                          border: "2.5px solid rgba(255,255,255,0.40)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                        }}
                      />
                      Gerando seu Pix...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 20 }}>⚡</span>
                      Pagar com Pix · R$14,90
                    </>
                  )}
                </button>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: "#9B94AE",
                    marginTop: 12,
                  }}
                >
                  🔒 Pagamento processado com segurança via Mercado Pago
                </p>
              </div>
            )}

            {/* ── STEP: QR Code ── */}
            {step === "qrcode" && !isExpired && (
              <div className="fade-in">
                <div
                  style={{
                    background: "white",
                    borderRadius: 24,
                    padding: 24,
                    boxShadow: "0 4px 20px rgba(180,150,180,0.10)",
                    border: "1px solid rgba(212,165,187,0.12)",
                    textAlign: "center",
                  }}
                >
                  {/* Timer */}
                  <div style={{ marginBottom: 20 }}>
                    <Timer
                      initialSeconds={PIX_EXPIRY_MINUTES * 60}
                      onExpire={handleExpire}
                    />
                  </div>

                  {/* QR Code */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                    <QRCodePlaceholder />
                  </div>

                  {/* Pix code */}
                  <div
                    style={{
                      background: "#FAF8F5",
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid rgba(212,165,187,0.15)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        color: "#9B94AE",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      {MOCK_PIX_CODE.slice(0, 40)}...
                    </p>
                    <button
                      onClick={handleCopy}
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        background: copied
                          ? "rgba(108,185,154,0.15)"
                          : "linear-gradient(135deg, #D4A5BB, #B8AACF)",
                        color: copied ? "#6CB99A" : "white",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {copied ? (
                        <>✓ Copiado!</>
                      ) : (
                        <>
                          <CopyIcon size={14} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(212,165,187,0.15)", marginBottom: 16 }} />

                  {/* 3 steps */}
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#9B94AE", marginBottom: 12, letterSpacing: "0.06em" }}>
                    COMO PAGAR
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                    {[
                      { step: "1", text: "Abra o app do seu banco" },
                      { step: "2", text: "Escaneie o QR Code ou cole o código Pix" },
                      { step: "3", text: "Confirme o pagamento de R$14,90" },
                    ].map((item) => (
                      <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          {item.step}
                        </div>
                        <p style={{ fontSize: 13, color: "#5C5670", paddingTop: 4 }}>{item.text}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 12, color: "#9B94AE" }}>
                      ⏳ Aguardando confirmação do pagamento...
                    </p>
                    <p style={{ fontSize: 11, color: "#B8AACF", marginTop: 4 }}>
                      Assim que confirmado, seu álbum começará a ser preparado!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP: Expired ── */}
            {isExpired && (
              <div
                className="fade-in"
                style={{
                  background: "white",
                  borderRadius: 24,
                  padding: 28,
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(180,150,180,0.10)",
                  border: "1px solid rgba(232,165,80,0.20)",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1E1B24",
                    marginBottom: 8,
                  }}
                >
                  Código Pix expirado
                </p>
                <p style={{ fontSize: 13, color: "#9B94AE", marginBottom: 20 }}>
                  O código Pix expirou após {PIX_EXPIRY_MINUTES} minutos. Gere um novo código para continuar.
                </p>
                <button
                  onClick={handleNewCode}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(212,165,187,0.30)",
                  }}
                >
                  Gerar novo código Pix
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
