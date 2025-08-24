/**
 * Comprehensive Error Handler for Web Scraper Pipeline
 * 
 * This module provides resilient error handling for web scraping operations,
 * ensuring graceful degradation and clear error reporting during demos.
 * 
 * Architecture:
 * - Wraps scraping operations with structured error handling
 * - Classifies errors by type for appropriate response strategies
 * - Provides circuit breaker pattern for failing domains
 * - Implements retry logic with exponential backoff
 * - Logs errors appropriately without crashing the pipeline
 */

import { createHash } from 'crypto'

// Error classifications for different handling strategies
export const ErrorTypes = {
  HTTP_ERROR: 'http_error',
  PAYWALL: 'paywall',
  JAVASCRIPT_REQUIRED: 'javascript_required', 
  NETWORK_ERROR: 'network_error',
  DNS_ERROR: 'dns_error',
  TIMEOUT: 'timeout',
  PARSING_ERROR: 'parsing_error',
  RATE_LIMITED: 'rate_limited',
  UNKNOWN: 'unknown'
}

// HTTP status code mappings
const HTTP_ERROR_CODES = {
  400: 'Bad Request',
  401: 'Unauthorized', 
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Rate Limited',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
}

// Common paywall indicators for detection
const PAYWALL_INDICATORS = [
  'subscribe',
  'subscription',
  'paywall',
  'premium content',
  'sign in to read',
  'register to continue',
  'unlock this article',
  'become a member',
  'this content is for subscribers',
  'continue reading with',
  'free trial',
  'monthly plan',
  'access denied'
]

// JavaScript-heavy site indicators
const JS_REQUIRED_INDICATORS = [
  'please enable javascript',
  'javascript is disabled',
  'requires javascript',
  'js is required',
  'enable js to view',
  'javascript must be enabled',
  'this site needs javascript'
]

// Circuit breaker for failing domains
class CircuitBreaker {
  constructor(failureThreshold = 5, timeoutMs = 60000) {
    this.failures = new Map() // domain -> failure count
    this.lastFailure = new Map() // domain -> timestamp
    this.failureThreshold = failureThreshold
    this.timeoutMs = timeoutMs
  }

  canAttempt(domain) {
    const failures = this.failures.get(domain) || 0
    const lastFailure = this.lastFailure.get(domain) || 0
    
    if (failures >= this.failureThreshold) {
      const timeSinceLastFailure = Date.now() - lastFailure
      return timeSinceLastFailure > this.timeoutMs
    }
    
    return true
  }

  recordFailure(domain) {
    const failures = (this.failures.get(domain) || 0) + 1
    this.failures.set(domain, failures)
    this.lastFailure.set(domain, Date.now())
  }

  recordSuccess(domain) {
    this.failures.delete(domain)
    this.lastFailure.delete(domain)
  }
}

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker()

/**
 * Structured error object for consistent error reporting
 */
class ScrapingError extends Error {
  constructor(type, message, originalError = null, metadata = {}) {
    super(message)
    this.name = 'ScrapingError'
    this.type = type
    this.originalError = originalError
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata
    }
    this.canRetry = this.determineRetryability()
  }

  determineRetryability() {
    // Determine if this error type should be retried
    const retryableTypes = [
      ErrorTypes.NETWORK_ERROR,
      ErrorTypes.TIMEOUT,
      ErrorTypes.RATE_LIMITED
    ]
    
    return retryableTypes.includes(this.type)
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      canRetry: this.canRetry,
      metadata: this.metadata,
      ...(this.originalError && {
        originalError: {
          name: this.originalError.name,
          message: this.originalError.message
        }
      })
    }
  }
}

/**
 * Classify error based on response, error type, and content
 */
