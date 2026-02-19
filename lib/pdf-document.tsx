import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

// PDF size: 200mm x 200mm square
const PAGE_SIZE = { width: '200mm', height: '200mm' } as const

interface TextSlot {
  id: string
  text: string
}

interface PhotoSlot {
  url: string | null
}

interface AlbumPageData {
  type: string
  bg: string
  bgGradient?: [string, string]
  photoSlots?: PhotoSlot[]
  textSlots?: TextSlot[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AlbumPDFProps {
  title: string
  subtitle: string
  pageCount: number
  templateColor?: string
  templateColor2?: string
  templateId?: string
  pages?: AlbumPageData[]
  photos?: string[]
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      width: '100%',
      height: '100%',
    },
    fullBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    coverContainer: {
      position: 'relative',
      width: '100%',
      height: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    coverImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    coverOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    coverTextContainer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    coverTitle: {
      fontSize: 28,
      color: '#FFFFFF',
      textAlign: 'center',
      fontFamily: 'Helvetica-Bold',
      marginBottom: 6,
    },
    coverSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      fontFamily: 'Helvetica',
    },
    photoSingleContainer: {
      flex: 1,
      padding: 24,
      flexDirection: 'column',
    },
    photoSingleImage: {
      width: '100%',
      flex: 1,
      borderRadius: 4,
    },
    photoSingleCaption: {
      fontSize: 10,
      color: '#5C5670',
      textAlign: 'center',
      marginTop: 8,
      fontFamily: 'Helvetica',
    },
    photoDoubleContainer: {
      flex: 1,
      padding: 16,
      flexDirection: 'row',
      gap: 8,
    },
    photoDoubleSlot: {
      flex: 1,
      flexDirection: 'column',
    },
    photoDoubleImage: {
      flex: 1,
      width: '100%',
      borderRadius: 4,
    },
    photoDoubleCaption: {
      fontSize: 9,
      color: '#5C5670',
      textAlign: 'center',
      marginTop: 6,
      fontFamily: 'Helvetica',
    },
    textFocusContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    textFocusHeading: {
      fontSize: 22,
      color: primaryColor,
      textAlign: 'center',
      fontFamily: 'Helvetica-Bold',
      marginBottom: 16,
      lineHeight: 1.3,
    },
    textFocusBody: {
      fontSize: 12,
      color: '#5C5670',
      textAlign: 'center',
      fontFamily: 'Helvetica',
      lineHeight: 1.6,
    },
    backCoverContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    backCoverClosing: {
      fontSize: 22,
      color: '#FFFFFF',
      textAlign: 'center',
      fontFamily: 'Helvetica-Oblique',
      marginBottom: 12,
    },
    backCoverAuthor: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.80)',
      textAlign: 'center',
      fontFamily: 'Helvetica',
      marginBottom: 40,
    },
    backCoverBrand: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.45)',
      textAlign: 'center',
      fontFamily: 'Helvetica',
    },
    photoPlaceholder: {
      flex: 1,
      backgroundColor: '#E8E4F0',
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoPlaceholderText: {
      fontSize: 10,
      color: '#8C7B82',
      fontFamily: 'Helvetica',
    },
  })

// ─── Page Renderers ───────────────────────────────────────────────────────────

function isValidPhoto(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('data:image/') || url.startsWith('http')
}

function CoverPdfPage({
  pageData,
  title,
  subtitle,
  primaryColor,
  secondaryColor,
}: {
  pageData?: AlbumPageData
  title: string
  subtitle: string
  primaryColor: string
  secondaryColor: string
}) {
  const styles = createStyles(primaryColor)
  const photo = pageData?.photoSlots?.[0]?.url
  const titleText = pageData?.textSlots?.find(s => s.id === 'title')?.text || title
  const subtitleText = pageData?.textSlots?.find(s => s.id === 'subtitle')?.text || subtitle

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      {/* Background gradient simulation (two rects) */}
      <View style={[styles.fullBg, { backgroundColor: primaryColor }]} />
      <View
        style={[
          styles.fullBg,
          {
            backgroundColor: secondaryColor,
            opacity: 0.5,
          },
        ]}
      />
      {/* Photo */}
      {isValidPhoto(photo) && (
        <Image src={photo!} style={styles.fullBg} />
      )}
      {/* Dark overlay at bottom */}
      <View style={styles.coverOverlay} />
      {/* Text */}
      <View style={styles.coverTextContainer}>
        <Text style={styles.coverTitle}>{titleText}</Text>
        <Text style={styles.coverSubtitle}>{subtitleText}</Text>
      </View>
    </Page>
  )
}

