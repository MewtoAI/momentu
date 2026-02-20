/**
 * Creative Director Agent
 * Creates detailed storyboard for photo albums with emotional captions and layout decisions
 */

import OpenAI from 'openai'
import { AnalyzedPhoto } from './vision-analyzer'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return openai
}

export interface PageSlot {
  x: number
  y: number
  w: number
  h: number
  ratio: 'portrait' | 'landscape' | 'square' | 'auto'
  cropFocus?: 'top' | 'center' | 'bottom' | 'attention'  // onde focar no crop
}

export interface TextOverlay {
  content: string
  subContent?: string                   // subtítulo/data
  position: 'top' | 'center' | 'bottom'
  color: string                         // harmoniza com o fundo DALL-E. Ex: "#4a3728", "#2c2c2c", "#7a6250"
  fontSize: 'large' | 'medium' | 'small'
  // ⛔ NUNCA há background/overlay. Texto flutua limpo sobre o fundo natural do layout.
}

export interface AlbumPage {
  index: number
  layoutType: 'cover_photo' | 'cover_elegant' | 'cover_minimal' | 'full_bleed' | 'portrait_single' | 'landscape_single' | 'double_portrait' | 'double_landscape' | 'triple' | 'text_focus'
  photoIds: string[]
  slots: PageSlot[]
  textOverlay?: TextOverlay   // texto com contraste garantido
  mood: string
  bgPrompt: string            // prompt para DALL-E gerar o fundo
}

export interface AlbumStoryboard {
  albumTitle: string
  narrative: string     // 2-3 frases descrevendo a história do álbum
  pages: AlbumPage[]
}

export interface DirectorInput {
  photos: AnalyzedPhoto[]
  questionnaire: {
    occasion: string
    style: string
    names?: string
    specialMessage?: string
    period?: string
  }
  pageCount: number
  isSample: boolean
}

/**
 * Constrói o prompt minucioso para o Diretor Criativo
 */
