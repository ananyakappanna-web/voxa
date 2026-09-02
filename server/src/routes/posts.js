const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { sendNotificationToUser } = require('../socket');

// Helper to format post with user interaction flags
function formatPost(row, currentUserId = null) {
  if (!row) return null;
  return {
    id: row.id,
    content: row.content,
    imageUrl: row.image_url,
    replyToId: row.reply_to_id,
    createdAt: row.created_at,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      isVerified: !!row.is_verified
    },
    likesCount: row.likes_count || 0,
    repostsCount: row.reposts_count || 0,
    repliesCount: row.replies_count || 0,
    bookmarksCount: row.bookmarks_count || 0,
    isLiked: !!row.is_liked,
    isReposted: !!row.is_reposted,
    isBookmarked: !!row.is_bookmarked,
    isAuthor: currentUserId ? row.user_id === currentUserId : false
  };
}

// SQL Fragment for Post Select
function getPostSelectQuery(currentUserId) {
  return `
    SELECT 
      p.id, p.content, p.image_url, p.reply_to_id, p.created_at, p.user_id,
      u.username, u.display_name, u.avatar_url, u.is_verified,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) as reposts_count,
      (SELECT COUNT(*) FROM posts r WHERE r.reply_to_id = p.id) as replies_count,
      (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id) as bookmarks_count,
      CASE WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM likes l WHERE l.user_id = ? AND l.post_id = p.id) THEN 1 ELSE 0 END as is_liked,
      CASE WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM reposts rp WHERE rp.user_id = ? AND rp.post_id = p.id) THEN 1 ELSE 0 END as is_reposted,
      CASE WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM bookmarks bm WHERE bm.user_id = ? AND bm.post_id = p.id) THEN 1 ELSE 0 END as is_bookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
  `;
}

// GET /api/posts (Home Feed: For You / Following)
router.get('/', optionalAuth, (req, res) => {
  try {
    const feedType = req.query.feed || 'for-you';
    const limit = parseInt(req.query.limit, 10) || 20;
    const currentUserId = req.user ? req.user.id : null;

    let query = '';
    let params = [];

    if (feedType === 'following') {
      if (!currentUserId) {
        return res.json({ posts: [] });
      }
      query = `
        ${getPostSelectQuery(currentUserId)}
        WHERE p.reply_to_id IS NULL
        AND (
          p.user_id = ?
          OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
        )
        ORDER BY p.created_at DESC
        LIMIT ?
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, limit];
    } else {
      // 'for-you' feed: all top-level posts
      query = `
        ${getPostSelectQuery(currentUserId)}
        WHERE p.reply_to_id IS NULL
        ORDER BY p.created_at DESC
        LIMIT ?
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, limit];
    }

    const rows = db.prepare(query).all(...params);
    const posts = rows.map(r => formatPost(r, currentUserId));

    return res.json({ posts });
  } catch (err) {
    console.error('Error fetching feed:', err);
    return res.status(500).json({ error: 'Failed to fetch posts feed' });
  }
});

// GET /api/posts/bookmarks (User's bookmarked posts)
router.get('/user-bookmarks', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const query = `
      ${getPostSelectQuery(currentUserId)}
      JOIN bookmarks b ON b.post_id = p.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `;
    const params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId];
    const rows = db.prepare(query).all(...params);
    const posts = rows.map(r => formatPost(r, currentUserId));

    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// GET /api/posts/user/:username
router.get('/user/:username', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const tab = req.query.tab || 'posts'; // 'posts' | 'replies' | 'likes' | 'media'
    const targetUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(username.toLowerCase());

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserId = req.user ? req.user.id : null;
    let query = '';
    let params = [];

    if (tab === 'replies') {
      query = `
        ${getPostSelectQuery(currentUserId)}
        WHERE p.user_id = ? AND p.reply_to_id IS NOT NULL
        ORDER BY p.created_at DESC
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, targetUser.id];
    } else if (tab === 'likes') {
      query = `
        ${getPostSelectQuery(currentUserId)}
        JOIN likes l ON l.post_id = p.id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, targetUser.id];
    } else if (tab === 'media') {
      query = `
        ${getPostSelectQuery(currentUserId)}
        WHERE p.user_id = ? AND p.image_url IS NOT NULL AND p.image_url != ''
        ORDER BY p.created_at DESC
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, targetUser.id];
    } else {
      // Default 'posts': top-level posts + reposts
      query = `
        ${getPostSelectQuery(currentUserId)}
        WHERE p.user_id = ? AND p.reply_to_id IS NULL
        ORDER BY p.created_at DESC
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, targetUser.id];
    }

    const rows = db.prepare(query).all(...params);
    const posts = rows.map(r => formatPost(r, currentUserId));

    return res.json({ posts });
  } catch (err) {
    console.error('Error fetching user timeline:', err);
    return res.status(500).json({ error: 'Failed to fetch user timeline' });
  }
});

