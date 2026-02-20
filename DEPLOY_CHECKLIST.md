# ✅ Deploy Checklist - Momentu AI Pipeline

## ✅ Concluído

### 1. AI Real no Pipeline (GPT-4o)
- ✅ Substituído curator burro por chamada real ao GPT-4o
- ✅ Modelo: `gpt-4o` (não mini - qualidade do produto importa)
- ✅ Fallback para curator tradicional se AI falhar
- ✅ Prompt engenheirado para gerar layouts baseados em ocasião/estilo
- ✅ Retorna JSON com estrutura de páginas + captions em PT-BR
- ✅ Campo `aiGenerated` na resposta indica se foi gerado por AI

### 2. Página de Galeria `/galeria/[id]`
- ✅ Página criada em `app/galeria/[id]/page.tsx`
- ✅ Mostra header com título, badges de estilo/ocasião/tipo
- ✅ Scroll vertical com todas as páginas preview
- ✅ CTA fixo no bottom: "✨ Quero assim — Criar o meu" → `/criar?ref={id}`
- ✅ Botão de voltar para galeria
- ✅ Layout responsivo

### 3. Gallery Card Links
- ✅ Card inteiro agora linka para `/galeria/{id}` (não mais direto para `/criar`)
- ✅ Texto mudou de "Quero assim →" para "Ver álbum →"
- ✅ CTA de criar movido para dentro da página de detail

### 4. Exemplos Reais Seedados
- ✅ Script criado: `scripts/seed-real-albums.ts`
- ✅ 3 álbuns gerados com AI real (GPT-4o):
  - **Sarah & João** (Casamento romântico) - 5 páginas
  - **Aventura pela Europa** (Viagem vibrante) - 7 páginas
  - **Nossa Família** (Família clássico) - 5 páginas
- ✅ Fotos do Unsplash por tema
- ✅ Layouts e captions gerados pela AI
- ✅ Salvos no banco com `preview_pages` + `thumbnail_url`

### 5. Build & Deploy
- ✅ `npm run build` passou sem erros
- ✅ Commit + push para `main`
- ✅ Vercel auto-deploy ativado

## ⚠️ PENDENTE: Configurar ENV VAR no Vercel

**IMPORTANTE:** Adicionar no dashboard do Vercel (Project Settings > Environment Variables):

```
OPENAI_API_KEY=<your-openai-api-key>
```

Após adicionar, fazer **redeploy** para que a nova env var seja carregada.

## 🧪 Como Testar

1. **Galeria na home:** https://momentu-eight.vercel.app
   - Verificar se os 3 álbuns novos aparecem
   - Clicar em um card → deve abrir `/galeria/{id}`

2. **Página de detail:**
   - Verificar header com badges
   - Scroll de páginas preview
   - CTA fixo no bottom
   - Link "Criar o meu" leva para `/criar?ref={id}`

3. **Pipeline de geração:**
   - Criar novo álbum (após adicionar env var no Vercel)
   - Upload de fotos
   - Gerar amostra
   - Verificar se as páginas foram criadas pela AI (captions em PT-BR)

## 📊 Custos da AI

- **Modelo:** GPT-4o
- **Custo por álbum:** ~R$0,08 (input + output tokens)
- **Justificativa:** Produto principal pago pelo usuário - qualidade > custo

## 🔧 Tecnologias Usadas

- OpenAI SDK (`openai`)
- GPT-4o
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Storage)
- Vercel (deployment)
- TypeScript + TSX (scripts)

## 📝 Arquivos Modificados

- `app/api/generation/route.ts` - AI pipeline
- `app/page.tsx` - Gallery card links
- `app/galeria/[id]/page.tsx` - Nova página de detail (criada)
- `scripts/seed-real-albums.ts` - Script de seed (criado)
- `.env.local` - OpenAI key adicionada (local only, não commitado)
- `package.json` - openai, tsx, dotenv adicionados

---

**Deploy URL:** https://momentu-eight.vercel.app
**GitHub:** https://github.com/MewtoAI/momentu
**Commit:** `42d764d` - "feat: AI real no pipeline (GPT-4o) + gallery detail page + card links para galeria + exemplos reais seedados"