function buildDirectorPrompt(input: DirectorInput): string {
  const { photos, questionnaire, pageCount, isSample } = input
  const { occasion, style, names, specialMessage, period } = questionnaire

  const photoSummary = photos.map(p => 
    `ID: ${p.id} | Orientação: ${p.analysis.suggestedSlot} | Brilho: ${p.analysis.brightness} | Rostos: ${p.analysis.faceArea} | Conteúdo: ${p.analysis.content} | Emoção: ${p.analysis.emotion} | Tipo: ${p.analysis.type} | Qualidade: ${p.analysis.quality}`
  ).join('\n')

  return `Você é um diretor criativo sênior especializado em álbuns de fotos de memórias.
Sua função é criar o storyboard de um álbum que vai emocionar profundamente quem o receber.

CONTEXTO DO USUÁRIO:
- Ocasião: ${occasion}
- Estilo visual: ${style}
- Nomes: ${names || 'não informado'}
- Mensagem especial: ${specialMessage || 'não informada'}
- Data/período: ${period || 'não informado'}
- Tipo de produto: álbum impresso (print)
- Total de fotos disponíveis: ${photos.length}
- Páginas a criar: ${pageCount}${isSample ? ' (AMOSTRA — apenas capa + 1 página interior)' : ''}

FOTOS DISPONÍVEIS (analisadas):
${photoSummary}

REGRAS DE NARRATIVA (seguir obrigatoriamente):
1. O álbum conta uma HISTÓRIA com arco narrativo: abertura impactante → desenvolvimento → clímax emocional → desfecho íntimo
2. A CAPA deve ser impactante. Use o tipo de capa certo para as fotos disponíveis (ver TIPOS DE CAPA abaixo).
3. Alterne ritmos: página de foto grande → duas fotos menores → página de texto → volta para foto grande
4. NUNCA coloque duas fotos de tipo idêntico lado a lado (dois retratos de expressão similar)
5. Prefira fotos portrait em slots portrait, landscape em slots landscape
6. A cada 4-5 páginas, inclua uma página de texto/citação para dar respiração visual
7. O desfecho deve ser íntimo e emotivo — não termine com festa ou grupo grande

TIPOS DE CAPA (escolha baseado nas fotos disponíveis):
- "cover_photo": Foto do usuário ocupa toda a capa — SEM texto, puro visual. A foto fala por si. Use para fotos de qualidade "excellent". Slots: [{"x":0, "y":0, "w":1, "h":1, "ratio":"auto"}]. textOverlay: omitir (não incluir no JSON).
- "cover_elegant": Fundo DALL-E lindo domina + foto pequena centralizada como detalhe + título elegante sobre o fundo. Slots: [{"x":0.35, "y":0.22, "w":0.3, "h":0.42, "ratio":"portrait", "cropFocus":"center"}]. textOverlay com position "bottom" sobre o fundo.
- "cover_minimal": Apenas fundo DALL-E + título + data. Pura tipografia sobre o fundo gerado. Slots: []. textOverlay obrigatório, position "center".

QUANDO usar cada tipo:
- cover_photo: foto de qualidade excellent, impacto visual total, casamento/bebê/formatura
- cover_elegant: foto disponível mas não perfeita para capa inteira, estilo romantic/vintage/bohemian
- cover_minimal: estilo classic/minimal, ou quando o Diretor quer que a primeira foto interior seja o impacto

REGRAS DE TEXTO — SOFISTICAÇÃO MÁXIMA (SEGUIR OBRIGATORIAMENTE):
⛔ PROIBIDO ABSOLUTAMENTE: faixa, band, overlay escuro/claro, retângulo semi-transparente por trás do texto. Isso é design barato de anos 2010.
⛔ PROIBIDO: texto sobre foto do usuário. Texto NÃO vai sobre as fotos do usuário. Nunca.

✅ TEXTO APENAS nas áreas de fundo DALL-E visível:
- Em "landscape_single": texto vai no espaço acima ou abaixo da foto (posição top ou bottom), onde só o fundo aparece
- Em "portrait_single": texto vai na faixa inferior pequena, abaixo do slot, sobre o fundo
- Em "cover_elegant" e "cover_minimal": texto fica no centro da página sobre o fundo lindo
- Em "cover_photo": textOverlay é OPCIONAL — só adicione se a foto tiver area natural limpa onde o fundo ainda aparece nas bordas. Se a foto domina tudo, deixe sem texto na capa — a elegância é o visual da foto sem perturbação.
- Em "double_portrait" e "double_landscape": caption vai embaixo, na pequena faixa do fundo

✅ Cor do texto harmoniza com o fundo DALL-E gerado:
- Estilo romantic (rose/cream): color "#7a5c4a" (marrom rosado quente)
- Estilo classic (white/gold): color "#2c2c2c" (preto suave)
- Estilo vintage (sepia): color "#5c4030" (marrom vintage)
- Estilo minimal (white/gray): color "#3a3a3a" (cinza escuro elegante)
- Estilo vibrant: color "#2c2c2c"
- Estilo bohemian (terracotta): color "#4a3020" (marrom quente)

✅ Tipografia discreta: fontSize "small" ou "medium" para captions. "large" só para título principal na capa de cover_elegant/cover_minimal.

REGRAS DE CROP INTELIGENTE (faceArea → cropFocus):
- Para cada slot com pessoas, defina cropFocus baseado no faceArea da foto:
  * faceArea "upper" → cropFocus: "top" (garante que a cabeça não seja cortada)
  * faceArea "center" → cropFocus: "center"
  * faceArea "lower" → cropFocus: "bottom"
  * faceArea "none" → cropFocus: "attention" (crop automático por saliência visual)
- NUNCA coloque uma foto com faceArea "upper" em um slot que forçaria crop do topo

REGRAS DE LAYOUT (páginas interiores):
- "full_bleed": 1 foto borda a borda, fundo quase invisível. Slots: [{"x":0, "y":0, "w":1, "h":0.85, "ratio":"auto", "cropFocus":"center"}]
- "portrait_single": 1 foto retrato com margens generosas, fundo à mostra. Slots: [{"x":0.1, "y":0.06, "w":0.8, "h":0.78, "ratio":"portrait", "cropFocus":"center"}]
- "landscape_single": 1 foto landscape centralizada, fundo à mostra acima/abaixo. Slots: [{"x":0.05, "y":0.18, "w":0.9, "h":0.6, "ratio":"landscape", "cropFocus":"center"}]
- "double_portrait": 2 fotos retrato lado a lado, espaço entre elas. Slots: [{"x":0.03, "y":0.08, "w":0.45, "h":0.75, "ratio":"portrait", "cropFocus":"center"}, {"x":0.52, "y":0.08, "w":0.45, "h":0.75, "ratio":"portrait", "cropFocus":"center"}]
- "double_landscape": 2 fotos landscape empilhadas. Slots: [{"x":0.05, "y":0.05, "w":0.9, "h":0.42, "ratio":"landscape", "cropFocus":"center"}, {"x":0.05, "y":0.53, "w":0.9, "h":0.42, "ratio":"landscape", "cropFocus":"center"}]
- "triple": 1 foto grande + 2 pequenas. Slots: [{"x":0.03, "y":0.05, "w":0.55, "h":0.88, "ratio":"portrait", "cropFocus":"center"}, {"x":0.61, "y":0.05, "w":0.36, "h":0.42, "ratio":"portrait"}, {"x":0.61, "y":0.51, "w":0.36, "h":0.42, "ratio":"portrait"}]
- "text_focus": Só texto, nenhuma foto. Slots: []

REGRAS DO BG_PROMPT (para DALL-E gerar o fundo):
- O fundo deve complementar as fotos, NUNCA competir com elas
- Fundos devem ser SUTIS: texturas, gradientes, elementos decorativos discretos
- Para estilo "romantic": "soft watercolor floral background, pale rose and cream tones, delicate botanical elements, premium paper texture"
- Para estilo "classic": "clean white background with subtle gold geometric border, premium quality, minimalist, elegant"
- Para estilo "vintage": "aged paper texture, sepia tones, subtle vintage botanical illustrations in corners"
- Para estilo "vibrant": "soft colorful gradient background, warm tones, subtle bokeh effect, premium"
- Para estilo "minimal": "pure white background, very subtle light gray geometric lines, ultra minimalist"
- Para estilo "bohemian": "warm terracotta and sage green tones, subtle hand-drawn botanical elements, organic texture"
- SEMPRE terminar bg_prompt com: ", no faces, no people, no text, seamless pattern for photo album"
- Para cover_elegant e cover_minimal: bgPrompt deve ser especialmente bonito — é o elemento visual principal da capa

REGRAS DE TEXTO (textOverlay):
- Sempre defina textOverlay para pages que têm texto (capa, captions)
- content: título do álbum na capa, ou caption emocional nas páginas interiores
- subContent: data/subtítulo apenas na capa
- Captions devem ser emocionais, específicas (não genéricas como "Dia especial")
- Use os nomes fornecidos. Máximo 15 palavras. Em português brasileiro.
- Para casamento: captions que emocionam

RETORNE SOMENTE JSON VÁLIDO (sem markdown, sem explicação):
{
  "albumTitle": "string",
  "narrative": "string (2-3 frases descrevendo a história do álbum)",
  "pages": [
    {
      "index": 0,
      "layoutType": "cover_photo",
      "photoIds": ["id_da_foto"],
      "slots": [{"x": 0, "y": 0, "w": 1, "h": 1, "ratio": "auto", "cropFocus": "center"}],
      "textOverlay": {
        "content": "Sarah & João",
        "subContent": "17 de dezembro de 2025",
        "position": "bottom",
        "color": "#7a5c4a",
        "fontSize": "large"
      },
      "mood": "string",
      "bgPrompt": "string (prompt para DALL-E gerar o fundo)"
    }
  ]
}`
}