// GET /api/posts/hashtag/:tag
router.get('/hashtag/:tag', optionalAuth, (req, res) => {
  try {
    let tag = req.params.tag;
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }
    const currentUserId = req.user ? req.user.id : null;

    const query = `
      ${getPostSelectQuery(currentUserId)}
      JOIN hashtags h ON h.post_id = p.id
      WHERE LOWER(h.tag) = ?
      ORDER BY p.created_at DESC
    `;
    const params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, tag.toLowerCase()];
    const rows = db.prepare(query).all(...params);
    const posts = rows.map(r => formatPost(r, currentUserId));

    return res.json({ hashtag: tag, posts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch hashtag posts' });
  }
});

// GET /api/posts/search?q=
router.get('/search', optionalAuth, (req, res) => {
  try {
    const queryTerm = req.query.q ? req.query.q.trim() : '';
    if (!queryTerm) {
      return res.json({ posts: [] });
    }

    const currentUserId = req.user ? req.user.id : null;
    const searchParam = `%${queryTerm.toLowerCase()}%`;

    const query = `
      ${getPostSelectQuery(currentUserId)}
      WHERE LOWER(p.content) LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 30
    `;
    const params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, searchParam];
    const rows = db.prepare(query).all(...params);
    const posts = rows.map(r => formatPost(r, currentUserId));

    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search posts' });
  }
});

// GET /api/posts/:id (Post detail with parent and replies thread)
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const currentUserId = req.user ? req.user.id : null;

    // Fetch main post
    const query = `
      ${getPostSelectQuery(currentUserId)}
      WHERE p.id = ?
    `;
    const params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, postId];
    const mainRow = db.prepare(query).get(...params);

    if (!mainRow) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = formatPost(mainRow, currentUserId);

    // Fetch parent post if this post is a reply
    let parentPost = null;
    if (mainRow.reply_to_id) {
      const parentRow = db.prepare(`
        ${getPostSelectQuery(currentUserId)}
        WHERE p.id = ?
      `).get(currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, mainRow.reply_to_id);
      if (parentRow) {
        parentPost = formatPost(parentRow, currentUserId);
      }
    }

    // Fetch direct replies
    const repliesQuery = `
      ${getPostSelectQuery(currentUserId)}
      WHERE p.reply_to_id = ?
      ORDER BY p.created_at ASC
    `;
    const repliesRows = db.prepare(repliesQuery).all(currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, postId);
    const replies = repliesRows.map(r => formatPost(r, currentUserId));

    return res.json({
      post,
      parentPost,
      replies
    });
  } catch (err) {
    console.error('Error fetching post detail:', err);
    return res.status(500).json({ error: 'Failed to fetch post details' });
  }
});

