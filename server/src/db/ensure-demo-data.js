const db = require('./index');

function ensureDemoData() {
  const marker = 'Demo update:';
  const existing = db.prepare('SELECT 1 FROM posts WHERE content LIKE ? LIMIT 1').get(`${marker}%`);
  if (existing) {
    return;
  }

  const users = db.prepare('SELECT id, username FROM users').all();
  const userIds = Object.fromEntries(users.map((user) => [user.username, user.id]));
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, content, image_url, reply_to_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertHashtag = db.prepare('INSERT INTO hashtags (tag, post_id, created_at) VALUES (?, ?, ?)');
  const insertLike = db.prepare('INSERT OR IGNORE INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)');
  const insertBookmark = db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, post_id, created_at) VALUES (?, ?, ?)');
  const insertNotification = db.prepare(`
    INSERT INTO notifications (recipient_id, actor_id, type, post_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertMessage = db.prepare(`
    INSERT INTO messages (sender_id, recipient_id, content, image_url, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const posts = [
    ['alex_dev', 'Demo update: shipped a faster search experience for every Voxa conversation. #VoxaLaunch #WebDev', null, '2025-02-02 09:00:00'],
    ['sarah_ux', 'Demo update: a tiny motion study turned a routine notification into a moment of clarity. #DesignSystems #UIUX', 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1000&auto=format&fit=crop&q=80', '2025-02-02 09:20:00'],
    ['nova_ai', 'Demo update: open research works best when experiments, failures, and benchmarks are shared in public. #AI #OpenSource', null, '2025-02-02 09:45:00'],
    ['marcus_code', 'Demo update: measured the new event pipeline at 12ms p95 under a realistic local workload. #Backend #RustLang', null, '2025-02-02 10:10:00'],
    ['elena_cyber', 'Demo update: security review complete. Strong defaults and small permissions make better products. #CyberSecurity #InfoSec', null, '2025-02-02 10:35:00'],
    ['voxa_official', 'Demo update: welcome to the community. Find a thread, share an idea, and make the next useful connection. #VoxaLaunch #BuildInPublic', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&auto=format&fit=crop&q=80', '2025-02-02 11:00:00']
  ];

  const createdPosts = [];
  const transaction = db.transaction(() => {
    for (const [username, content, imageUrl, createdAt] of posts) {
      const result = insertPost.run(userIds[username], content, imageUrl, null, createdAt);
      const postId = result.lastInsertRowid;
      createdPosts.push(postId);

      for (const tag of content.match(/#[a-zA-Z0-9_]+/g) || []) {
        insertHashtag.run(tag.toLowerCase(), postId, createdAt);
      }
    }

    for (const postId of createdPosts) {
      insertLike.run(userIds.alex_dev, postId, '2025-02-02 12:00:00');
      insertLike.run(userIds.sarah_ux, postId, '2025-02-02 12:05:00');
    }

    insertBookmark.run(userIds.alex_dev, createdPosts[1], '2025-02-02 12:10:00');
    insertBookmark.run(userIds.alex_dev, createdPosts[5], '2025-02-02 12:15:00');

    insertNotification.run(userIds.alex_dev, userIds.sarah_ux, 'LIKE', createdPosts[0], 0, '2025-02-02 12:20:00');
    insertNotification.run(userIds.alex_dev, userIds.voxa_official, 'REPLY', createdPosts[5], 0, '2025-02-02 12:25:00');
    insertNotification.run(userIds.sarah_ux, userIds.alex_dev, 'FOLLOW', null, 0, '2025-02-02 12:30:00');

    insertMessage.run(userIds.alex_dev, userIds.nova_ai, 'The new research thread is live. Would love your take on the benchmark notes.', null, 0, '2025-02-02 12:35:00');
    insertMessage.run(userIds.nova_ai, userIds.alex_dev, 'I will review it today. The comparison chart is especially useful.', null, 0, '2025-02-02 12:40:00');
  });

  transaction();
  console.log('Demo content added: 6 posts, interactions, notifications, and messages.');
}

module.exports = ensureDemoData;
