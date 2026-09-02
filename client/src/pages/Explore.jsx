import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, BadgeCheck } from 'lucide-react';
import { api } from '../api/client';
import { VoxCard } from '../components/posts/VoxCard';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { PostSkeleton } from '../components/posts/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

const TOPIC_CHIPS = ['Curated', 'Trending', 'Fintech & Tech', 'Frontier AI', 'Design Systems', 'Philosophy'];
const TOPIC_SEARCH_TERMS = {
  Trending: '#technews',
  'Fintech & Tech': '#technews',
  'Frontier AI': '#ai',
  'Design Systems': '#designsystems',
  Philosophy: 'philosophy'
};

export function Explore() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [activeChip, setActiveChip] = useState('Curated');
  const [searchQuery, setSearchQuery] = useState('');
  const [trends, setTrends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);

    let isMounted = true;
    setIsLoading(true);

    async function loadExploreData() {
      try {
        if (q) {
          const [postsRes, usersRes] = await Promise.all([
            api.posts.search(q).catch(() => ({ posts: [] })),
            api.users.search(q).catch(() => ({ users: [] }))
          ]);

          if (isMounted) {
            setPosts(postsRes.posts || []);
            setMatchedUsers(usersRes.users || []);
          }
        } else {
          const [postsRes, trendsRes] = await Promise.all([
            api.posts.getFeed('for-you', 25).catch(() => ({ posts: [] })),
            api.trends.getTrends().catch(() => ({ trends: [] }))
          ]);

          if (isMounted) {
            setPosts(postsRes.posts || []);
            setTrends(trendsRes.trends || []);
            setMatchedUsers([]);
          }
        }
      } catch (err) {
        console.error('Explore load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadExploreData();

    return () => {
      isMounted = false;
    };
  }, [location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleFollowUser = async (targetUser) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.users.toggleFollow(targetUser.id);
      setMatchedUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: res.isFollowing ? 1 : 0 } : u))
      );
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Search Header */}
      <div className="sticky top-0 z-20 glass-header p-3 sm:p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8888D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations, members, #tags..."
            className="w-full bg-[#160B0F]/90 text-[#F5EDE8] placeholder-[#A8888D] pl-11 pr-4 py-2.5 rounded-full border border-[#D4A574]/20 focus:border-[#D4A574] focus:ring-1 focus:ring-[#D4A574]/30 focus:outline-none text-sm transition-all"
          />
        </form>

        {/* Topic Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setActiveChip(chip);
                if (chip !== 'Curated') {
                  navigate(`/explore?q=${encodeURIComponent(TOPIC_SEARCH_TERMS[chip] || chip)}`);
                } else {
                  navigate('/explore');
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-200 ${
                activeChip === chip
                  ? 'btn-metallic text-[#0D0709]'
                  : 'bg-[#160B0F]/80 text-[#A8888D] border border-[#D4A574]/15 hover:text-[#F5EDE8] hover:border-[#D4A574]/40'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Matched Users in Search */}
      {matchedUsers.length > 0 && (
        <div className="border-b border-[#D4A574]/15 p-4 bg-[#160B0F]/40">
          <h3 className="text-[11px] font-bold tracking-widest text-[#D4A574] uppercase mb-3 px-1">
            People
          </h3>
          <div className="space-y-2">
            {matchedUsers.slice(0, 3).map((u) => (
              <div
                key={u.id}
                onClick={() => navigate(`/profile/${u.username}`)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#D4A574]/5 border border-transparent hover:border-[#D4A574]/15 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <Avatar src={u.avatar_url} alt={u.display_name} size="md" />
                  <div className="min-w-0 truncate">
                    <p className="font-serif font-bold text-sm text-[#F5EDE8] truncate flex items-center gap-1">
                      {u.display_name}
                      {u.is_verified ? (
                        <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] shrink-0" />
                      ) : null}
                    </p>
                    <p className="text-xs text-[#A8888D] truncate">@{u.username}</p>
                  </div>
                </div>

                {currentUser?.id !== u.id && (
                  <Button
                    size="sm"
                    variant={u.is_following ? 'outline' : 'primary'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowUser(u);
                    }}
                    className="shrink-0 text-xs px-3.5 font-bold"
                  >
                    {u.is_following ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Topics Grid (if default explore mode) */}
      {!location.search && trends.length > 0 && (
        <div className="border-b border-[#D4A574]/15 p-5 bg-gradient-to-b from-[#1E0B12]/40 to-transparent">
          <h2 className="font-serif text-base font-bold text-[#F5EDE8] mb-3.5 flex items-center gap-2 tracking-wide">
            <TrendingUp className="w-4 h-4 text-[#D4A574]" />
            <span>Featured Trends</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trends.slice(0, 4).map((t, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/explore?q=${encodeURIComponent(t.tag)}`)}
                className="p-3.5 bg-[#160B0F]/80 hover:bg-[#231117]/80 border border-[#D4A574]/15 hover:border-[#D4A574]/35 rounded-2xl transition-all cursor-pointer shadow-sm group"
              >
                <span className="text-[10px] tracking-wider uppercase text-[#A8888D] block font-medium">
                  {t.category}
                </span>
                <span className="text-sm font-bold text-[#F5EDE8] group-hover:text-[#D4A574] transition-colors block mt-0.5">
                  {t.tag}
                </span>
                <span className="text-[11px] text-[#A8888D] font-mono block mt-1">
                  {t.postCount?.toLocaleString()} Voxes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Stream */}
      <div>
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-[#A8888D] space-y-2">
            <p className="font-serif text-base font-bold text-[#F5EDE8]">No matching conversations found</p>
            <p className="text-xs">Try refining your search terms or exploring featured topics.</p>
          </div>
        ) : (
          posts.map((post) => <VoxCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
