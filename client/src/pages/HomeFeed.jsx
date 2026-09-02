import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ComposeBox } from '../components/posts/ComposeBox';
import { VoxCard } from '../components/posts/VoxCard';
import { PostSkeleton } from '../components/posts/SkeletonLoader';

export function HomeFeed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('for-you'); // 'for-you' | 'following'
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);

    try {
      const res = await api.posts.getFeed(activeTab);
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to fetch home feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Listen for global vox creation events
  useEffect(() => {
    const handleVoxCreated = () => {
      fetchFeed(false);
    };
    window.addEventListener('vox_created', handleVoxCreated);
    return () => window.removeEventListener('vox_created', handleVoxCreated);
  }, [fetchFeed]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="w-full">
      {/* Sticky Header with Feed Tabs */}
      <div className="sticky top-0 z-20 glass-header">
        <div className="flex items-center justify-between px-5 py-3 sm:hidden">
          <h1 className="font-serif font-bold text-base text-[#F5EDE8] tracking-wide">Home</h1>
        </div>

        {/* Tabs: For You / Following */}
        <div className="flex w-full">
          <button
            onClick={() => setActiveTab('for-you')}
            className="flex-1 py-4 hover:bg-[#D4A574]/5 transition relative flex items-center justify-center font-bold text-xs sm:text-sm uppercase tracking-widest text-[#F5EDE8]"
          >
            <span className={activeTab === 'for-you' ? 'text-[#F5EDE8] font-extrabold text-metallic' : 'text-[#A8888D]'}>
              For you
            </span>
            {activeTab === 'for-you' && (
              <div className="absolute bottom-0 h-[2.5px] w-14 bg-gradient-to-r from-[#E8B4B8] via-[#D4A574] to-[#C97B8A] rounded-full shadow-[0_0_12px_rgba(212,165,116,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('following')}
            className="flex-1 py-4 hover:bg-[#D4A574]/5 transition relative flex items-center justify-center font-bold text-xs sm:text-sm uppercase tracking-widest text-[#F5EDE8]"
          >
            <span className={activeTab === 'following' ? 'text-[#F5EDE8] font-extrabold text-metallic' : 'text-[#A8888D]'}>
              Following
            </span>
            {activeTab === 'following' && (
              <div className="absolute bottom-0 h-[2.5px] w-14 bg-gradient-to-r from-[#E8B4B8] via-[#D4A574] to-[#C97B8A] rounded-full shadow-[0_0_12px_rgba(212,165,116,0.8)]" />
            )}
          </button>
        </div>
      </div>

      {/* Inline Post Composer */}
      {user && (
        <div className="hidden sm:block">
          <ComposeBox onPostCreated={handlePostCreated} />
        </div>
      )}

      {/* Feed Stream */}
      <div>
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-[#A8888D] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#5C1A2B]/25 border border-[#D4A574]/20 mx-auto flex items-center justify-center text-[#D4A574]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#F5EDE8]">
              {activeTab === 'following' ? 'Your timeline awaits' : 'No Voxes available yet'}
            </h3>
            <p className="text-xs max-w-sm mx-auto leading-relaxed">
              {activeTab === 'following'
                ? 'Follow creators, founders, and thinkers to curate your personalized stream.'
                : 'Share your thoughts, perspectives, or announcements with the Voxa community.'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <VoxCard key={post.id} post={post} onDelete={handlePostDelete} />
          ))
        )}
      </div>
    </div>
  );
}