function PhotoSinglePdfPage({
  pageData,
  primaryColor,
  fallbackPhoto,
}: {
  pageData?: AlbumPageData
  primaryColor: string
  fallbackPhoto?: string
}) {
  const styles = createStyles(primaryColor)
  const photo = pageData?.photoSlots?.[0]?.url || fallbackPhoto
  const caption = pageData?.textSlots?.find(s => s.id === 'caption')?.text || ''

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={[styles.fullBg, { backgroundColor: pageData?.bg || '#FFFFFF' }]} />
      <View style={styles.photoSingleContainer}>
        {isValidPhoto(photo) ? (
          <Image src={photo!} style={styles.photoSingleImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>Foto aqui</Text>
          </View>
        )}
        {caption ? (
          <Text style={styles.photoSingleCaption}>{caption}</Text>
        ) : null}
      </View>
    </Page>
  )
}

function PhotoDoublePdfPage({
  pageData,
  primaryColor,
  fallbackPhotos,
}: {
  pageData?: AlbumPageData
  primaryColor: string
  fallbackPhotos?: (string | null)[]
}) {
  const styles = createStyles(primaryColor)
  const photo1 = pageData?.photoSlots?.[0]?.url || fallbackPhotos?.[0] || null
  const photo2 = pageData?.photoSlots?.[1]?.url || fallbackPhotos?.[1] || null
  const caption1 = pageData?.textSlots?.find(s => s.id === 'caption1')?.text || ''
  const caption2 = pageData?.textSlots?.find(s => s.id === 'caption2')?.text || ''

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={[styles.fullBg, { backgroundColor: pageData?.bg || '#FFFFFF' }]} />
      <View style={styles.photoDoubleContainer}>
        <View style={styles.photoDoubleSlot}>
          {isValidPhoto(photo1) ? (
            <Image src={photo1!} style={styles.photoDoubleImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Foto 1</Text>
            </View>
          )}
          {caption1 ? <Text style={styles.photoDoubleCaption}>{caption1}</Text> : null}
        </View>
        <View style={styles.photoDoubleSlot}>
          {isValidPhoto(photo2) ? (
            <Image src={photo2!} style={styles.photoDoubleImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Foto 2</Text>
            </View>
          )}
          {caption2 ? <Text style={styles.photoDoubleCaption}>{caption2}</Text> : null}
        </View>
      </View>
    </Page>
  )
}

function TextFocusPdfPage({
  pageData,
  primaryColor,
}: {
  pageData?: AlbumPageData
  primaryColor: string
}) {
  const styles = createStyles(primaryColor)
  const heading = pageData?.textSlots?.find(s => s.id === 'heading')?.text || 'Um momento especial'
  const body = pageData?.textSlots?.find(s => s.id === 'body')?.text || ''

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={[styles.fullBg, { backgroundColor: pageData?.bg || '#FFFFFF' }]} />
      <View style={styles.textFocusContainer}>
        <Text style={styles.textFocusHeading}>{heading}</Text>
        {body ? <Text style={styles.textFocusBody}>{body}</Text> : null}
      </View>
    </Page>
  )
}

function BackCoverPdfPage({
  pageData,
  primaryColor,
}: {
  pageData?: AlbumPageData
  primaryColor: string
}) {
  const styles = createStyles(primaryColor)
  const closing = pageData?.textSlots?.find(s => s.id === 'closing')?.text || 'com amor,'
  const author = pageData?.textSlots?.find(s => s.id === 'author')?.text || ''
  const bg = pageData?.bg || primaryColor

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={[styles.fullBg, { backgroundColor: bg }]} />
      <View style={styles.backCoverContainer}>
        <Text style={styles.backCoverClosing}>{closing}</Text>
        {author ? <Text style={styles.backCoverAuthor}>{author}</Text> : null}
        <Text style={styles.backCoverBrand}>feito com ❤️ no momentu</Text>
      </View>
    </Page>
  )
}

// ─── Legacy AlbumPDF (for backward compat) ────────────────────────────────────

interface AlbumPDFLegacyProps {
  title: string
  subtitle: string
  pageCount: number
}

