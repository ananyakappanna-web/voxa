const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendMessageToUser } = require('../socket');

// GET /api/messages/conversations (List recent conversations)
router.get('/conversations', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get unique other users that current user has exchanged messages with
    const query = `
      SELECT 
        u.id as user_id, u.username, u.display_name, u.avatar_url, u.is_verified,
        m.id as last_message_id, m.content as last_message, m.created_at as last_message_time,
        m.sender_id as last_sender_id,
        (
          SELECT COUNT(*) 
          FROM messages unread 
          WHERE unread.sender_id = u.id AND unread.recipient_id = ? AND unread.is_read = 0
        ) as unread_count
      FROM users u
      JOIN messages m ON m.id = (
        SELECT id FROM messages 
        WHERE (sender_id = ? AND recipient_id = u.id) OR (sender_id = u.id AND recipient_id = ?)
        ORDER BY created_at DESC 
        LIMIT 1
      )
      WHERE u.id != ?
      ORDER BY m.created_at DESC
    `;

    const conversations = db.prepare(query).all(currentUserId, currentUserId, currentUserId, currentUserId);

    return res.json({
      conversations: conversations.map(c => ({
        user: {
          id: c.user_id,
          username: c.username,
          displayName: c.display_name,
          avatarUrl: c.avatar_url,
          isVerified: !!c.is_verified
        },
        lastMessage: c.last_message,
        lastMessageTime: c.last_message_time,
        lastSenderId: c.last_sender_id,
        unreadCount: c.unread_count
      }))
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/messages/:userId (Message history with specific user)
router.get('/:userId', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const otherUser = db.prepare('SELECT id, username, display_name, avatar_url, is_verified, bio FROM users WHERE id = ?').get(targetUserId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Auto mark incoming messages as read
    db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND recipient_id = ?').run(targetUserId, currentUserId);

    const messages = db.prepare(`
      SELECT id, sender_id, recipient_id, content, image_url, is_read, created_at
      FROM messages
      WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
      ORDER BY created_at ASC
    `).all(currentUserId, targetUserId, targetUserId, currentUserId);

    return res.json({
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.display_name,
        avatarUrl: otherUser.avatar_url,
        isVerified: !!otherUser.is_verified,
        bio: otherUser.bio
      },
      messages: messages.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        content: m.content,
        imageUrl: m.image_url,
        isRead: !!m.is_read,
        createdAt: m.created_at,
        isMine: m.sender_id === currentUserId
      }))
    });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    return res.status(500).json({ error: 'Failed to fetch message history' });
  }
});

// POST /api/messages (Send direct message)
router.post('/', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId, content, imageUrl } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient is required' });
    }

    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const recipient = db.prepare('SELECT id, username FROM users WHERE id = ?').get(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user does not exist' });
    }

    const insertRes = db.prepare(`
      INSERT INTO messages (sender_id, recipient_id, content, image_url)
      VALUES (?, ?, ?, ?)
    `).run(currentUserId, recipientId, content ? content.trim() : '', imageUrl || null);

    const messageData = {
      id: insertRes.lastInsertRowid,
      senderId: currentUserId,
      recipientId: recipientId,
      content: content ? content.trim() : '',
      imageUrl: imageUrl || null,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.display_name,
        avatarUrl: req.user.avatar_url
      }
    };

    // Emit live message to recipient via WebSockets
    sendMessageToUser(recipientId, messageData);

    return res.status(201).json({
      message: 'Message sent successfully',
      data: {
        ...messageData,
        isMine: true
      }
    });
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// PATCH /api/messages/:userId/read
router.patch('/:userId/read', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);

    db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND recipient_id = ?').run(targetUserId, currentUserId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router;
