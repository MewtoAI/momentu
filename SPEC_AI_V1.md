# Momentu AI — Documento de Execução Completo
> **SPEC_AI_V1.md** — A bíblia do time. Ninguém executa sem ler esse doc.
> Última atualização: 2026-02-19
> Status: **APROVADO PARA EXECUÇÃO**

---

## ⚠️ Aviso Crítico — Leia Primeiro

Este documento substitui a visão de produto do SPEC_V2.md.
A arquitetura técnica base (pdf-lib, Konva, FORMAT_SPECS, tipos do TypeScript) do SPEC_V2 **permanece válida** e é usada pelo Compositor (Agente 3).

**O que muda radicalmente:** O usuário não é mais editor. A AI é a designer.

---

## 1. Visão do Produto

### 1.1 O que é o Momentu AI

Serviço de criação de álbuns de foto por inteligência artificial. O usuário descreve o que quer, sobe as fotos, e a AI gera um álbum profissional completo — sem editor, sem habilidade técnica, sem arrastar nada.

**Dois produtos:**
1. **Print** — Álbum impresso (PDF 300 DPI, print-ready, pronto para gráfica)
2. **Digital** — Conteúdo para redes sociais (carrossel Instagram, Stories, TikTok)

### 1.2 O que NÃO é

| ❌ Não é | ✅ É |
|----------|------|
| Um editor DIY | Um serviço criativo com AI |
| Canva com templates | Geração única para cada pedido |
| Drag-and-drop de fotos em slots | Upload + descrição → álbum pronto |
| Produto onde o usuário faz design | Produto onde o usuário recebe design |

**Regra de ouro:** Se o usuário precisar de habilidade técnica para usar, falhamos.

### 1.3 Proposta de Valor Central

> "Você sobe as fotos, descreve o que sente. A gente transforma em um álbum que parece ter sido feito por um designer profissional. Em minutos."

**Print:** O arquivo que sai vai direto para a gráfica. Zero ajustes necessários.

**Digital:** Conteúdo pronto para postar. Sem aplicativo de edição, sem filtro, sem cropping manual.

### 1.4 Público-Alvo — 3 Personas

---

#### Persona 1 — Ana, a Mãe que Quer Eternizar
**Idade:** 34 anos
**Perfil:** Mãe de dois filhos, trabalha meio período, usa Instagram para compartilhar a vida da família. Tira centenas de fotos por mês. Nunca organizou nenhuma delas.
**Dor:** "Quero fazer um álbum do primeiro ano do meu filho, mas nunca tenho tempo e não entendo de design."
**Comportamento:** Pesquisou Canva mas desistiu na segunda tela. Pagou R$180 para uma fotógrafa fazer um livro de fotos uma vez.
**O que quer:** Um álbum bonito, rápido, sem esforço. Que quando chegar na mão ela chore de emoção.
**Produto principal:** Print (álbum bebê/família)
**Decisor de compra:** Preço abaixo de R$60. Ela compra na hora se confiar na qualidade.
**Objeção principal:** "E se ficar feio?"
**Resposta:** A amostra gratuita elimina essa objeção antes do pagamento.

---

#### Persona 2 — Rodrigo, o Noivo Procrastinador
**Idade:** 28 anos
**Perfil:** Acabou de se casar. As fotos do casamento estão num HD externo há 8 meses. A noiva já falou 3 vezes que quer um álbum.
**Dor:** "Tenho 400 fotos e não sei por onde começar. Quero resolver isso rápido e bem."
**Comportamento:** Vai buscar solução quando a dor aumentar (pressão da cônjuge). Decide rápido quando encontra algo que resolve o problema com clareza.
**O que quer:** Entregar o álbum para a esposa. Resultado final > processo.
**Produto principal:** Print (álbum casamento, 20 páginas)
**Decisor de compra:** Facilidade + resultado profissional. Preço é secundário para casamento.
**Objeção principal:** "Vai parecer que eu não me esforcei?"
**Resposta:** Posicionar como curadoria inteligente, não preguiça. "A AI fez em horas o que levaria semanas."

---

#### Persona 3 — Juliana, a Criadora de Conteúdo
**Idade:** 24 anos
**Perfil:** Viajante, 8k seguidores no Instagram. Volta de uma viagem com 300 fotos e precisa criar conteúdo para a semana.
**Dor:** "Passo 4 horas editando fotos no Lightroom e fazendo carrossel no Canva. É exaustivo e eu tenho que fazer isso toda semana."
**Comportamento:** Paga por ferramentas que economizam tempo. Assina Adobe Express, Notion, Notion AI.
**O que quer:** Carrossel profissional em 10 minutos. Estética consistente com o perfil dela.
**Produto principal:** Digital (carrossel + Stories)
**Decisor de compra:** Qualidade visual e velocidade. R$29,90 por viagem é zero comparado ao tempo que economiza.
**Objeção principal:** "O resultado vai parecer genérico?"
**Resposta:** Estilo escolhido + paleta de cores + fotos dela = resultado único. A amostra prova isso.

---

## 2. Fluxo Completo — Produto Print

### Convenções desta seção

Cada tela segue o formato:
```
T[N] — NOME
• O que o usuário vê
• Interações disponíveis
• Backend
• Edge cases
```

---

### T1 — INSPIRE (Homepage / Galeria de Inspiração)

**O que o usuário vê:**
```
┌─────────────────────────────────────────────────────┐
│  Momentu                              [Criar meu álbum →] │
├─────────────────────────────────────────────────────┤
│  [Todos] [Casamento] [Bebê] [Viagem] [Família] [Formatura] [Aniversário] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [thumb]   [thumb]   [thumb]   [thumb]              │
│  [thumb]   [thumb]   [thumb]   [thumb]              │
│  [thumb]   [thumb]   [thumb]   [thumb]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Grid de álbuns gerados anteriormente. Cada card:
- Thumbnail principal (primeira página do álbum)
- Estilo e ocasião em tag discreta
- No hover (desktop) ou tap (mobile): preview animado de 3–4 páginas em carrossel

**Interações disponíveis:**
- Filtrar por categoria (pills horizontais, múltipla seleção)
- Hover/tap em álbum → preview de páginas
- Botão "Quero um assim" em cada álbum → salva `reference_album_id` na sessão e entra no fluxo (T2)
- Botão global "Criar meu álbum" → entra no fluxo (T2) sem referência

**Backend:**
- Query: `SELECT * FROM gallery_albums WHERE is_featured = true ORDER BY created_at DESC`
- Filtragem por ocasião feita no cliente (dados já carregados)
- `reference_album_id` salvo em sessionStorage até login ser completado

**Edge cases:**
- Galeria vazia (lançamento): mostrar 3–5 álbuns curados manualmente antes de ter usuários reais
- Sem internet: mostrar última versão em cache (Next.js ISR com revalidate 3600s)
- Usuário já logado e já usou amostra: mostrar badge "Amostra já utilizada" no CTA, mas não bloquear

---

### T2 — LOGIN / CADASTRO

**O que o usuário vê:**
```
Momentu

Entre para criar seu álbum

[ seu@email.com    ]
[  Enviar link mágico  ]

"Enviamos um link para o seu e-mail.
 Clique nele para entrar — sem senha necessária."
