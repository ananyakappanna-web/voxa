import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserRowSkeleton } from '../posts/SkeletonLoader';

export function FollowListModal({ isOpen, onClose, username, type = 'followers' }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !username) return;

    let isMounted = true;
    setIsLoading(true);

    const fetchUsers = async () => {
      try {
        const res =
          type === 'followers'
            ? await api.users.getFollowers(username)
            : await api.users.getFollowing(username);

        if (isMounted) {
          setUsers(type === 'followers' ? res.followers : res.following);
        }
      } catch (err) {
        console.error('Failed to fetch follow list:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, username, type]);

  if (!isOpen) return null;

  const handleToggleFollow = async (targetUser) => {
    if (!currentUser) return;
    try {
      const res = await api.users.toggleFollow(targetUser.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: res.isFollowing ? 1 : 0 } : u))
      );
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0709]/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#14080C] border border-[#D4A574]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D4A574]/15 sticky top-0 bg-[#160B0F]/95 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-1.5 text-[#A8888D] hover:text-[#F5EDE8] hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif font-bold text-base text-[#F5EDE8] capitalize tracking-wide">
                @{username}'s {type}
              </h3>
            </div>
          </div>

          {/* User List */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#D4A574]/10">
            {isLoading ? (
              <>
                <UserRowSkeleton />
                <UserRowSkeleton />
                <UserRowSkeleton />
              </>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-[#A8888D]">
                <p className="text-sm font-serif font-bold text-[#F5EDE8]">No {type} yet</p>
                <p className="text-xs mt-1">When someone {type === 'followers' ? 'follows' : 'is followed by'} @{username}, they'll appear here.</p>
              </div>
            ) : (
              users.map((item) => {
                const isSelf = currentUser?.id === item.id;
                const isFollowing = !!item.is_following;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigate(`/profile/${item.username}`);
                      onClose();
                    }}
                    className="p-4 flex items-center justify-between hover:bg-[#D4A574]/5 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <Avatar src={item.avatar_url} alt={item.display_name} size="md" />
                      <div className="min-w-0 truncate">
                        <div className="font-serif font-bold text-sm text-[#F5EDE8] hover:text-[#D4A574] flex items-center gap-1 truncate transition-colors">
                          {item.display_name}
                          {item.is_verified ? (
                            <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] inline-block shrink-0" />
                          ) : null}
                        </div>
                        <div className="text-xs text-[#A8888D] truncate">@{item.username}</div>
                        {item.bio && (
                          <div className="text-xs text-[#F5EDE8]/70 line-clamp-1 mt-0.5">{item.bio}</div>
                        )}
                      </div>
                    </div>

                    {!isSelf && currentUser && (
                      <Button
                        size="sm"
                        variant={isFollowing ? 'outline' : 'primary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(item);
                        }}
                        className="shrink-0 text-xs px-3.5 font-bold"
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
