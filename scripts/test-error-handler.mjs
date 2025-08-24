#!/usr/bin/env node

/**
 * Test Script for Scraper Error Handler
 * 
 * This script demonstrates and tests the comprehensive error handling
 * capabilities of the web scraper pipeline.
 * 
 * Run with: node scripts/test-error-handler.mjs
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

// Import the error handler components
import { 
  ScrapingErrorHandler,
  scraperErrorHandler,
  ErrorTypes,
  ScrapingError,
  classifyError
} from '../server/lib/scraper/error-handler.js'

// Import demo scraper
import { runScrapingDemo, scrapeUrls } from '../server/lib/scraper/demo-scraper.js'

/**
 * Test individual error classification
 */
async function testErrorClassification() {
  console.log('🧪 Testing Error Classification...\n')
  
  const testCases = [
    {
      name: 'HTTP 404 Error',
      error: null,
      response: { status: 404 },
      content: '<html><body><h1>404 Not Found</h1></body></html>',
      expectedType: ErrorTypes.HTTP_ERROR
    },
    {
      name: 'HTTP 429 Rate Limited',
      error: null,
      response: { status: 429 },
      content: '',
      expectedType: ErrorTypes.RATE_LIMITED
    },
    {
      name: 'DNS Error',
      error: { message: 'getaddrinfo ENOTFOUND', code: 'ENOTFOUND' },
      response: null,
      content: '',
      expectedType: ErrorTypes.DNS_ERROR
    },
    {
      name: 'Network Connection Error',
      error: { message: 'connect ECONNREFUSED', code: 'ECONNREFUSED' },
      response: null,
      content: '',
      expectedType: ErrorTypes.NETWORK_ERROR
    },
    {
      name: 'Paywall Detection',
      error: null,
      response: { status: 200 },
      content: '<html><body><h1>Article</h1><p>Subscribe now to read more...</p></body></html>',
      expectedType: ErrorTypes.PAYWALL
    },
    {
      name: 'JavaScript Required',
      error: null,
      response: { status: 200 },
      content: '<html><body><p>Please enable JavaScript to view this content</p></body></html>',
      expectedType: ErrorTypes.JAVASCRIPT_REQUIRED
    },
    {
      name: 'Timeout Error',
      error: { message: 'Request timeout', code: 'ETIMEDOUT' },
      response: null,
      content: '',
      expectedType: ErrorTypes.TIMEOUT
    }
  ]
  
  let passed = 0
  let total = testCases.length
  
  testCases.forEach(({ name, error, response, content, expectedType }) => {
    const result = classifyError(error, response, content)
    const success = result.type === expectedType
    
    console.log(`  ${success ? '✅' : '❌'} ${name}`)
    console.log(`     Expected: ${expectedType}`)
    console.log(`     Got: ${result.type}`)
    console.log(`     Message: ${result.message}`)
    
    if (success) passed++
    console.log('')
  })
  
  console.log(`📊 Classification Tests: ${passed}/${total} passed\n`)
  return passed === total
}

/**
 * Test circuit breaker functionality
 */
async function testCircuitBreaker() {
  console.log('🔧 Testing Circuit Breaker...\n')
  
  const handler = new ScrapingErrorHandler({
    enableCircuitBreaker: true,
    maxRetries: 1,
    logErrors: false
  })
  
  const testDomain = 'failing-test-domain.com'
  const testUrl = `https://${testDomain}/test`
  
  // Function that always fails
  const alwaysFails = async () => {
    const error = new Error('Network error')
    error.code = 'ECONNRESET'
    throw error
  }
  
  console.log('  Testing repeated failures...')
  
  // Trigger failures to trip circuit breaker
  for (let i = 0; i < 6; i++) {
    const result = await handler.wrap(testUrl, alwaysFails)
    console.log(`    Attempt ${i + 1}: ${result.success ? 'Success' : result.error.type}`)
  }
  
  // Check circuit breaker status
  const status = handler.getCircuitBreakerStatus()
  const domainBlocked = status.failures[testDomain] >= 5
  
  console.log(`\n  Circuit breaker status for ${testDomain}:`)
  console.log(`    Failures: ${status.failures[testDomain] || 0}`)
  console.log(`    Blocked: ${domainBlocked}`)
  
  // Test reset functionality
  handler.resetCircuitBreaker(testDomain)
  const resetStatus = handler.getCircuitBreakerStatus()
  const domainReset = !resetStatus.failures[testDomain]
  
  console.log(`\n  After reset:`)
  console.log(`    Domain reset: ${domainReset}`)
  
  console.log(`\n📊 Circuit Breaker Test: ${domainBlocked && domainReset ? 'PASSED' : 'FAILED'}\n`)
  return domainBlocked && domainReset
}

/**
 * Test retry mechanism
 */
