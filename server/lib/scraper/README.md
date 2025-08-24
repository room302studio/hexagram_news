# Web Scraper Error Handler

A comprehensive error handling system for web scraping operations that provides graceful degradation, structured error reporting, and resilient pipeline execution.

## Architecture Overview

The error handler is designed with the following principles:

- **Graceful Degradation**: Never crash the pipeline; always return structured responses
- **Error Classification**: Categorize errors by type for appropriate handling strategies  
- **Circuit Breaker Pattern**: Temporarily block failing domains to prevent cascading failures
- **Retry Logic**: Implement exponential backoff for transient errors
- **Structured Logging**: Provide clear error information without breaking the flow
- **Demo Resilience**: Ensure demos continue even when individual URLs fail

### Data Flow

```
URL → Error Handler Wrapper → Scraping Operation → Classification → Response
  ↓                                    ↓                    ↓
Circuit Breaker Check          Error Detection      Structured Error
  ↓                                    ↓                    ↓  
Retry Logic                   Content Analysis       Logging
  ↓                                    ↓                    ↓
Success/Failure              Error Type Assignment    Return
```

### Component Architecture

```
ScrapingErrorHandler (Main Class)
├── Circuit Breaker (Domain failure tracking)
├── Retry Logic (Exponential backoff)
├── Error Classifier (Type detection)
├── Structured Logger (Non-blocking)
└── Response Formatter (Consistent output)
```

## Error Types

The system classifies errors into distinct types for appropriate handling:

| Error Type | Description | Retry? | Circuit Breaker |
|------------|-------------|--------|-----------------|
| `http_error` | HTTP status codes (4xx, 5xx) | No | Yes |
| `paywall` | Content blocked by subscription | No | No |
| `javascript_required` | Content needs JS rendering | No | No |
| `network_error` | Connection failures | Yes | Yes |
| `dns_error` | Domain resolution failures | No | Yes |
| `timeout` | Request timeouts | Yes | No |
| `parsing_error` | Content extraction failures | No | No |
| `rate_limited` | Too many requests | Yes | No |
| `unknown` | Unclassified errors | No | No |

## Quick Start

### Basic Usage

```javascript
import { scraperErrorHandler } from './error-handler.js'

// Wrap any scraping operation
const result = await scraperErrorHandler.wrap(
  'https://example.com/article',
  async () => {
    const response = await fetch(url)
    const html = await response.text()
    return parseContent(html)
  }
)

if (result.success) {
  console.log('Content:', result.data)
} else {
  console.log('Error:', result.error.type, result.error.message)
}
```

### Batch Processing

```javascript
const urls = [
  'https://site1.com/article',
  'https://site2.com/article',
  'https://site3.com/article'
]

const operations = urls.map(url => ({
  url,
  operation: () => scrapeUrl(url),
  context: { batch: true }
}))

const result = await scraperErrorHandler.wrapBatch(operations, {
  concurrency: 5,
  continueOnError: true
})

console.log(`Success rate: ${result.summary.successRate}`)
```

### Custom Configuration

```javascript
import { ScrapingErrorHandler } from './error-handler.js'

const customHandler = new ScrapingErrorHandler({
  maxRetries: 5,
  baseDelay: 2000,
  enableCircuitBreaker: true,
  logErrors: true
})
```

## Integration Examples

### Nuxt.js API Route

```javascript
// server/api/scrape.js
import { scrapeForApp } from '../lib/scraper/demo-scraper.js'

export default defineEventHandler(async (event) => {
  const { url } = await readBody(event)
  const result = await scrapeForApp(url)
  
  return result.success 
    ? { data: result.article }
    : { error: result.error, fallback: result.fallback }
})
```

### Vue.js Frontend

