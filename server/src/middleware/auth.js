const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'voxa_super_secret_jwt_key_2025_twitter_clone';

// Required Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`SELECT id, username, email, display_name, avatar_url, bio, cover_url, location, website, is_verified, created_at FROM users WHERE id = ?`).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Optional Authentication Middleware (e.g. for public feeds that show personalized like/repost state)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`SELECT id, username, email, display_name, avatar_url, bio, cover_url, location, website, is_verified, created_at FROM users WHERE id = ?`).get(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
