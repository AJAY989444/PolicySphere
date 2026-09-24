const cacheService = require('../services/cache.service');
const webSocketService = require('../services/websocket.service');
const { idempotencyManager } = require('./idempotency');

/**
 * Performance SLA Monitoring & Telemetry Middleware (SRS Section 28)
 * Enforces and audits API response times against strict IRDAI / Section 28 criteria:
 * - Cached endpoints: < 200 ms
 * - Normal REST endpoints: < 500 ms
 * - Quote / AI endpoints: < 5000 ms
 * - Payment processing: < 10000 ms
 */

class SlaMonitor {
  constructor() {
    this.latencies = []; // array of duration in ms
    this.maxLatencySamples = 5000;
    this.totalRequests = 0;
    this.breachCount = 0;
    this.slowestRequests = []; // top 20 slowest requests
    this.startTime = Date.now();
  }

  getThreshold(path, isCached) {
    if (isCached) return 200;
    if (path.includes('/quotes') || path.includes('/ai')) return 5000;
    if (path.includes('/payments')) return 10000;
    return 500; // standard SLA is 500ms
  }

  record(method, path, durationMs, statusCode, isCached) {
    this.totalRequests++;
    this.latencies.push(durationMs);
    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }

    const threshold = this.getThreshold(path, isCached);
    const isBreach = durationMs > threshold;

    if (isBreach) {
      this.breachCount++;
      const breachRecord = {
        method,
        path,
        durationMs,
        thresholdMs: threshold,
        statusCode,
        timestamp: new Date().toISOString(),
      };

      this.slowestRequests.unshift(breachRecord);
      if (this.slowestRequests.length > 20) {
        this.slowestRequests.pop();
      }
    }

    return { isBreach, threshold };
  }

  getMetrics() {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const count = sorted.length;

    const p50 = count > 0 ? sorted[Math.floor(count * 0.50)] : 0;
    const p90 = count > 0 ? sorted[Math.floor(count * 0.90)] : 0;
    const p95 = count > 0 ? sorted[Math.floor(count * 0.95)] : 0;
    const p99 = count > 0 ? sorted[Math.floor(count * 0.99)] : 0;
    const avg = count > 0 ? (sorted.reduce((acc, curr) => acc + curr, 0) / count) : 0;

    const compliance = this.totalRequests > 0
      ? (((this.totalRequests - this.breachCount) / this.totalRequests) * 100).toFixed(2)
      : '100.00';

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      breachCount: this.breachCount,
      slaCompliancePercent: parseFloat(compliance),
      latency: {
        avgMs: parseFloat(avg.toFixed(2)),
        p50Ms: parseFloat(p50.toFixed(2)),
        p90Ms: parseFloat(p90.toFixed(2)),
        p95Ms: parseFloat(p95.toFixed(2)),
        p99Ms: parseFloat(p99.toFixed(2)),
      },
      slowestRequests: this.slowestRequests,
      cache: cacheService.getMetrics(),
      websocket: webSocketService.getConnectedStats(),
      idempotency: idempotencyManager.getStats(),
      targets: {
        cachedThresholdMs: 200,
        standardThresholdMs: 500,
        quoteCalculationMs: 5000,
        paymentProcessingMs: 10000,
        targetCompliancePercent: 99.9,
      },
    };
  }
}

const slaMonitor = new SlaMonitor();

/**
 * Express middleware measuring request latency
 */
const slaMiddleware = (req, res, next) => {
  const startHr = process.hrtime.bigint();

  const originalEnd = res.end;
  res.end = function (...args) {
    const endHr = process.hrtime.bigint();
    const durationMs = Number(endHr - startHr) / 1000000;
    const isCached = res.getHeader && res.getHeader('X-Cache-Lookup') === 'HIT';

    const { isBreach } = slaMonitor.record(
      req.method,
      req.originalUrl || req.url,
      parseFloat(durationMs.toFixed(2)),
      res.statusCode,
      isCached
    );

    if (!res.headersSent) {
      res.setHeader('X-Response-Time-Ms', durationMs.toFixed(2));
      res.setHeader('X-SLA-Status', isBreach ? 'BREACH' : 'PASS');
    }

    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Controller endpoint for performance telemetry
 */
const getSlaTelemetry = (req, res) => {
  res.json({
    success: true,
    data: slaMonitor.getMetrics(),
  });
};

module.exports = {
  slaMiddleware,
  slaMonitor,
  getSlaTelemetry,
};
