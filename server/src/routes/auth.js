const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { sendSignupOtp } = require('../services/email');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function normalizeGmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isGmail(email) {
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/.test(email);
}

function createOtpHash(otp) {
  return crypto.createHmac('sha256', JWT_SECRET).update(otp).digest('hex');
}

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function sendVerificationCode(email) {
  const otp = createOtp();
  const now = Date.now();
  db.prepare(`
    UPDATE signup_verifications
    SET otp_hash = ?, expires_at = ?, last_sent_at = ?, attempts = 0
    WHERE email = ?
  `).run(createOtpHash(otp), now + 10 * 60 * 1000, now, email);
  await sendSignupOtp(email, otp);
}

// POST /api/auth/signup/request-otp
router.post('/signup/request-otp', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    const normalizedEmail = normalizeGmail(email);

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: 'Username, email, password, and display name are required.' });
    }

    if (!isGmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please use a valid Gmail address.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
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
    const now = Date.now();
    const otp = createOtp();
    db.prepare(`
      INSERT INTO signup_verifications
        (email, username, display_name, password_hash, otp_hash, expires_at, last_sent_at, attempts)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(email) DO UPDATE SET
        username = excluded.username,
        display_name = excluded.display_name,
        password_hash = excluded.password_hash,
        otp_hash = excluded.otp_hash,
        expires_at = excluded.expires_at,
        last_sent_at = excluded.last_sent_at,
        attempts = 0
    `).run(normalizedEmail, cleanUsername, displayName.trim(), passwordHash, createOtpHash(otp), now + 10 * 60 * 1000, now);

    try {
      await sendSignupOtp(normalizedEmail, otp);
    } catch (mailError) {
      db.prepare('DELETE FROM signup_verifications WHERE email = ?').run(normalizedEmail);
      throw mailError;
    }

    return res.status(202).json({ message: 'Verification code sent.', email: normalizedEmail });
  } catch (err) {
    console.error('Signup OTP error:', err.message);
    return res.status(500).json({ error: 'Unable to send verification code. Please try again later.' });
  }
});

// POST /api/auth/signup/resend-otp
router.post('/signup/resend-otp', async (req, res) => {
  try {
    const email = normalizeGmail(req.body.email);
    const pending = db.prepare('SELECT last_sent_at FROM signup_verifications WHERE email = ?').get(email);
    if (!pending) return res.status(400).json({ error: 'Your signup session expired. Please start again.' });
    if (Date.now() - pending.last_sent_at < 60 * 1000) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting another code.' });
    }
    await sendVerificationCode(email);
    return res.json({ message: 'A new verification code was sent.' });
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    return res.status(500).json({ error: 'Unable to resend verification code. Please try again later.' });
  }
});

// POST /api/auth/signup/verify-otp
router.post('/signup/verify-otp', async (req, res) => {
  try {
    const email = normalizeGmail(req.body.email);
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
    const pending = db.prepare('SELECT * FROM signup_verifications WHERE email = ?').get(email);

    if (!pending || pending.expires_at < Date.now()) {
      db.prepare('DELETE FROM signup_verifications WHERE email = ?').run(email);
      return res.status(400).json({ error: 'This verification code has expired. Please request a new one.' });
    }
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'Enter the 6-digit verification code.' });
    if (pending.attempts >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }
    if (createOtpHash(otp) !== pending.otp_hash) {
      db.prepare('UPDATE signup_verifications SET attempts = attempts + 1 WHERE email = ?').run(email);
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${pending.username}`;
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(pending.username, pending.email, pending.password_hash, pending.display_name, defaultAvatar, 'Hello Voxa!');
    db.prepare('DELETE FROM signup_verifications WHERE email = ?').run(email);

    const newUser = db.prepare('SELECT id, username, email, display_name, bio, avatar_url, cover_url, location, website, is_verified, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ message: 'Email verified and account created.', token: generateToken(newUser), user: { ...newUser, followersCount: 0, followingCount: 0, postsCount: 0, unreadNotifications: 0, unreadMessages: 0 } });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    return res.status(500).json({ error: 'Unable to verify your email. Please try again.' });
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
