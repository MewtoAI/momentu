"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Momentu — Hero Section
// Fontes: Playfair Display (heading) + Inter (body) via Google Fonts
// Paleta: cream #FAF8F5 | rose #D4A5BB | lavender #B8AACF
// Vibe: aéreo, glassmorphism suave, orbs de luz decorativos
// ─────────────────────────────────────────────────────────────────────────────

const STARS = "★★★★★";
const SOCIAL_PROOF = "Mais de 500 álbuns criados";

const albumPages = [
  { bg: "from-rose-100 to-pink-200", label: "Amor Infinito" },
  { bg: "from-green-100 to-teal-200", label: "Nossa Família" },
  { bg: "from-purple-100 to-indigo-200", label: "Primeiro Sorriso" },
];

export default function HeroSection() {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % albumPages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 15% 20%, rgba(212,165,187,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(184,170,207,0.14) 0%, transparent 55%), #FAF8F5",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* ── Google Fonts injected via next/head in real app ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
        .font-heading { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(-6px) rotate(-0.5deg); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, -30px) scale(1.05); opacity: 0.4; }
        }
        @keyframes pageFade {
          0% { opacity: 0; transform: scale(0.96) translateY(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.18); opacity: 0; }
        }
        .float-album { animation: float 6s ease-in-out infinite; }
        .orb { animation: floatOrb 8s ease-in-out infinite; pointer-events: none; }
        .page-fade { animation: pageFade 0.5s ease-out forwards; }
      `}</style>

      {/* ── Decorative light orbs ── */}
      <div
        className="orb absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          top: "-80px",
          right: "-60px",
          background: "radial-gradient(circle, #D4A5BB 0%, transparent 70%)",
          filter: "blur(90px)",
          opacity: 0.35,
        }}
      />
      <div
        className="orb absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          bottom: "60px",
          left: "-80px",
          background: "radial-gradient(circle, #B8AACF 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.3,
          animationDelay: "3s",
        }}
      />
      <div
        className="orb absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          top: "40%",
          left: "38%",
          background: "radial-gradient(circle, #D4A5BB 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.2,
          animationDelay: "1.5s",
        }}
      />

      {/* ── Navbar ── */}
      <nav
        className="relative z-50 flex items-center justify-between px-6 py-4 md:px-12"
        style={{
          background: "rgba(250,248,245,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,165,187,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #D4A5BB, #B8AACF)" }}
          >
            <span className="text-white text-xs font-bold font-heading">M</span>
          </div>
          <span
            className="font-heading text-xl font-semibold"
            style={{ color: "#1E1B24" }}
          >
            Momentu
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="hidden md:block font-body text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            style={{ color: "#5C5670" }}
          >
            Ver modelos
          </Link>
          <Link
            href="/templates"
            className="font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
              boxShadow: "0 4px 16px rgba(212,165,187,0.35)",
            }}
          >
            Criar Álbum
          </Link>
        </div>
      </nav>

      {/* ── Hero Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-20 md:pt-20">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          
          {/* LEFT — Copy */}
          <div className="flex-1 text-center md:text-left max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.80)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,165,187,0.30)",
                  color: "#8B5A72",
                  boxShadow: "0 2px 8px rgba(212,165,187,0.12)",
                }}
              >
                <span>✨</span>
                <span>Álbum profissional em 5 minutos</span>
              </div>
            </div>

            {/* H1 */}
            <h1
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              style={{ color: "#1E1B24", lineHeight: "1.18" }}
            >
              Transforme suas fotos em{" "}
              <em
                className="font-heading not-italic"
                style={{ color: "#D4A5BB" }}
              >
                memórias
              </em>{" "}
              que duram para sempre.
            </h1>

            {/* Subtitle */}
            <p
              className="font-body text-lg md:text-xl leading-relaxed mb-8 max-w-md mx-auto md:mx-0"
              style={{ color: "#5C5670" }}
            >
              Crie álbuns de fotos profissionais para imprimir. Feito para
              casais, mães e famílias que querem preservar o que realmente
              importa.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start mb-8">
              <Link
                href="/templates"
                className="w-full sm:w-auto font-body font-semibold text-base px-8 py-4 rounded-2xl text-white transition-all hover:-translate-y-1 active:translate-y-0"
                style={{
                  background: "linear-gradient(135deg, #D4A5BB 0%, #B8AACF 100%)",
                  boxShadow: "0 6px 24px rgba(212,165,187,0.40)",
                  minWidth: "200px",
                  textAlign: "center",
                }}
              >
                Criar Meu Álbum →
              </Link>
              <Link
                href="/templates"
                className="font-body text-sm font-medium px-6 py-4 rounded-2xl transition-all hover:bg-white/60"
                style={{
                  color: "#5C5670",
                  border: "1.5px solid rgba(212,165,187,0.25)",
                }}
              >
                Ver modelos
              </Link>
            </div>

            {/* Price hint */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm"
              style={{
                background: "rgba(255,255,255,0.60)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(212,165,187,0.20)",
                color: "#5C5670",
              }}
            >
              <span
                className="font-semibold"
                style={{ color: "#6CB99A" }}
              >
                a partir de R$14,90
              </span>
              <span>·</span>
              <span
                className="line-through"
                style={{ color: "#9B94AE" }}
              >
                gráficas cobram R$80
              </span>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-2 mt-6 justify-center md:justify-start">
              <div className="flex">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white -ml-2 first:ml-0"
                    style={{
                      background: `hsl(${320 + i * 20}, 55%, 78%)`,
                    }}
                  />
                ))}
              </div>
              <span className="font-body text-sm" style={{ color: "#9B94AE" }}>
                <span style={{ color: "#E8A550" }}>{STARS}</span>{" "}
                {SOCIAL_PROOF}
              </span>
            </div>
          </div>

          {/* RIGHT — Album Mockup */}
          <div className="flex-1 flex items-center justify-center w-full max-w-lg">
            <div className="relative w-full" style={{ maxWidth: "480px" }}>
              {/* Floating album */}
              <div className="float-album relative">
                {/* Main album open spread */}
                <div
                  className="relative w-full rounded-3xl overflow-hidden"
                  style={{
                    boxShadow:
                      "0 24px 80px rgba(180,150,180,0.25), 0 8px 24px rgba(180,150,180,0.15)",
                    background: "white",
                  }}
                >
                  <div className="flex" style={{ aspectRatio: "2/1.25" }}>
                    {/* Left page */}
                    <div
                      className={`flex-1 bg-gradient-to-br ${albumPages[currentPage].bg} flex items-center justify-center relative`}
                      key={`left-${currentPage}`}
                    >
                      <div className="page-fade w-full h-full flex flex-col items-center justify-center gap-3 p-6">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-sm">
                          <span className="text-3xl md:text-4xl">📷</span>
                        </div>
                        <div className="w-24 h-2 rounded-full bg-white/50" />
                        <div className="w-16 h-1.5 rounded-full bg-white/30" />
                      </div>
                    </div>

                    {/* Center spine */}
                    <div
                      className="w-3 flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.03), rgba(0,0,0,0.08))",
                      }}
                    />

                    {/* Right page */}
                    <div
                      className="flex-1 bg-white flex flex-col items-start justify-center p-6 gap-3"
                      key={`right-${currentPage}`}
                    >
                      <div className="page-fade w-full">
                        <div
                          className="text-xs font-body font-medium mb-2"
                          style={{ color: "#D4A5BB" }}
                        >
                          {albumPages[currentPage].label}
                        </div>
                        <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 mb-3 flex items-center justify-center">
                          <span className="text-2xl">🌸</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 rounded-full bg-neutral-100 w-full" />
                          <div className="h-2 rounded-full bg-neutral-100 w-3/4" />
                          <div className="h-2 rounded-full bg-neutral-100 w-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom bar — album name */}
                  <div
                    className="px-6 py-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <span
                      className="font-heading text-sm italic"
                      style={{ color: "#5C5670" }}
                    >
                      Momentu
                    </span>
                    <div className="flex gap-1">
                      {albumPages.map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                          style={{
                            background: i === currentPage ? "#D4A5BB" : "#E8E8E8",
                            transform:
                              i === currentPage ? "scale(1.3)" : "scale(1)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating tag — PDF ready */}
                <div
                  className="absolute -top-4 -right-4 px-3 py-2 rounded-2xl font-body text-xs font-semibold flex items-center gap-1.5"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(108,185,154,0.30)",
                    boxShadow: "0 4px 20px rgba(108,185,154,0.15)",
                    color: "#3D8B6B",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#6CB99A" }}
                  />
                  PDF 300 DPI · Pronto
                </div>

                {/* Floating tag — price */}
                <div
                  className="absolute -bottom-4 -left-4 px-3 py-2 rounded-2xl font-body text-xs font-semibold flex items-center gap-1.5"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(212,165,187,0.30)",
                    boxShadow: "0 4px 20px rgba(212,165,187,0.15)",
                    color: "#8B5A72",
                  }}
                >
                  💳 R$14,90 · pague com Pix
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works strip ── */}
      <div
        className="relative z-10 w-full py-12 px-6 md:px-12"
        style={{
          background: "rgba(255,255,255,0.60)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(212,165,187,0.15)",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
            {[
              { icon: "🎨", step: "01", title: "Escolha o modelo", desc: "5 templates com temas diferentes" },
              { icon: "📸", step: "02", title: "Adicione suas fotos", desc: "Do celular ou computador" },
              { icon: "⬇️", step: "03", title: "Baixe e imprima", desc: "PDF 300 DPI pronto para gráfica" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-0 w-full md:w-auto justify-center">
                <div className="flex flex-col items-center text-center px-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3"
                    style={{
                      background: "linear-gradient(135deg, rgba(212,165,187,0.15), rgba(184,170,207,0.15))",
                      border: "1px solid rgba(212,165,187,0.20)",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    className="font-body text-xs font-semibold mb-1"
                    style={{ color: "#D4A5BB", letterSpacing: "0.1em" }}
                  >
                    PASSO {item.step}
                  </span>
                  <span
                    className="font-heading text-base font-semibold mb-1"
                    style={{ color: "#1E1B24" }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="font-body text-sm"
                    style={{ color: "#9B94AE" }}
                  >
                    {item.desc}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className="hidden md:block w-12 h-px flex-shrink-0"
                    style={{ background: "rgba(212,165,187,0.30)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
