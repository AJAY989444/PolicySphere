/**
 * Global error handling middleware.
 * Catches all errors thrown or passed via next(err).
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with that value already exists.',
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }

  // Prisma database connection / cold-start timeouts
  if (
    err.name === 'PrismaClientInitializationError' ||
    err.message?.includes("Can't reach database server") ||
    err.message?.includes('ETIMEDOUT') ||
    err.message?.includes('ECONNREFUSED')
  ) {
    return res.status(503).json({
      success: false,
      message: 'The database server is currently waking up from idle mode. Please retry in 5-10 seconds.',
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
};

module.exports = { errorHandler };
