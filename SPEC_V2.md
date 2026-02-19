# Momentu — Spec v2.0
> Documento de arquitetura e UX para aprovação antes de qualquer código.
> Última atualização: 2026-02-19

---

## 1. Premissas fundamentais

- **Template = fundo (background)**. É o cenário, a identidade visual. Não compete com as fotos.
- **Fotos = foco absoluto**. Sempre sobrepõem tudo. São a razão do álbum existir.
- **Promessa central para print**: "O arquivo que sai daqui vai direto para a gráfica."
- **Pipeline correto**: Designer cria SVG do fundo → thumbnail = render desse SVG → editor carrega esse SVG como base → usuário personaliza em cima.
- **Onboarding obrigatório** antes do editor: coletar finalidade + tamanho antes de qualquer template.

---

## 2. Onboarding — configuração do álbum

### Tela 1 — Finalidade

```
"Para que é seu álbum?"

[ 📖 Para imprimir na gráfica ]    [ 📱 Para guardar digitalmente ]
   arquivo PDF profissional           compartilhar, salvar, presentear
```

---

### Tela 2A — Print: Tamanho do álbum

```
"Escolha o tamanho do álbum"

[ 20×20 cm  ]   [ A4  21×30 cm ]   [ Mini 15×21 cm ]
  Quadrado         Retrato             Compacto
  (mais popular)

── Canvas interno: [20x20] [30x20] [20x30]  ← orientação (futuro)
```

Especificações técnicas internas (invisíveis ao usuário):

| Formato     | Dimensões  | Canvas 300 DPI  | Bleed (+3mm todos os lados) |
|-------------|------------|-----------------|------------------------------|
| 20×20 cm    | 200×200 mm | 2362×2362 px    | 2398×2398 px                 |
| A4          | 210×297 mm | 2480×3508 px    | 2516×3544 px                 |
| Mini 15×21  | 150×210 mm | 1772×2480 px    | 1808×2516 px                 |

---

### Tela 2B — Digital: Formato

```
"Escolha o formato"

[ 1:1 Quadrado  ]   [ 9:16 Story  ]   [ 16:9 Paisagem ]
  Instagram Feed     Stories/Reels       Apresentação
  1080×1080 px       1080×1920 px        1920×1080 px
```

---

### Tela 3 — Número de páginas

```
"Quantas páginas você quer?"

  ○──────────●──────────○
  8          16         30

  Recomendamos 16 páginas (~24 fotos)
  
  [8 págs]  [12 págs]  [16 págs ✓]  [20 págs]  [30 págs]
  
  R$ 14,90                           (+ R$ 5,00 a cada +8 págs extras)
```

---

### Tela 4 — Escolha do template

```
"Escolha seu estilo"

[ Filtros: Todos | Casal | Bebê | Família | Formatura | Viagem ]

[ thumb real ] [ thumb real ] [ thumb real ] [ thumb real ]
  Casamento      Pequeno        Raízes         Conquista
  Dourado        Universo

── thumbnail = render do SVG real, não DALL-E livre
── templates filtrados pelo formato escolhido (print vs digital)
```

Ao tocar em um template:
- Preview rápido (como o álbum vai ficar com fotos de exemplo)
- Botão "Usar este estilo" → entra no editor

---

## 3. Arquitetura do Editor

### 3.1 Estrutura de layers no Konva

```
Stage (canvasW × canvasH)
  ├── Layer 0: Background (não-interativo)
  │     └── KonvaImage: bg.svg carregado como imagem
  │           listening={false} — usuário não pode interagir
  │
  ├── Layer 1: Photo slots (interativos)
  │     └── KonvaPhotoSlot[]
  │           - Toque: abre file picker
  │           - Foto carregada: fill slot, sobrepõe o fundo
  │           - Validação de resolução na hora do upload
  │
  ├── Layer 2: Template elements (interativos)
  │     └── DraggableElement[]
  │           - Pré-posicionados pelo Designer no JSON do template
  │           - Usuário pode: mover (drag free), redimensionar, deletar
  │           - Seleção mostra handles do Konva Transformer
  │
  ├── Layer 3: Text slots (interativos)
  │     └── KonvaTextSlot[]
  │           - Toque: abre input nativo (fora do canvas) para editar
  │           - Posição pré-definida pelo template
  │
  └── Layer 4: Transformer
        └── <Transformer> — handles de resize/rotate quando elemento selecionado
```

### 3.2 Escala de renderização

O canvas exibe em escala reduzida (performance) e exporta em resolução total:

```
Print 20×20:
  Display: ~600px (pixelRatio = 1)     ← fluido no browser
  Export:  2362px (pixelRatio = 3.94)  ← 300 DPI real

Digital 1080×1080:
  Display: ~540px (pixelRatio = 1)
  Export:  1080px (pixelRatio = 2)
```