```

**Interações disponíveis:**
- Campo de e-mail + botão envio
- Link mágico abre em nova aba ou redireciona com token

**Backend:**
- Supabase Auth: `signInWithOtp({ email })`
- Após confirmação do magic link:
  - Verificar `users.used_free_sample`
  - Se `false` (primeira vez): continuar normalmente para T3
  - Se `true` (já usou amostra): mostrar banner "Você já usou sua amostra gratuita. Mas pode criar seu álbum agora!" — botão "Criar álbum completo" pula T4/T5 e vai direto para T6 (pagamento)
  - Se `reference_album_id` estava em sessionStorage: persistir na sessão do usuário

**Edge cases:**
- E-mail inválido: validação em tempo real, não submeter
- Link expirado (Supabase: 1h padrão): "Seu link expirou. Solicite um novo." + botão para reenviar
- Usuário já logado (cookie válido): pular T2 diretamente
- Domínio de e-mail temporário (mailinator, guerrilla): não bloquear, apenas monitorar abuso

---

### T3 — QUESTIONÁRIO

O questionário é um wizard de 6 perguntas, **uma por tela**, com barra de progresso.
Transição suave entre perguntas (slide horizontal).
Respostas salvas progressivamente em `album_sessions.questionnaire` (JSONB).

**Barra de progresso:** `[●●●○○○]` — 6 passos, visual limpo.

---

#### P1 — PRODUTO

```
Progresso: 1/6

"O que você quer criar?"

┌──────────────────────────┐  ┌──────────────────────────┐
│                          │  │                          │
│   📖                     │  │   📱                     │
│                          │  │                          │
│  Álbum para              │  │  Conteúdo para           │
│  imprimir na gráfica     │  │  redes sociais           │
│                          │  │                          │
│  Arquivo PDF profissional│  │  Instagram, Stories,     │
│  pronto para gráfica     │  │  TikTok                  │
│                          │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

- Seleção de card → destaque visual + avança automaticamente para P2
- Salva em `questionnaire.product_type` = `'print'` | `'digital'`
- Se `'digital'`: fluxo diverge a partir de P5 (ver Seção 3)

---

#### P2 — OCASIÃO

```
Progresso: 2/6

"Que momento você quer eternizar?"

┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  💍    │ │  🎂    │ │  👶    │ │  ✈️    │
│Casamento│ │Aniversário│ │  Bebê  │ │ Viagem │
└────────┘ └────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐ ┌────────┐
│  👨‍👩‍👧  │ │  🎓   │ │  ···   │
│ Família│ │Formatura│ │ Outro  │
└────────┘ └────────┘ └────────┘
```

- Ícone animado ao tap (micro-animação: escala 1.0 → 1.2 → 1.0)
- Seleção única, destaque com borda colorida
- "Outro" → campo de texto aparece abaixo: "Qual ocasião?"
- Salva em `questionnaire.occasion`

**Edge cases:**
- "Outro" com campo vazio ao tentar avançar: avisa "Conte um pouco sobre a ocasião"

---

#### P3 — ESTILO

```
Progresso: 3/6

"Qual estilo te representa?"

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  [visual]   │  │  [visual]   │  │  [visual]   │
│             │  │             │  │             │
│  Romântico  │  │  Clássico   │  │  Vibrante   │
└─────────────┘  └─────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  [visual]   │  │  [visual]   │  │  [visual]   │
│             │  │             │  │             │
│ Minimalista │  │   Vintage   │  │   Bohemio   │
└─────────────┘  └─────────────┘  └─────────────┘
```

**6 cards visuais — SEM TEXTO DESCRITIVO, só o nome do estilo:**
- **Romântico:** tons rosa/creme, elementos florais delicados, fontes cursivas
- **Clássico:** preto/branco/dourado, linhas limpas, fontes serifadas elegantes
- **Vibrante:** cores saturadas, composição dinâmica, fontes sem serifa modernas
- **Minimalista:** predominância de branco, muita respiração, tipografia limpa
- **Vintage:** tons sépia/amarelados, texturas de papel, fontes retro
- **Bohemio:** tons terrosos/cobre/verde, elementos orgânicos, fontes manuscritas

Cada card = imagem de moodboard real (não gerada por AI — curada manualmente).
Seleção única, tap avança automaticamente.
Salva em `questionnaire.style`

---

#### P4 — COR

```
Progresso: 4/6

"Tem uma paleta de cor preferida?"

○ ○ ○ ○    ← linha 1: 6 paletas neutras/clássicas
○ ○ ○ ○    ← linha 2: 4 paletas vibrantes
○ ○         ← linha 3: 2 paletas escuras/dramáticas

[  ✨ Me surpreenda  ]  ← AI escolhe baseado em estilo + ocasião
```

**12 paletas curadas (círculos coloridos, sem nome):**
1. Rosa claro + creme + dourado suave
2. Azul marinho + branco + prata
3. Preto + branco + dourado
4. Verde sage + bege + nude
5. Lavanda + cinza + branco
6. Coral + pêssego + creme
7. Vinho + dourado + creme
8. Verde esmeralda + dourado + branco
9. Azul céu + amarelo + branco
10. Laranja + marrom + creme (bohemio)
11. Cinza escuro + preto + branco (dramático)
12. Roxo + rosa + lavanda

Tap em círculo → seleciona paleta, anel de seleção ao redor.
"Me surpreenda" → `questionnaire.palette = 'ai_choice'` + AI escolhe no Agente 2.
Salva em `questionnaire.palette_id` ou `'ai_choice'`.

---

#### P5 — TAMANHO (apenas Print)

```
Progresso: 5/6

"Quantas páginas no seu álbum?"

┌──────────────────────┐  ┌──────────────────────┐
│    10 páginas        │  │    12 páginas         │
│                      │  │                       │
│      R$ 39,90        │  │      R$ 44,90         │
│                      │  │                       │
│  Ideal para          │  │  Ideal para           │
│  20–25 fotos         │  │  25–30 fotos          │
└──────────────────────┘  └──────────────────────┘
┌──────────────────────┐  ┌──────────────────────┐
│    15 páginas        │  │    20 páginas         │
│                      │  │                       │
│      R$ 49,90        │  │      R$ 59,90         │
│                      │  │                       │
│  Ideal para          │  │  Ideal para           │
│  30–40 fotos         │  │  40+ fotos            │
└──────────────────────┘  └──────────────────────┘
```

Seleção única. Salva em `questionnaire.page_count` e `album_sessions.price`.

**Nota:** Formatos de print são todos 20×20cm (quadrado). Outros tamanhos são trabalho futuro.

**Edge cases:**
- Usuário com mais fotos do que suportado: aviso amigável na T7 (upload), não bloquear aqui

---

#### P6 — MENSAGEM ESPECIAL

```
Progresso: 6/6

"Tem alguma mensagem especial para incluir?"

┌────────────────────────────────────────────────┐
│ Ex: "Para a minha mãe, com todo o amor do mundo"│
│                                                │
│                                                │
└────────────────────────────────────────────────┘

[ Pular ]    [ Continuar → ]
```