// POST /api/posts (Create post or reply)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { content, imageUrl, replyToId } = req.body;
    const user = req.user;

    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Post must contain text content or an image.' });
    }

    if (content && content.length > 280) {
      return res.status(400).json({ error: 'Post exceeds 280 character limit.' });
    }

    let validReplyToId = null;
    let parentPostAuthorId = null;

    if (replyToId) {
      const parent = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(replyToId);
      if (parent) {
        validReplyToId = parent.id;
        parentPostAuthorId = parent.user_id;
      }
    }

    const insertResult = db.prepare(`
      INSERT INTO posts (user_id, content, image_url, reply_to_id)
      VALUES (?, ?, ?, ?)
    `).run(user.id, content ? content.trim() : '', imageUrl || null, validReplyToId);

    const newPostId = insertResult.lastInsertRowid;

    // Extract and insert hashtags
    if (content) {
      const tags = content.match(/#[a-zA-Z0-9_]+/g);
      if (tags) {
        const insertHashtag = db.prepare('INSERT INTO hashtags (tag, post_id) VALUES (?, ?)');
        for (const tag of tags) {
          insertHashtag.run(tag.toLowerCase(), newPostId);
        }
      }
    }

    // If this is a reply and author is not self, send notification
    if (validReplyToId && parentPostAuthorId && parentPostAuthorId !== user.id) {
      const notifRes = db.prepare(`
        INSERT INTO notifications (recipient_id, actor_id, type, post_id)
        VALUES (?, ?, 'REPLY', ?)
      `).run(parentPostAuthorId, user.id, newPostId);

      const fullNotif = db.prepare(`
        SELECT n.*, u.username as actor_username, u.display_name as actor_display_name, u.avatar_url as actor_avatar_url
        FROM notifications n
        JOIN users u ON n.actor_id = u.id
        WHERE n.id = ?
      `).get(notifRes.lastInsertRowid);

      sendNotificationToUser(parentPostAuthorId, fullNotif);
    }

    // Return created post
    const createdRow = db.prepare(`
      ${getPostSelectQuery(user.id)}
      WHERE p.id = ?
    `).get(user.id, user.id, user.id, user.id, user.id, user.id, newPostId);

    return res.status(201).json({
      message: validReplyToId ? 'Reply posted' : 'Vox published',
      post: formatPost(createdRow, user.id)
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Failed to publish post' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== currentUserId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    return res.json({ message: 'Post deleted successfully', postId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/posts/:id/like (Toggle Like)
router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(currentUserId, postId);

    if (existingLike) {
      // Unlike
      db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(currentUserId, postId);
      const likesCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').get(postId).c;
      return res.json({ isLiked: false, likesCount });
    } else {
      // Like
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(currentUserId, postId);
      const likesCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').get(postId).c;

      // Notification
      if (post.user_id !== currentUserId) {
        const notifRes = db.prepare(`
          INSERT INTO notifications (recipient_id, actor_id, type, post_id)
          VALUES (?, ?, 'LIKE', ?)
        `).run(post.user_id, currentUserId, postId);

        const fullNotif = db.prepare(`
          SELECT n.*, u.username as actor_username, u.display_name as actor_display_name, u.avatar_url as actor_avatar_url
          FROM notifications n
          JOIN users u ON n.actor_id = u.id
          WHERE n.id = ?
        `).get(notifRes.lastInsertRowid);

        sendNotificationToUser(post.user_id, fullNotif);
      }

      return res.json({ isLiked: true, likesCount });
    }
  } catch (err) {
    console.error('Like toggle error:', err);
    return res.status(500).json({ error: 'Failed to update like status' });
  }
});

// POST /api/posts/:id/repost (Toggle Repost)
router.post('/:id/repost', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingRepost = db.prepare('SELECT id FROM reposts WHERE user_id = ? AND post_id = ?').get(currentUserId, postId);

    if (existingRepost) {
      // Un-repost
      db.prepare('DELETE FROM reposts WHERE user_id = ? AND post_id = ?').run(currentUserId, postId);
      const repostsCount = db.prepare('SELECT COUNT(*) as c FROM reposts WHERE post_id = ?').get(postId).c;
      return res.json({ isReposted: false, repostsCount });
    } else {
      // Repost
      db.prepare('INSERT INTO reposts (user_id, post_id) VALUES (?, ?)').run(currentUserId, postId);
      const repostsCount = db.prepare('SELECT COUNT(*) as c FROM reposts WHERE post_id = ?').get(postId).c;

      // Notification
      if (post.user_id !== currentUserId) {
        const notifRes = db.prepare(`
          INSERT INTO notifications (recipient_id, actor_id, type, post_id)
          VALUES (?, ?, 'REPOST', ?)
        `).run(post.user_id, currentUserId, postId);

        const fullNotif = db.prepare(`
          SELECT n.*, u.username as actor_username, u.display_name as actor_display_name, u.avatar_url as actor_avatar_url
          FROM notifications n
          JOIN users u ON n.actor_id = u.id
          WHERE n.id = ?
        `).get(notifRes.lastInsertRowid);

        sendNotificationToUser(post.user_id, fullNotif);
      }

      return res.json({ isReposted: true, repostsCount });
    }
  } catch (err) {
    console.error('Repost toggle error:', err);
    return res.status(500).json({ error: 'Failed to update repost status' });
  }
});

// POST /api/posts/:id/bookmark (Toggle Bookmark)
router.post('/:id/bookmark', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?').get(currentUserId, postId);

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').run(currentUserId, postId);
      const bookmarksCount = db.prepare('SELECT COUNT(*) as c FROM bookmarks WHERE post_id = ?').get(postId).c;
      return res.json({ isBookmarked: false, bookmarksCount, message: 'Removed from Bookmarks' });
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').run(currentUserId, postId);
      const bookmarksCount = db.prepare('SELECT COUNT(*) as c FROM bookmarks WHERE post_id = ?').get(postId).c;
      return res.json({ isBookmarked: true, bookmarksCount, message: 'Added to your Bookmarks' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

module.exports = router;
