import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentu — Crie Álbuns de Fotos em Minutos | R$14,90",
  description: "Transforme suas fotos em memórias que duram para sempre. Álbuns de fotos profissionais para imprimir. Para casais, mães e famílias.",
  openGraph: {
    title: "Momentu — Álbuns de Fotos Personalizados",
    description: "PDF 300 DPI pronto para gráfica. A partir de R$14,90.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
