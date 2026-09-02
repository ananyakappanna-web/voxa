import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Repeat,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Bell,
  BadgeCheck
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { NotificationSkeleton } from '../components/posts/SkeletonLoader';

export function Notifications() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mentions'
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        const res = await api.notifications.getAll();
        if (isMounted) {
          setNotifications(res.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      updateUser({ unreadNotifications: 0 });
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5 text-[#E8B4B8] fill-[#C97B8A]" />;
      case 'REPOST':
        return <Repeat className="w-5 h-5 text-[#D4A574]" />;
      case 'REPLY':
        return <MessageCircle className="w-5 h-5 text-[#E8B4B8]" />;
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-[#D4A574]" />;
      default:
        return <Bell className="w-5 h-5 text-[#D4A574]" />;
    }
  };

  const getNotificationText = (n) => {
    switch (n.type) {
      case 'LIKE':
        return 'appreciated your Vox';
      case 'REPOST':
        return 'reposted your Vox';
      case 'REPLY':
        return 'replied to your thread';
      case 'FOLLOW':
        return 'began following your updates';
      default:
        return 'interacted with your profile';
    }
  };

  const filteredNotifications =
    activeTab === 'mentions'
      ? notifications.filter((n) => n.type === 'REPLY')
      : notifications;

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 glass-header">
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="font-serif font-bold text-base text-[#F5EDE8] tracking-wide">
            Notifications
          </h1>
          <button
            onClick={handleMarkAllRead}
            title="Mark all as read"
            className="p-2 rounded-full hover:bg-[#D4A574]/10 text-[#A8888D] hover:text-[#D4A574] transition"
          >
            <CheckCheck className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: All / Mentions */}
        <div className="flex w-full">
          <button
            onClick={() => setActiveTab('all')}
            className="flex-1 py-3.5 hover:bg-[#D4A574]/5 transition relative flex items-center justify-center font-bold text-xs uppercase tracking-widest text-[#F5EDE8]"
          >
            <span className={activeTab === 'all' ? 'text-[#F5EDE8] font-extrabold text-metallic' : 'text-[#A8888D]'}>
              All
            </span>
            {activeTab === 'all' && (
              <div className="absolute bottom-0 h-[2.5px] w-12 bg-gradient-to-r from-[#E8B4B8] via-[#D4A574] to-[#C97B8A] rounded-full shadow-[0_0_10px_rgba(212,165,116,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('mentions')}
            className="flex-1 py-3.5 hover:bg-[#D4A574]/5 transition relative flex items-center justify-center font-bold text-xs uppercase tracking-widest text-[#F5EDE8]"
          >
            <span className={activeTab === 'mentions' ? 'text-[#F5EDE8] font-extrabold text-metallic' : 'text-[#A8888D]'}>
              Mentions
            </span>
            {activeTab === 'mentions' && (
              <div className="absolute bottom-0 h-[2.5px] w-12 bg-gradient-to-r from-[#E8B4B8] via-[#D4A574] to-[#C97B8A] rounded-full shadow-[0_0_10px_rgba(212,165,116,0.8)]" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-[#D4A574]/15">
        {isLoading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-[#A8888D] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#5C1A2B]/25 border border-[#D4A574]/20 mx-auto flex items-center justify-center text-[#D4A574]">
              <Bell className="w-5 h-5" />
            </div>
            <p className="font-serif text-base font-bold text-[#F5EDE8]">Nothing to see here yet</p>
            <p className="text-xs max-w-sm mx-auto">
              {activeTab === 'mentions'
                ? 'When someone mentions or replies to your threads, you’ll find it here.'
                : 'From likes to reposts and new followers, your notifications will arrive in style.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.postId) navigate(`/vox/${n.postId}`);
                else navigate(`/profile/${n.actor.username}`);
              }}
              className={`p-4 sm:p-5 flex gap-3.5 hover:bg-[#160B0F]/50 transition cursor-pointer ${
                !n.isRead ? 'bg-[#5C1A2B]/10 border-l-2 border-[#D4A574]' : ''
              }`}
            >
              {/* Type Icon */}
              <div className="shrink-0 w-7 flex justify-end pt-1">
                {getNotificationIcon(n.type)}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${n.actor.username}`);
                    }}
                  >
                    <Avatar src={n.actor.avatarUrl} alt={n.actor.displayName} size="md" />
                  </div>
                </div>

                <div className="text-sm text-[#F5EDE8]">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${n.actor.username}`);
                    }}
                    className="font-serif font-bold hover:text-[#D4A574] cursor-pointer inline-flex items-center gap-1 transition-colors"
                  >
                    {n.actor.displayName}
                    {n.actor.isVerified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] inline-block" />
                    )}
                  </span>{' '}
                  <span className="text-[#A8888D]">{getNotificationText(n)}</span>
                </div>

                {n.postContent && (
                  <p className="text-xs sm:text-sm text-[#A8888D] line-clamp-2 bg-[#160B0F]/80 p-3 rounded-2xl border border-[#D4A574]/15">
                    {n.postContent}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-[#A8888D] font-mono shrink-0 pt-1">
                {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: false })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