Campo de texto livre, máx 280 caracteres.
Mensagem aparecerá na contracapa ou em página de texto dedicada (decisão do Agente 1 — Curador).
Salva em `questionnaire.special_message`.

---

#### REFERÊNCIA DE ÁLBUM (opcional — só aparece se veio de "Quero um assim")

Aparece entre P6 e o botão final, se `reference_album_id` estiver preenchido.

```
"Você escolheu esse álbum como referência ↗"

[thumbnail do álbum referência]

O que mais te agradou?
┌────────────────────────────────────────────────┐
│ Ex: "As flores nos cantos são lindas"           │
└────────────────────────────────────────────────┘

O que pode ser diferente?
┌────────────────────────────────────────────────┐
│ Ex: "Quero cores mais vibrantes"               │
└────────────────────────────────────────────────┘

[ Continuar → ]
```

Salva em `questionnaire.reference_notes.liked` e `questionnaire.reference_notes.different`.

---

### T4 — UPLOAD DA AMOSTRA

**O que o usuário vê:**
```
"Escolha 2 fotos para ver como vai ficar"

Vamos criar uma prévia gratuita para você ver o estilo
do seu álbum antes de decidir.

┌─────────────────┐  ┌─────────────────┐
│                 │  │                 │
│   + Adicionar   │  │   + Adicionar   │
│                 │  │                 │
└─────────────────┘  └─────────────────┘

          [  Gerar minha amostra  ]
```

**Interações disponíveis:**
- Upload de exatamente 2 fotos (não mais, não menos)
- File picker ou câmera (mobile)
- Preview inline após seleção
- Botão "Gerar minha amostra" ativa-se apenas com 2 fotos

**Backend:**
1. Upload para Supabase Storage: `storage/albums/{session_id}/sample/{foto1, foto2}`
2. Cria registro em `generation_jobs` com `type='sample'`, `status='queued'`
3. Trigger para pipeline de geração (cria 2 páginas: capa + 1 spread)
4. Atualiza `album_sessions.status = 'sample_requested'`
5. Frontend faz polling a cada 5s em `/api/generation/status?jobId=...`

**Loading screen durante geração (~2–3 min):**
```
Criando sua amostra...

[animação delicada — folhas virando, álbum se formando]

"Estamos desenhando seu estilo..."

Isso leva cerca de 2 minutos.
Pode ficar aqui ou voltar em instantes.
```

**Edge cases:**
- Foto em formato não suportado (HEIC, RAW): converter com sharp no servidor, avisar o usuário
- Foto menor que 800px: aviso "Essa foto pode ficar com qualidade reduzida na impressão. Continue assim mesmo?" — não bloquear
- Geração falha (timeout >5min ou erro): "Ocorreu um problema. Estamos tentando novamente." — retry automático 1x, depois alerta para Mewto via log
- Usuário fecha o app durante geração: e-mail automático quando pronto ("Sua amostra está pronta!")

---

### T5 — PREVIEW DA AMOSTRA

**O que o usuário vê:**
```
"Sua amostra está pronta ✨"

[← capa •  spread →]   ← swipe entre 2 páginas

(imagem em alta qualidade, centralizada, com sombra sutil)

"Seu álbum completo vai ser assim"
"Todas as suas fotos, no mesmo estilo, com o mesmo cuidado."

┌──────────────────────────────────┐
│  Quero esse álbum! → R$ XX,XX   │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│       Não é isso que quero       │
└──────────────────────────────────┘
```

**Interações disponíveis:**
- Swipe entre as 2 páginas da amostra
- Tap na imagem → zoom (pinch to zoom)
- "Quero esse álbum!" → vai para T6 (pagamento)
- "Não é isso que quero" → popup de feedback + encerramento

**Backend:**
- Marcar `users.used_free_sample = true` e `users.free_sample_used_at = NOW()` **ao abrir esta tela** (não ao pagar)
- Motivo: o usuário JÁ consumiu o crédito ao ver a amostra

**Se clicar "Não é isso que quero":**
```
"Entendemos. O que não estava certo?"

○ O estilo não era o que imaginei
○ As cores não combinaram
○ A disposição das fotos não gostei
○ Outro: [campo texto]

[ Encerrar ]
```
Registra feedback em analytics. Exibe:
```
"Sua amostra gratuita foi utilizada.
Esperamos te ver em breve! 👋

Se quiser tentar um estilo diferente, você pode
criar um novo álbum com pagamento direto."
```

**Edge cases:**
- Usuário fica parado na tela por mais de 30min: lembrete gentil via push/in-app
- Usuário não acessa o preview em 24h: e-mail automático "Sua amostra está esperando por você"

---

### T6 — PAGAMENTO

**O que o usuário vê:**
```
"Confirmar pedido"

📖 Álbum Print — 15 páginas
Estilo: Romântico | Ocasião: Casamento
R$ 49,90

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pagar com Pix

[QR Code]

Código: XXXX XXXX XXXX [copiar]

Expira em: 15:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **Seu álbum será criado especialmente para você.**
**Por ser personalizado e gerado sob demanda, não
aceitamos cancelamentos ou reembolsos após o pagamento.**
```

**Interações disponíveis:**
- Copiar código Pix
- Aguardar confirmação (polling automático)
- Cancelar (antes de pagar) → volta para T5

**Backend:**
- Mercado Pago API: criar preferência de pagamento Pix
- Webhook Mercado Pago: quando `status='approved'` → atualiza `album_sessions.status = 'paid'`
- Redirect automático para T7 após confirmação
- Timeout do Pix: 30 minutos (padrão Mercado Pago)

**Edge cases:**
- Pix expirado: "O tempo expirou. Gerar novo código?" → botão para regenerar
- Pagamento duplicado (bug de rede): idempotência por `session_id`, não cobrar duas vezes
- Webhook não chegou: polling manual a cada 30s em `/api/payment/status?sessionId=...`
- Falha no Mercado Pago: "Sistema de pagamento indisponível. Tente novamente em alguns minutos."

---

### T7 — UPLOAD COMPLETO

**O que o usuário vê:**
```
"Agora envie todas as fotos do seu álbum"

Máximo de 40 fotos. Arraste aqui ou clique para selecionar.

┌──────────────────────────────────────────────────┐
│                                                  │
│  📎  Arraste as fotos aqui                       │
│     ou clique para selecionar                    │
│                                                  │
└──────────────────────────────────────────────────┘

[grid de preview após upload — 4 colunas]

"Essas são todas as fotos que vão aparecer no seu álbum.
 Certifique-se de que estão todas corretas."

[ Confirmar fotos → ]
```

**Interações disponíveis:**
- Drag & drop de múltiplos arquivos
- File picker (aceita: JPG, PNG, HEIC, WebP)
- Grid de preview após seleção (reordenáveis via drag)
- Remover foto individual (× no canto de cada thumb)
- Adicionar mais fotos (clique em área livre do grid)

**Backend:**
1. Upload em batch para Supabase Storage: `storage/albums/{session_id}/full/{uuid}.jpg`
2. Conversão HEIC → JPG via sharp (server-side)
3. Geração de thumbnails para o grid
4. Atualiza `album_sessions.photo_count`

