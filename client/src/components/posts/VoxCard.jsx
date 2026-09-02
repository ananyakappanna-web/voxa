import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Repeat2,
  MessageCircle,
  Bookmark,
  Share,
  MoreHorizontal,
  Trash2,
  Link as LinkIcon,
  BadgeCheck
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ImageLightbox } from './ImageLightbox';

export function VoxCard({ post, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isReposted, setIsReposted] = useState(post.isReposted);
  const [repostsCount, setRepostsCount] = useState(post.repostsCount);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarksCount);
  const [showMenu, setShowMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  const getFormattedDate = (dateStr) => {
    try {
      return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false })
        .replace(' seconds', 's')
        .replace(' second', 's')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd');
    } catch {
      return 'just now';
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast({ title: 'Sign in required', message: 'Please sign in to like this Vox', type: 'info' });
      return;
    }
    if (isLiking) return;

    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setIsLiking(true);

    try {
      const res = await api.posts.toggleLike(post.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast({ title: 'Sign in required', message: 'Please sign in to repost this Vox', type: 'info' });
      return;
    }
    if (isReposting) return;

    const prevReposted = isReposted;
    const prevCount = repostsCount;
    setIsReposted(!prevReposted);
    setRepostsCount(prevReposted ? prevCount - 1 : prevCount + 1);
    setIsReposting(true);

    try {
      const res = await api.posts.toggleRepost(post.id);
      setIsReposted(res.isReposted);
      setRepostsCount(res.repostsCount);
    } catch (err) {
      setIsReposted(prevReposted);
      setRepostsCount(prevCount);
    } finally {
      setIsReposting(false);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast({ title: 'Sign in required', message: 'Please sign in to bookmark', type: 'info' });
      return;
    }

    const prevBookmarked = isBookmarked;
    const prevCount = bookmarksCount;
    setIsBookmarked(!prevBookmarked);
    setBookmarksCount(prevBookmarked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await api.posts.toggleBookmark(post.id);
      setIsBookmarked(res.isBookmarked);
      setBookmarksCount(res.bookmarksCount);
      showToast({ title: 'Bookmark updated', message: res.message, type: 'info' });
    } catch (err) {
      setIsBookmarked(prevBookmarked);
      setBookmarksCount(prevCount);
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/vox/${post.id}`;
    navigator.clipboard.writeText(url);
    setShowMenu(false);
    showToast({ title: 'Link copied', message: 'Vox link copied to clipboard', type: 'info' });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Vox?')) return;
    try {
      await api.posts.delete(post.id);
      showToast({ title: 'Vox removed', message: 'Your post was successfully deleted', type: 'info' });
      if (onDelete) onDelete(post.id);
    } catch (err) {
      showToast({ title: 'Error', message: 'Failed to delete post', type: 'danger' });
    }
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;

    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/explore?q=${encodeURIComponent(part)}`);
            }}
            className="text-[#D4A574] hover:text-[#E8B4B8] hover:underline font-medium cursor-pointer transition-colors"
          >
            {part}
          </span>
        );
      } else if (part.startsWith('@')) {
        const handle = part.substring(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${handle}`);
            }}
            className="text-[#E8B4B8] hover:text-[#F5EDE8] hover:underline font-medium cursor-pointer transition-colors"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const isAuthor = currentUser?.id === post.author.id;

  return (
    <>
      <article
        onClick={() => navigate(`/vox/${post.id}`)}
        className="border-b border-[#D4A574]/15 p-4 sm:p-5 hover:bg-[#160B0F]/50 transition-all duration-200 cursor-pointer relative group select-text"
      >
        <div className="flex gap-3.5">
          {/* Avatar Column */}
          <div
            className="shrink-0 pt-0.5"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${post.author.username}`);
            }}
          >
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              size="md"
              className="cursor-pointer"
            />
          </div>

          {/* Content Column */}
          <div className="flex-1 min-w-0">
            {/* Header: Name, Handle, Timestamp, Menu */}
            <div className="flex items-center justify-between gap-1">
              <div
                className="flex items-center gap-1.5 min-w-0 truncate"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${post.author.username}`);
                }}
              >
                <span className="font-serif font-bold text-[#F5EDE8] hover:text-[#D4A574] truncate cursor-pointer text-sm sm:text-base flex items-center gap-1.5 transition-colors">
                  {post.author.displayName}
                  {post.author.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-[#D4A574] fill-[#D4A574] inline-block shrink-0" />
                  )}
                </span>
                <span className="text-[#A8888D] text-xs sm:text-sm truncate">@{post.author.username}</span>
                <span className="text-[#D4A574]/40 text-xs">·</span>
                <span className="text-[#A8888D] text-xs hover:text-[#F5EDE8] shrink-0 font-mono">
                  {getFormattedDate(post.createdAt)}
                </span>
              </div>

              {/* Options Menu */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1.5 rounded-full text-[#A8888D] hover:text-[#F5EDE8] hover:bg-white/10 transition"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-48 bg-[#14080C]/95 border border-[#D4A574]/25 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] py-1.5 z-20 overflow-hidden backdrop-blur-2xl"
                  >
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

            {/* Post Content */}
            <div className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#F5EDE8] break-words whitespace-pre-line font-normal">
              {renderFormattedContent(post.content)}
            </div>

            {/* Image Attachment */}
            {post.imageUrl && (
              <div
                className="mt-3 rounded-2xl overflow-hidden border border-[#D4A574]/20 max-h-96 relative group/img cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLightbox(true);
                }}
              >
                <img
                  src={post.imageUrl}
                  alt="Attachment"
                  className="w-full h-auto max-h-96 object-cover hover:scale-[1.01] transition duration-300"
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between max-w-md mt-3.5 pt-1 text-[#A8888D]">
              {/* Reply */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/vox/${post.id}`);
                }}
                className="group/btn flex items-center gap-1.5 hover:text-[#E8B4B8] transition-colors text-xs"
              >
                <div className="p-2 rounded-full group-hover/btn:bg-[#E8B4B8]/10 transition">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                </div>
                {post.repliesCount > 0 && <span className="font-mono">{post.repliesCount}</span>}
              </button>

              {/* Repost */}
              <button
                type="button"
                onClick={handleRepost}
                className={`group/btn flex items-center gap-1.5 transition-colors text-xs ${
                  isReposted ? 'text-[#D4A574]' : 'hover:text-[#D4A574]'
                }`}
              >
                <div
                  className={`p-2 rounded-full transition ${
                    isReposted ? 'bg-[#D4A574]/15' : 'group-hover/btn:bg-[#D4A574]/10'
                  }`}
                >
                  <Repeat2 className="w-4 h-4" strokeWidth={1.75} />
                </div>
                {repostsCount > 0 && <span className="font-mono">{repostsCount}</span>}
              </button>

              {/* Like */}
              <button
                type="button"
                onClick={handleLike}
                className={`group/btn flex items-center gap-1.5 transition-colors text-xs ${
                  isLiked ? 'text-[#C97B8A]' : 'hover:text-[#E8B4B8]'
                }`}
              >
                <motion.div
                  whileTap={{ scale: 1.35 }}
                  className={`p-2 rounded-full transition ${
                    isLiked ? 'bg-[#5C1A2B]/40 shadow-[0_0_15px_rgba(201,123,138,0.4)]' : 'group-hover/btn:bg-[#C97B8A]/10'
                  }`}
                >
                  <Heart
                    strokeWidth={1.75}
                    className={`w-4 h-4 transition-all ${
                      isLiked ? 'fill-[#C97B8A] text-[#E8B4B8]' : ''
                    }`}
                  />
                </motion.div>
                {likesCount > 0 && <span className="font-mono">{likesCount}</span>}
              </button>

              {/* Bookmark */}
              <button
                type="button"
                onClick={handleBookmark}
                className={`group/btn flex items-center gap-1.5 transition-colors text-xs ${
                  isBookmarked ? 'text-[#D4A574]' : 'hover:text-[#D4A574]'
                }`}
              >
                <div
                  className={`p-2 rounded-full transition ${
                    isBookmarked ? 'bg-[#D4A574]/15' : 'group-hover/btn:bg-[#D4A574]/10'
                  }`}
                >
                  <Bookmark
                    strokeWidth={1.75}
                    className={`w-4 h-4 ${isBookmarked ? 'fill-[#D4A574] text-[#D4A574]' : ''}`}
                  />
                </div>
                {bookmarksCount > 0 && <span className="font-mono">{bookmarksCount}</span>}
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="group/btn flex items-center gap-1.5 hover:text-[#D4A574] transition-colors text-xs"
              >
                <div className="p-2 rounded-full group-hover/btn:bg-[#D4A574]/10 transition">
                  <Share className="w-4 h-4" strokeWidth={1.75} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Image Lightbox */}
      {showLightbox && (
        <ImageLightbox imageUrl={post.imageUrl} onClose={() => setShowLightbox(false)} />
      )}
    </>
  );
}