export function AlbumPDF({ title, subtitle, pageCount }: AlbumPDFLegacyProps) {
  const numContentPages = Math.max(1, pageCount - 2)
  const primaryColor = '#C9607A'
  const styles = createStyles(primaryColor)

  return (
    <Document title={title} author="Momentu" creator="Momentu">
      {/* Cover */}
      <Page size={PAGE_SIZE} style={styles.page}>
        <View style={[styles.fullBg, { backgroundColor: primaryColor }]} />
        <View style={styles.coverTextContainer}>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>{subtitle}</Text>
        </View>
      </Page>

      {/* Content pages */}
      {Array.from({ length: numContentPages }, (_, i) => i).map(idx => (
        <Page key={idx} size={PAGE_SIZE} style={styles.page}>
          <View style={[styles.fullBg, { backgroundColor: '#FAF7F5' }]} />
          <View style={styles.photoSingleContainer}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Sua foto aqui</Text>
            </View>
            <Text style={styles.photoSingleCaption}>Página {idx + 2} · {title}</Text>
          </View>
        </Page>
      ))}

      {/* Back cover */}
      <Page size={PAGE_SIZE} style={styles.page}>
        <View style={[styles.fullBg, { backgroundColor: '#1A1A2E' }]} />
        <View style={styles.backCoverContainer}>
          <Text style={styles.backCoverClosing}>com amor,</Text>
          <Text style={styles.backCoverBrand}>feito com ❤️ no momentu</Text>
        </View>
      </Page>
    </Document>
  )
}

// ─── Full Album PDF ───────────────────────────────────────────────────────────

export function FullAlbumPDF({
  title,
  subtitle,
  pageCount,
  templateColor = '#C9607A',
  templateColor2 = '#A8485F',
  pages,
  photos = [],
}: AlbumPDFProps) {
  // If we have full page data, use it; otherwise fall back to simple layout
  if (pages && pages.length > 0) {
    let photoIndex = 0

    return (
      <Document title={title} author="Momentu" creator="Momentu">
        {pages.map((pg, i) => {
          switch (pg.type) {
            case 'cover':
              return (
                <CoverPdfPage
                  key={i}
                  pageData={pg}
                  title={title}
                  subtitle={subtitle}
                  primaryColor={templateColor}
                  secondaryColor={templateColor2}
                />
              )
            case 'photo_single': {
              const fallback = photos[photoIndex++] || null
              return (
                <PhotoSinglePdfPage
                  key={i}
                  pageData={pg}
                  primaryColor={templateColor}
                  fallbackPhoto={fallback || undefined}
                />
              )
            }
            case 'photo_double': {
              const fb1 = photos[photoIndex++] || null
              const fb2 = photos[photoIndex++] || null
              return (
                <PhotoDoublePdfPage
                  key={i}
                  pageData={pg}
                  primaryColor={templateColor}
                  fallbackPhotos={[fb1, fb2]}
                />
              )
            }
            case 'text_focus':
              return (
                <TextFocusPdfPage
                  key={i}
                  pageData={pg}
                  primaryColor={templateColor}
                />
              )
            case 'back_cover':
              return (
                <BackCoverPdfPage
                  key={i}
                  pageData={pg}
                  primaryColor={templateColor}
                />
              )
            default:
              return (
                <TextFocusPdfPage
                  key={i}
                  pageData={pg}
                  primaryColor={templateColor}
                />
              )
          }
        })}
      </Document>
    )
  }

  // Fallback: generate from photos array
  const numPages = Math.max(1, pageCount)

  return (
    <Document title={title} author="Momentu" creator="Momentu">
      {/* Cover */}
      <CoverPdfPage
        title={title}
        subtitle={subtitle}
        primaryColor={templateColor}
        secondaryColor={templateColor2}
        pageData={{ type: 'cover', bg: templateColor, photoSlots: photos[0] ? [{ url: photos[0] }] : [] }}
      />

      {/* Content pages with photos */}
      {Array.from({ length: Math.max(1, numPages - 2) }, (_, i) => i).map(i => {
        const photo = photos[i + 1] || null
        return (
          <PhotoSinglePdfPage
            key={i}
            primaryColor={templateColor}
            fallbackPhoto={photo || undefined}
            pageData={{
              type: 'photo_single',
              bg: '#FAF7F5',
              photoSlots: [],
              textSlots: [{ id: 'caption', text: `Página ${i + 2}` }],
            }}
          />
        )
      })}

      {/* Back cover */}
      <BackCoverPdfPage
        primaryColor={templateColor}
        pageData={{ type: 'back_cover', bg: templateColor }}
      />
    </Document>
  )
}