Konva suporta `stage.toDataURL({ pixelRatio: X })` nativamente.

### 3.3 Bleed para print

Para print, o canvas de exportação tem +3mm de sangria em todos os lados.
O conteúdo editável fica dentro da safe zone (5mm das bordas visíveis).
Linhas de corte (crop marks) opcionais no PDF final.

```
┌─────────────────────────┐  ← borda do bleed (+3mm)
│   ·  ·  ·  ·  ·  ·  ·  │  ← área de sangria (background estende aqui)
│  · ┌───────────────┐ ·  │
│  · │  safe zone    │ ·  │  ← conteúdo importante (fotos, texto) fica aqui
│  · │  (5mm dentro) │ ·  │
│  · └───────────────┘ ·  │
│   ·  ·  ·  ·  ·  ·  ·  │
└─────────────────────────┘
```

### 3.4 Validação de qualidade de foto

No momento do upload, calculamos a resolução mínima necessária para aquele slot:

```
slot_width_cm = (slot_width_px / canvas_px) * format_width_cm
min_photo_px = slot_width_cm * (300 / 2.54)

Exemplo: slot que ocupa 50% de um álbum 20×20cm
  slot_width_cm = 10cm
  min_photo_px = 10 * (300/2.54) = 1181px
```

Feedback ao usuário:
- ✅ Verde: foto boa para impressão
- ⚠️ Amarelo: qualidade aceitável (resultado pode variar)
- ❌ Vermelho: foto muito pequena, impressão vai ficar borrada

---

## 4. Estrutura de um template (schema)

```typescript
interface TemplateConfig {
  id: string
  name: string
  
  // Formatos suportados por esse template
  formats: ('print_20x20' | 'print_a4' | 'print_15x21' | 'digital_square' | 'digital_story')[]
  
  // Background: um arquivo SVG por formato
  backgrounds: {
    [format: string]: string  // path: /templates/{id}/{format}/bg.svg
  }
  
  // Thumbnail: render do background com fotos de exemplo
  thumbnail: string  // path: /templates/{id}/thumb.jpg
  
  // Fontes do template
  font: string       // fonte de título (Google Fonts)
  bodyFont: string   // fonte de corpo
  
  // Paleta de cores
  colors: {
    primary: string
    secondary: string
    accent?: string
    text: string
    bg: string
  }
  
  // Elementos interativos pré-posicionados pelo Designer
  // (coordenadas em % do canvas — independente do tamanho)
  elements: {
    [format: string]: TemplateElement[]
  }
  
  // Layouts de página por tipo (onde ficam os photo slots e text slots)
  pages: {
    cover: PageLayout
    photo_single: PageLayout
    photo_double: PageLayout
    text_focus: PageLayout
    back_cover: PageLayout
  }
}

interface TemplateElement {
  id: string
  type: 'icon' | 'sticker' | 'ornament'
  src: string       // caminho do SVG do elemento
  x: number         // % do canvas width
  y: number         // % do canvas height
  width: number     // % do canvas width
  height: number    // % do canvas height
  locked?: boolean  // se true: não pode ser movido (parte fixa do design)
}

interface PageLayout {
  photoSlots: PhotoSlot[]
  textSlots: TextSlot[]
}

interface PhotoSlot {
  x: number; y: number; width: number; height: number  // % do canvas
  minResolutionPx?: number  // calculado baseado no formato
}
```

---

## 5. Geração de PDF print-ready

### Fluxo

```
1. Para cada página do álbum:
   a. Exportar canvas via Konva.toDataURL({ pixelRatio: fullRes/displayRes })
   b. Resultado: PNG em 300 DPI real

2. Combinar PNGs em PDF via pdf-lib:
   a. Criar PDF com dimensões exatas em mm/cm
   b. Embutir cada PNG em uma página
   c. (Print) Adicionar 3mm de bleed nas dimensões da página
   d. Embutir metadados: título do álbum, data, DPI

3. Output: PDF com múltiplas páginas
   - Print: PDF/X-1a compatível (RGB — gráficas modernas aceitam)
   - Digital: PDF screen-optimized
```

### Dependências

| Biblioteca | Uso | Status |
|-----------|-----|--------|
| `react-konva` | Editor canvas | já instalado |
| `pdf-lib` | Geração PDF print-ready | SUBSTITUIR @react-pdf/renderer |
| `sharp` (server) | Compressão e validação de imagem | já instalado |

### Por que mudar de @react-pdf/renderer para pdf-lib?

`@react-pdf/renderer` renderiza com primitivos PDF (texto, formas) em 72 DPI — não adequado para print profissional.

`pdf-lib` + Konva export em alta resolução = PNG 300 DPI embedado no PDF = print-ready real.

---

## 6. UX do Editor (redesign completo)

### Layout geral

