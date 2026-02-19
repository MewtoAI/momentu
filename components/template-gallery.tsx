"use client";

import { useState } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Momentu — Template Gallery
// Grid responsivo: 2 cols mobile → 3 cols desktop
// Cards com hover overlay suave e botão "Usar este modelo"
// Filtros por tema: pills com estado ativo
// ─────────────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  slug: string;
  name: string;
  theme: string;
  themeLabel: string;
  pageCount: number;
  rating: number;
  ratingCount: number;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  badge?: string;
}

const TEMPLATES: Template[] = [
  {
    id: "1",
    slug: "amor-infinito",
    name: "Amor Infinito",
    theme: "casal",
    themeLabel: "Casal",
    pageCount: 10,
    rating: 4.9,
    ratingCount: 213,
    emoji: "💕",
    gradientFrom: "#FFF0F3",
    gradientTo: "#FFD6E0",
    accentColor: "#C9184A",
    badge: "Mais popular",
  },
  {
    id: "2",
    slug: "primeiro-sorriso",
    name: "Primeiro Sorriso",
    theme: "bebe",
    themeLabel: "Bebê",
    pageCount: 12,
    rating: 5.0,
    ratingCount: 178,
    emoji: "👶",
    gradientFrom: "#F0FBF7",
    gradientTo: "#C8EBE0",
    accentColor: "#B5D8CC",
    badge: "Novo",
  },
  {
    id: "3",
    slug: "nossa-familia",
    name: "Nossa Família",
    theme: "familia",
    themeLabel: "Família",
    pageCount: 10,
    rating: 4.8,
    ratingCount: 134,
    emoji: "🏡",
    gradientFrom: "#FEF9EF",
    gradientTo: "#FDEBD0",
    accentColor: "#E07A5F",
  },
  {
    id: "4",
    slug: "instante",
    name: "Instante",
    theme: "minimalista",
    themeLabel: "Minimalista",
    pageCount: 8,
    rating: 4.7,
    ratingCount: 92,
    emoji: "🎞️",
    gradientFrom: "#F8F8F8",
    gradientTo: "#E8E8E8",
    accentColor: "#1A1A2E",
  },
  {
    id: "5",
    slug: "mundo-afora",
    name: "Mundo Afora",
    theme: "viagem",
    themeLabel: "Viagem",
    pageCount: 12,
    rating: 4.9,
    ratingCount: 156,
    emoji: "🌍",
    gradientFrom: "#E8F5EE",
    gradientTo: "#C5E6D4",
    accentColor: "#2D6A4F",
  },
];

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "casal", label: "Casal" },
  { value: "bebe", label: "Bebê" },
  { value: "familia", label: "Família" },
  { value: "minimalista", label: "Minimalista" },
  { value: "viagem", label: "Viagem" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#E8A550", letterSpacing: "-1px" }}>
      {"★".repeat(Math.floor(rating))}
    </span>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-3xl overflow-hidden cursor-pointer group"
      style={{
        background: "white",
        boxShadow: hovered
          ? "0 16px 48px rgba(180,150,180,0.22), 0 2px 8px rgba(180,150,180,0.12)"
          : "0 2px 16px rgba(180,150,180,0.10), 0 0 1px rgba(180,150,180,0.15)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.30s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "4/5" }}
      >
        {/* Gradient background placeholder */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: `linear-gradient(160deg, ${template.gradientFrom} 0%, ${template.gradientTo} 100%)`,
          }}
        >
          {/* Simulated album pages */}
          <div className="relative w-3/4 mx-auto">
            {/* Back page shadow */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "white",
                transform: "rotate(3deg) translateX(6px)",
                opacity: 0.7,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            />
            {/* Main page */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "white",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* Page header color bar */}
              <div
                className="h-2 w-full"
                style={{ background: template.accentColor, opacity: 0.7 }}
              />
              <div className="p-4">
                {/* Emoji large */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto"
                  style={{
                    background: `${template.gradientFrom}`,
                  }}
                >
                  {template.emoji}
                </div>
                {/* Simulated photo area */}
                <div
                  className="w-full rounded-xl mb-3"
                  style={{
                    aspectRatio: "16/9",
                    background: `linear-gradient(135deg, ${template.gradientTo}, ${template.gradientFrom})`,
                  }}
                />
                {/* Simulated text lines */}
                <div className="space-y-1.5">
                  <div
                    className="h-2 rounded-full"
                    style={{ background: `${template.accentColor}25`, width: "80%" }}
                  />
                  <div
                    className="h-1.5 rounded-full"
                    style={{ background: `${template.accentColor}15`, width: "60%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badge */}
        {template.badge && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full font-body text-xs font-semibold"
            style={{
              background: template.badge === "Novo"
                ? "linear-gradient(135deg, #6CB99A, #4DA885)"
                : "linear-gradient(135deg, #D4A5BB, #B8AACF)",
              color: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {template.badge}
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{
            background: "rgba(30, 27, 36, 0.55)",
            backdropFilter: "blur(4px)",
            opacity: hovered ? 1 : 0,
          }}
        >
          <Link
            href={`/criar/${template.slug}`}
            className="font-body font-semibold px-6 py-3 rounded-2xl text-sm transition-all"
            style={{
              background: "rgba(255,255,255,0.95)",
              color: "#1E1B24",
              boxShadow: "0 4px 20px rgba(0,0,0,0.20)",
              transform: hovered ? "scale(1)" : "scale(0.90)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Usar este modelo →
          </Link>
        </div>
      </div>

      {/* Card footer info */}
      <div className="p-4">
        {/* Theme tag */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="font-body text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: `${template.accentColor}15`,
              color: template.accentColor,
            }}
          >
            {template.themeLabel}
          </span>
          <span
            className="font-body text-xs"
            style={{ color: "#9B94AE" }}
          >
            {template.pageCount} páginas
          </span>
        </div>

        {/* Name */}
        <h3
          className="font-heading text-lg font-semibold mb-1"
          style={{ color: "#1E1B24", fontFamily: "'Playfair Display', serif" }}
        >
          {template.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={template.rating} />
          <span
            className="font-body text-xs font-medium"
            style={{ color: "#5C5670" }}
          >
            {template.rating.toFixed(1)}
          </span>
          <span
            className="font-body text-xs"
            style={{ color: "#9B94AE" }}
          >
            ({template.ratingCount} álbuns)
          </span>
        </div>
      </div>

      {/* Use button — visible on mobile (no hover) */}
      <div className="px-4 pb-4 md:hidden">
        <Link
          href={`/criar/${template.slug}`}
          className="block w-full text-center font-body font-semibold text-sm py-2.5 rounded-xl transition-all"
          style={{
            background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
            color: "white",
            boxShadow: "0 3px 12px rgba(212,165,187,0.30)",
          }}
        >
          Usar este modelo
        </Link>
      </div>
    </div>
  );
}

export default function TemplateGallery() {
  const [activeFilter, setActiveFilter] = useState("todos");

  const filteredTemplates =
    activeFilter === "todos"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.theme === activeFilter);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 10% 30%, rgba(212,165,187,0.10) 0%, transparent 50%), #FAF8F5",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      {/* Page header */}
      <div
        className="py-16 px-6 md:px-12 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(212,165,187,0.08) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(212,165,187,0.12)",
        }}
      >
        <span
          className="inline-block font-body text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
          style={{
            background: "rgba(212,165,187,0.12)",
            color: "#8B5A72",
            letterSpacing: "0.08em",
          }}
        >
          5 MODELOS DISPONÍVEIS
        </span>
        <h1
          className="font-heading text-4xl md:text-5xl font-bold mb-4"
          style={{
            color: "#1E1B24",
            fontFamily: "'Playfair Display', serif",
            lineHeight: "1.2",
          }}
        >
          Escolha o modelo perfeito
        </h1>
        <p
          className="font-body text-lg max-w-lg mx-auto"
          style={{ color: "#5C5670" }}
        >
          Cada template foi criado com amor para um momento especial da sua
          vida.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap mb-10 justify-center">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className="font-body text-sm font-medium px-5 py-2 rounded-full transition-all duration-200"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #D4A5BB, #B8AACF)"
                    : "rgba(255,255,255,0.80)",
                  color: isActive ? "white" : "#5C5670",
                  border: isActive
                    ? "1.5px solid transparent"
                    : "1.5px solid rgba(212,165,187,0.25)",
                  boxShadow: isActive
                    ? "0 3px 12px rgba(212,165,187,0.35)"
                    : "0 1px 4px rgba(180,150,180,0.08)",
                  transform: isActive ? "scale(1.03)" : "scale(1)",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎨</div>
            <p
              className="font-heading text-xl"
              style={{ color: "#5C5670", fontFamily: "'Playfair Display', serif" }}
            >
              Nenhum template encontrado
            </p>
            <button
              onClick={() => setActiveFilter("todos")}
              className="mt-4 font-body text-sm"
              style={{ color: "#D4A5BB" }}
            >
              Ver todos os modelos
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16 py-12">
          <div
            className="inline-flex flex-col items-center gap-4 px-10 py-8 rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(212,165,187,0.20)",
              boxShadow: "0 8px 32px rgba(180,150,180,0.10)",
            }}
          >
            <p
              className="font-heading text-2xl font-semibold"
              style={{
                color: "#1E1B24",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Preço único:{" "}
              <span style={{ color: "#D4A5BB" }}>R$14,90</span>
            </p>
            <p className="font-body text-sm" style={{ color: "#5C5670" }}>
              PDF 300 DPI + JPGs por página · Pague com Pix
            </p>
            <div className="flex gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "#6CB99A" }}
              />
              <span className="font-body text-xs" style={{ color: "#6CB99A" }}>
                Download disponível por 30 dias
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
