/**
 * Nuxt API Route for Web Scraping with Error Handler
 * 
 * This API endpoint demonstrates how to integrate the scraper error handler
 * with a Nuxt.js application, providing resilient scraping for the frontend.
 * 
 * Usage:
 * POST /api/scrape
 * { "url": "https://example.com/article", "options": { "timeout": 10000 } }
 * 
 * GET /api/scrape?url=https://example.com/article
 */

import { scrapeForApp, runScrapingDemo } from '../lib/scraper/demo-scraper.js'
import { scraperErrorHandler } from '../lib/scraper/error-handler.js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  
  try {
    // Handle demo endpoint
    if (query.demo === 'true') {
      const demoResult = await runScrapingDemo()
      
      return {
        success: true,
        type: 'demo',
        result: demoResult,
        message: 'Scraping demo completed successfully'
      }
    }
    
    // Handle circuit breaker status endpoint
    if (query.status === 'true') {
      const status = scraperErrorHandler.getCircuitBreakerStatus()
      
      return {
        success: true,
        type: 'status',
        circuitBreaker: status,
        message: 'Circuit breaker status retrieved'
      }
    }
    
    let url, options = {}
    
    // Parse request based on method
    if (method === 'GET') {
      url = query.url
      if (query.timeout) options.timeout = parseInt(query.timeout)
    } else if (method === 'POST') {
      const body = await readBody(event)
      url = body.url
      options = body.options || {}
    }
    
    // Validate URL
    if (!url) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'URL parameter is required'
        }
      }
    }
    
    // Validate URL format
    try {
      new URL(url)
    } catch {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Invalid URL format'
        }
      }
    }
    
    // Perform scraping with error handling
    console.log(`[API] Starting scrape for: ${url}`)
    const result = await scrapeForApp(url, options)
    
    if (result.success) {
      // Successful scraping
      return {
        success: true,
        type: 'scrape',
        data: result.article,
        metadata: result.metadata,
        message: 'Content scraped successfully'
      }
    } else {
      // Scraping failed but error was handled gracefully
      const httpStatus = getHttpStatusForErrorType(result.error.type)
      
      if (httpStatus >= 500) {
        setResponseStatus(event, httpStatus)
      }
      
      return {
        success: false,
        type: 'scrape',
        error: result.error,
        fallback: result.fallback,
        message: 'Scraping failed but was handled gracefully'
      }
    }
    
  } catch (error) {
    // Unhandled error (should be rare with proper error handler usage)
    console.error('[API] Unhandled error:', error)
    
    setResponseStatus(event, 500)
    return {
      success: false,
      error: {
        type: 'internal_error',
        message: 'An unexpected error occurred',
        canRetry: true
      },
      message: 'Internal server error'
    }
  }
})

/**
 * Map error types to appropriate HTTP status codes
 */
function getHttpStatusForErrorType(errorType) {
  const statusMap = {
    'http_error': 502, // Bad Gateway
    'paywall': 402, // Payment Required
    'javascript_required': 422, // Unprocessable Entity
    'network_error': 503, // Service Unavailable
    'dns_error': 503, // Service Unavailable
    'timeout': 504, // Gateway Timeout
    'parsing_error': 502, // Bad Gateway
    'rate_limited': 429, // Too Many Requests
    'unknown': 500 // Internal Server Error
  }
  
  return statusMap[errorType] || 500
}