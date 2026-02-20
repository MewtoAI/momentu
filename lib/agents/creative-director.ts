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
}

export interface AlbumPage {
  index: number
  layoutType: 'cover' | 'full_bleed' | 'portrait_single' | 'landscape_single' | 'double_portrait' | 'double_landscape' | 'triple' | 'text_focus'
  photoIds: string[]
  slots: PageSlot[]
  title?: string        // só para capa
  subtitle?: string     // só para capa
  caption?: string      // para páginas interiores
  mood: string
  bgPrompt: string      // prompt para DALL-E gerar o fundo
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
    `ID: ${p.id} | Orientação: ${p.analysis.suggestedSlot} | Conteúdo: ${p.analysis.content} | Emoção: ${p.analysis.emotion} | Tipo: ${p.analysis.type} | Qualidade: ${p.analysis.quality}`
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
2. A CAPA deve usar a foto mais impactante e representativa. Nunca use foto de baixa qualidade na capa.
3. Alterne ritmos: página de foto grande → duas fotos menores → página de texto → volta para foto grande
4. NUNCA coloque duas fotos de tipo idêntico lado a lado (dois retratos de expressão similar)
5. Prefira fotos portrait em slots portrait, landscape em slots landscape. Especifique o aspect_ratio de cada slot.
6. A cada 4-5 páginas, inclua uma página de texto/citação para dar respiração visual
7. O desfecho deve ser íntimo e emotivo — não termine com festa ou grupo grande

REGRAS DE LAYOUT:
- "full_bleed": 1 foto ocupando a página inteira. Slots: [{"x":0, "y":0, "w":1, "h":0.85, "ratio":"auto"}]
- "portrait_single": 1 foto retrato centralizada com margens. Slots: [{"x":0.1, "y":0.05, "w":0.8, "h":0.82, "ratio":"portrait"}]
- "landscape_single": 1 foto landscape centralizada. Slots: [{"x":0.05, "y":0.15, "w":0.9, "h":0.65, "ratio":"landscape"}]
- "double_portrait": 2 fotos retrato lado a lado. Slots: [{"x":0.03, "y":0.08, "w":0.45, "h":0.78, "ratio":"portrait"}, {"x":0.52, "y":0.08, "w":0.45, "h":0.78, "ratio":"portrait"}]
- "double_landscape": 2 fotos landscape empilhadas. Slots: [{"x":0.05, "y":0.04, "w":0.9, "h":0.44, "ratio":"landscape"}, {"x":0.05, "y":0.52, "w":0.9, "h":0.44, "ratio":"landscape"}]
- "triple": 3 fotos — 1 grande + 2 pequenas. Slots: [{"x":0.03, "y":0.05, "w":0.55, "h":0.88, "ratio":"portrait"}, {"x":0.61, "y":0.05, "w":0.36, "h":0.42, "ratio":"portrait"}, {"x":0.61, "y":0.51, "w":0.36, "h":0.42, "ratio":"portrait"}]
- "text_focus": Página de texto/citação sem foto principal. Slots: []
- "cover": Capa com foto e título. Slots: [{"x":0, "y":0, "w":1, "h":1, "ratio":"auto"}]

REGRAS DO BG_PROMPT (para DALL-E gerar o fundo):
- O fundo deve complementar as fotos, NUNCA competir com elas
- Fundos devem ser SUTIS: texturas, gradientes suaves, elementos decorativos discretos
- Para estilo "romantic": "soft watercolor floral background, pale rose and cream tones, delicate botanical elements, premium paper texture, no text, no people"
- Para estilo "classic": "clean white background with subtle gold geometric border, premium quality, minimalist, elegant"
- Para estilo "vintage": "aged paper texture, sepia tones, subtle vintage botanical illustrations in corners, no text"
- Para estilo "vibrant": "soft colorful gradient background, warm tones, subtle bokeh effect, premium"
- Para estilo "minimal": "pure white background, very subtle light gray geometric lines, ultra minimalist"
- Para estilo "bohemian": "warm terracotta and sage green tones, subtle hand-drawn botanical elements, organic texture"
- SEMPRE terminar bg_prompt com: ", no faces, no people, no text, seamless pattern for photo album"

IMPORTANTE — texto/captions:
- Captions devem ser emocionais, específicas e únicas (não genéricas como "Dia especial")
- Use os nomes fornecidos nas captions
- Captions em português brasileiro
- Máximo 15 palavras por caption
- Para casamento: captions que fazem chorar (bom senso de emoção)

RETORNE SOMENTE JSON VÁLIDO (sem markdown, sem explicação):
{
  "albumTitle": "string",
  "narrative": "string (2-3 frases descrevendo a história do álbum)",
  "pages": [
    {
      "index": 0,
      "layoutType": "cover",
      "photoIds": ["id_da_foto"],
      "slots": [{"x": 0, "y": 0, "w": 1, "h": 1, "ratio": "auto"}],
      "title": "string (só para capa)",
      "subtitle": "string (só para capa, ex: '17 de dezembro de 2025')",
      "caption": "string (para páginas interiores)",
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
