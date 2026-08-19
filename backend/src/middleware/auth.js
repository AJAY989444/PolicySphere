const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/db');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Fetch user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      }
    });

    if (!user || !user.isActive) {
      const error = new Error('User not found or inactive.');
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      err.message = 'Token expired.';
      err.statusCode = 401;
    } else if (err.name === 'JsonWebTokenError') {
      err.message = 'Invalid token.';
      err.statusCode = 401;
    }
    next(err);
  }
};

module.exports = { requireAuth };