```javascript
// composables/useScraper.js
export const useScraper = () => {
  const scrape = async (url) => {
    try {
      const response = await $fetch('/api/scrape', {
        method: 'POST',
        body: { url }
      })
      
      return response.data || response.fallback
    } catch (error) {
      console.error('Scraping failed:', error)
      return null
    }
  }
  
  return { scrape }
}
```

## Features

### Circuit Breaker

Automatically blocks domains that repeatedly fail to prevent cascading failures:

```javascript
// Check circuit breaker status
const status = scraperErrorHandler.getCircuitBreakerStatus()

// Reset for specific domain (manual intervention)
scraperErrorHandler.resetCircuitBreaker('example.com')

// Reset all domains
scraperErrorHandler.resetCircuitBreaker()
```

### Retry Logic

Implements exponential backoff with jitter for transient errors:

- Base delay: 1 second (configurable)
- Exponential multiplier: 2x per retry
- Jitter: ±50% to prevent thundering herd
- Max retries: 3 (configurable)

### Error Classification

Automatically detects error types from various signals:

- HTTP status codes
- Error messages and codes  
- Response content analysis
- Paywall and JavaScript indicators

### Structured Logging

Non-blocking logging with structured data:

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "url": "https://example.com",
  "error": {
    "type": "paywall",
    "message": "Subscription required",
    "canRetry": false
  },
  "context": {
    "userAgent": "Demo-Scraper/1.0",
    "timeout": 10000
  }
}
```

## Testing

### Run All Tests

```bash
node scripts/test-error-handler.mjs
```

### Interactive Demo

```bash
node scripts/test-error-handler.mjs --demo
```

### API Testing

```bash
# Test scraping endpoint
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'

# Run demo
curl "http://localhost:3000/api/scrape?demo=true"

# Check status
curl "http://localhost:3000/api/scrape?status=true"
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `maxRetries` | 3 | Maximum retry attempts |
| `baseDelay` | 1000 | Base delay in milliseconds |
| `enableCircuitBreaker` | true | Enable circuit breaker |
| `logErrors` | true | Enable error logging |

## Error Response Format

All operations return structured responses:

### Success Response
```json
{
  "success": true,
  "data": { "title": "Article", "content": "..." },
  "metadata": {
    "domain": "example.com",
    "operationId": "abc123",
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "type": "paywall",
    "message": "Subscription required",
    "canRetry": false,
    "metadata": {
      "timestamp": "2025-01-01T12:00:00.000Z",
      "domain": "example.com",
      "operationId": "abc123"
    }
  },
  "metadata": {
    "domain": "example.com", 
    "operationId": "abc123",
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

## Best Practices

### For Demos

1. **Always use the error handler wrapper** - Never let scraping operations throw uncaught exceptions
2. **Show fallback content** - Provide meaningful alternatives when scraping fails
3. **Display error types** - Help users understand what went wrong
4. **Continue processing** - Don't stop the demo if one URL fails

### For Production

1. **Monitor circuit breaker status** - Track domain failures
2. **Adjust retry settings** - Balance speed vs reliability
3. **Log errors appropriately** - Structured logging for debugging
4. **Handle rate limiting** - Implement proper delays

### For Development

1. **Test error scenarios** - Use the provided test script
2. **Mock different failures** - Simulate various error conditions  
3. **Validate error classification** - Ensure proper error type detection
4. **Test batch processing** - Verify concurrent error handling

## Troubleshooting

### High Error Rates
- Check circuit breaker status
- Adjust retry settings
- Review error classifications
- Monitor network conditions

### Memory Issues
- Reduce batch concurrency
- Check for memory leaks in operations
- Monitor error handler overhead

### Performance Issues  
- Optimize retry delays
- Reduce timeout values
- Use circuit breaker effectively
- Profile scraping operations

## Contributing

The error handler is designed to be extensible. To add new error types:

1. Add to `ErrorTypes` enum
2. Update `classifyError` function
3. Add test cases
4. Update documentation

For questions or issues, refer to the test suite for comprehensive usage examples.