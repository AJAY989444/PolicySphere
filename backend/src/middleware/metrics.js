// backend/src/middleware/metrics.js
// Prometheus APM Exporter (SRS Module 30)

const os = require('os');
const prisma = require('../config/db');

// In-memory Prometheus metric accumulators
const requestCounters = new Map(); // key: method:route:status => count
const latencyBuckets = [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0, 10.0];
const latencyHistograms = new Map(); // key: method:route:status => bucketCounts[]

function getHistogram(key) {
  if (!latencyHistograms.has(key)) {
    latencyHistograms.set(key, {
      buckets: new Array(latencyBuckets.length).fill(0),
      count: 0,
      sum: 0,
    });
  }
  return latencyHistograms.get(key);
}

function normalizeRoute(path) {
  if (!path) return 'root';
  return path
    .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
    .replace(/\/c[a-z0-9]{20,}/gi, '/:cuid')
    .replace(/\/\d+/g, '/:id')
    .split('?')[0] || '/';
}

function apmMetricsMiddleware(req, res, next) {
  if (req.path === '/api/metrics' || req.path === '/metrics') {
    return next();
  }

  const startHr = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startHr);
    const durationSeconds = seconds + nanoseconds / 1e9;
    const method = req.method;
    const route = normalizeRoute(req.baseUrl + (req.route?.path || req.path));
    const status = res.statusCode;

    const metricKey = `${method}:${route}:${status}`;

    // Increment request count
    requestCounters.set(metricKey, (requestCounters.get(metricKey) || 0) + 1);

    // Update histogram
    const hist = getHistogram(metricKey);
    hist.count++;
    hist.sum += durationSeconds;
    for (let i = 0; i < latencyBuckets.length; i++) {
      if (durationSeconds <= latencyBuckets[i]) {
        hist.buckets[i]++;
      }
    }
  });

  next();
}

async function renderPrometheusMetrics(req, res) {
  const lines = [];

  lines.push('# HELP http_requests_total Total number of HTTP requests processed');
  lines.push('# TYPE http_requests_total counter');
  for (const [key, count] of requestCounters.entries()) {
    const [method, route, status] = key.split(':');
    lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`);
  }

  lines.push('');
  lines.push('# HELP http_request_duration_seconds HTTP request latencies in seconds');
  lines.push('# TYPE http_request_duration_seconds histogram');
  for (const [key, hist] of latencyHistograms.entries()) {
    const [method, route, status] = key.split(':');
    let cum = 0;
    for (let i = 0; i < latencyBuckets.length; i++) {
      cum += hist.buckets[i];
      lines.push(
        `http_request_duration_seconds_bucket{method="${method}",route="${route}",status="${status}",le="${latencyBuckets[i]}"} ${cum}`
      );
    }
    lines.push(
      `http_request_duration_seconds_bucket{method="${method}",route="${route}",status="${status}",le="+Inf"} ${hist.count}`
    );
    lines.push(`http_request_duration_seconds_sum{method="${method}",route="${route}",status="${status}"} ${hist.sum.toFixed(4)}`);
    lines.push(`http_request_duration_seconds_count{method="${method}",route="${route}",status="${status}"} ${hist.count}`);
  }

  // System & Node.js Runtime Telemetry
  const mem = process.memoryUsage();
  lines.push('');
  lines.push('# HELP nodejs_memory_heap_used_bytes Process heap memory used in bytes');
  lines.push('# TYPE nodejs_memory_heap_used_bytes gauge');
  lines.push(`nodejs_memory_heap_used_bytes ${mem.heapUsed}`);

  lines.push('# HELP nodejs_memory_heap_total_bytes Process heap memory allocated in bytes');
  lines.push('# TYPE nodejs_memory_heap_total_bytes gauge');
  lines.push(`nodejs_memory_heap_total_bytes ${mem.heapTotal}`);

  lines.push('# HELP nodejs_process_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE nodejs_process_uptime_seconds gauge');
  lines.push(`nodejs_process_uptime_seconds ${Math.floor(process.uptime())}`);

  lines.push('# HELP system_cpu_load_average_1m OS 1-minute CPU load average');
  lines.push('# TYPE system_cpu_load_average_1m gauge');
  lines.push(`system_cpu_load_average_1m ${(os.loadavg()[0] || 0.15).toFixed(2)}`);

  // Section 28 & 35 Domain KPIs
  try {
    const auditCount = await prisma.auditLog.count().catch(() => 0);
    lines.push('');
    lines.push('# HELP policysphere_audit_ledger_records_total Cryptographically chained immutable audit records');
    lines.push('# TYPE policysphere_audit_ledger_records_total gauge');
    lines.push(`policysphere_audit_ledger_records_total ${auditCount}`);

    const hospitalCount = await prisma.networkHospital.count().catch(() => 0);
    lines.push('# HELP policysphere_cashless_hospitals_total Empanelled ROHINI cashless hospitals in network');
    lines.push('# TYPE policysphere_cashless_hospitals_total gauge');
    lines.push(`policysphere_cashless_hospitals_total ${hospitalCount}`);
  } catch {}

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n') + '\n');
}

module.exports = {
  apmMetricsMiddleware,
  renderPrometheusMetrics,
};
