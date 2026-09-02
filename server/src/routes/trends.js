const express = require('express');
const router = express.Router();
const db = require('../db');

// Category mappings for realistic Twitter-like trend classification
const CATEGORY_MAP = {
  '#ai': 'Artificial Intelligence · Trending',
  '#voxalaunch': 'Technology · Trending',
  '#webdev': 'Software Development · Trending',
  '#reactjs': 'Frontend Frameworks · Trending',
  '#technews': 'Technology · News',
  '#designsystems': 'Design · Trending',
  '#rustlang': 'Programming Languages · Trending',
  '#buildinpublic': 'Startups · Trending',
  '#cybersecurity': 'Information Security · Trending',
  '#desksetup': 'Productivity & Workspaces · Trending'
};

// GET /api/trends
router.get('/', (req, res) => {
  try {
    const rawTrends = db.prepare(`
      SELECT tag, COUNT(*) as post_count
      FROM hashtags
      GROUP BY tag
      ORDER BY post_count DESC
      LIMIT 10
    `).all();

    // Default high-profile fallback topics if hashtag count is low
    const fallbackTopics = [
      { tag: '#VoxaLaunch', post_count: 1420, category: 'Technology · Trending' },
      { tag: '#AI', post_count: 9850, category: 'Artificial Intelligence · Trending' },
      { tag: '#WebDev', post_count: 4320, category: 'Software Development · Trending' },
      { tag: '#ReactJS', post_count: 2890, category: 'Frontend · Trending' },
      { tag: '#DesignSystems', post_count: 1540, category: 'Design · Trending' },
      { tag: '#OpenSource', post_count: 3100, category: 'Developers · Trending' }
    ];

    const trends = rawTrends.map(t => {
      const lower = t.tag.toLowerCase();
      const baseCategory = CATEGORY_MAP[lower] || 'Trending worldwide';
      return {
        tag: t.tag,
        category: baseCategory,
        postCount: Math.max(t.post_count * 120 + 45, 120) // Scale post count for realistic feel
      };
    });

    // Merge if necessary
    for (const fb of fallbackTopics) {
      if (!trends.find(t => t.tag.toLowerCase() === fb.tag.toLowerCase())) {
        trends.push(fb);
      }
    }

    return res.json({ trends: trends.slice(0, 8) });
  } catch (err) {
    console.error('Trends error:', err);
    return res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

module.exports = router;
