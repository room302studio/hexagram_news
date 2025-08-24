/**
 * Demo Scraper with Error Handler Integration
 * 
 * This demonstrates how to use the error handler with actual scraping operations.
 * Shows graceful degradation and error recovery during demos.
 */

import { scraperErrorHandler, ErrorTypes } from './error-handler.js'

/**
 * Mock HTTP client - replace with your actual HTTP client (fetch, axios, etc.)
 */
class MockHttpClient {
  static async fetch(url, options = {}) {
    const timeout = options.timeout || 10000
    
    // Simulate various failure scenarios for demo
    const domain = new URL(url).hostname
    
    // Simulate some domains being problematic
    if (domain.includes('paywall-news.com')) {
      return {
        status: 200,
        text: () => Promise.resolve(`
          <html>
            <body>
              <h1>Breaking News</h1>
              <p>This is a preview. Subscribe now to read the full article...</p>
              <div class="paywall">Sign up for our premium subscription</div>
            </body>
          </html>
        `)
      }
    }
    
    if (domain.includes('js-heavy.com')) {
      return {
        status: 200,
        text: () => Promise.resolve(`
          <html>
            <body>
              <p>Please enable JavaScript to view this content</p>
              <script>document.body.innerHTML = "This content was loaded by JavaScript"</script>
            </body>
          </html>
        `)
      }
    }
    
    if (domain.includes('flaky-server.com')) {
      // Simulate intermittent failures
      if (Math.random() < 0.7) {
        const error = new Error('Network error')
        error.code = 'ECONNRESET'
        throw error
      }
    }
    
    if (domain.includes('not-found.com')) {
      return {
        status: 404,
        text: () => Promise.resolve('<html><body><h1>404 Not Found</h1></body></html>')
      }
    }
    
    if (domain.includes('rate-limited.com')) {
      return {
        status: 429,
        text: () => Promise.resolve('<html><body><h1>Too Many Requests</h1></body></html>')
      }
    }
    
    if (domain.includes('dns-error.com')) {
      const error = new Error('getaddrinfo ENOTFOUND')
      error.code = 'ENOTFOUND'
      throw error
    }
    
    // Simulate successful scraping for other domains
    return {
      status: 200,
      text: () => Promise.resolve(`
        <html>
          <head>
            <title>Sample Article - ${domain}</title>
            <meta property="og:title" content="Sample Article">
            <meta property="og:description" content="This is a sample article description">
          </head>
          <body>
            <article>
              <h1>Sample News Article</h1>
              <p>This is the main content of the article. It contains important information about the topic.</p>
              <p>Additional paragraphs with more details and analysis.</p>
            </article>
          </body>
        </html>
      `)
    }
  }
}

/**
 * Extract content from HTML using basic parsing
 */
