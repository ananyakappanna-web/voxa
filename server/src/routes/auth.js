const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: 'Username, email, password, and display name are required.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const normalizedEmail = email.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 alphanumeric characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check existing username or email
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(cleanUsername, normalizedEmail);
    if (existing) {
      if (existing.username === cleanUsername) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cleanUsername, normalizedEmail, passwordHash, displayName.trim(), defaultAvatar, 'Hello Voxa!');
    const newUser = db.prepare('SELECT id, username, email, display_name, bio, avatar_url, cover_url, location, website, is_verified, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Account created successfully',
      token: generateToken(newUser),
      user: { ...newUser, followersCount: 0, followingCount: 0, postsCount: 0, unreadNotifications: 0, unreadMessages: 0 }
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Server error creating account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // login can be email or username

    if (!login || !password) {
      return res.status(400).json({ error: 'Please provide username/email and password.' });
    }

    const cleanLogin = login.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?
    `).get(cleanLogin, cleanLogin);

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken(user);

    // Get user counts
    const followersCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id).c;
    const followingCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id).c;
    const postsCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(user.id).c;
    const unreadNotifications = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE recipient_id = ? AND is_read = 0').get(user.id).c;
    const unreadMessages = db.prepare('SELECT COUNT(*) as c FROM messages WHERE recipient_id = ? AND is_read = 0').get(user.id).c;

    const { password_hash, ...safeUser } = user;

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        ...safeUser,
        followersCount,
        followingCount,
        postsCount,
        unreadNotifications,
        unreadMessages
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    const followersCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id).c;
    const followingCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id).c;
    const postsCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(user.id).c;
    const unreadNotifications = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE recipient_id = ? AND is_read = 0').get(user.id).c;
    const unreadMessages = db.prepare('SELECT COUNT(*) as c FROM messages WHERE recipient_id = ? AND is_read = 0').get(user.id).c;

    return res.json({
      user: {
        ...user,
        followersCount,
        followingCount,
        postsCount,
        unreadNotifications,
        unreadMessages
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching user profile.' });
  }
});

// GET /api/auth/demo-users (Returns available demo accounts for 1-click test login)
router.get('/demo-users', (req, res) => {
  try {
    const demoUsers = db.prepare(`
      SELECT id, username, email, display_name, avatar_url, bio, is_verified
      FROM users
      ORDER BY id ASC
      LIMIT 8
    `).all();
    return res.json({ demoUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
});

module.exports = router;