/**
 * Extrai JSON de uma resposta que pode conter markdown code blocks
 */
function extractJSON(text: string): string {
  let cleaned = text.trim()
  
  // Tenta encontrar JSON dentro de code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }
  
  // Remove possíveis prefixos/sufixos não-JSON
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
  }
  
  return cleaned
}

/**
 * Cria o storyboard do álbum com o Diretor Criativo
 */
export async function createStoryboard(input: DirectorInput): Promise<AlbumStoryboard | null> {
  const maxRetries = 2
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const prompt = buildDirectorPrompt(input)

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o', // Claude Sonnet 4.6 seria melhor, mas usamos GPT-4o
        messages: [
          {
            role: 'system',
            content: 'Você é um diretor criativo sênior brasileiro especializado em álbuns de fotos emocionantes. Responda APENAS com JSON válido, sem markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Temperatura alta para criatividade
        max_tokens: 4000,
      })

      const responseText = completion.choices[0].message.content?.trim() || ''
      
      if (!responseText) {
        console.error(`Creative Director returned empty response (attempt ${attempt + 1})`)
        continue
      }

      const jsonText = extractJSON(responseText)
      
      let storyboard: AlbumStoryboard
      try {
        storyboard = JSON.parse(jsonText)
      } catch (parseError) {
        console.error(`JSON parse error (attempt ${attempt + 1}):`, parseError)
        console.error('Raw response:', responseText.substring(0, 500))
        continue
      }
      
      // Validar estrutura
      if (!storyboard.pages || !Array.isArray(storyboard.pages) || storyboard.pages.length === 0) {
        console.error(`Invalid storyboard structure (attempt ${attempt + 1}):`, storyboard)
        continue
      }

      // Validar que cada página tem photoIds válidos
      const validPhotoIds = new Set(input.photos.map(p => p.id))
      for (const page of storyboard.pages) {
        if (!page.photoIds || !Array.isArray(page.photoIds)) {
          page.photoIds = []
        }
        // Filtrar IDs inválidos
        page.photoIds = page.photoIds.filter(id => validPhotoIds.has(id))
      }

      console.log(`Creative Director: storyboard created with ${storyboard.pages.length} pages`)
      return storyboard

    } catch (error) {
      console.error(`Creative Director error (attempt ${attempt + 1}):`, error)
      if (attempt === maxRetries) {
        return null
      }
      // Espera antes de retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return null
}
