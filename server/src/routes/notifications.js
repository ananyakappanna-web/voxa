const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;

    const notifications = db.prepare(`
      SELECT 
        n.id, n.type, n.is_read, n.created_at, n.post_id,
        u.id as actor_id, u.username as actor_username, u.display_name as actor_display_name,
        u.avatar_url as actor_avatar_url, u.is_verified as actor_is_verified,
        p.content as post_content, p.image_url as post_image_url
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      LEFT JOIN posts p ON n.post_id = p.id
      WHERE n.recipient_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(currentUserId);

    return res.json({
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        isRead: !!n.is_read,
        createdAt: n.created_at,
        postId: n.post_id,
        postContent: n.post_content,
        postImageUrl: n.post_image_url,
        actor: {
          id: n.actor_id,
          username: n.actor_username,
          displayName: n.actor_display_name,
          avatarUrl: n.actor_avatar_url,
          isVerified: !!n.actor_is_verified
        }
      }))
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/read (Mark all as read)
router.patch('/read', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?').run(currentUserId);
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const count = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE recipient_id = ? AND is_read = 0').get(currentUserId).c;
    return res.json({ unreadCount: count });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get unread notification count' });
  }
});

module.exports = router;
