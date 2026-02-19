# Momentu — MVP Progress

**Última atualização:** 2026-02-19  
**Status:** ✅ MVP v2 completo — Konva Editor + Design System + PDF com fotos

---

## ✅ MVP v2 — Tarefas Concluídas

### TAREFA 1 — Design System Aplicado
- **app/globals.css**: substituído pelo design system do Designer (CSS vars, fontes, componentes atômicos)
  - Google Fonts: Playfair Display + Inter (app) + Lato, Nunito, Merriweather, etc. (templates)
  - Design tokens completos: cores, tipografia, espaçamento, sombras
  - Componentes atômicos: .btn, .card, .badge, .input, .tag, .skeleton, .spinner
- **app/page.tsx**: nova Landing Page com LandingHero design
  - Header sticky com blur, hero com gradient text, CTA button, template cards horizontal scroll
  - Seção "Em 3 passos", pricing, depoimentos, footer
- **components/templates-gallery.tsx**: novo componente TemplatesGallery
  - Filtros por tema (chips), grid 2 colunas, cards com gradiente + CTA
- **app/templates/page.tsx**: usa novo TemplatesGallery (server component com metadata)
- **app/checkout/[albumId]/page.tsx**: design CheckoutPix integrado
  - Resumo do pedido, QR Code mock, countdown timer, copiar código, "Já paguei" para MVP
- **app/download/[albumId]/page.tsx**: design DownloadSuccess integrado
  - Celebration header (🎉), album preview card, botões de download, expiry warning, quality badges

### TAREFA 2 — Editor Konva Real
- **components/konva-editor.tsx**: editor completo com react-konva
  - 5 templates configurados com layouts de página por tipo
  - Tipos de página: `cover`, `photo_single`, `photo_double`, `text_focus`, `back_cover`
  - Stage Konva 300x300 com Layer, Rect, Text, Image, Group
  - Gradientes em Konva via `fillLinearGradientColorStops`
  - Click em slot de foto → abre input file → carrega base64 → renderiza KonvaImage
  - Cache de imagens com `imageCache` + `forceRender()` ao carregar
  - Click em slot de texto → abre painel de edição na toolbar inferior
  - Strip de thumbnails clicáveis (scroll horizontal) com indicador visual
  - Toolbar com abas: Foto | Texto | Preview
  - Header: input de título editável + botão "Finalizar →"
  - Navegação por setas e dots
  - Auto-save em localStorage a cada 1s (debounce)
  - "Finalizar" → salva albumData com `pages` completo → redireciona para /preview
- **app/criar/[templateId]/page.tsx**: dynamic import do KonvaEditor com `{ssr: false}`

### TAREFA 3 — PDF com Fotos Reais
- **lib/pdf-document.tsx**: documento PDF completo com todos os tipos de página
  - `FullAlbumPDF`: aceita `pages` (do editor Konva) + `photos` array
  - PDF 200mm × 200mm (square album)
  - `CoverPdfPage`: bg colorido + foto full-bleed + overlay + texto
  - `PhotoSinglePdfPage`: bg + foto grande + caption
  - `PhotoDoublePdfPage`: bg + 2 fotos lado a lado + captions
  - `TextFocusPdfPage`: bg + heading em cor do template + body
  - `BackCoverPdfPage`: bg sólido + "com amor," + autor + brand
  - Fotos base64 (`data:image/...`) suportadas diretamente via `@react-pdf/renderer Image`
  - Fallback para placeholders quando foto não disponível
  - `AlbumPDF` legacy mantido para compatibilidade
- **app/api/generate-pdf/route.ts**: aceita `pages`, `photos`, `templateColor`, `templateColor2`

### TAREFA 4 — Verificação
- **TypeScript**: `npx tsc --noEmit` → 0 erros
- **Build**: `npm run build` → sucesso (0 erros, apenas warnings off)
- **Dev server**: `npm run dev` → ready in ~1.5s
- **Rotas testadas**:
  - `/` → HTTP 200 ✓
  - `/templates` → HTTP 200 ✓
  - Build: todas as rotas compiladas com sucesso

---

## Decisões Técnicas MVP v2

1. **react-konva com SSR**: Usou `dynamic(() => import(...), { ssr: false })` para evitar problemas de SSR com Konva (acessa `document`/`window`)
2. **Cache de imagens**: Módulo-level `imageCache` (objeto fora do componente) para persistir imagens entre re-renders sem ficar no estado React
3. **forceRender()**: `useReducer` para triggering re-render manual quando imagem carrega
4. **@react-pdf/renderer Image**: Aceita base64 data URIs diretamente — fotos do Konva editor (base64) vão direto para o PDF sem conversão adicional
5. **PDF size**: 200mm × 200mm conforme spec (square album para gráfica)
6. **localStorage auto-save**: Debounce 1s para salvar estado do editor; chave `editor-${templateId}` para reutilizar ao voltar para o mesmo template
7. **ESLint**: `jsx-a11y/alt-text` desabilitado para `@react-pdf/renderer Image` (componente PDF, não HTML)
8. **Sem Supabase real**: Tudo em localStorage conforme regras MVP
9. **Pix mockado**: QR Code desenhado em CSS, código copia-cola fixo para teste

---

## Estado atual (mockado para produção real)
- **Supabase**: não integrado, dados em localStorage
- **Mercado Pago**: Pix mockado (QR Code estático, "Já paguei" para teste)
- **Autenticação**: sem login
- **Upload para nuvem**: fotos ficam em base64 no localStorage (temporário)

## Para testar localmente
```bash
cd /home/Jether/.openclaw/workspace/projects/momentu
npm run dev
# Abre: http://localhost:3000
# Fluxo: / → /templates → /criar/amor-infinito → /preview/ID → /checkout/ID → /download/ID
```

## Próximos passos para produção
1. Integrar Mercado Pago real (POST /api/create-order, webhook confirmação)
2. Integrar Supabase Storage para upload de fotos
3. Supabase DB para persistir álbuns e pedidos
4. Autenticação (Supabase Auth ou magic link)
5. Deploy no Vercel (edge functions para API, nodejs runtime para PDF)
6. Otimização de imagens no PDF (resize antes de base64 para reduzir tamanho)
