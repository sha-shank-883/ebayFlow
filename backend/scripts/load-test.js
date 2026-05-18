/**
 * Load Test Script for SellerFlow AI Public API
 *
 * HOW TO RUN:
 *   1. Ensure the backend server is running (e.g., npm run dev or npm start)
 *   2. Run this script with Node.js:
 *
 *      node scripts/load-test.js
 *
 *   3. Customize options by passing environment variables or editing defaults:
 *
 *      BASE_URL=http://localhost:3000 node scripts/load-test.js
 *      CONCURRENCY=100 TOTAL_REQUESTS=5000 node scripts/load-test.js
 *
 * OPTIONS:
 *   BASE_URL       - Base URL of the API (default: http://localhost:3000)
 *   CONCURRENCY    - Number of concurrent requests (default: 50)
 *   TOTAL_REQUESTS - Total number of requests to send (default: 1000)
 *
 * EXAMPLES:
 *   # Default settings (50 concurrent, 1000 total)
 *   node scripts/load-test.js
 *
 *   # Light load (10 concurrent, 200 total)
 *   CONCURRENCY=10 TOTAL_REQUESTS=200 node scripts/load-test.js
 *
 *   # Heavy load (200 concurrent, 10000 total)
 *   CONCURRENCY=200 TOTAL_REQUESTS=10000 node scripts/load-test.js
 */

const http = require('http');
const url = require('url');

// --- Configuration ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY, 10) || 50;
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS, 10) || 1000;

// Endpoints to test
const ENDPOINTS = [
  '/api/public/settings',
  '/api/public/sections/home',
  '/api/public/blog',
  '/api/public/testimonials',
];

// --- Result Tracking ---
const results = {
  total: 0,
  successes: 0,
  failures: 0,
  rateLimited: 0,
  statusCodes: {},
  responseTimes: [],
  errors: [],
};

// --- Utility Functions ---

/**
 * Parse a URL string into host, port, and path components
 */
function parseUrl(fullUrl) {
  const parsed = new url.URL(fullUrl);
  return {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname,
    protocol: parsed.protocol,
  };
}

/**
 * Make a single HTTP GET request and record the result
 */
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const parsed = parseUrl(BASE_URL + endpoint);
    const startTime = process.hrtime.bigint();

    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: 'GET',
      headers: {
        'User-Agent': 'SellerFlow-Load-Test/1.0',
      },
      timeout: 30000,
    };

    const req = http.request(options, (res) => {
      // Consume the response data to free up memory
      res.on('data', () => {});
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6;

        results.total++;
        results.responseTimes.push(durationMs);

        const statusCode = res.statusCode;
        results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;

        if (statusCode === 200) {
          results.successes++;
        } else if (statusCode === 429) {
          results.rateLimited++;
        } else {
          results.failures++;
        }

        resolve({ statusCode, durationMs });
      });
    });

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;

      results.total++;
      results.responseTimes.push(durationMs);
      results.failures++;
      results.errors.push(`${endpoint}: ${err.message}`);

      resolve({ statusCode: 0, durationMs, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.end();
  });
}

/**
 * Calculate percentile from a sorted array of values
 */
function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Format milliseconds to appropriate unit
 */
function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Print results as a formatted table
 */
