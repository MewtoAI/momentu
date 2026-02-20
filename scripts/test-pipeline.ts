/**
 * Test Pipeline - Downloads sample wedding photos and runs complete AI pipeline
 */

import { analyzePhotos, PhotoInput } from '../lib/agents/vision-analyzer'
import { createStoryboard, DirectorInput } from '../lib/agents/creative-director'
import { generateBackgrounds, BackgroundRequest } from '../lib/agents/bg-generator'
import { composePages, PageComposition } from '../lib/agents/compositor'
import { assemblePDF } from '../lib/agents/assembler'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Verify API keys are loaded
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY not found in environment')
  process.exit(1)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Supabase credentials not found in environment')
  process.exit(1)
}

// Sample wedding photos from Unsplash (mix of portrait and landscape)
const SAMPLE_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', // couple portrait
    id: 'photo_1'
  },
  {
    url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80', // ceremony
    id: 'photo_2'
  },
  {
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80', // rings detail
    id: 'photo_3'
  },
  {
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', // landscape venue
    id: 'photo_4'
  },
  {
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80', // couple dance
    id: 'photo_5'
  }
]

const TEST_QUESTIONNAIRE = {
  occasion: 'wedding',
  style: 'romantic',
  names: 'Sarah & João',
  specialMessage: 'Para sempre juntos',
  period: '17 de dezembro de 2025'
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  // Simple PNG/JPEG dimension detection
  // For production, would use sharp or image-size
  return { width: 1200, height: 1600 } // Placeholder
}

