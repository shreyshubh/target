const jwt = require('jsonwebtoken');
const config = require('../config');

function authMiddleware(req, res, next) {
  // Priority: httpOnly cookie → Authorization header (fallback for API clients)
  let token = req.cookies?.auth_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    // Clear invalid cookie if it was the source
    if (req.cookies?.auth_token) {
      res.clearCookie('auth_token', { path: '/' });
    }
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = authMiddleware;

