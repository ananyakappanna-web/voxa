const bcrypt = require('bcryptjs');
const db = require('./index');

async function seed() {
  console.log('🌱 Seeding Voxa database with rich realistic data...');

  // Clear existing records
  db.exec(`
    DELETE FROM hashtags;
    DELETE FROM messages;
    DELETE FROM notifications;
    DELETE FROM follows;
    DELETE FROM bookmarks;
    DELETE FROM reposts;
    DELETE FROM likes;
    DELETE FROM posts;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, display_name, bio, avatar_url, cover_url, location, website, is_verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    {
      username: 'alex_dev',
      email: 'alex@voxa.com',
      displayName: 'Alex Morgan ⚡',
      bio: 'Full-stack engineer building the future of social tech. TypeScript, React, Node & AI enthusiast. Building @Voxa 🚀',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      location: 'San Francisco, CA',
      website: 'https://alexmorgan.dev',
      verified: 1,
      createdAt: '2025-01-10 10:00:00'
    },
    {
      username: 'sarah_ux',
      email: 'sarah@voxa.com',
      displayName: 'Sarah Jenkins 🎨',
      bio: 'Staff Product Designer @Stripe. Obsessed with micro-interactions, dark UI & design systems. Crafting digital emotions.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
      location: 'Brooklyn, NY',
      website: 'https://sarahdesigns.io',
      verified: 1,
      createdAt: '2025-01-12 11:30:00'
    },
    {
      username: 'sam_altman',
      email: 'sam@voxa.com',
      displayName: 'Sam Altman',
      bio: 'AGI is getting closer every week. Focusing on intelligence, compute, and human agency.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      location: 'San Francisco, CA',
      website: 'https://blog.samaltman.com',
      verified: 1,
      createdAt: '2025-01-05 08:00:00'
    },
    {
      username: 'tech_insider',
      email: 'news@voxa.com',
      displayName: 'Tech Insider 📡',
      bio: 'Your primary frequency for breaking technology news, silicon developments, robotics, and global software breakthroughs.',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      location: 'Global',
      website: 'https://techinsider.news',
      verified: 1,
      createdAt: '2025-01-01 00:00:00'
    },
    {
      username: 'nova_ai',
      email: 'nova@voxa.com',
      displayName: 'Nova AI Research 🧠',
      bio: 'Open-weights frontier reasoning models. Scalable alignment, synthetic cognitive tokens, and multi-modal architectures.',
      avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
      location: 'Zurich / Remote',
      website: 'https://nova-research.ai',
      verified: 1,
      createdAt: '2025-01-08 09:00:00'
    },
    {
      username: 'marcus_code',
      email: 'marcus@voxa.com',
      displayName: 'Marcus Rivera',
      bio: 'Distributed systems & Rust enthusiast. Optimizing low-latency network protocols and database engines.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      location: 'Austin, TX',
      website: 'https://mrivera.dev',
      verified: 0,
      createdAt: '2025-01-15 14:20:00'
    },
    {
      username: 'elena_cyber',
      email: 'elena@voxa.com',
      displayName: 'Elena Rostova 🛡️',
      bio: 'Security researcher & zero-day hunter. Hardware hacking, cryptography, and defensive infrastructure.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
      location: 'Berlin, Germany',
      website: 'https://cybersec-elena.org',
      verified: 1,
      createdAt: '2025-01-18 16:45:00'
    },
    {
      username: 'voxa_official',
      email: 'official@voxa.com',
      displayName: 'Voxa 𝕏',
      bio: 'Welcome to Voxa. The next-generation open conversation platform for builders, creators, and thinkers. Say what matters. #VoxaLaunch',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      cover: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
      location: 'The Internet',
      website: 'https://voxa.social',
      verified: 1,
      createdAt: '2025-01-01 00:00:00'
    }
  ];

  const userIds = {};
  for (const u of users) {
    const res = insertUser.run(u.username, u.email, passwordHash, u.displayName, u.bio, u.avatar, u.cover, u.location, u.website, u.verified, u.createdAt);
    userIds[u.username] = res.lastInsertRowid;
  }

  // 2. Insert Follow Relationships
  const insertFollow = db.prepare(`INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)`);
  const followPairs = [
    ['alex_dev', 'sarah_ux'],
    ['alex_dev', 'sam_altman'],
    ['alex_dev', 'nova_ai'],
    ['alex_dev', 'voxa_official'],
    ['sarah_ux', 'alex_dev'],
    ['sarah_ux', 'sam_altman'],
    ['sarah_ux', 'voxa_official'],
    ['sam_altman', 'nova_ai'],
    ['sam_altman', 'voxa_official'],
    ['tech_insider', 'sam_altman'],
    ['tech_insider', 'nova_ai'],
    ['tech_insider', 'alex_dev'],
    ['nova_ai', 'alex_dev'],
    ['marcus_code', 'alex_dev'],
    ['marcus_code', 'sarah_ux'],
    ['elena_cyber', 'alex_dev'],
    ['elena_cyber', 'tech_insider'],
    ['voxa_official', 'alex_dev']
  ];

  for (const [follower, following] of followPairs) {
    insertFollow.run(userIds[follower], userIds[following], '2025-01-20 12:00:00');
  }

  // 3. Helper to insert Post and its Hashtags
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, content, image_url, reply_to_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertHashtag = db.prepare(`INSERT INTO hashtags (tag, post_id, created_at) VALUES (?, ?, ?)`);

  function createPost(username, content, imageUrl = null, replyToId = null, createdAt = new Date().toISOString()) {
    const res = insertPost.run(userIds[username], content, imageUrl, replyToId, createdAt);
    const postId = res.lastInsertRowid;

    // Extract hashtags
    const tags = content.match(/#[a-zA-Z0-9_]+/g);
    if (tags) {
      for (const tag of tags) {
        insertHashtag.run(tag.toLowerCase(), postId, createdAt);
      }
    }
    return postId;
  }

  // Create Posts
  const p1 = createPost(
    'voxa_official',
    'Welcome to Voxa ⚡ The modern, ultra-fast social platform engineered for developers, creators, and thinkers. Real-time feeds, rich threads, and zero bloat. Let us know what you think! #VoxaLaunch #WebDev #BuildInPublic',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
    null,
    '2025-02-01 08:00:00'
  );

  const p2 = createPost(
    'alex_dev',
    'Just pushed a major architecture upgrade to the feed pipeline. Reduced time-to-interactive down to 64ms with SQLite WAL mode and WebSocket message streams! 🚀🔥 #FullStack #ReactJS #NodeJS #TechNews',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
    null,
    '2025-02-01 09:15:00'
  );

  const p3 = createPost(
    'sarah_ux',
    'Dark mode is not just inverted white. It is depth, subtle elevation layers, border contrasts, and crisp electric accents. What do you think of this palette? ✨🖤 #DesignSystems #UIUX #DesignTrends',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80',
    null,
    '2025-02-01 10:30:00'
  );

  const p4 = createPost(
    'sam_altman',
    'The speed at which autonomous coding agents are improving is unprecedented. What took a senior engineering team three weeks in 2023 can now be scaffolded, tested, and verified in minutes. #AI #FutureOfWork',
    null,
    null,
    '2025-02-01 11:00:00'
  );

  const p5 = createPost(
    'nova_ai',
    'Introducing Nova-Omni 3.0: 70B parameter dense model with native multi-step chain-of-thought verification, scoring 94.2% on HumanEval benchmarks. Weights dropping on HuggingFace today! 🧠✨ #AI #MachineLearning #OpenSource',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1000&auto=format&fit=crop&q=80',
    null,
    '2025-02-01 12:45:00'
  );

  const p6 = createPost(
    'tech_insider',
    'BREAKING: Semiconductor foundries announce breakthrough in 1.4nm ribbon-FET mass production scheduled for Q3 2026. 35% higher clock efficiency with 40% thermal dissipation gains. #TechNews #Hardware #Silicon',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
    null,
    '2025-02-01 13:20:00'
  );

  const p7 = createPost(
    'marcus_code',
    'Rewriting our core ingestion worker in Rust dropped memory footprint from 1.8GB to 42MB under peak load. Zero garbage collector pauses is pure bliss. #RustLang #Backend #HighPerformance',
    null,
    null,
    '2025-02-01 14:00:00'
  );

  const p8 = createPost(
    'elena_cyber',
    'PSA: Always sanitize your markdown rendering pipeline against SVG script injections and prototype pollution in nested JSON parsers! Stay vigilant 🛡️ #CyberSecurity #InfoSec #WebDev',
    null,
    null,
    '2025-02-01 14:40:00'
  );

  const p9 = createPost(
    'alex_dev',
    'Working on the new 1:1 Direct Messages feature with instant typing indicators and live presence on @Voxa! The UI feels incredibly snappy. 💬⚡ #BuildInPublic #VoxaLaunch',
    null,
    null,
    '2025-02-01 15:30:00'
  );

  const p10 = createPost(
    'sarah_ux',
    'Minimalist workspace setup for today. Good mechanical keyboard + 4K OLED + espresso = 10x design output. ☕💻 #DeskSetup #Workspace #Productivity',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
    null,
    '2025-02-01 16:10:00'
  );

  // Replies / Threads
  const r1 = createPost('sarah_ux', 'This looks remarkably clean @alex_dev! The electric blue accent pops beautifully against true black 🖤', null, p2, '2025-02-01 09:25:00');
  const r2 = createPost('marcus_code', 'Are you using SQLite with WAL mode on NVMe? The write throughput is genuinely insane.', null, p2, '2025-02-01 09:30:00');
  const r3 = createPost('alex_dev', 'Yes! WAL mode with synchronous=NORMAL handles thousands of concurrent writes without a hiccup.', null, r2, '2025-02-01 09:35:00');
  const r4 = createPost('alex_dev', 'The key is contrast ratio! 4.5:1 minimum on text, with 1px border highlights for cards.', null, p3, '2025-02-01 10:45:00');
  const r5 = createPost('sam_altman', 'Big congratulations on the launch team @voxa_official. Clean UI and fast latency will always win.', null, p1, '2025-02-01 08:30:00');
  const r6 = createPost('alex_dev', 'Can’t wait to benchmark Nova-Omni against our internal evaluation dataset @nova_ai! 🚀', null, p5, '2025-02-01 13:00:00');

  // 4. Insert Likes & Reposts
  const insertLike = db.prepare(`INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)`);
  const insertRepost = db.prepare(`INSERT INTO reposts (user_id, post_id, created_at) VALUES (?, ?, ?)`);
  const insertBookmark = db.prepare(`INSERT INTO bookmarks (user_id, post_id, created_at) VALUES (?, ?, ?)`);

  const likesData = [
    ['sarah_ux', p1], ['sam_altman', p1], ['alex_dev', p1], ['marcus_code', p1], ['elena_cyber', p1],
    ['sarah_ux', p2], ['sam_altman', p2], ['nova_ai', p2], ['marcus_code', p2],
    ['alex_dev', p3], ['sam_altman', p3], ['marcus_code', p3],
    ['alex_dev', p4], ['sarah_ux', p4], ['nova_ai', p4], ['tech_insider', p4],
    ['alex_dev', p5], ['sam_altman', p5], ['tech_insider', p5],
    ['alex_dev', p6], ['elena_cyber', p6],
    ['alex_dev', p7], ['sarah_ux', p7],
    ['alex_dev', p8], ['tech_insider', p8],
    ['sarah_ux', p9], ['marcus_code', p9],
    ['alex_dev', p10], ['sam_altman', p10]
  ];

  for (const [u, pid] of likesData) {
    insertLike.run(userIds[u], pid, '2025-02-01 10:00:00');
  }

  const repostsData = [
    ['alex_dev', p1], ['sarah_ux', p1],
    ['sarah_ux', p2],
    ['alex_dev', p5], ['tech_insider', p5],
    ['alex_dev', p6]
  ];

  for (const [u, pid] of repostsData) {
    insertRepost.run(userIds[u], pid, '2025-02-01 11:00:00');
  }

  const bookmarksData = [
    ['alex_dev', p3],
    ['alex_dev', p5],
    ['alex_dev', p8]
  ];

  for (const [u, pid] of bookmarksData) {
    insertBookmark.run(userIds[u], pid, '2025-02-01 12:00:00');
  }

  // 5. Insert Notifications for Alex
  const insertNotif = db.prepare(`
    INSERT INTO notifications (recipient_id, actor_id, type, post_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(userIds['alex_dev'], userIds['sarah_ux'], 'LIKE', p2, 0, '2025-02-01 09:20:00');
  insertNotif.run(userIds['alex_dev'], userIds['sarah_ux'], 'REPLY', r1, 0, '2025-02-01 09:25:00');
  insertNotif.run(userIds['alex_dev'], userIds['sam_altman'], 'LIKE', p2, 0, '2025-02-01 09:40:00');
  insertNotif.run(userIds['alex_dev'], userIds['marcus_code'], 'FOLLOW', null, 0, '2025-02-01 10:00:00');
  insertNotif.run(userIds['alex_dev'], userIds['sarah_ux'], 'REPOST', p2, 1, '2025-02-01 10:15:00');
  insertNotif.run(userIds['alex_dev'], userIds['elena_cyber'], 'FOLLOW', null, 1, '2025-02-01 10:30:00');

  // 6. Insert Messages (Direct Messages with Sarah and Sam)
  const insertMessage = db.prepare(`
    INSERT INTO messages (sender_id, recipient_id, content, image_url, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertMessage.run(userIds['sarah_ux'], userIds['alex_dev'], 'Hey Alex! Loved the new dark mode aesthetics on Voxa 🎨', null, 1, '2025-02-01 10:00:00');
  insertMessage.run(userIds['alex_dev'], userIds['sarah_ux'], 'Thanks Sarah! Credit goes to your design specs. The electric blue highlights really stand out.', null, 1, '2025-02-01 10:02:00');
  insertMessage.run(userIds['sarah_ux'], userIds['alex_dev'], 'Are we adding the image lightbox modal this week?', null, 0, '2025-02-01 10:05:00');

  insertMessage.run(userIds['sam_altman'], userIds['alex_dev'], 'Hey Alex, really impressive speed on the timeline feed.', null, 1, '2025-02-01 11:30:00');
  insertMessage.run(userIds['alex_dev'], userIds['sam_altman'], 'Appreciate that Sam! We are optimizing WebSockets for sub-10ms delivery next.', null, 1, '2025-02-01 11:35:00');

  insertMessage.run(userIds['nova_ai'], userIds['alex_dev'], 'We would love to integrate Nova reasoning tokens into Voxa smart threads!', null, 0, '2025-02-01 14:00:00');

  console.log('✅ Database seeded successfully with 8 users, 16 posts & replies, follows, likes, notifications, and DMs!');
}

seed().catch(err => {
  console.error('❌ Error seeding database:', err);
  process.exit(1);
});