function printResults(durationMs) {
  const sorted = [...results.responseTimes].sort((a, b) => a - b);
  const totalRequests = results.total;
  const rps = totalRequests / (durationMs / 1000);

  const avgResponseTime =
    sorted.length > 0
      ? sorted.reduce((sum, val) => sum + val, 0) / sorted.length
      : 0;

  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const min = sorted.length > 0 ? sorted[0] : 0;
  const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0;

  const errorRate = totalRequests > 0 ? (results.failures / totalRequests) * 100 : 0;
  const rateLimitRate = totalRequests > 0 ? (results.rateLimited / totalRequests) * 100 : 0;

  // Separator line
  const sep = '─'.repeat(60);

  console.log('\n' + sep);
  console.log('  SELLERFLOW AI - LOAD TEST RESULTS');
  console.log(sep);
  console.log(`  Base URL:        ${BASE_URL}`);
  console.log(`  Concurrency:     ${CONCURRENCY}`);
  console.log(`  Total Requests:  ${TOTAL_REQUESTS}`);
  console.log(`  Duration:        ${formatMs(durationMs)}`);
  console.log(sep);

  console.log('\n  PERFORMANCE METRICS');
  console.log(sep);
  console.log(`  Requests/sec:    ${rps.toFixed(2)}`);
  console.log(`  Avg Response:    ${formatMs(avgResponseTime)}`);
  console.log(`  Min Response:    ${formatMs(min)}`);
  console.log(`  Max Response:    ${formatMs(max)}`);
  console.log(`  P50 Latency:     ${formatMs(p50)}`);
  console.log(`  P95 Latency:     ${formatMs(p95)}`);
  console.log(`  P99 Latency:     ${formatMs(p99)}`);
  console.log(sep);

  console.log('\n  RESPONSE SUMMARY');
  console.log(sep);
  console.log(`  Successful (2xx): ${results.successes}`);
  console.log(`  Rate Limited:     ${results.rateLimited} (${rateLimitRate.toFixed(2)}%)`);
  console.log(`  Failed:           ${results.failures} (${errorRate.toFixed(2)}%)`);
  console.log(sep);

  // Status code breakdown
  const statusEntries = Object.entries(results.statusCodes).sort(
    (a, b) => parseInt(a[0]) - parseInt(b[0])
  );
  if (statusEntries.length > 0) {
    console.log('\n  STATUS CODE BREAKDOWN');
    console.log(sep);
    for (const [code, count] of statusEntries) {
      const pct = ((count / totalRequests) * 100).toFixed(2);
      console.log(`  ${code}: ${count} (${pct}%)`);
    }
    console.log(sep);
  }

  // Endpoint distribution (approximate since requests are randomized)
  console.log('\n  ENDPOINTS TESTED');
  console.log(sep);
  for (const ep of ENDPOINTS) {
    console.log(`  ${ep}`);
  }
  console.log(sep);

  // Show sample errors if any
  if (results.errors.length > 0) {
    console.log('\n  SAMPLE ERRORS (first 5)');
    console.log(sep);
    for (const err of results.errors.slice(0, 5)) {
      console.log(`  ✗ ${err}`);
    }
    console.log(sep);
  }

  console.log('');
}

// --- Main Load Test Runner ---

async function runLoadTest() {
  console.log('Starting load test...');
  console.log(`  Base URL:    ${BASE_URL}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Total:       ${TOTAL_REQUESTS}`);
  console.log(`  Endpoints:   ${ENDPOINTS.length}`);
  console.log('');

  const overallStart = process.hrtime.bigint();

  // Process requests in batches based on concurrency
  let completed = 0;

  while (completed < TOTAL_REQUESTS) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - completed);
    const batch = [];

    for (let i = 0; i < batchSize; i++) {
      // Round-robin through endpoints
      const endpoint = ENDPOINTS[(completed + i) % ENDPOINTS.length];
      batch.push(makeRequest(endpoint));
    }

    await Promise.all(batch);
    completed += batchSize;

    // Progress indicator every 10%
    const pct = Math.floor((completed / TOTAL_REQUESTS) * 100);
    if (pct % 10 === 0 && (completed === TOTAL_REQUESTS || (completed - batchSize) / TOTAL_REQUESTS < pct / 100)) {
      process.stdout.write(`\r  Progress: ${pct}% (${completed}/${TOTAL_REQUESTS})`);
    }
  }

  process.stdout.write('\r  Progress: 100% (' + TOTAL_REQUESTS + '/' + TOTAL_REQUESTS + ')\n');

  const overallEnd = process.hrtime.bigint();
  const durationMs = Number(overallEnd - overallStart) / 1e6;

  printResults(durationMs);
}

// Run the test
runLoadTest().catch((err) => {
  console.error('Load test failed:', err.message);
  process.exit(1);
});