async function runPipelineTest() {
  console.log('=== Momentu Pipeline Test ===\n')
  
  const startTime = Date.now()
  const sessionId = `test_${Date.now()}`
  const outputDir = '/tmp/test-album'
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log(`Session ID: ${sessionId}`)
  console.log(`Output: ${outputDir}\n`)

  try {
    // Prepare photo inputs
    console.log('→ Downloading sample photos...')
    const photoInputs: PhotoInput[] = []
    
    for (const photo of SAMPLE_PHOTOS) {
      const buffer = await downloadImage(photo.url)
      const dimensions = await getImageDimensions(buffer)
      
      photoInputs.push({
        id: photo.id,
        url: photo.url,
        width: dimensions.width,
        height: dimensions.height
      })
      
      // Save to output dir for reference
      fs.writeFileSync(path.join(outputDir, `${photo.id}_original.jpg`), buffer)
    }
    
    console.log(`✓ Downloaded ${photoInputs.length} photos\n`)

    // AGENT 1: Vision Analyzer
    console.log('→ AGENT 1: Vision Analyzer')
    const visionStart = Date.now()
    const analyzedPhotos = await analyzePhotos(photoInputs)
    const visionTime = Date.now() - visionStart
    
    console.log(`✓ Analysis complete in ${visionTime}ms`)
    console.log(`  Analyzed ${analyzedPhotos.length} photos`)
    
    analyzedPhotos.forEach(p => {
      console.log(`  - ${p.id}: ${p.analysis.content} (${p.analysis.emotion}, ${p.analysis.type}, ${p.analysis.quality})`)
    })
    console.log()

    // AGENT 2: Creative Director
    console.log('→ AGENT 2: Creative Director')
    const directorStart = Date.now()
    
    const directorInput: DirectorInput = {
      photos: analyzedPhotos,
      questionnaire: TEST_QUESTIONNAIRE,
      pageCount: 2, // Sample: cover + 1 interior page
      isSample: true
    }
    
    const storyboard = await createStoryboard(directorInput)
    const directorTime = Date.now() - directorStart
    
    if (!storyboard) {
      throw new Error('Creative Director failed to create storyboard')
    }
    
    console.log(`✓ Storyboard created in ${directorTime}ms`)
    console.log(`  Title: "${storyboard.albumTitle}"`)
    console.log(`  Narrative: "${storyboard.narrative}"`)
    console.log(`  Pages: ${storyboard.pages.length}`)
    
    storyboard.pages.forEach(p => {
      console.log(`  - Page ${p.index} (${p.layoutType}): ${p.photoIds.length} photos, "${p.title || p.caption || ''}"`)
    })
    
    // Save storyboard JSON
    fs.writeFileSync(
      path.join(outputDir, 'storyboard.json'),
      JSON.stringify(storyboard, null, 2)
    )
    console.log()

    // AGENT 3: DALL-E Background Generator
    console.log('→ AGENT 3: DALL-E Background Generator')
    const bgStart = Date.now()
    
    const bgRequests: BackgroundRequest[] = storyboard.pages.map(page => ({
      pageIndex: page.index,
      bgPrompt: page.bgPrompt,
      sessionId
    }))
    
    const backgrounds = await generateBackgrounds(bgRequests, 1) // 1 at a time for cost
    const bgTime = Date.now() - bgStart
    
    console.log(`✓ Backgrounds generated in ${bgTime}ms`)
    console.log(`  Generated ${backgrounds.length}/${bgRequests.length} backgrounds`)
    
    const bgMap = new Map(backgrounds.map(bg => [bg.pageIndex, bg.url]))
    console.log()

    // COMPOSITOR: Compose pages
    console.log('→ COMPOSITOR: Composing pages')
    const compStart = Date.now()
    
    const compositions: PageComposition[] = storyboard.pages.map(page => {
      const photos = page.photoIds.map((photoId, slotIndex) => {
        const photo = analyzedPhotos.find(p => p.id === photoId)
        const slot = page.slots[slotIndex]
        
        return photo && slot ? { url: photo.url, slot } : null
      }).filter((p): p is { url: string; slot: any } => p !== null)

      let text: PageComposition['text'] = undefined
      if (page.index === 0 && page.title) {
        text = { content: page.title, position: 'center', style: 'title' }
      } else if (page.caption) {
        text = { content: page.caption, position: 'bottom', style: 'caption' }
      }

      return {
        pageIndex: page.index,
        backgroundUrl: bgMap.get(page.index) || '#FFF5F7',
        photos,
        text
      }
    })
    
    const pageUrls = await composePages(compositions, sessionId)
    const compTime = Date.now() - compStart
    
    console.log(`✓ Pages composed in ${compTime}ms`)
    console.log(`  Composed ${pageUrls.length} pages`)
    
    // Download composed pages for local inspection
    for (let i = 0; i < pageUrls.length; i++) {
      const buffer = await downloadImage(pageUrls[i])
      fs.writeFileSync(path.join(outputDir, `page_${i}_composed.png`), buffer)
    }
    console.log()

    // ASSEMBLER: Generate PDF
    console.log('→ ASSEMBLER: Generating PDF')
    const pdfStart = Date.now()
    
    const pdfUrl = await assemblePDF({
      pageUrls,
      sessionId,
      format: 'print_20x20'
    })
    const pdfTime = Date.now() - pdfStart
    
    if (!pdfUrl) {
      throw new Error('PDF assembly failed')
    }
    
    console.log(`✓ PDF assembled in ${pdfTime}ms`)
    console.log(`  URL: ${pdfUrl}`)
    
    // Download PDF
    const pdfBuffer = await downloadImage(pdfUrl)
    const pdfPath = path.join(outputDir, 'album.pdf')
    fs.writeFileSync(pdfPath, pdfBuffer)
    console.log(`  Saved to: ${pdfPath}`)
    console.log()

    // Summary
    const totalTime = Date.now() - startTime
    
    console.log('=== Pipeline Complete ===')
    console.log(`Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`)
    console.log(`\nBreakdown:`)
    console.log(`  Vision Analyzer: ${visionTime}ms`)
    console.log(`  Creative Director: ${directorTime}ms`)
    console.log(`  Background Generation: ${bgTime}ms`)
    console.log(`  Page Composition: ${compTime}ms`)
    console.log(`  PDF Assembly: ${pdfTime}ms`)
    
    // Cost estimation (rough)
    const gpt4oCost = 0.0025 * (analyzedPhotos.length + 1) // $0.0025 per image analysis + storyboard
    const dalleCost = 0.04 * backgrounds.length // $0.04 per DALL-E 3 standard image
    const totalCost = gpt4oCost + dalleCost
    
    console.log(`\nEstimated cost:`)
    console.log(`  GPT-4o Vision: ~$${gpt4oCost.toFixed(4)}`)
    console.log(`  DALL-E 3: ~$${dalleCost.toFixed(4)}`)
    console.log(`  Total: ~$${totalCost.toFixed(4)}`)
    
    console.log(`\nOutput saved to: ${outputDir}`)
    console.log(`  - storyboard.json`)
    console.log(`  - page_*_composed.png`)
    console.log(`  - album.pdf`)
    
    return {
      success: true,
      totalTime,
      cost: totalCost,
      outputDir
    }

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error)
    throw error
  }
}

// Run test
runPipelineTest()
  .then(result => {
    console.log('\n✓ Test completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n✗ Test failed:', error)
    process.exit(1)
  })
