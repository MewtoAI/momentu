import { PhotoGrouping, AlbumQuestionnaire } from '@/lib/types'
import { getStyleLayouts } from '@/lib/styles'

export interface PhotoMeta {
  id: string
  url: string
  width: number
  height: number
  isPortrait: boolean  // height > width
}

export interface PagePlan {
  index: number
  layoutType: 'cover' | 'single' | 'double' | 'triple' | 'text_focus' | 'back_cover'
  photos: PhotoMeta[]
  textHints: string[]  // sugestões de texto para essa página
}

export function planAlbum(
  photos: PhotoMeta[],
  questionnaire: AlbumQuestionnaire,
  groupings: PhotoGrouping[],
  pageCount: number
): PagePlan[] {
  const plans: PagePlan[] = []

  // Capa (sempre primeira)
  plans.push({
    index: 0,
    layoutType: 'cover',
    photos: photos.slice(0, 1),
    textHints: [questionnaire.specialMessage || 'Nosso Álbum']
  })

  // Se usuário definiu agrupamentos, usá-los
  // Senão, distribuir automaticamente
  const innerPhotos = photos.slice(1)
  const innerPageCount = pageCount - 2  // -capa e -contracapa

  if (groupings.length > 0) {
    // Usar agrupamentos do usuário
    groupings.forEach((group, i) => {
      if (i >= innerPageCount) return
      const groupPhotos = group.photoIds
        .map(id => photos.find(p => p.id === id))
        .filter(Boolean) as PhotoMeta[]
      const layoutType = decideLayout(groupPhotos)
      plans.push({ index: i + 1, layoutType, photos: groupPhotos, textHints: [] })
    })
  } else {
    // Distribuição automática: agrupar portraits juntos, landscapes sozinhos
    let photoIndex = 0
    for (let i = 0; i < innerPageCount && photoIndex < innerPhotos.length; i++) {
      const photo = innerPhotos[photoIndex]

      // A cada 4 páginas, inserir uma text_focus
      if (i > 0 && i % 4 === 3 && innerPhotos.length - photoIndex > 1) {
        plans.push({ index: i + 1, layoutType: 'text_focus', photos: [photo], textHints: [] })
        photoIndex++
        continue
      }

      // Landscape: sozinha na página
      if (!photo.isPortrait) {
        plans.push({ index: i + 1, layoutType: 'single', photos: [photo], textHints: [] })
        photoIndex++
        continue
      }

      // Portrait: verificar se próxima também é portrait → agrupar em double
      const nextPhoto = innerPhotos[photoIndex + 1]
      if (nextPhoto?.isPortrait && photoIndex + 1 < innerPhotos.length) {
        plans.push({
          index: i + 1,
          layoutType: 'double',
          photos: [photo, nextPhoto],
          textHints: []
        })
        photoIndex += 2
      } else {
        plans.push({ index: i + 1, layoutType: 'single', photos: [photo], textHints: [] })
        photoIndex++
      }
    }
  }

  // Contracapa (sempre última)
  plans.push({
    index: pageCount - 1,
    layoutType: 'back_cover',
    photos: [],
    textHints: ['momentu', 'Feito com amor ♥']
  })

  return plans
}

function decideLayout(photos: PhotoMeta[]): PagePlan['layoutType'] {
  if (photos.length === 0) return 'text_focus'
  if (photos.length === 1) return 'single'
  if (photos.length === 2) return 'double'
  return 'triple'
}
