/**
 * Idempotency Key Middleware (SRS Section 23 - API Standards)
 * Prevents double-billing and duplicate resource creation caused by network timeouts or retries.
 */

class IdempotencyManager {
  constructor(ttlMs = 24 * 60 * 60 * 1000) {
    this.store = new Map(); // key -> { status: 'IN_FLIGHT'|'COMPLETED', statusCode, body, createdAt }
    this.ttlMs = ttlMs;

    // Prune stale entries hourly
    setInterval(() => this.prune(), 60 * 60 * 1000);
  }

  prune() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.createdAt > this.ttlMs) {
        this.store.delete(key);
      }
    }
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  setInFlight(key) {
    this.store.set(key, {
      status: 'IN_FLIGHT',
      createdAt: Date.now(),
    });
  }

  setCompleted(key, statusCode, body) {
    this.store.set(key, {
      status: 'COMPLETED',
      statusCode,
      body,
      createdAt: Date.now(),
    });
  }

  getStats() {
    let completed = 0;
    let inFlight = 0;
    for (const entry of this.store.values()) {
      if (entry.status === 'COMPLETED') completed++;
      else inFlight++;
    }
    return { totalKeysTracked: this.store.size, completed, inFlight };
  }
}

const idempotencyManager = new IdempotencyManager();

/**
 * Express middleware to enforce or process Idempotency-Key
 */
const requireIdempotency = (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  // If no idempotency key provided, proceed normally
  if (!idempotencyKey) {
    return next();
  }

  const existing = idempotencyManager.get(idempotencyKey);

  if (existing) {
    if (existing.status === 'IN_FLIGHT') {
      return res.status(409).json({
        success: false,
        message: 'A request with this Idempotency-Key is currently in-flight. Please wait before retrying.',
        idempotencyKey,
      });
    }

    // Return the cached response
    res.setHeader('X-Idempotency-Status', 'HIT');
    res.setHeader('X-Idempotency-Key', idempotencyKey);
    return res.status(existing.statusCode).json({
      ...existing.body,
      _idempotentReplay: true,
      _originalTimestamp: new Date(existing.createdAt).toISOString(),
    });
  }

  // Register in-flight
  idempotencyManager.setInFlight(idempotencyKey);
  res.setHeader('X-Idempotency-Status', 'STORED');
  res.setHeader('X-Idempotency-Key', idempotencyKey);

  // Hook res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only cache successful or non-server-crash responses
    if (res.statusCode < 500) {
      idempotencyManager.setCompleted(idempotencyKey, res.statusCode, body);
    }
    return originalJson(body);
  };

  next();
};

module.exports = {
  requireIdempotency,
  idempotencyManager,
};