function classifyError(error, response = null, content = '') {
  // HTTP status code errors
  if (response?.status) {
    const status = response.status
    
    if (status === 429) {
      return {
        type: ErrorTypes.RATE_LIMITED,
        message: `Rate limited (${status})`
      }
    }
    
    if (status === 403) {
      return {
        type: ErrorTypes.HTTP_ERROR,
        message: `Access forbidden (${status})`
      }
    }
    
    if (status === 404) {
      return {
        type: ErrorTypes.HTTP_ERROR,
        message: `Page not found (${status})`
      }
    }
    
    if (status >= 500) {
      return {
        type: ErrorTypes.HTTP_ERROR,
        message: `Server error (${status}): ${HTTP_ERROR_CODES[status] || 'Unknown'}`
      }
    }
    
    if (status >= 400) {
      return {
        type: ErrorTypes.HTTP_ERROR,
        message: `Client error (${status}): ${HTTP_ERROR_CODES[status] || 'Unknown'}`
      }
    }
  }

  // Network and connection errors
  if (error) {
    const errorMessage = error.message?.toLowerCase() || ''
    const errorCode = error.code?.toLowerCase() || ''

    // DNS errors
    if (errorMessage.includes('getaddrinfo') || 
        errorCode === 'enotfound' ||
        errorCode === 'enodata') {
      return {
        type: ErrorTypes.DNS_ERROR,
        message: 'DNS resolution failed'
      }
    }

    // Network connection errors
    if (errorMessage.includes('connect') || 
        errorMessage.includes('network') ||
        errorCode === 'econnrefused' ||
        errorCode === 'econnreset' ||
        errorCode === 'etimedout') {
      return {
        type: ErrorTypes.NETWORK_ERROR,
        message: 'Network connection failed'
      }
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || 
        errorCode === 'etimeout') {
      return {
        type: ErrorTypes.TIMEOUT,
        message: 'Request timeout'
      }
    }
  }

  // Content-based error detection
  if (content) {
    const contentLower = content.toLowerCase()
    
    // Paywall detection
    const paywallFound = PAYWALL_INDICATORS.some(indicator => 
      contentLower.includes(indicator)
    )
    if (paywallFound) {
      return {
        type: ErrorTypes.PAYWALL,
        message: 'Paywall detected'
      }
    }

    // JavaScript requirement detection
    const jsRequired = JS_REQUIRED_INDICATORS.some(indicator => 
      contentLower.includes(indicator)
    )
    if (jsRequired) {
      return {
        type: ErrorTypes.JAVASCRIPT_REQUIRED,
        message: 'JavaScript required for content rendering'
      }
    }

    // Empty or minimal content (possible JS-heavy site)
    if (content.trim().length < 100 && !contentLower.includes('<!doctype')) {
      return {
        type: ErrorTypes.JAVASCRIPT_REQUIRED,
        message: 'Minimal content detected - likely requires JavaScript'
      }
    }
  }

  // Default classification
  return {
    type: ErrorTypes.UNKNOWN,
    message: error?.message || 'Unknown error occurred'
  }
}

/**
 * Enhanced logging that doesn't crash the pipeline
 */
function logError(error, url, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    url,
    error: {
      type: error.type,
      message: error.message,
      canRetry: error.canRetry
    },
    context,
    ...(error.metadata && { metadata: error.metadata })
  }

  try {
    // Use structured logging - could integrate with your logging service
    console.error('[SCRAPER_ERROR]', JSON.stringify(logEntry, null, 2))
  } catch (loggingError) {
    // Fallback logging if JSON serialization fails
    console.error('[SCRAPER_ERROR] Failed to log error:', error.type, error.message)
  }
}

/**
 * Extract domain from URL for circuit breaker
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown-domain'
  }
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt === maxRetries || !error.canRetry) {
        break
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Main error handler wrapper for scraping operations
 */
