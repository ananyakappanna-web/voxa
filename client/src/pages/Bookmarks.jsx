import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { VoxCard } from '../components/posts/VoxCard';
import { PostSkeleton } from '../components/posts/SkeletonLoader';

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadBookmarks() {
      try {
        const res = await api.posts.getBookmarks();
        if (isMounted) {
          setBookmarks(res.posts || []);
        }
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBookmarks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePostDelete = (postId) => {
    setBookmarks((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 glass-header px-5 py-3">
        <h1 className="font-serif font-bold text-base text-[#F5EDE8] tracking-wide">Bookmarks</h1>
        <p className="text-[11px] text-[#A8888D]">Curated & saved for review</p>
      </div>

      {/* Content Stream */}
      <div>
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : bookmarks.length === 0 ? (
          <div className="p-12 text-center text-[#A8888D] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#5C1A2B]/25 border border-[#D4A574]/20 mx-auto flex items-center justify-center text-[#D4A574]">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#F5EDE8]">Save Voxes for later</h3>
            <p className="text-xs max-w-sm mx-auto leading-relaxed">
              Bookmark valuable insights, breakthrough announcements, and discussions to access them anytime.
            </p>
          </div>
        ) : (
          bookmarks.map((post) => (
            <VoxCard key={post.id} post={post} onDelete={handlePostDelete} />
          ))
        )}
      </div>
    </div>
  );
}
