import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sparkles, BadgeCheck, TrendingUp } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function RightSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [trends, setTrends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync search input if already on explore page with query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [trendsRes, suggestionsRes] = await Promise.all([
          api.trends.getTrends().catch(() => ({ trends: [] })),
          api.users.getSuggestions(3).catch(() => ({ suggestions: [] }))
        ]);

        if (isMounted) {
          setTrends(trendsRes.trends || []);
          setSuggestions(suggestionsRes.suggestions || []);
        }
      } catch (err) {
        console.error('Failed to load right sidebar data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFollowSuggestion = async (user) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      await api.users.toggleFollow(user.id);
      setSuggestions((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error('Failed to follow suggestion:', err);
    }
  };

  return (
    <aside className="hidden lg:block w-80 xl:w-96 p-4 space-y-4 shrink-0 border-l border-[#D4A574]/15 min-h-screen bg-[#0D0709]/60 backdrop-blur-xl">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 bg-[#0D0709]/90 backdrop-blur-md pt-1 pb-3 z-10">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8888D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Voxa..."
            className="w-full bg-[#160B0F]/90 text-[#F5EDE8] placeholder-[#A8888D] pl-11 pr-4 py-2.5 rounded-full border border-[#D4A574]/20 focus:border-[#D4A574] focus:ring-1 focus:ring-[#D4A574]/30 focus:outline-none text-sm transition-all duration-200"
          />
        </form>
      </div>

      {/* "What's happening" / Trends Luxury Card */}
      <div className="bg-[#160B0F]/80 border border-[#D4A574]/15 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(13,7,9,0.7)] backdrop-blur-xl">
        <div className="p-4 border-b border-[#D4A574]/15 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#F5EDE8] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4A574]" />
            <span className="tracking-wide">What's Happening</span>
          </h3>
        </div>

        <div className="divide-y divide-[#D4A574]/10">
          {trends.slice(0, 5).map((trend, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/explore?q=${encodeURIComponent(trend.tag)}`)}
              className="p-3.5 hover:bg-[#D4A574]/5 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[11px] text-[#A8888D] tracking-wider uppercase">
                <span>{trend.category || 'Trending worldwide'}</span>
              </div>
              <p className="font-bold text-sm text-[#F5EDE8] group-hover:text-[#D4A574] transition-colors mt-0.5">
                {trend.tag}
              </p>
              <span className="text-xs text-[#A8888D] font-mono">
                {trend.postCount?.toLocaleString() || '1.2k'} Voxes
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* "Who to follow" Luxury Card */}
      {suggestions.length > 0 && (
        <div className="bg-[#160B0F]/80 border border-[#D4A574]/15 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(13,7,9,0.7)] backdrop-blur-xl">
          <div className="p-4 border-b border-[#D4A574]/15">
            <h3 className="font-serif font-bold text-base text-[#F5EDE8] tracking-wide">
              Who to follow
            </h3>
          </div>

          <div className="divide-y divide-[#D4A574]/10">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                onClick={() => navigate(`/profile/${sug.username}`)}
                className="p-3.5 flex items-center justify-between hover:bg-[#D4A574]/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <Avatar src={sug.avatar_url} alt={sug.display_name} size="md" />
                  <div className="min-w-0 truncate">
                    <p className="font-serif font-bold text-sm text-[#F5EDE8] hover:text-[#D4A574] truncate flex items-center gap-1 transition-colors">
                      {sug.display_name}
                      {sug.is_verified ? (
                        <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] shrink-0" />
                      ) : null}
                    </p>
                    <p className="text-xs text-[#A8888D] truncate">@{sug.username}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowSuggestion(sug);
                  }}
                  className="shrink-0 text-xs px-3.5 py-1 font-bold"
                >
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Luxury Footer */}
      <footer className="px-4 py-2 text-xs text-[#A8888D]/80 space-y-1.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] tracking-wider uppercase font-medium">
          <a href="#" className="hover:text-[#D4A574] transition">Terms</a>
          <a href="#" className="hover:text-[#D4A574] transition">Privacy</a>
          <a href="#" className="hover:text-[#D4A574] transition">Cookies</a>
          <a href="#" className="hover:text-[#D4A574] transition">Security</a>
        </div>
        <p className="pt-1 text-[10px] tracking-widest uppercase text-[#D4A574]/60">
          © 2026 VOXA · PREMIUM COMMUNICATION
        </p>
      </footer>
    </aside>
  );
}
