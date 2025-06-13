import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

async function analyzeScraps() {
  console.log('Fetching sample scraps from database...\n')
  
  // Fetch a diverse sample of scraps
  const { data: scraps, error } = await supabase
    .from('scraps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15)
  
  if (error) {
    console.error('Error fetching scraps:', error)
    return
  }
  
  console.log(`Total scraps fetched: ${scraps.length}\n`)
  
  // Analyze structure
  if (scraps.length > 0) {
    console.log('=== SCRAP STRUCTURE ===')
    const firstScrap = scraps[0]
    const fields = Object.keys(firstScrap).sort()
    console.log('Fields:', fields.join(', '))
    console.log('\n')
    
    // Analyze content richness
    console.log('=== CONTENT ANALYSIS ===')
    let contentStats = {
      hasContent: 0,
      hasSummary: 0,
      hasTitle: 0,
      hasUrl: 0,
      hasScreenshot: 0,
      hasMetadataImages: 0,
      hasTags: 0,
      hasSource: 0,
      avgContentLength: 0,
      avgSummaryLength: 0
    }
    
    let totalContentLength = 0
    let totalSummaryLength = 0
    
    scraps.forEach((scrap, i) => {
      if (scrap.content) {
        contentStats.hasContent++
        totalContentLength += scrap.content.length
      }
      if (scrap.summary) {
        contentStats.hasSummary++
        totalSummaryLength += scrap.summary.length
      }
      if (scrap.title) contentStats.hasTitle++
      if (scrap.url) contentStats.hasUrl++
      if (scrap.screenshot_url) contentStats.hasScreenshot++
      if (scrap.metadata?.images?.length > 0 || scrap.metadata?.image) contentStats.hasMetadataImages++
      if (scrap.tags?.length > 0) contentStats.hasTags++
      if (scrap.source) contentStats.hasSource++
    })
    
    contentStats.avgContentLength = Math.round(totalContentLength / contentStats.hasContent)
    contentStats.avgSummaryLength = Math.round(totalSummaryLength / contentStats.hasSummary)
    
    console.log('Content field populated:', `${contentStats.hasContent}/${scraps.length}`)
    console.log('Summary field populated:', `${contentStats.hasSummary}/${scraps.length}`)
    console.log('Title field populated:', `${contentStats.hasTitle}/${scraps.length}`)
    console.log('URL field populated:', `${contentStats.hasUrl}/${scraps.length}`)
    console.log('Screenshot URL populated:', `${contentStats.hasScreenshot}/${scraps.length}`)
    console.log('Metadata images available:', `${contentStats.hasMetadataImages}/${scraps.length}`)
    console.log('Tags populated:', `${contentStats.hasTags}/${scraps.length}`)
    console.log('Source populated:', `${contentStats.hasSource}/${scraps.length}`)
    console.log('\nAverage content length:', contentStats.avgContentLength, 'chars')
    console.log('Average summary length:', contentStats.avgSummaryLength, 'chars')
    
    // Show example scraps
    console.log('\n\n=== EXAMPLE SCRAPS ===')
    
    // Find a scrap with rich content
    const richScrap = scraps.find(s => s.content && s.summary && s.tags?.length > 0)
    if (richScrap) {
      console.log('\n--- RICH CONTENT EXAMPLE ---')
      console.log('ID:', richScrap.id)
      console.log('Title:', richScrap.title || 'No title')
      console.log('Source:', richScrap.source)
      console.log('Type:', richScrap.type)
      console.log('Tags:', richScrap.tags?.join(', ') || 'No tags')
      console.log('Content preview:', richScrap.content?.substring(0, 200) + '...')
      console.log('Summary preview:', richScrap.summary?.substring(0, 200) + '...')
      console.log('URL:', richScrap.url || 'No URL')
      console.log('Has screenshot:', !!richScrap.screenshot_url)
      console.log('Created:', new Date(richScrap.created_at).toLocaleString())
    }
    
    // Find a scrap with just a link
    const linkScrap = scraps.find(s => !s.content && s.url)
    if (linkScrap) {
      console.log('\n--- LINK-ONLY EXAMPLE ---')
      console.log('ID:', linkScrap.id)
      console.log('Title:', linkScrap.title || 'No title')
      console.log('Source:', linkScrap.source)
      console.log('Type:', linkScrap.type)
      console.log('Tags:', linkScrap.tags?.join(', ') || 'No tags')
      console.log('URL:', linkScrap.url)
      console.log('Has metadata:', !!linkScrap.metadata)
      if (linkScrap.metadata) {
        console.log('Metadata keys:', Object.keys(linkScrap.metadata).join(', '))
      }
    }
    
    // Show source distribution
    console.log('\n\n=== SOURCE DISTRIBUTION ===')
    const sourceCounts = {}
    scraps.forEach(scrap => {
      const source = scrap.source || 'unknown'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`${source}: ${count}`)
    })
    
    // Show type distribution
    console.log('\n=== TYPE DISTRIBUTION ===')
    const typeCounts = {}
    scraps.forEach(scrap => {
      const type = scrap.type || 'unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${type}: ${count}`)
    })
    
    // Show full structure of one scrap
    console.log('\n\n=== FULL SCRAP STRUCTURE (First Item) ===')
    console.log(JSON.stringify(scraps[0], null, 2))
  }
}

analyzeScraps().catch(console.error)