export class ScrapingErrorHandler {
  constructor(options = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      enableCircuitBreaker: options.enableCircuitBreaker !== false,
      logErrors: options.logErrors !== false,
      ...options
    }
  }

  /**
   * Wrap a scraping operation with comprehensive error handling
   */
  async wrap(url, scrapingOperation, context = {}) {
    const domain = extractDomain(url)
    const operationId = createHash('md5').update(`${url}-${Date.now()}`).digest('hex').substring(0, 8)

    try {
      // Check circuit breaker
      if (this.options.enableCircuitBreaker && !circuitBreaker.canAttempt(domain)) {
        throw new ScrapingError(
          ErrorTypes.HTTP_ERROR,
          'Circuit breaker open - domain temporarily blocked due to repeated failures',
          null,
          { domain, operationId }
        )
      }

      // Execute operation with retry logic
      const result = await retryWithBackoff(
        async () => {
          try {
            return await scrapingOperation()
          } catch (error) {
            // Classify the error
            const classification = classifyError(error, error.response, error.content)
            
            throw new ScrapingError(
              classification.type,
              classification.message,
              error,
              { domain, url, operationId, attempt: arguments[2] }
            )
          }
        },
        this.options.maxRetries,
        this.options.baseDelay
      )

      // Record success for circuit breaker
      if (this.options.enableCircuitBreaker) {
        circuitBreaker.recordSuccess(domain)
      }

      return {
        success: true,
        data: result,
        metadata: {
          domain,
          operationId,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      // Ensure we have a ScrapingError
      if (!(error instanceof ScrapingError)) {
        const classification = classifyError(error)
        error = new ScrapingError(
          classification.type,
          classification.message,
          error,
          { domain, url, operationId }
        )
      }

      // Record failure for circuit breaker
      if (this.options.enableCircuitBreaker && 
          [ErrorTypes.HTTP_ERROR, ErrorTypes.NETWORK_ERROR, ErrorTypes.DNS_ERROR].includes(error.type)) {
        circuitBreaker.recordFailure(domain)
      }

      // Log error (non-blocking)
      if (this.options.logErrors) {
        try {
          logError(error, url, context)
        } catch (loggingError) {
          console.error('[ERROR_HANDLER] Failed to log error:', loggingError.message)
        }
      }

      // Return structured error response instead of throwing
      return {
        success: false,
        error: error.toJSON(),
        metadata: {
          domain,
          operationId,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Handle multiple URLs in parallel with error isolation
   */
  async wrapBatch(urlsAndOperations, options = {}) {
    const { 
      concurrency = 5, 
      continueOnError = true,
      collectErrors = true 
    } = options

    const results = []
    const errors = []

    // Process in batches to control concurrency
    for (let i = 0; i < urlsAndOperations.length; i += concurrency) {
      const batch = urlsAndOperations.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async ({ url, operation, context }) => {
        const result = await this.wrap(url, operation, context)
        
        if (result.success) {
          results.push({ url, ...result })
        } else {
          if (collectErrors) {
            errors.push({ url, ...result })
          }
          
          if (!continueOnError) {
            throw new Error(`Batch operation failed for ${url}: ${result.error.message}`)
          }
        }
        
        return result
      })

      // Wait for batch to complete
      await Promise.allSettled(batchPromises)
    }

    return {
      success: results.length > 0,
      results,
      errors,
      summary: {
        total: urlsAndOperations.length,
        succeeded: results.length,
        failed: errors.length,
        successRate: results.length / urlsAndOperations.length
      }
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus() {
    return {
      failures: Object.fromEntries(circuitBreaker.failures),
      lastFailures: Object.fromEntries(circuitBreaker.lastFailure),
      threshold: circuitBreaker.failureThreshold,
      timeout: circuitBreaker.timeoutMs
    }
  }

  /**
   * Reset circuit breaker for a domain (for testing/manual intervention)
   */
  resetCircuitBreaker(domain = null) {
    if (domain) {
      circuitBreaker.failures.delete(domain)
      circuitBreaker.lastFailure.delete(domain)
    } else {
      circuitBreaker.failures.clear()
      circuitBreaker.lastFailure.clear()
    }
  }
}

// Export default instance for convenience
export const scraperErrorHandler = new ScrapingErrorHandler()

// Export individual components for advanced usage
export { 
  ScrapingError, 
  CircuitBreaker,
  classifyError,
  extractDomain,
  retryWithBackoff
}