**Edge cases:**
- Mais de 40 fotos: "Você selecionou 47 fotos. Máximo é 40. Por favor, selecione as mais importantes."
- Fotos de resolução muito baixa (< 500px): aviso individual por foto, não bloquear
- Upload interrompido: retomar de onde parou (chunked upload)
- Foto corrompida: "Não conseguimos processar 1 foto. As demais foram enviadas." + identificar qual

---

### T8 — AGRUPAMENTO

**O que o usuário vê:**
```
"Como você quer organizar as fotos?"

Você pode deixar com a gente, ou customizar
quais fotos ficam na mesma página.

┌──────────────────────────────────┐
│  🤖  Deixa com a gente          │
│     A IA decide o melhor layout  │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  ✏️  Quero customizar           │
│     Escolho quais ficam juntas   │
└──────────────────────────────────┘
```

**Se "Deixa com a gente":**
- Salva `album_sessions.groupings = null`
- Vai para T9

**Se "Quero customizar" — Interface de agrupamento:**
```
Toque para selecionar fotos que ficarão na mesma página.

[foto1] [foto2] [foto3] [foto4] [foto5] [foto6] ...
← scroll horizontal →

[foto2+foto3 selecionadas → animação de sobreposição → stack]
  Badge: "Mesma página"

Tap no stack → opção: [Separar] ou [Cancelar]
Fotos não agrupadas = uma página cada.
Drag para reordenar.

[ Pronto, usar essa organização → ]
```

**Regras da interface:**
- Máximo de 3 fotos por grupo (página triple)
- Ordem dentro do grupo: definida pelo usuário (drag dentro do grupo)
- Ordem das páginas: drag do grupo inteiro
- Grupos aparecem como cards com badge "2 fotos" / "3 fotos"

**Backend:**
```json
album_sessions.groupings = [
  { "group_id": "g1", "photos": ["uuid1"], "order": 0 },
  { "group_id": "g2", "photos": ["uuid2", "uuid3"], "order": 1 },
  { "group_id": "g3", "photos": ["uuid4", "uuid5", "uuid6"], "order": 2 }
]
```

**Edge cases:**
- Usuário agrupa todas as fotos em grupos de 3 com 10 páginas: aviso "Você tem fotos demais para essa quantidade de páginas. Algumas páginas terão layout diferente."
- Usuário não agrupa nada no modo customizado: aviso "Nenhum grupo criado. Quer deixar a IA decidir?"

---

### T9 — AJUSTE FINAL

**O que o usuário vê:**
```
"Algum detalhe para ajustar?"

Você tem uma oportunidade de pedir mudanças.
Após isso, geramos seu álbum completo.

[capa da amostra]   [spread da amostra]
← swipe →

Toque em qualquer área para anotar um detalhe.

Exemplos de ajustes:
[Muda o fundo]  [Outra foto na capa]  [Fonte mais elegante]  [Menos ornamentos]

Alguma instrução geral?
┌────────────────────────────────────────────────┐
│ Ex: "Quero mais espaço em branco nas páginas"  │
└────────────────────────────────────────────────┘

⚠️ Após confirmar, o álbum será gerado.
   Não será possível fazer mais alterações.

[  Gerar álbum completo →  ]
```

**Interações de anotação:**
1. Toque em área da imagem → popup aparece na área tocada
2. Popup: "O que você quer diferente aqui?" + campo texto
3. Confirmar → pin colorido fica na área anotada
4. Múltiplos pins permitidos (máx 5)
5. Tap em pin existente → editar ou remover
6. Chips de sugestão (tap adiciona ao campo geral)
7. Campo geral para instrução abrangente

**Backend:**
```json
album_sessions.adjustment_annotations = {
  "pins": [
    {
      "x_percent": 0.25,
      "y_percent": 0.60,
      "page": "cover",
      "note": "Coloca outra foto aqui, essa ficou meio escura"
    }
  ],
  "general_instruction": "Quero fontes mais elegantes e menos ornamentos"
}
```

**Edge cases:**
- Usuário clica "Gerar álbum completo" sem nenhuma anotação: pop-up de confirmação "Você não anotou nenhum ajuste. Quer gerar o álbum exatamente como está na amostra?"
- Usuário fecha o app após anotar mas antes de confirmar: anotações salvas automaticamente (auto-save a cada mudança)

---

### T10 — GERAÇÃO (Loading Screen)

**Regra crítica:** Não pode ser um spinner genérico. Esta tela deve ser bonita.

**O que o usuário vê:**
```
"Seu álbum está sendo criado com carinho ✨"

[animação: ícone de álbum sendo "construído" magicamente
 páginas surgindo uma a uma, elementos aparecendo,
 foto entrando em cada slot — animação Lottie ou CSS pura]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Analisando suas fotos..."

Pronto em aproximadamente 8 minutos.
Você receberá um e-mail quando estiver pronto.
Pode fechar o app com tranquilidade. 📨
```

**Mensagens alternadas a cada 20 segundos:**
1. "Analisando suas fotos..."
2. "Criando o design personalizado..."
3. "Compondo as páginas..."
4. "Ajustando os detalhes..."
5. "Verificando a qualidade..."
6. "Quase lá..."

**Backend:**
- Cria `generation_jobs` com `type='full'`, `status='queued'`
- Pipeline dos 4 agentes (ver Seção 4)
- Progresso atualizado em `generation_jobs.pages_done`
- Frontend polling a cada 10s em `/api/generation/status`
- Ao concluir: e-mail enviado via Resend/SendGrid + redirect automático para T11

**Edge cases:**
- Usuário fecha o app: e-mail de conclusão é o mecanismo principal
- Timeout > 30min: alerta para Mewto (Telegram), revisão manual, e-mail para usuário "Seu álbum está demorando um pouco mais que o esperado. Avisaremos em breve."
- Falha em 1 página: retry nessa página, não na geração inteira
- Falha total: e-mail para usuário + alerta Mewto, reembolso manual decidido caso a caso

---

### T11 — ENTREGA

**O que o usuário vê:**
```
"Seu álbum está pronto! 🎉"

[preview de todas as páginas em scroll horizontal]
[cada página clicável para ver em full screen]

┌──────────────────────────────────────┐
│  📥  Baixar PDF para impressão       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  🔗  Compartilhar prévia             │
└──────────────────────────────────────┘

─────────────────────────────────────
📖 Como imprimir seu álbum
Guia de gráficas parceiras →
─────────────────────────────────────
```

**Interações disponíveis:**
- Download do PDF (armazenado em Supabase Storage, link com expiração de 7 dias)
- "Compartilhar prévia" → link público watermarked (ex: `momentu.com/preview/{token}`)
- Guia de gráficas → página com instruções detalhadas de como enviar para impressão

**Backend:**
- PDF final armazenado em Supabase Storage: `storage/albums/{session_id}/final/album.pdf`
- Link de preview público: imagens comprimidas (72 DPI) com watermark "MOMENTU PREVIEW"
- Atualiza `album_sessions.status = 'done'`
- Atualiza `generation_jobs.status = 'done'`, `completed_at = NOW()`, `result_url = <PDF URL>`

