"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AlbumData {
  albumId: string;
  templateId: string;
  templateName: string;
  templateEmoji: string;
  themeLabel: string;
  pageCount: number;
  photos: string[];
  textContent: {
    title: string;
    subtitle: string;
    date: string;
    message: string;
  };
  createdAt: string;
}

const TEMPLATE_COLORS: Record<string, { color: string; bg: string }> = {
  "amor-infinito": { color: "#C9184A", bg: "#FFF0F3" },
  "primeiro-sorriso": { color: "#B5D8CC", bg: "#F0FBF7" },
  "nossa-familia": { color: "#E07A5F", bg: "#FEF9EF" },
  "instante": { color: "#1A1A2E", bg: "#F8F8F8" },
  "mundo-afora": { color: "#2D6A4F", bg: "#E8F5EE" },
};

export default function PreviewPage({ params }: { params: { albumId: string } }) {
  const router = useRouter();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem(`album-${params.albumId}`);
      if (data) {
        setAlbum(JSON.parse(data));
      }
    } catch (e) {
      console.error("Failed to load album", e);
    }
    setLoaded(true);
  }, [params.albumId]);

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F5" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ width: 40, height: 40, border: "3px solid rgba(212,165,187,0.30)", borderTopColor: "#D4A5BB", borderRadius: "50%", margin: "0 auto 16px" }} />
          <p style={{ color: "#9B94AE", fontSize: 14 }}>Carregando seu álbum...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F5" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#1E1B24", marginBottom: 8 }}>
            Álbum não encontrado
          </h2>
          <p style={{ fontSize: 14, color: "#9B94AE", marginBottom: 24 }}>
            Não encontramos os dados deste álbum. Isso pode acontecer se você limpou o histórico do navegador.
          </p>
          <Link
            href="/templates"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 28px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Criar novo álbum
          </Link>
        </div>
      </div>
    );
  }

  const templateColors = TEMPLATE_COLORS[album.templateId] || { color: "#D4A5BB", bg: "#F2E4EC" };
  const pages = Array.from({ length: album.pageCount }, (_, i) => i);

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F5", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(250,248,245,0.90)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,165,187,0.15)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href={`/criar/${album.templateId}`}
          style={{ fontSize: 14, color: "#5C5670", textDecoration: "none", fontWeight: 500 }}
        >
          ← Voltar ao editor
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{album.templateEmoji}</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#1E1B24" }}>
            {album.textContent.title}
          </span>
        </div>

        <button
          onClick={() => router.push(`/checkout/${params.albumId}`)}
          style={{
            background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(212,165,187,0.35)",
          }}
        >
          Criar Álbum → R$14,90
        </button>
      </header>

      {/* Page content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Album info */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 99,
              background: `${templateColors.color}15`,
              color: templateColors.color,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            {album.themeLabel.toUpperCase()} · {album.pageCount} PÁGINAS
          </span>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 40,
              fontWeight: 700,
              color: "#1E1B24",
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            {album.textContent.title}
          </h1>
          <p style={{ fontSize: 16, color: "#5C5670", marginBottom: 4 }}>{album.textContent.subtitle}</p>
          <p style={{ fontSize: 14, color: "#9B94AE" }}>{album.textContent.date}</p>
        </div>

        {/* Pages grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 64,
          }}
        >
          {pages.map((i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(180,150,180,0.10)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(180,150,180,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(180,150,180,0.10)";
              }}
            >
              {/* Page preview */}
              <div
                style={{
                  aspectRatio: "1",
                  background: i === 0 || i === album.pageCount - 1
                    ? `linear-gradient(135deg, ${templateColors.bg}, ${templateColors.color}40)`
                    : "#FAF8F5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {i === 0 ? (
                  <div style={{ textAlign: "center", padding: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{album.templateEmoji}</div>
                    <p style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: templateColors.color,
                    }}>
                      {album.textContent.title}
                    </p>
                  </div>
                ) : i === album.pageCount - 1 ? (
                  <div style={{ textAlign: "center", padding: 16 }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.80)", background: templateColors.color, padding: "4px 10px", borderRadius: 99 }}>
                      Contracapa
                    </p>
                  </div>
                ) : album.photos[i - 1] ? (
                  <img
                    src={album.photos[i - 1]}
                    alt={`Página ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", color: "#9B94AE" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                    <p style={{ fontSize: 10 }}>Sem foto</p>
                  </div>
                )}

                {/* Page number */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "rgba(255,255,255,0.90)",
                    borderRadius: 99,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#9B94AE",
                  }}
                >
                  {i + 1}
                </div>
              </div>

              {/* Page label */}
              <div style={{ padding: "10px 12px" }}>
                <p style={{ fontSize: 12, color: "#5C5670", fontWeight: 500 }}>
                  {i === 0 ? "📖 Capa" : i === album.pageCount - 1 ? "📕 Contracapa" : `Página ${i + 1}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              background: "white",
              borderRadius: 28,
              padding: "40px 56px",
              boxShadow: "0 8px 40px rgba(180,150,180,0.12)",
            }}
          >
            <div style={{ fontSize: 48 }}>✨</div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#1E1B24",
                marginBottom: 0,
              }}
            >
              Seu álbum está pronto!
            </h2>
            <p style={{ fontSize: 15, color: "#5C5670" }}>
              {album.pageCount} páginas · Template {album.templateName}
            </p>
            <button
              onClick={() => router.push(`/checkout/${params.albumId}`)}
              style={{
                background: "linear-gradient(135deg, #D4A5BB, #B8AACF)",
                color: "white",
                border: "none",
                borderRadius: 16,
                padding: "16px 48px",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(212,165,187,0.40)",
                transition: "transform 0.2s ease",
              }}
            >
              Comprar e Baixar · R$14,90
            </button>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9B94AE" }}>
              <span>✓ PDF 300 DPI</span>
              <span>✓ JPGs por página</span>
              <span>✓ Pague com Pix</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