function extractContent(html, url) {
  // Simple content extraction (replace with your actual parser)
  const titleMatch = html.match(/<title[^>]*>([^<]+)</title>/i)
  const h1Match = html.match(/<h1[^>]*>([^<]+)</h1>/i)
  const metaDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
  
  // Extract article text (very basic)
  const articleMatch = html.match(/<article[^>]*>(.*?)<\/article>/is)
  let content = ''
  if (articleMatch) {
    content = articleMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  return {
    title: titleMatch?.[1] || h1Match?.[1] || 'No title',
    description: metaDescMatch?.[1] || '',
    content,
    url,
    extractedAt: new Date().toISOString(),
    contentLength: content.length
  }
}

/**
 * Main scraping operation wrapped with error handler
 */
export async function scrapeUrl(url, options = {}) {
  const { timeout = 10000, userAgent = 'Demo-Scraper/1.0' } = options
  
  return await scraperErrorHandler.wrap(
    url,
    async () => {
      // Perform the actual HTTP request
      const response = await MockHttpClient.fetch(url, {
        timeout,
        headers: {
          'User-Agent': userAgent
        }
      })
      
      // Get the HTML content
      const html = await response.text()
      
      // Attach response info for error classification
      const error = new Error('HTTP Error')
      error.response = response
      error.content = html
      
      // Check for HTTP errors
      if (response.status >= 400) {
        throw error
      }
      
      // Extract structured content
      const extracted = extractContent(html, url)
      
      return {
        ...extracted,
        httpStatus: response.status,
        success: true
      }
    },
    { source: 'demo-scraper', userAgent }
  )
}

/**
 * Batch scraping with error handling demo
 */
export async function scrapeUrls(urls, options = {}) {
  const { concurrency = 3, timeout = 10000 } = options
  
  // Prepare operations for batch processing
  const operations = urls.map(url => ({
    url,
    operation: () => scrapeUrl(url, { timeout }).then(result => result.data || result),
    context: { batch: true, timestamp: Date.now() }
  }))
  
  return await scraperErrorHandler.wrapBatch(operations, {
    concurrency,
    continueOnError: true,
    collectErrors: true
  })
}

/**
 * Demo function to show error handler in action
 */
export async function runScrapingDemo() {
  console.log('🕷️  Starting web scraping demo with error handling...\n')
  
  // Test URLs that demonstrate different error scenarios
  const testUrls = [
    'https://example.com/article1',
    'https://paywall-news.com/premium-article',
    'https://js-heavy.com/spa-content', 
    'https://flaky-server.com/unreliable',
    'https://not-found.com/missing-page',
    'https://rate-limited.com/popular-article',
    'https://dns-error.com/article',
    'https://good-site.com/normal-article',
    'https://another-good-site.com/story'
  ]
  
  console.log('📋 Test URLs:', testUrls.length)
  console.log('⚡ Testing concurrent scraping with error handling...\n')
  
  const startTime = Date.now()
  const result = await scrapeUrls(testUrls, { 
    concurrency: 4, 
    timeout: 5000 
  })
  const duration = Date.now() - startTime
  
  console.log('✅ Scraping completed!')
  console.log(`⏱️  Duration: ${duration}ms`)
  console.log(`📊 Success rate: ${(result.summary.successRate * 100).toFixed(1)}%`)
  console.log(`✅ Successful: ${result.summary.succeeded}`)
  console.log(`❌ Failed: ${result.summary.failed}\n`)
  
  // Show successful results
  if (result.results.length > 0) {
    console.log('🎉 SUCCESSFUL SCRAPES:')
    result.results.forEach(item => {
      console.log(`  ✅ ${item.url}`)
      console.log(`     Title: ${item.data.title}`)
      console.log(`     Content: ${item.data.contentLength} chars`)
      console.log('')
    })
  }
  
  // Show errors with their classifications
  if (result.errors.length > 0) {
    console.log('⚠️  HANDLED ERRORS:')
    result.errors.forEach(item => {
      console.log(`  ❌ ${item.url}`)
      console.log(`     Error: ${item.error.type}`)
      console.log(`     Message: ${item.error.message}`)
      console.log(`     Can retry: ${item.error.canRetry}`)
      console.log('')
    })
  }
  
  // Show circuit breaker status
  console.log('🔧 CIRCUIT BREAKER STATUS:')
  const cbStatus = scraperErrorHandler.getCircuitBreakerStatus()
  if (Object.keys(cbStatus.failures).length === 0) {
    console.log('  All domains operational')
  } else {
    Object.entries(cbStatus.failures).forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count} failures`)
    })
  }
  
  console.log('\n🎬 Demo completed! The error handler prevented crashes and provided structured error information.')
  
  return result
}

/**
 * Integration example for Nuxt/Vue application
 */
export async function scrapeForApp(url) {
  console.log(`🔍 Scraping: ${url}`)
  
  const result = await scrapeUrl(url)
  
  if (result.success) {
    console.log('✅ Scraping successful')
    return {
      success: true,
      article: result.data,
      metadata: result.metadata
    }
  } else {
    console.log(`❌ Scraping failed: ${result.error.type}`)
    
    // Return partial data or fallback based on error type
    return {
      success: false,
      error: result.error,
      fallback: {
        title: `Failed to load: ${result.error.type}`,
        content: 'Content could not be retrieved due to technical issues.',
        url,
        timestamp: new Date().toISOString()
      }
    }
  }
}