**IHM — Captura de aprendizado:**
Após entrega bem-sucedida, gravar episódio no IHM:
```typescript
ihm_store({
  content: `Álbum gerado: style=${style}, ocasião=${occasion}, palette=${palette}, pages=${pageCount}, groupings=${hasGroupings}, adjustments=${annotationCount}`,
  project: "albumapp",
  importance: 3
})
```

**Edge cases:**
- PDF corrompido: validação automática com pdf-lib antes de liberar download
- Download falha: retry automático, link alternativo via e-mail
- Usuário tenta baixar após 7 dias: "Seu link expirou. Enviamos um novo para o seu e-mail."

---

## 3. Fluxo Completo — Produto Digital

O fluxo Digital usa as mesmas telas T1 a T4, com adaptações nas perguntas do questionário.

### 3.1 Diferenças no questionário

**P5 — PLATAFORMA** (substitui P5-Print que era "Tamanho"):

```
Progresso: 5/6

"Para qual plataforma você quer criar o conteúdo?"

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  📸          │ │  📱          │ │  🎵          │
│  Instagram   │ │  Instagram   │ │  TikTok      │
│  Feed        │ │  Stories     │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│  👥          │ │  🌐          │
│  Facebook    │ │  Todos       │
│              │ │              │
└──────────────┘ └──────────────┘
```

Salva em `questionnaire.platform`.
Se "Todos" → entrega todos os formatos.

**P6-Digital — LEGENDA** (pergunta extra, entre P5-Digital e Mensagem):

```
Progresso: 5.5/6

"Quer texto ou legenda em cada imagem?"

○  Sim — em todas as imagens
○  Só na primeira
○  Não — só as fotos

[ Continuar → ]
```

Salva em `questionnaire.caption_style`.

**P6 — MENSAGEM:** Igual ao Print.

### 3.2 Divergência pós-T5 (Preview)

Após confirmar "Quero esse conteúdo!" em T5:
- T6: Pagamento → valor fixo R$ 29,90 (independente de plataforma)
- T7: Upload completo (máx 20 fotos para digital)
- T8: Agrupamento → **não existe para digital** (pula direto para T9)
- T9: Ajuste Final → adaptado (mostra previews no formato da plataforma escolhida)
- T10: Geração
- T11: Entrega

### 3.3 Especificações de output

| Plataforma | Dimensões | Máx slides | Formato |
|-----------|-----------|-----------|--------|
| Instagram Feed | 1080×1080px | 10 slides | PNG |
| Instagram Stories | 1080×1920px | 10 slides | PNG |
| TikTok | 1080×1920px | 10 slides | PNG |
| Facebook | 1200×630px | 10 slides | PNG |
| "Todos" | Todos acima | 10 slides cada | ZIP com pastas |

### 3.4 Precificação Digital

**R$ 29,90** — inclui todos os formatos selecionados.
Se "Todos": todos os formatos incluídos no mesmo preço.

---

## 4. Arquitetura dos Agentes AI

A geração de cada álbum passa por **4 agentes em sequência**. Os agentes são funções TypeScript em `lib/agents/`.

```
Fotos + Questionnaire + Groupings + Reference
         ↓
    [Agente 1: Curador]
         ↓ page_structure.json
    [Agente 2: Designer]
         ↓ bg.svg + elements.json + typography.json
    [Agente 3: Compositor]
         ↓ page_01.png ... page_N.png
    [Agente 4: Quality Checker]
         ↓ pass/fail
    [pdf-lib: montar PDF]
         ↓
    album.pdf (300 DPI, print-ready)
```

---

### Agente 1 — Curador

**Arquivo:** `lib/agents/curator.ts`

**Input:**
```typescript
interface CuratorInput {
  photos: PhotoMeta[]        // metadados de cada foto (sem enviar binário)
  groupings: Grouping[] | null
  questionnaire: Questionnaire
  reference: ReferenceNotes | null
  pageCount: number
}

interface PhotoMeta {
  id: string
  url: string
  width: number
  height: number
  fileSizeKb: number
  orientation: 'portrait' | 'landscape' | 'square'
  uploadOrder: number        // ordem em que o usuário fez upload
}
```

**Tasks (em ordem):**
1. Analisar cada foto: orientação, qualidade estimada por resolução, aspecto
2. Se `groupings != null`: respeitar agrupamentos do usuário (não reagrupar)
3. Se `groupings == null`: agrupar fotos por semelhança/sequência de upload
4. Atribuir tipo de página a cada grupo:
   - 1 foto: `photo_single`
   - 2 fotos: `photo_double`
   - 3 fotos: `photo_triple`
   - Página com mensagem especial: `text_focus`
   - Primeira página: `cover`
   - Última página: `back_cover`
5. Garantir **pacing**: variar layouts. Regra: nunca mais de 3 páginas do mesmo tipo seguidas
6. Cover: foto de melhor resolução com orientação compatível com 20×20 (preferencialmente paisagem ou quadrada)
7. Back cover: última foto ou mais "leve" da coleção (menos ocupada visualmente)

**Output:**
```typescript
interface PageStructure {
  pages: Page[]
}

interface Page {
  type: 'cover' | 'photo_single' | 'photo_double' | 'photo_triple' | 'text_focus' | 'back_cover'
  photos: string[]           // IDs das fotos
  text?: string              // texto para text_focus ou mensagem especial
  order: number
}
```

**Exemplo de output JSON:**
```json
{
  "pages": [
    { "type": "cover", "photos": ["uuid_7"], "order": 0 },
    { "type": "photo_double", "photos": ["uuid_1", "uuid_2"], "order": 1 },
    { "type": "photo_single", "photos": ["uuid_3"], "order": 2 },
    { "type": "text_focus", "photos": [], "text": "Para a minha mãe, com todo o amor do mundo", "order": 3 },
    { "type": "photo_triple", "photos": ["uuid_4", "uuid_5", "uuid_6"], "order": 4 },
    { "type": "back_cover", "photos": ["uuid_12"], "order": 5 }
  ]
}
```

**Modelo:** Gemini 2.5 Flash (análise de metadados + lógica de pacing)
**Fallback:** Se análise falha, usar ordem de upload + tipo baseado em count

---

### Agente 2 — Designer de Fundo

**Arquivo:** `lib/agents/designer.ts`

**Input:**
```typescript
interface DesignerInput {
  style: 'romantic' | 'classic' | 'vibrant' | 'minimal' | 'vintage' | 'bohemian'
  palette_id: string | 'ai_choice'
  occasion: string
  reference_album_id?: string
  adjustment_annotations?: AdjustmentAnnotations
  format: 'print_20x20'   // v1 só suporta 20×20
}
```

**Tasks:**
1. Selecionar ou gerar `bg.svg` para o álbum inteiro
   - O fundo deve ser **consistente** em todas as páginas (mesma identidade)
   - Variações sutis por tipo de página são permitidas
2. **Regras obrigatórias para o SVG:**
   - Decoração **apenas nas bordas/cantos** (margens de até 15% do canvas)
   - Zona central 70% do canvas: completamente limpa
   - Deve funcionar em P&B (gráficas monocromáticas)
   - Saturação máxima dos elementos decorativos: 40% (não competem com fotos)
