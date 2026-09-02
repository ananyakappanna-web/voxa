const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { sendNotificationToUser } = require('../socket');

// GET /api/users/profile/:username
router.get('/profile/:username', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const targetUser = db.prepare(`
      SELECT id, username, email, display_name, bio, avatar_url, cover_url, location, website, is_verified, created_at
      FROM users
      WHERE LOWER(username) = ?
    `).get(username.toLowerCase());

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followersCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(targetUser.id).c;
    const followingCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(targetUser.id).c;
    const postsCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ? AND reply_to_id IS NULL').get(targetUser.id).c;

    let isFollowing = false;
    let isSelf = false;

    if (req.user) {
      isSelf = req.user.id === targetUser.id;
      if (!isSelf) {
        const followRecord = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, targetUser.id);
        isFollowing = !!followRecord;
      }
    }

    return res.json({
      user: {
        ...targetUser,
        followersCount,
        followingCount,
        postsCount,
        isFollowing,
        isSelf
      }
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PATCH /api/users/profile (Update current user profile)
router.patch('/profile', authenticateToken, (req, res) => {
  try {
    const { displayName, bio, avatarUrl, coverUrl, location, website } = req.body;
    const current = req.user;

    const updatedDisplayName = displayName !== undefined ? displayName.trim() : current.display_name;
    const updatedBio = bio !== undefined ? bio.trim() : current.bio;
    const updatedAvatar = avatarUrl !== undefined ? avatarUrl.trim() : current.avatar_url;
    const updatedCover = coverUrl !== undefined ? coverUrl.trim() : current.cover_url;
    const updatedLocation = location !== undefined ? location.trim() : current.location;
    const updatedWebsite = website !== undefined ? website.trim() : current.website;

    db.prepare(`
      UPDATE users
      SET display_name = ?, bio = ?, avatar_url = ?, cover_url = ?, location = ?, website = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(updatedDisplayName, updatedBio, updatedAvatar, updatedCover, updatedLocation, updatedWebsite, current.id);

    const updatedUser = db.prepare(`SELECT id, username, email, display_name, bio, avatar_url, cover_url, location, website, is_verified, created_at FROM users WHERE id = ?`).get(current.id);

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/:id/follow (Toggle Follow/Unfollow)
router.post('/:id/follow', authenticateToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFollow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, targetUserId);

    if (existingFollow) {
      // Unfollow
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUserId, targetUserId);
      return res.json({
        isFollowing: false,
        message: `Unfollowed @${targetUser.username}`
      });
    } else {
      // Follow
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(currentUserId, targetUserId);

      // Create notification
      const notifRes = db.prepare(`
        INSERT INTO notifications (recipient_id, actor_id, type)
        VALUES (?, ?, 'FOLLOW')
      `).run(targetUserId, currentUserId);

      // Trigger real-time notification
      const fullNotif = db.prepare(`
        SELECT n.*, u.username as actor_username, u.display_name as actor_display_name, u.avatar_url as actor_avatar_url
        FROM notifications n
        JOIN users u ON n.actor_id = u.id
        WHERE n.id = ?
      `).get(notifRes.lastInsertRowid);

      sendNotificationToUser(targetUserId, fullNotif);

      return res.json({
        isFollowing: true,
        message: `Following @${targetUser.username}`
      });
    }
  } catch (err) {
    console.error('Follow toggle error:', err);
    return res.status(500).json({ error: 'Failed to update follow status' });
  }
});

// GET /api/users/:username/followers
router.get('/:username/followers', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const targetUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(username.toLowerCase());
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserId = req.user ? req.user.id : null;

    const followers = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_verified,
        CASE WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id = ? AND f2.following_id = u.id) THEN 1 ELSE 0 END as is_following
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `).all(currentUserId, currentUserId, targetUser.id);

    return res.json({ followers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/users/:username/following
router.get('/:username/following', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const targetUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(username.toLowerCase());
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserId = req.user ? req.user.id : null;

    const following = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_verified,
        CASE WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id = ? AND f2.following_id = u.id) THEN 1 ELSE 0 END as is_following
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(currentUserId, currentUserId, targetUser.id);

    return res.json({ following });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch following users' });
  }
});

// GET /api/users/suggestions ("Who to follow")
router.get('/suggestions', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const limit = parseInt(req.query.limit, 10) || 4;

    const suggestions = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_verified,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
      FROM users u
      WHERE u.id != ?
      AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
      ORDER BY followers_count DESC, RANDOM()
      LIMIT ?
    `).all(currentUserId, currentUserId, limit);

    return res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions error:', err);
    return res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// GET /api/users/search?q=
router.get('/search', optionalAuth, (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) {
      return res.json({ users: [] });
    }

    const currentUserId = req.user ? req.user.id : null;
    const searchTerm = `%${query.toLowerCase()}%`;

    const users = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_verified,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        CASE WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id) THEN 1 ELSE 0 END as is_following
      FROM users u
      WHERE LOWER(u.username) LIKE ? OR LOWER(u.display_name) LIKE ? OR LOWER(u.bio) LIKE ?
      ORDER BY followers_count DESC
      LIMIT 20
    `).all(currentUserId, currentUserId, searchTerm, searchTerm, searchTerm);

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
