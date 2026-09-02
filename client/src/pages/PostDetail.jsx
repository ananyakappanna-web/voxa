import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Repeat2,
  Bookmark,
  Share,
  BadgeCheck,
  MoreHorizontal,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { ComposeBox } from '../components/posts/ComposeBox';
import { VoxCard } from '../components/posts/VoxCard';
import { PostSkeleton } from '../components/posts/SkeletonLoader';
import { ImageLightbox } from '../components/posts/ImageLightbox';

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [parentPost, setParentPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadPostDetail() {
      try {
        const res = await api.posts.getById(id);
        if (isMounted) {
          setPost(res.post);
          setParentPost(res.parentPost);
          setReplies(res.replies || []);
        }
      } catch (err) {
        console.error('Failed to load post detail:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPostDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleLike = async () => {
    if (!currentUser) {
      showToast({ title: 'Sign in required', message: 'Please sign in to like', type: 'info' });
      return;
    }
    const prevLiked = post.isLiked;
    const prevCount = post.likesCount;
    setPost((prev) => ({
      ...prev,
      isLiked: !prevLiked,
      likesCount: prevLiked ? prevCount - 1 : prevCount + 1
    }));

    try {
      const res = await api.posts.toggleLike(post.id);
      setPost((prev) => ({ ...prev, isLiked: res.isLiked, likesCount: res.likesCount }));
    } catch (err) {
      setPost((prev) => ({ ...prev, isLiked: prevLiked, likesCount: prevCount }));
    }
  };

  const handleRepost = async () => {
    if (!currentUser) {
      showToast({ title: 'Sign in required', message: 'Please sign in to repost', type: 'info' });
      return;
    }
    const prevReposted = post.isReposted;
    const prevCount = post.repostsCount;
    setPost((prev) => ({
      ...prev,
      isReposted: !prevReposted,
      repostsCount: prevReposted ? prevCount - 1 : prevCount + 1
    }));

    try {
      const res = await api.posts.toggleRepost(post.id);
      setPost((prev) => ({ ...prev, isReposted: res.isReposted, repostsCount: res.repostsCount }));
    } catch (err) {
      setPost((prev) => ({ ...prev, isReposted: prevReposted, repostsCount: prevCount }));
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      showToast({ title: 'Sign in required', message: 'Please sign in to bookmark', type: 'info' });
      return;
    }
    const prevBookmarked = post.isBookmarked;
    const prevCount = post.bookmarksCount;
    setPost((prev) => ({
      ...prev,
      isBookmarked: !prevBookmarked,
      bookmarksCount: prevBookmarked ? prevCount - 1 : prevCount + 1
    }));

    try {
      const res = await api.posts.toggleBookmark(post.id);
      setPost((prev) => ({ ...prev, isBookmarked: res.isBookmarked, bookmarksCount: res.bookmarksCount }));
      showToast({ title: 'Bookmark updated', message: res.message, type: 'info' });
    } catch (err) {
      setPost((prev) => ({ ...prev, isBookmarked: prevBookmarked, bookmarksCount: prevCount }));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowMenu(false);
    showToast({ title: 'Link copied', message: 'Vox link copied to clipboard', type: 'info' });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this Vox?')) return;
    try {
      await api.posts.delete(post.id);
      showToast({ title: 'Vox deleted', message: 'Your post was successfully deleted', type: 'info' });
      navigate(-1);
    } catch (err) {
      showToast({ title: 'Error', message: 'Failed to delete post', type: 'danger' });
    }
  };

  const handleReplyCreated = (newReply) => {
    setReplies((prev) => [...prev, newReply]);
    setPost((prev) => ({ ...prev, repliesCount: (prev.repliesCount || 0) + 1 }));
  };

  const handleReplyDelete = (replyId) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    setPost((prev) => ({ ...prev, repliesCount: Math.max((prev.repliesCount || 1) - 1, 0) }));
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={index}
            onClick={() => navigate(`/explore?q=${encodeURIComponent(part)}`)}
            className="text-[#D4A574] hover:text-[#E8B4B8] hover:underline font-medium cursor-pointer transition-colors"
          >
            {part}
          </span>
        );
      } else if (part.startsWith('@')) {
        return (
          <span
            key={index}
            onClick={() => navigate(`/profile/${part.substring(1)}`)}
            className="text-[#E8B4B8] hover:text-[#F5EDE8] hover:underline font-medium cursor-pointer transition-colors"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen">
        <div className="p-4 border-b border-[#D4A574]/15 flex items-center gap-4">
          <ArrowLeft className="w-5 h-5 text-[#A8888D]" />
          <h2 className="font-serif font-bold text-base text-[#F5EDE8]">Vox</h2>
        </div>
        <PostSkeleton />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-12 text-center text-[#A8888D] space-y-3">
        <h2 className="font-serif text-2xl font-bold text-[#F5EDE8]">Vox Unavailable</h2>
        <p className="text-xs">This post may have been removed by the author.</p>
        <button
          onClick={() => navigate('/')}
          className="text-[#D4A574] hover:underline font-bold text-xs uppercase tracking-wider"
        >
          Return to Stream
        </button>
      </div>
    );
  }

  const isAuthor = currentUser?.id === post.author.id;

  return (
    <div className="w-full min-h-screen">
      {/* Top Header */}
      <div className="sticky top-0 z-20 glass-header px-4 py-3 flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-white/10 text-[#F5EDE8] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-serif font-bold text-base text-[#F5EDE8] tracking-wide">Vox</h2>
      </div>

      {/* Parent Post (if this is a reply) */}
      {parentPost && (
        <div className="relative">
          <div className="absolute left-9 top-14 bottom-0 w-0.5 bg-[#D4A574]/20" />
          <VoxCard post={parentPost} />
        </div>
      )}

      {/* Main Post Editorial Full View */}
      <article className="border-b border-[#D4A574]/15 p-5 space-y-4 bg-[#14080C]/40 backdrop-blur-md">
        {/* Author Details Header */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => navigate(`/profile/${post.author.username}`)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="lg" />
            <div>
              <h3 className="font-serif font-bold text-base text-[#F5EDE8] group-hover:text-[#D4A574] flex items-center gap-1.5 leading-tight transition-colors">
                {post.author.displayName}
                {post.author.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-[#D4A574] fill-[#D4A574] inline-block shrink-0" />
                )}
              </h3>
              <p className="text-xs text-[#A8888D]">@{post.author.username}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full text-[#A8888D] hover:text-[#F5EDE8] hover:bg-white/10 transition"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#14080C]/95 border border-[#D4A574]/25 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] py-1.5 z-20 overflow-hidden backdrop-blur-2xl">
                <button
                  onClick={handleCopyLink}
                  className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-wider text-[#F5EDE8] hover:bg-[#D4A574]/10 flex items-center gap-3 transition"
                >
                  <LinkIcon className="w-4 h-4 text-[#D4A574]" />
                  <span>Copy link to Vox</span>
                </button>
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-wider text-[#E8B4B8] hover:bg-[#5C1A2B]/40 flex items-center gap-3 transition"
                  >
                    <Trash2 className="w-4 h-4 text-[#C97B8A]" />
                    <span>Delete Vox</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Text (Large Font) */}
        <div className="text-lg sm:text-xl text-[#F5EDE8] font-normal leading-relaxed break-words whitespace-pre-line select-text">
          {renderFormattedContent(post.content)}
        </div>

        {/* Media Image */}
        {post.imageUrl && (
          <div
            className="rounded-2xl overflow-hidden border border-[#D4A574]/25 max-h-[500px] cursor-pointer shadow-lg"
            onClick={() => setShowLightbox(true)}
          >
            <img
              src={post.imageUrl}
              alt="Attachment"
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Detailed Timestamp */}
        <div className="text-xs text-[#A8888D] pt-2 border-t border-[#D4A574]/15 font-mono">
          <span>{format(new Date(post.createdAt), 'h:mm a · MMM d, yyyy')}</span>
        </div>

        {/* Engagement Stats Bar */}
        {(post.repostsCount > 0 || post.likesCount > 0 || post.bookmarksCount > 0) && (
          <div className="flex items-center gap-6 py-3 border-y border-[#D4A574]/15 text-xs tracking-wider uppercase font-medium">
            {post.repostsCount > 0 && (
              <span className="flex items-center gap-1.5 font-mono">
                <strong className="text-[#F5EDE8] font-bold">{post.repostsCount}</strong>
                <span className="text-[#A8888D]">Reposts</span>
              </span>
            )}
            {post.likesCount > 0 && (
              <span className="flex items-center gap-1.5 font-mono">
                <strong className="text-[#F5EDE8] font-bold">{post.likesCount}</strong>
                <span className="text-[#A8888D]">Appreciations</span>
              </span>
            )}
            {post.bookmarksCount > 0 && (
              <span className="flex items-center gap-1.5 font-mono">
                <strong className="text-[#F5EDE8] font-bold">{post.bookmarksCount}</strong>
                <span className="text-[#A8888D]">Bookmarks</span>
              </span>
            )}
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-around py-1 text-[#A8888D] border-b border-[#D4A574]/15">
          <button
            onClick={handleRepost}
            className={`p-2.5 rounded-full transition ${
              post.isReposted
                ? 'text-[#D4A574] bg-[#D4A574]/15'
                : 'hover:bg-[#D4A574]/10 hover:text-[#D4A574]'
            }`}
          >
            <Repeat2 className="w-5 h-5" strokeWidth={1.75} />
          </button>

          <button
            onClick={handleLike}
            className={`p-2.5 rounded-full transition ${
              post.isLiked
                ? 'text-[#C97B8A] bg-[#5C1A2B]/40'
                : 'hover:bg-[#C97B8A]/10 hover:text-[#E8B4B8]'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-[#C97B8A] text-[#E8B4B8]' : ''}`} strokeWidth={1.75} />
          </button>

          <button
            onClick={handleBookmark}
            className={`p-2.5 rounded-full transition ${
              post.isBookmarked
                ? 'text-[#D4A574] bg-[#D4A574]/15'
                : 'hover:bg-[#D4A574]/10 hover:text-[#D4A574]'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-[#D4A574] text-[#D4A574]' : ''}`} strokeWidth={1.75} />
          </button>

          <button
            onClick={handleCopyLink}
            className="p-2.5 rounded-full hover:bg-[#D4A574]/10 hover:text-[#D4A574] transition"
          >
            <Share className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
      </article>

      {/* Inline Reply Composer */}
      {currentUser && (
        <div className="border-b border-[#D4A574]/15 p-4 bg-[#14080C]/60">
          <p className="text-xs text-[#A8888D] mb-2 pl-14">
            Replying to <span className="text-[#D4A574]">@{post.author.username}</span>
          </p>
          <ComposeBox
            placeholder="Post your reply..."
            replyToId={post.id}
            onPostCreated={handleReplyCreated}
          />
        </div>
      )}

      {/* Replies Stream */}
      <div className="divide-y divide-[#D4A574]/15">
        {replies.map((reply) => (
          <VoxCard key={reply.id} post={reply} onDelete={handleReplyDelete} />
        ))}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <ImageLightbox imageUrl={post.imageUrl} onClose={() => setShowLightbox(false)} />
      )}
    </div>
  );
}
