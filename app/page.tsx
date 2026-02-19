'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TemplateCardProps {
  slug: string
  name: string
  theme: string
  pages: number
  gradient: string
  accentBg: string
  icon: string
  price: string
}

function TemplateCard({ slug, name, theme, pages, gradient, accentBg, icon, price }: TemplateCardProps) {
  return (
    <Link
      href={`/criar/${slug}`}
      className="flex-shrink-0 w-[220px] rounded-[20px] overflow-hidden block transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 4px 12px rgba(44,33,37,0.08)', textDecoration: 'none' }}
    >
      <div
        className="h-[140px] w-full relative flex items-center justify-center"
        style={{ background: gradient }}
      >
        <span className="text-5xl">{icon}</span>
        <span
          className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.20)', color: '#FFFFFF' }}
        >
          {pages} páginas
        </span>
      </div>
      <div className="p-4" style={{ backgroundColor: accentBg }}>
        <h3
          className="font-bold text-base leading-tight mb-0.5"
          style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
        >
          {name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: '#8C7B82' }}>{theme}</span>
          <span className="text-sm font-bold" style={{ color: '#C9607A' }}>{price}</span>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const templates: TemplateCardProps[] = [
    {
      slug: 'amor-infinito',
      name: 'Amor Infinito',
      theme: 'Casal',
      pages: 10,
      gradient: 'linear-gradient(135deg, #C9184A 0%, #FF758F 100%)',
      accentBg: '#FFF0F3',
      icon: '❤️',
      price: 'R$14,90',
    },
    {
      slug: 'primeiro-sorriso',
      name: 'Primeiro Sorriso',
      theme: 'Bebê',
      pages: 12,
      gradient: 'linear-gradient(135deg, #B5D8CC 0%, #F9C9D4 100%)',
      accentBg: '#FEF9EF',
      icon: '🍼',
      price: 'R$14,90',
    },
    {
      slug: 'nossa-familia',
      name: 'Nossa Família',
      theme: 'Família',
      pages: 10,
      gradient: 'linear-gradient(135deg, #E07A5F 0%, #F2CC8F 100%)',
      accentBg: '#F4F1DE',
      icon: '🏡',
      price: 'R$14,90',
    },
  ]

  return (
    <div style={{ backgroundColor: '#FAF7F5', fontFamily: 'Inter, sans-serif' }} className="min-h-screen">
      {/* ── Sticky Header ── */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(250, 247, 245, 0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #EDE8E6' : 'none',
        }}
      >
        <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold"
            style={{ color: '#C9607A', fontFamily: 'Playfair Display, Georgia, serif', textDecoration: 'none' }}
          >
            momentu
          </Link>
          <Link
            href="/templates"
            className="px-5 py-2 text-sm font-medium transition-all hover:opacity-80"
            style={{ color: '#C9607A', border: '1.5px solid #C9607A', borderRadius: '9999px', textDecoration: 'none' }}
          >
            Ver Templates
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="max-w-screen-sm mx-auto px-4 pt-12 pb-16">
        {/* New badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{ backgroundColor: '#F7E8EC', color: '#A8485F' }}
        >
          <span>✨</span>
          <span>Novo: 5 templates exclusivos disponíveis</span>
        </div>

        {/* Main Heading */}
        <h1
          className="font-bold text-[2.25rem] leading-[1.2] mb-5"
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            background: 'linear-gradient(135deg, #C9607A 0%, #A8485F 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Crie Álbuns de Fotos<br />
          Que Duram Para Sempre 🤍
        </h1>

        {/* Subheading */}
        <div className="space-y-1.5 mb-8">
          <p className="text-[1.0625rem] leading-relaxed" style={{ color: '#8C7B82' }}>
            Transforme suas fotos em álbuns digitais impressos em minutos.
          </p>
          <p className="text-[1.0625rem] font-semibold" style={{ color: '#C9607A' }}>
            A partir de R$14,90.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/templates"
          className="w-full flex items-center justify-center gap-2 py-4 text-white font-semibold text-base mb-5 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: '#C9607A',
            borderRadius: '9999px',
            boxShadow: '0 4px 16px rgba(201, 96, 122, 0.30)',
            textDecoration: 'none',
          }}
        >
          Criar Meu Álbum →
        </Link>

        {/* Social Proof */}
        <div className="flex items-center gap-2 text-sm mb-10" style={{ color: '#8C7B82' }}>
          <span style={{ color: '#C9607A' }}>✦</span>
          <span>500+ álbuns criados com amor</span>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6" style={{ color: '#8C7B82' }}>
          <div className="h-px flex-1" style={{ backgroundColor: '#EDE8E6' }} />
          <span className="text-xs font-medium whitespace-nowrap">Templates populares</span>
          <div className="h-px flex-1" style={{ backgroundColor: '#EDE8E6' }} />
        </div>

        {/* Template Cards — Horizontal Scroll */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 pb-3" style={{ width: 'max-content' }}>
            {templates.map(t => (
              <TemplateCard key={t.slug} {...t} />
            ))}
          </div>
        </div>

        {/* Ver todos link */}
        <div className="text-center mt-5">
          <Link
            href="/templates"
            className="text-sm font-semibold transition-colors"
            style={{ color: '#C9607A', textDecoration: 'none' }}
          >
            Ver todos os templates →
          </Link>
        </div>
      </main>

      {/* ── How it works ── */}
      <section className="py-10 px-4" style={{ backgroundColor: '#F7E8EC' }}>
        <div className="max-w-screen-sm mx-auto">
          <h2
            className="text-center text-xl font-bold mb-6"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
          >
            Em 3 passos simples
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { icon: '🖼️', title: 'Escolha o template', desc: '5 temas para cada momento especial.' },
              { icon: '📸', title: 'Adicione suas fotos', desc: 'Upload direto do celular. JPEG, PNG ou HEIC.' },
              { icon: '⬇️', title: 'Pague e baixe', desc: 'Pix instantâneo. PDF pronto para imprimir.' },
            ].map(item => (
              <div
                key={item.title}
                className="flex items-start gap-4 bg-white rounded-[20px] p-4"
                style={{ boxShadow: '0 1px 3px rgba(44,33,37,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: '#FAF7F5' }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#2C2125' }}>{item.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#8C7B82' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-12 px-4">
        <div className="max-w-screen-sm mx-auto">
          <h2
            className="text-center text-2xl font-bold mb-2"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
          >
            Preço único. Sem surpresas.
          </h2>
          <p className="text-center text-sm mb-8" style={{ color: '#8C7B82' }}>
            Pague uma vez, baixe para sempre (30 dias).
          </p>

          <div
            className="rounded-[20px] p-6"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(44,33,37,0.08)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: '#8C7B82' }}>Gráficas cobram</span>
              <span className="text-lg line-through" style={{ color: '#8C7B82' }}>R$80 – R$200</span>
            </div>
            <div
              className="rounded-[16px] p-5 mb-4 text-center"
              style={{ background: 'linear-gradient(135deg, #C9607A 0%, #A8485F 100%)' }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>SEU PREÇO NO MOMENTU</p>
              <p
                className="text-5xl font-bold text-white leading-none mb-1"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                R$14,90
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>por álbum completo</p>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: '📄', text: 'PDF 300 DPI — perfeito para impressão' },
                { icon: '🖼️', text: 'JPG por página — para Stories e WhatsApp' },
                { icon: '⬇️', text: 'Download disponível por 30 dias' },
                { icon: '⚡', text: 'Pix instantâneo, álbum pronto em minutos' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm" style={{ color: '#8C7B82' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-10 px-4" style={{ backgroundColor: '#F7E8EC' }}>
        <div className="max-w-screen-sm mx-auto">
          <h2
            className="text-center text-xl font-bold mb-6"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
          >
            Quem criou, amou 💕
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { name: 'Ana Lima', avatar: '💕', stars: 5, text: 'Fiz para meu namorado de aniversário. Ficou lindo demais!', theme: 'Casal' },
              { name: 'Camila Rocha', avatar: '👶', stars: 5, text: 'Imprimi o álbum do primeiro ano do meu filho. A qualidade é incrível!', theme: 'Bebê' },
            ].map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] p-4"
                style={{ boxShadow: '0 1px 3px rgba(44,33,37,0.06)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ background: 'linear-gradient(135deg, #F7E8EC, #E8E4F0)' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#2C2125' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#8C7B82' }}>Template {t.theme}</p>
                  </div>
                  <span className="ml-auto text-sm" style={{ color: '#F4A261' }}>{'★'.repeat(t.stars)}</span>
                </div>
                <p className="text-sm italic" style={{ color: '#8C7B82' }}>&quot;{t.text}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-screen-sm mx-auto">
          <p
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2C2125' }}
          >
            Pronta para começar?
          </p>
          <p className="text-sm mb-6" style={{ color: '#8C7B82' }}>
            Seu álbum fica pronto em menos de 10 minutos.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full text-white font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: '#C9607A',
              boxShadow: '0 4px 16px rgba(201, 96, 122, 0.25)',
              textDecoration: 'none',
            }}
          >
            Criar Meu Álbum Agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center" style={{ backgroundColor: '#2C2125' }}>
        <div className="max-w-screen-sm mx-auto">
          <p className="text-lg font-bold mb-1"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#C9607A' }}>
            momentu
          </p>
          <p className="text-xs mb-4" style={{ color: '#8C7B82' }}>
            Transforme suas fotos em memórias que duram para sempre.
          </p>
          <div className="flex gap-6 justify-center mb-4">
            <Link href="/templates" className="text-xs" style={{ color: '#8C7B82', textDecoration: 'none' }}>Templates</Link>
            <Link href="/" className="text-xs" style={{ color: '#8C7B82', textDecoration: 'none' }}>Como funciona</Link>
          </div>
          <p className="text-xs" style={{ color: '#5C5670' }}>© 2026 Momentu · Feito com ❤️</p>
        </div>
      </footer>
    </div>
  )
}