3. Gerar elementos decorativos SVG compatíveis com o estilo (max 5 elementos por página)
4. Definir tokens tipográficos:
   ```typescript
   typography: {
     titleFont: string,    // Google Fonts URL
     bodyFont: string,
     titleSize: number,    // em % do canvas height
     bodySize: number,
     titleColor: string,   // hex
     bodyColor: string
   }
   ```

**Output:**
```typescript
interface DesignerOutput {
  bgSvgUrl: string          // SVG do fundo carregado no storage
  elementsSvgUrls: string[] // SVGs dos elementos decorativos
  typography: TypographyTokens
  paletteResolved: {        // paleta final usada (se era 'ai_choice', registrar o que foi escolhido)
    primary: string
    secondary: string
    accent: string
    text: string
    bg: string
  }
}
```

**Lógica de seleção de paleta:**
```
if palette_id == 'ai_choice':
  → cruzar style + occasion → tabela de paletas recomendadas
  → ex: romantic + wedding → paleta 1 (rosa/creme/dourado)
  → ex: classic + graduation → paleta 3 (preto/branco/dourado)
else:
  → usar paleta selecionada pelo usuário (id da lista curada)
```

**Modelo:** Gemini 2.5 Flash com geração de SVG ou seleção de library curada de SVGs

---

### Agente 3 — Compositor

**Arquivo:** `lib/agents/compositor.ts`

**Input:** Output dos Agentes 1 e 2 + URLs das fotos

**Tasks:**
1. Para cada página em `page_structure.pages`:
   a. Carregar `bg.svg` como imagem base no Konva (server-side via `canvas` npm package)
   b. Aplicar layout correto para o `type` da página (slots de `PageLayout`)
   c. Carregar cada foto no slot correspondente
   d. Aplicar elementos decorativos
   e. Renderizar texto (títulos, mensagens) com tokens tipográficos
   f. Exportar página como PNG com `pixelRatio = 3.94` (300 DPI para 20×20cm)
2. Verificar cada PNG exportado (não corrompido, dimensões corretas)
3. Combinar todos os PNGs em PDF via pdf-lib:
   - Dimensões: 200×200mm (mais 3mm bleed = 206×206mm)
   - Formato: RGB, compatível com gráficas modernas
   - Metadados: título, data, "Gerado por Momentu AI"

**Output:**
- PDF final em Supabase Storage
- Array de URLs das páginas individuais PNG (para preview em T11)

**Resolução de exportação por formato:**
```
Print 20×20: canvas display ~600px → export pixelRatio=3.94 → 2362×2362px (300 DPI)
Digital 1:1: canvas display ~540px → export pixelRatio=2 → 1080×1080px
Digital 9:16: canvas display ~540px → export pixelRatio=2 → 1080×1920px
```

---

### Agente 4 — Quality Checker

**Arquivo:** `lib/agents/quality-checker.ts`

**Input:** Array de URLs dos PNGs gerados

**Checklist (tudo programático, sem AI):**
1. ✅ **Todas as fotos usadas:** comparar `page_structure.pages[].photos` com lista de uploads
2. ✅ **Contraste de texto:** calcular luminosidade de fundo na área do texto, verificar ratio WCAG (mínimo 4.5:1)
3. ✅ **Zona central limpa:** analisar pixel density de elementos decorativos na zona central (70% do canvas), flag se > 5% de pixels saturados
4. ✅ **Dimensões corretas:** verificar resolução de cada PNG exportado
5. ✅ **PDF válido:** tentar abrir com pdf-lib, verificar página count

**Output:**
```typescript
interface QualityReport {
  pass: boolean
  score: number      // 0-100
  issues: {
    type: 'missing_photo' | 'low_contrast' | 'cluttered_center' | 'wrong_resolution' | 'pdf_error'
    page?: number
    detail: string
    severity: 'warning' | 'fail'
  }[]
}
```

**Política de falha:**
- Se `pass = false` com qualquer `severity = 'fail'`: tentar **1 regeneração automática** (do Agente 3, com mesmo input + nota sobre o problema)
- Se segunda tentativa também falha: alertar Mewto via Telegram + aguardar revisão manual
- Se `pass = true` mas com warnings: registrar no log, não bloquear entrega

---

### IHM — Integração de Aprendizado

**Antes de cada geração (sample ou full):**
```typescript
const context = await ihm_recall(`álbum estilo ${style} ocasião ${occasion} paleta ${palette}`, 'albumapp')
// Injetar context nos prompts dos Agentes 1 e 2
```

**Após cada álbum entregue (T11):**
```typescript
await ihm_store({
  content: `Álbum ${session_id}: style=${style}, occasion=${occasion}, palette=${palette}, pages=${pageCount}, groupings_provided=${hasGroupings}, adjustments_count=${annotationCount}, quality_score=${qcScore}`,
  project: "albumapp",
  importance: 3
})
```

**Após feedback de qualidade (rubrica do mês 1):**
```typescript
await ihm_store({
  content: `Score mês 1 sessão ${session_id}: visual_bg=${score1}, layout=${score2}, style_coherence=${score3}, typography=${score4}, fidelity=${score5}. Notas: ${notes}`,
  project: "albumapp",
  importance: 4
})
```

---

## 5. Schema do Banco de Dados

### 5.1 Alterações na tabela `users` (existente)

```sql
ALTER TABLE users
  ADD COLUMN used_free_sample    BOOLEAN    DEFAULT FALSE,
  ADD COLUMN free_sample_used_at TIMESTAMPTZ;
```

---

### 5.2 Tabela `album_sessions` (nova)

```sql
CREATE TABLE album_sessions (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID         REFERENCES users(id) ON DELETE CASCADE,

  product_type            TEXT         NOT NULL
                          CHECK (product_type IN ('print', 'digital')),

  status                  TEXT         NOT NULL DEFAULT 'questionnaire'
                          CHECK (status IN (
                            'questionnaire',     -- preenchendo o questionário
                            'sample_requested',  -- amostra em geração
                            'sample_ready',      -- amostra gerada, aguardando decisão
                            'paid',              -- pagamento confirmado
                            'uploading',         -- upload completo em andamento
                            'generating',        -- geração completa em andamento
                            'done',              -- álbum entregue
                            'abandoned'          -- usuário saiu sem comprar
                          )),

  questionnaire           JSONB,        -- respostas completas do questionário
  reference_album_id      UUID         REFERENCES gallery_albums(id),

  photo_count             INT,
  page_count              INT,

  format                  TEXT
                          CHECK (format IN (
                            'print_20x20',
                            'digital_square',
                            'digital_story',
                            'digital_landscape',
                            'digital_all'
                          )),

  price                   NUMERIC(10,2),
  payment_id              TEXT,         -- ID da transação no Mercado Pago

  groupings               JSONB,        -- agrupamentos definidos pelo usuário (null = AI decide)
  adjustment_annotations  JSONB,        -- anotações da tela de ajuste (T9)

  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_album_sessions_updated_at
  BEFORE UPDATE ON album_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX idx_album_sessions_user_id ON album_sessions(user_id);
CREATE INDEX idx_album_sessions_status  ON album_sessions(status);
CREATE INDEX idx_album_sessions_created ON album_sessions(created_at DESC);
```

---

### 5.3 Tabela `generation_jobs` (nova)

