require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorHandler');
const config = require('./config');

const app = express();

// ─── Global Middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PolicySphere API',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes (added incrementally) ─────────────────────
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const policyRoutes = require('./routes/policy.routes');
const claimRoutes = require('./routes/claim.routes');
const advisorRoutes = require('./routes/advisor.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/advisor', advisorRoutes);

// ─── Error Handler (must be last) ─────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀 PolicySphere API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}\n`);
});

module.exports = app;