```
┌─────────────────────────────────────────────────┐
│ ← Voltar   [nome do álbum]        [Preview] [💾] │  ← Header
├─────┬───────────────────────────┬───────────────┤
│     │                           │               │
│  P  │                           │    Toolbar    │
│  á  │      CANVAS               │               │
│  g  │   (template + foto slots  │  ┌──────────┐ │
│  i  │    + elementos editáveis) │  │ Páginas  │ │
│  n  │                           │  │ (strip)  │ │
│  a  │                           │  └──────────┘ │
│  s  │                           │               │
│     │                           │  + Adicionar  │
│     │                           │    página     │
└─────┴───────────────────────────┴───────────────┘
```

### Toolbar lateral (direita)
- **Páginas**: miniaturas das páginas (toque para navegar)
- **+ Adicionar página**: escolhe tipo (só foto, foto+texto, texto, etc.)
- **Layout da página**: trocar o layout da página atual (1 foto, 2 fotos, etc.)
- **Elementos**: lista de elementos do template na página (para gerenciar camadas)

### Interações no canvas
- **Photo slot vazio**: ícone de câmera + "Toque para adicionar foto"
- **Photo slot com foto**: toque → trocar foto; long press → opções (remover, ajustar)
- **Elemento do template**: toque → seleciona (handles aparecem), drag → move, pinch → redimensiona, × → deleta
- **Text slot**: toque → abre teclado nativo com a fonte do template

### Header
- Seta voltar → sai sem salvar (confirma)
- Nome do álbum (editável ao toque)
- "Preview" → renderiza todas as páginas lado a lado
- Ícone salvar → save automático (localStorage por enquanto)

### Bottom flow
Após editar todas as páginas:
- Botão fixo "Finalizar álbum" (bottom fixed)
- Toque → tela de revisão → checkout → geração do PDF

---

## 7. Tela de Preview (antes do checkout)

```
"Seu álbum está pronto! 🎉"

[< pág 1 >] [< pág 2 >] ... (scroll horizontal de previews)

Print: "Arquivo otimizado para impressão — 300 DPI, pronto para gráfica"
Digital: "Alta resolução para compartilhar e imprimir em casa"

[Fazer download — R$ 14,90]
```

Checklist automático antes de mostrar o botão de finalizar:
- [ ] Todas as páginas têm pelo menos 1 foto?
- [ ] Alguma foto tem resolução muito baixa? (aviso, não bloqueio)
- [ ] Tem capa e contracapa?

---

## 8. Fluxo de redesign de templates (nova pipeline)

Para CADA template novo:

```
1. Designer recebe: nome, conceito, paleta, público-alvo, formato(s) alvo

2. Designer produz:
   a. bg.svg — o fundo em tamanho original por formato
      Regras:
      - Decoração nas bordas/cantos, NÃO no centro
      - Zona central deve ser clean (é onde as fotos ficam)
      - Elementos decorativos = simples, elegantes, baixo contraste
      - Deve ficar bom em P&B (teste de impressão monocromática)
   
   b. elements.json — ícones pré-posicionados por formato
      [{ id, type, src, x%, y%, width%, height% }, ...]
   
   c. thumbnail.jpg — screenshot do bg.svg + fotos de exemplo realistas
      NÃO é DALL-E. É um render real do template com fotos.
   
   d. Ícones SVG individuais (elementos interativos)
      public/templates/{id}/elements/icon1.svg, icon2.svg, ...

3. Dev importa e testa no editor

4. Jether valida visualmente
```

---

## 9. Ordem de implementação

### Fase 1 — Fundação (Sprint atual)
- [ ] Trocar @react-pdf/renderer → pdf-lib
- [ ] Arquitetura de 4 layers no Konva (bg image + fotos + elementos + texto)
- [ ] Konva export em high-res (pixelRatio correto por formato)
- [ ] Schema de TemplateConfig v2 implementado
- [ ] Validação de resolução de foto no upload

### Fase 2 — Onboarding
- [ ] Tela 1: finalidade (print vs digital)
- [ ] Tela 2A: escolha de tamanho (print)
- [ ] Tela 2B: escolha de formato (digital)
- [ ] Tela 3: número de páginas + pricing
- [ ] Tela 4: seleção de template (filtrado por formato)

### Fase 3 — Editor redesenhado
- [ ] Layout novo (canvas + toolbar lateral)
- [ ] Elementos interativos com Konva Transformer
- [ ] Text editing nativo
- [ ] Page navigation strip
- [ ] Checklist de qualidade

### Fase 4 — Primeiro template v2
- [ ] Designer refaz 1 template seguindo nova pipeline
- [ ] bg.svg + elements.json + thumbnail real
- [ ] Dev integra e valida

### Fase 5 — PDF print-ready
- [ ] pdf-lib: combinação de páginas em PDF
- [ ] Bleed correto por formato
- [ ] Metadados embutidos

---

*Aprovação necessária antes de iniciar Fase 1.*