```sql
CREATE TABLE generation_jobs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        REFERENCES album_sessions(id) ON DELETE CASCADE,

  type          TEXT        NOT NULL
                CHECK (type IN ('sample', 'full')),

  status        TEXT        NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'processing', 'done', 'failed')),

  pages_total   INT,
  pages_done    INT         NOT NULL DEFAULT 0,

  result_url    TEXT,       -- URL do PDF final ou pasta de imagens digitais
  page_urls     JSONB,      -- array de URLs das páginas individuais PNG
  error         TEXT,       -- mensagem de erro se status='failed'

  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_session ON generation_jobs(session_id);
CREATE INDEX idx_generation_jobs_status  ON generation_jobs(status);
```

---

### 5.4 Tabela `gallery_albums` (nova)

```sql
CREATE TABLE gallery_albums (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,

  style         TEXT        NOT NULL
                CHECK (style IN ('romantic', 'classic', 'vibrant', 'minimal', 'vintage', 'bohemian')),

  occasion      TEXT        NOT NULL
                CHECK (occasion IN ('wedding', 'birthday', 'baby', 'travel', 'family', 'graduation', 'other')),

  product_type  TEXT        NOT NULL DEFAULT 'print'
                CHECK (product_type IN ('print', 'digital')),

  thumbnail_url TEXT,       -- URL da primeira página (preview principal)
  preview_pages JSONB,      -- array de URLs: 3–4 páginas para hover preview
  is_featured   BOOLEAN     NOT NULL DEFAULT FALSE,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_albums_style    ON gallery_albums(style);
CREATE INDEX idx_gallery_albums_occasion ON gallery_albums(occasion);
CREATE INDEX idx_gallery_albums_featured ON gallery_albums(is_featured) WHERE is_featured = TRUE;
```

---

## 6. Alterações no Codebase

### 6.1 Deprecar / Substituir

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `app/criar/[templateId]/page.tsx` | Manter como review step apenas | Editor DIY não existe mais |
| `components/templates-gallery.tsx` | Substituir | Galeria agora é de álbuns gerados, não templates |

### 6.2 Criar (novos arquivos)

```
app/
├── page.tsx                                  ← REESCREVER: galeria INSPIRE
├── criar/
│   ├── page.tsx                              ← REESCREVER: wizard de questionário (T3)
│   ├── amostra/
│   │   └── page.tsx                          ← CRIAR: upload amostra (T4) + preview (T5)
│   └── [sessionId]/
│       ├── upload/
│       │   └── page.tsx                      ← CRIAR: upload completo pós-pagamento (T7)
│       ├── agrupamento/
│       │   └── page.tsx                      ← CRIAR: agrupamento (T8)
│       ├── ajuste/
│       │   └── page.tsx                      ← CRIAR: ajuste/anotação (T9)
│       ├── gerando/
│       │   └── page.tsx                      ← CRIAR: loading screen (T10)
│       └── pronto/
│           └── page.tsx                      ← CRIAR: entrega (T11)
└── api/
    ├── generation/
    │   ├── route.ts                          ← CRIAR: trigger de geração (sample + full)
    │   └── status/
    │       └── route.ts                      ← CRIAR: polling de status
    ├── payment/
    │   ├── route.ts                          ← CRIAR: criar preferência Mercado Pago
    │   └── webhook/
    │       └── route.ts                      ← CRIAR: webhook Mercado Pago
    └── gallery/
        └── route.ts                          ← CRIAR: listar álbuns da galeria

lib/
├── agents/
│   ├── curator.ts                            ← CRIAR: Agente 1
│   ├── designer.ts                           ← CRIAR: Agente 2
│   ├── compositor.ts                         ← CRIAR: Agente 3
│   └── quality-checker.ts                   ← CRIAR: Agente 4
├── types.ts                                  ← ATUALIZAR: adicionar novos tipos
└── pdf-generator.ts                          ← MANTER: sem alterações

components/
├── inspire-gallery.tsx                       ← CRIAR: grid de álbuns (T1)
├── questionnaire-wizard.tsx                  ← CRIAR: wizard multi-step (T3)
├── photo-grouping.tsx                        ← CRIAR: interface de agrupamento (T8)
├── annotation-canvas.tsx                     ← CRIAR: canvas de anotação (T9)
└── konva-editor.tsx                          ← MANTER: usado no review step
```

### 6.3 Manter sem alteração

- `lib/types.ts` — adicionar tipos, não remover existentes
- `lib/pdf-generator.ts` — usado pelo Compositor (Agente 3)
- `components/konva-editor.tsx` — usado no review step interno

### 6.4 Novos tipos a adicionar em `lib/types.ts`

```typescript
// Tipos do AI Flow
export type ProductType = 'print' | 'digital'
export type AlbumStatus = 'questionnaire' | 'sample_requested' | 'sample_ready' | 'paid' | 'uploading' | 'generating' | 'done' | 'abandoned'
export type PageType = 'cover' | 'photo_single' | 'photo_double' | 'photo_triple' | 'text_focus' | 'back_cover'
export type StyleType = 'romantic' | 'classic' | 'vibrant' | 'minimal' | 'vintage' | 'bohemian'
export type OccasionType = 'wedding' | 'birthday' | 'baby' | 'travel' | 'family' | 'graduation' | 'other'
export type PlatformType = 'instagram_feed' | 'instagram_stories' | 'tiktok' | 'facebook' | 'all'

export interface Questionnaire {
  product_type: ProductType
  occasion: OccasionType
  occasion_custom?: string
  style: StyleType
  palette_id: string | 'ai_choice'
  page_count?: number          // só print
  platform?: PlatformType      // só digital
  caption_style?: 'all' | 'first_only' | 'none'  // só digital
  special_message?: string
  reference_notes?: {
    liked: string
    different: string
  }
}

export interface AlbumSession {
  id: string
  user_id: string
  product_type: ProductType
  status: AlbumStatus
  questionnaire: Questionnaire
  reference_album_id?: string
  photo_count?: number
  page_count?: number
  format?: string
  price?: number
  payment_id?: string
  groupings?: Grouping[] | null
  adjustment_annotations?: AdjustmentAnnotations
  created_at: string
  updated_at: string
}

export interface Grouping {
  group_id: string
  photos: string[]    // IDs das fotos
  order: number
}

export interface AdjustmentAnnotations {
  pins: AnnotationPin[]
  general_instruction?: string
}

export interface AnnotationPin {
  x_percent: number   // 0-1
  y_percent: number   // 0-1
  page: 'cover' | 'spread'
  note: string
}

export interface GenerationJob {
  id: string
  session_id: string
  type: 'sample' | 'full'
  status: 'queued' | 'processing' | 'done' | 'failed'
  pages_total?: number
  pages_done: number
  result_url?: string
  page_urls?: string[]
  error?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface GalleryAlbum {
  id: string
  title: string
  style: StyleType
  occasion: OccasionType
  product_type: ProductType
  thumbnail_url?: string
  preview_pages?: string[]
  is_featured: boolean
  created_at: string
}
```

---

## 7. Precificação Final

| Produto | Quantidade | Preço |
|---------|-----------|-------|
| Print | 10 páginas | **R$ 39,90** |
| Print | 12 páginas | **R$ 44,90** |
| Print | 15 páginas | **R$ 49,90** |
| Print | 20 páginas | **R$ 59,90** |
| Digital | Todos os formatos | **R$ 29,90** |

