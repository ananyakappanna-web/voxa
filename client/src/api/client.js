// Centralized API client for Voxa

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('voxa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (login, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
    signup: (username, email, password, displayName) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password, displayName }) }),
    me: () => request('/auth/me'),
    getDemoUsers: () => request('/auth/demo-users')
  },

  // Posts
  posts: {
    getFeed: (feed = 'for-you', limit = 20) => request(`/posts?feed=${feed}&limit=${limit}`),
    getUserTimeline: (username, tab = 'posts') => request(`/posts/user/${username}?tab=${tab}`),
    getByHashtag: (tag) => request(`/posts/hashtag/${encodeURIComponent(tag)}`),
    search: (query) => request(`/posts/search?q=${encodeURIComponent(query)}`),
    getById: (id) => request(`/posts/${id}`),
    create: (content, imageUrl, replyToId = null) => request('/posts', { method: 'POST', body: JSON.stringify({ content, imageUrl, replyToId }) }),
    delete: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
    toggleLike: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
    toggleRepost: (id) => request(`/posts/${id}/repost`, { method: 'POST' }),
    toggleBookmark: (id) => request(`/posts/${id}/bookmark`, { method: 'POST' }),
    getBookmarks: () => request('/posts/user-bookmarks')
  },

  // Users
  users: {
    getProfile: (username) => request(`/users/profile/${username}`),
    updateProfile: (data) => request('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    toggleFollow: (id) => request(`/users/${id}/follow`, { method: 'POST' }),
    getFollowers: (username) => request(`/users/${username}/followers`),
    getFollowing: (username) => request(`/users/${username}/following`),
    getSuggestions: (limit = 4) => request(`/users/suggestions?limit=${limit}`),
    search: (query) => request(`/users/search?q=${encodeURIComponent(query)}`)
  },

  // Notifications
  notifications: {
    getAll: () => request('/notifications'),
    markRead: () => request('/notifications/read', { method: 'PATCH' }),
    getUnreadCount: () => request('/notifications/unread-count')
  },

  // Messages
  messages: {
    getConversations: () => request('/messages/conversations'),
    getHistory: (userId) => request(`/messages/${userId}`),
    send: (recipientId, content, imageUrl = null) => request('/messages', { method: 'POST', body: JSON.stringify({ recipientId, content, imageUrl }) }),
    markRead: (userId) => request(`/messages/${userId}/read`, { method: 'PATCH' })
  },

  // Trends
  trends: {
    getTrends: () => request('/trends')
  },

  // Upload
  upload: {
    uploadImageFile: async (file) => {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('voxa_token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      return data;
    },
    uploadBase64: (imageBase64) => request('/upload', { method: 'POST', body: JSON.stringify({ imageBase64 }) })
  }
};