async function testRetryMechanism() {
  console.log('🔄 Testing Retry Mechanism...\n')
  
  const handler = new ScrapingErrorHandler({
    maxRetries: 3,
    baseDelay: 100, // Short delay for testing
    logErrors: false
  })
  
  let attemptCount = 0
  
  // Function that fails twice then succeeds
  const flakyOperation = async () => {
    attemptCount++
    console.log(`    Attempt ${attemptCount}`)
    
    if (attemptCount <= 2) {
      const error = new Error('Temporary network error')
      error.code = 'ECONNRESET'
      throw error
    }
    
    return { message: 'Success after retries!' }
  }
  
  console.log('  Testing operation that succeeds after 2 failures...')
  
  const startTime = Date.now()
  const result = await handler.wrap('https://test.com/retry', flakyOperation)
  const duration = Date.now() - startTime
  
  console.log(`  Result: ${result.success ? 'SUCCESS' : 'FAILED'}`)
  console.log(`  Total attempts: ${attemptCount}`)
  console.log(`  Duration: ${duration}ms`)
  
  const success = result.success && attemptCount === 3
  console.log(`\n📊 Retry Test: ${success ? 'PASSED' : 'FAILED'}\n`)
  return success
}

/**
 * Test batch processing with mixed results
 */
async function testBatchProcessing() {
  console.log('📦 Testing Batch Processing...\n')
  
  // Mix of URLs that will succeed and fail
  const testUrls = [
    'https://good-site1.com/article1',
    'https://good-site2.com/article2', 
    'https://paywall-news.com/premium',
    'https://dns-error.com/missing',
    'https://good-site3.com/article3',
    'https://rate-limited.com/busy',
    'https://good-site4.com/article4'
  ]
  
  console.log(`  Processing ${testUrls.length} URLs with concurrency=3...`)
  
  const startTime = Date.now()
  const result = await scrapeUrls(testUrls, { 
    concurrency: 3,
    timeout: 2000
  })
  const duration = Date.now() - startTime
  
  console.log(`  Completed in ${duration}ms`)
  console.log(`  Success rate: ${(result.summary.successRate * 100).toFixed(1)}%`)
  console.log(`  Successful: ${result.summary.succeeded}`)
  console.log(`  Failed: ${result.summary.failed}`)
  
  // Expected: some successes, some failures, but no crashes
  const hasSuccesses = result.summary.succeeded > 0
  const hasFailures = result.summary.failed > 0
  const noExceptions = result.summary.total === testUrls.length
  
  const success = hasSuccesses && hasFailures && noExceptions
  console.log(`\n📊 Batch Test: ${success ? 'PASSED' : 'FAILED'}\n`)
  return success
}

/**
 * Test structured error objects
 */
async function testErrorStructure() {
  console.log('📋 Testing Error Structure...\n')
  
  const error = new ScrapingError(
    ErrorTypes.PAYWALL,
    'Paywall detected on site',
    new Error('Original error'),
    { domain: 'example.com', url: 'https://example.com/article' }
  )
  
  const json = error.toJSON()
  
  const hasType = json.type === ErrorTypes.PAYWALL
  const hasMessage = json.message.includes('Paywall')
  const hasRetryFlag = typeof json.canRetry === 'boolean'
  const hasMetadata = json.metadata && json.metadata.timestamp
  const hasOriginalError = json.originalError && json.originalError.message
  
  console.log('  Testing ScrapingError serialization...')
  console.log(`    Has type: ${hasType}`)
  console.log(`    Has message: ${hasMessage}`)
  console.log(`    Has retry flag: ${hasRetryFlag}`)
  console.log(`    Has metadata: ${hasMetadata}`)
  console.log(`    Has original error: ${hasOriginalError}`)
  
  const success = hasType && hasMessage && hasRetryFlag && hasMetadata && hasOriginalError
  console.log(`\n📊 Error Structure Test: ${success ? 'PASSED' : 'FAILED'}\n`)
  return success
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Scraper Error Handler Test Suite')
  console.log('=' .repeat(60) + '\n')
  
  const tests = [
    { name: 'Error Classification', fn: testErrorClassification },
    { name: 'Circuit Breaker', fn: testCircuitBreaker },
    { name: 'Retry Mechanism', fn: testRetryMechanism },
    { name: 'Batch Processing', fn: testBatchProcessing },
    { name: 'Error Structure', fn: testErrorStructure }
  ]
  
  const results = []
  
  for (const test of tests) {
    console.log(`Running ${test.name} test...`)
    try {
      const passed = await test.fn()
      results.push({ name: test.name, passed })
    } catch (error) {
      console.error(`❌ Test '${test.name}' threw an exception:`, error.message)
      results.push({ name: test.name, passed: false })
    }
    console.log('-'.repeat(40) + '\n')
  }
  
  // Summary
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  
  console.log('🏁 TEST SUMMARY')
  console.log('=' .repeat(60))
  
  results.forEach(({ name, passed }) => {
    console.log(`  ${passed ? '✅' : '❌'} ${name}`)
  })
  
  console.log('')
  console.log(`📊 Overall Result: ${passedTests}/${totalTests} tests passed`)
  console.log(`🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Error handler is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Check the error handler implementation.')
  }
  
  return passedTests === totalTests
}

/**
 * Demo runner for interactive testing
 */
async function runDemo() {
  console.log('🎬 Running Interactive Demo...\n')
  
  try {
    await runScrapingDemo()
    console.log('\n✅ Demo completed successfully!')
  } catch (error) {
    console.error('❌ Demo failed:', error.message)
  }
}

// Command line interface
if (process.argv.includes('--demo')) {
  runDemo()
} else if (process.argv.includes('--help')) {
  console.log(`
🕷️  Scraper Error Handler Test Suite

Usage:
  node scripts/test-error-handler.mjs [options]

Options:
  --demo    Run interactive demo
  --help    Show this help message
  
Default: Run all tests
`)
} else {
  runAllTests()
}