**Regras de negócio:**
- Amostra gratuita: 1 por usuário (controlado por `users.used_free_sample`)
- Sem desconto, sem cupom (v1)
- Sem assinatura, sem recorrência (v1)
- Sem parcelamento — Pix apenas (v1)

---

## 8. Mês 1 — Validação Manual (Harness de Qualidade)

### 8.1 Por que manual

No Mês 1, os prompts dos agentes ainda estão em calibração. Antes de automatizar a entrega completamente, **Mewto supervisiona cada geração** e **Jether aprova cada álbum** antes do usuário receber.

Isso garante:
- Zero álbum ruim chegando ao usuário
- Dados de qualidade para refinar os prompts
- Identificação rápida de edge cases

### 8.2 Processo de Validação

```
1. Usuário completa o fluxo até "Gerar álbum completo →" (T9)
2. Status: album_sessions.status = 'generating'
3. Pipeline AI executa (Agentes 1-4)
4. Quality Checker roda automaticamente
5. Resultado vai para FILA DE REVISÃO (não entregue ainda)
6. Mewto recebe alerta: "Álbum X pronto para revisão"
   → Mewto verifica: prompts usados, output de cada agente, PNG gerado
   → Mewto abre o PDF internamente
7. Se OK: Mewto aprova → status = 'done' → usuário recebe e-mail
8. Se tem problema: Mewto regenera manualmente (ajustando prompts)
9. Jether recebe o álbum aprovado + rubrica para scoring
10. Jether preenche rubrica e retorna para Mewto
11. Mewto grava resultado no IHM
```

### 8.3 Rubrica de Avaliação

Jether avalia cada álbum de 1 a 5 em cada dimensão:

| Dimensão | 1 | 3 | 5 |
|----------|---|---|---|
| **Qualidade visual do fundo** | Fundo feio/inadequado | Fundo ok, não impressiona | Fundo lindo, profissional |
| **Layout das fotos por página** | Fotos mal posicionadas, cortadas | Layout funcional | Composição perfeita |
| **Coerência de estilo (início→fim)** | Páginas sem relação visual | Coerência parcial | Álbum tem identidade clara |
| **Tipografia e texto** | Fonte errada, ilegível | Tipografia ok | Tipografia elegante e harmônica |
| **Fidelidade ao estilo pedido** | Totalmente diferente do pedido | Similar ao pedido | Exatamente o que o usuário quis |

**Campos adicionais:**
- Observações livres (o que errou, o que acertou)
- Sugestão de ajuste de prompt

### 8.4 Meta e Critérios de Automação

**Meta do Mês 1:** 20–30 álbuns gerados e avaliados com rubrica.

**Critério para remover revisão manual:**
- Score médio ≥ 4.0 em todas as dimensões nas últimas 10 gerações consecutivas
- Zero `severity='fail'` no Quality Checker nas últimas 10 gerações
- Aprovado por Jether

---

## 9. Política de Uso e Textos Legais

### 9.1 Texto obrigatório — Telas onde aparece

Aparece em **T6 (Pagamento)** em destaque negrito:

> **Seu álbum será criado especialmente para você. Por ser personalizado e gerado sob demanda, não aceitamos cancelamentos ou reembolsos após o pagamento.**

Aparece em **T9 (Ajuste Final)** no rodapé:

> **Após confirmar, o álbum será gerado. Não será possível fazer mais alterações.**

Aparece no **e-mail de confirmação de pagamento:**

> Seu pedido foi confirmado. Seu álbum personalizado está sendo criado pela nossa IA. Por ser um produto sob demanda, não realizamos cancelamentos ou reembolsos após a confirmação do pagamento.

### 9.2 Termos de serviço (link no footer)

Texto completo nos Termos de Serviço (página separada), cobrindo:
- Uso das fotos enviadas (processadas apenas para gerar o álbum, não usadas para treinar modelos sem consentimento)
- Armazenamento das fotos (deletadas após 30 dias da entrega)
- Política de não-reembolso detalhada
- Uso aceitável (sem fotos de terceiros sem permissão, sem conteúdo ilegal)

---

## 10. Alertas e Monitoramento Operacional

### 10.1 Alertas para Mewto via Telegram

| Evento | Mensagem |
|--------|---------|
| Amostra falha 2x | `⚠️ AMOSTRA FALHOU: session_id=${id} — revisar` |
| Geração completa falha 2x | `🚨 GERAÇÃO FALHOU: session_id=${id} — revisão urgente` |
| Quality Checker fail | `📋 QC FAIL: session_id=${id}, issue=${issue}` |
| Álbum pronto (mês 1) | `✅ ÁLBUM PRONTO: session_id=${id} — aguarda revisão Mewto` |
| Pagamento confirmado | `💰 PAGAMENTO: session_id=${id}, R$${price}` |

### 10.2 Logs obrigatórios

Cada job de geração deve logar:
- Timestamp de início de cada agente
- Tokens usados por agente (custo de API)
- Resultado do Quality Checker com score detalhado
- Tamanho do PDF gerado
- Tempo total de geração

---

## 11. Fluxo de Dados — Diagrama Simplificado

```
Usuário
  │
  ├── T1: INSPIRE (gallery_albums)
  ├── T2: LOGIN (Supabase Auth)
  │         ↓ create album_sessions
  ├── T3: QUESTIONÁRIO (update album_sessions.questionnaire)
  ├── T4: UPLOAD AMOSTRA (Supabase Storage)
  │         ↓ create generation_jobs (type='sample')
  │         ↓ Agentes 1+2+3+4 → 2 páginas PNG
  ├── T5: PREVIEW AMOSTRA (update users.used_free_sample=true)
  ├── T6: PAGAMENTO (Mercado Pago → webhook → update status='paid')
  ├── T7: UPLOAD COMPLETO (Supabase Storage)
  ├── T8: AGRUPAMENTO (update album_sessions.groupings)
  ├── T9: AJUSTE FINAL (update album_sessions.adjustment_annotations)
  │         ↓ create generation_jobs (type='full')
  │         ↓ Agentes 1+2+3+4 → N páginas PNG → PDF
  ├── T10: GERAÇÃO (polling generation_jobs.status)
  └── T11: ENTREGA (update status='done' → download PDF)
```

---

## 12. Stack Técnico Resumido

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js (App Router) | 14+ |
| Canvas | react-konva / konva (server) | existente |
| PDF | pdf-lib | existente |
| Imagem | sharp | existente |
| Auth | Supabase Auth (magic link) | existente |
| DB | Supabase PostgreSQL | existente |
| Storage | Supabase Storage | existente |
| Pagamento | Mercado Pago API | novo |
| AI | Gemini 2.5 Flash | novo |
| Memória | IHM (project="albumapp") | existente |
| E-mail | Resend | novo |
| Hosting | Vercel | existente |

---

*Documento criado por Mewto (OpenClaw) em 2026-02-19.*
*Aprovação: Jether Rodrigues.*
*Próxima revisão: após Mês 1 de validação ou quando score médio atingir ≥ 4.0.*
