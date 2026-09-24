require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { errorHandler } = require('./middleware/errorHandler');
const { slaMiddleware, getSlaTelemetry } = require('./middleware/slaMonitor');
const { requireIdempotency } = require('./middleware/idempotency');
const webSocketService = require('./services/websocket.service');
const config = require('./config');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket Gateway
webSocketService.init(server);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── Global Middleware ─────────────────────────────────────
const securityHardeningMiddleware = require('./middleware/securityHeaders');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: false,
}));
app.use(securityHardeningMiddleware);
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Microsecond SLA Response Time & Performance Monitoring (SRS Section 28)
app.use(slaMiddleware);

// Prometheus APM Metrics (SRS Module 30)
const { apmMetricsMiddleware, renderPrometheusMetrics } = require('./middleware/metrics');
app.use(apmMetricsMiddleware);

// Static Files (Uploaded Document Evidence)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health & Telemetry ────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PolicySphere API',
    websocketActive: true,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/performance/sla', getSlaTelemetry);
app.get('/api/metrics', renderPrometheusMetrics);
app.get('/metrics', renderPrometheusMetrics);

// ─── API Routes (added incrementally) ─────────────────────
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const policyRoutes = require('./routes/policy.routes');
const claimRoutes = require('./routes/claim.routes');
const advisorRoutes = require('./routes/advisor.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const quoteRoutes = require('./routes/quote.routes');
const notificationRoutes = require('./routes/notification.routes');
const aiRoutes = require('./routes/ai.routes');
const documentRoutes = require('./routes/document.routes');
const proposalRoutes = require('./routes/proposal.routes');
const crmRoutes = require('./routes/crm.routes');
const underwritingRoutes = require('./routes/underwriting.routes');
const paymentGatewayRoutes = require('./routes/paymentGateway.routes');
const searchRoutes = require('./routes/search.routes');
const supportRoutes = require('./routes/support.routes');
const reportingRoutes = require('./routes/reporting.routes');
const governanceRoutes = require('./routes/governance.routes');
const corporateRoutes = require('./routes/corporate.routes');
const insurerRoutes = require('./routes/insurer.routes');
const complianceRoutes = require('./routes/compliance.routes');
const integrationsRoutes = require('./routes/integrations.routes');
const innovationsRoutes = require('./routes/innovations.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/innovations', innovationsRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/governance', governanceRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/corporate', corporateRoutes);
app.use('/api/insurer', insurerRoutes);
app.use('/api/payments/checkout', requireIdempotency);
app.use('/api/payments', paymentRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/underwriting', underwritingRoutes);
app.use('/api/payments-engine', paymentGatewayRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reports', reportingRoutes);

// ─── API Documentation & OpenAPI Specification ─────────────
const docsRoutes = require('./routes/docs.routes');
app.use('/api', docsRoutes);

// ─── Error Handler (must be last) ─────────────────────────
app.use(errorHandler);

// ─── Start Server (HTTP + WebSocket) ───────────────────────
const PORT = config.port;
const prisma = require('./config/db');

server.listen(PORT, () => {
  console.log(`\n🚀 PolicySphere API running on http://localhost:${PORT}`);
  console.log(`   OpenAPI Swagger Docs: http://localhost:${PORT}/api/docs`);
  console.log(`   WebSocket Gateway: ws://localhost:${PORT}/ws`);
  console.log(`   Environment: ${config.nodeEnv}\n`);

  // Warm up Neon connection
  prisma.$connect()
    .then(() => console.log('✅ Connected to Neon PostgreSQL database'))
    .catch((err) => console.warn('⚠️ Initial database connect delayed:', err.message));

  // Keep Neon serverless database active (prevent auto-suspension during active dev)
  setInterval(() => {
    prisma.$queryRaw`SELECT 1`.catch(() => {});
  }, 4 * 60 * 1000);
});

module.exports = { app, server };
