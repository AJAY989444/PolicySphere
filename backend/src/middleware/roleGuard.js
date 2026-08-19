/**
 * Middleware to restrict routes to specific roles.
 * Must be used AFTER requireAuth middleware.
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g. ['ADMIN', 'ADVISOR'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Access denied. Insufficient permissions.');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = { requireRole };
