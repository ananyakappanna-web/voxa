import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  BadgeCheck,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { VoxCard } from '../components/posts/VoxCard';
import { PostSkeleton } from '../components/posts/SkeletonLoader';
import { EditProfileModal } from '../components/modals/EditProfileModal';
import { FollowListModal } from '../components/modals/FollowListModal';

export function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'replies' | 'likes' | 'media'
  const [posts, setPosts] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followModalConfig, setFollowModalConfig] = useState({ isOpen: false, type: 'followers' });

  useEffect(() => {
    let isMounted = true;
    setIsLoadingProfile(true);

    async function loadProfile() {
      try {
        const res = await api.users.getProfile(username);
        if (isMounted) {
          setProfileUser(res.user);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [username, currentUser?.id]);

  useEffect(() => {
    if (!profileUser) return;

    let isMounted = true;
    setIsLoadingPosts(true);

    async function loadUserPosts() {
      try {
        const res = await api.posts.getUserTimeline(username, activeTab);
        if (isMounted) {
          setPosts(res.posts || []);
        }
      } catch (err) {
        console.error('Failed to load user posts:', err);
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    }

    loadUserPosts();
    return () => {
      isMounted = false;
    };
  }, [username, activeTab, profileUser?.id]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!profileUser) return;

    const prevFollowing = profileUser.isFollowing;
    const prevFollowersCount = profileUser.followersCount;

    setProfileUser((prev) => ({
      ...prev,
      isFollowing: !prevFollowing,
      followersCount: prevFollowing ? prevFollowersCount - 1 : prevFollowersCount + 1
    }));

    try {
      const res = await api.users.toggleFollow(profileUser.id);
      setProfileUser((prev) => ({ ...prev, isFollowing: res.isFollowing }));
    } catch (err) {
      setProfileUser((prev) => ({
        ...prev,
        isFollowing: prevFollowing,
        followersCount: prevFollowersCount
      }));
    }
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (isLoadingProfile) {
    return (
      <div className="w-full min-h-screen">
        <div className="p-4 border-b border-[#D4A574]/15 flex items-center gap-4">
          <div className="h-6 w-32 bg-[#5C1A2B]/30 rounded animate-pulse" />
        </div>
        <div className="h-44 bg-[#160B0F] animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="w-24 h-24 rounded-full bg-[#5C1A2B]/30 -mt-16 border-4 border-[#0D0709] animate-pulse" />
          <div className="h-5 w-40 bg-[#5C1A2B]/40 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-12 text-center text-[#A8888D] space-y-3">
        <h2 className="font-serif text-2xl font-bold text-[#F5EDE8]">Member Profile Not Found</h2>
        <p className="text-xs">The requested profile does not exist or may have been updated.</p>
        <Button size="sm" onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    );
  }

  const isSelf = currentUser?.id === profileUser.id;

  return (
    <div className="w-full min-h-screen">
      {/* Top Header */}
      <div className="sticky top-0 z-20 glass-header px-4 py-2.5 flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 text-[#F5EDE8] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-serif font-bold text-base text-[#F5EDE8] flex items-center gap-1 leading-tight">
            {profileUser.display_name}
            {profileUser.is_verified ? (
              <BadgeCheck className="w-4 h-4 text-[#D4A574] fill-[#D4A574] inline-block shrink-0" />
            ) : null}
          </h2>
          <p className="text-[11px] text-[#A8888D] font-mono">{profileUser.postsCount} Voxes</p>
        </div>
      </div>

      {/* Luxury Cover Banner */}
      <div className="h-36 sm:h-52 w-full bg-[#1A0E12] relative overflow-hidden">
        {profileUser.cover_url ? (
          <img
            src={profileUser.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#3B0D19] via-[#5C1A2B] to-[#1A0E12]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0709] via-transparent to-transparent opacity-60" />
      </div>

      {/* Profile Details Container */}
      <div className="px-5 pb-5 border-b border-[#D4A574]/15 bg-[#14080C]/40 backdrop-blur-md">
        {/* Avatar & Action Button Row */}
        <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-4">
          <div className="relative rounded-full border-4 border-[#0D0709] overflow-hidden bg-[#0D0709] shadow-2xl">
            <Avatar
              src={profileUser.avatar_url}
              alt={profileUser.display_name}
              size="2xl"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {!isSelf && currentUser && (
              <button
                onClick={() => navigate(`/messages?user=${profileUser.id}`)}
                className="p-2.5 rounded-full border border-[#D4A574]/30 hover:bg-[#D4A574]/10 text-[#F5EDE8] transition shadow-sm"
                title="Direct Message"
              >
                <Mail className="w-4 h-4 text-[#D4A574]" />
              </button>
            )}

            {isSelf ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="font-bold text-xs"
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={profileUser.isFollowing ? 'outline' : 'primary'}
                size="sm"
                onClick={handleToggleFollow}
                className="font-bold px-5 text-xs"
              >
                {profileUser.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        {/* Display Name & Handle */}
        <div className="space-y-1">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F5EDE8] flex items-center gap-1.5">
            {profileUser.display_name}
            {profileUser.is_verified ? (
              <BadgeCheck className="w-5 h-5 text-[#D4A574] fill-[#D4A574] shrink-0" />
            ) : null}
          </h1>
          <p className="text-xs text-[#A8888D]">@{profileUser.username}</p>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="text-sm text-[#F5EDE8] mt-3 leading-relaxed break-words whitespace-pre-line font-normal">
            {profileUser.bio}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#A8888D] mt-4">
          {profileUser.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4A574]" />
              <span>{profileUser.location}</span>
            </div>
          )}

          {profileUser.website && (
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#D4A574]" />
              <a
                href={
                  profileUser.website.startsWith('http')
                    ? profileUser.website
                    : `https://${profileUser.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-[#D4A574] hover:text-[#E8B4B8] hover:underline"
              >
                {profileUser.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          <div className="flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5 text-[#D4A574]" />
            <span>
              Joined{' '}
              {profileUser.created_at
                ? format(new Date(profileUser.created_at), 'MMMM yyyy')
                : 'Recently'}
            </span>
          </div>
        </div>

        {/* Following / Followers Stats */}
        <div className="flex items-center gap-6 mt-4 text-xs tracking-wider uppercase font-medium">
          <button
            onClick={() => setFollowModalConfig({ isOpen: true, type: 'following' })}
            className="hover:underline flex items-center gap-1.5 group"
          >
            <span className="font-bold text-[#F5EDE8] font-mono group-hover:text-[#D4A574]">
              {profileUser.followingCount?.toLocaleString() || 0}
            </span>
            <span className="text-[#A8888D]">Following</span>
          </button>

          <button
            onClick={() => setFollowModalConfig({ isOpen: true, type: 'followers' })}
            className="hover:underline flex items-center gap-1.5 group"
          >
            <span className="font-bold text-[#F5EDE8] font-mono group-hover:text-[#D4A574]">
              {profileUser.followersCount?.toLocaleString() || 0}
            </span>
            <span className="text-[#A8888D]">Followers</span>
          </button>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-[#D4A574]/15 sticky top-12 z-10 glass-header">
        {['posts', 'replies', 'likes', 'media'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3.5 hover:bg-[#D4A574]/5 transition relative flex items-center justify-center font-bold text-xs uppercase tracking-widest"
          >
            <span className={activeTab === tab ? 'text-[#F5EDE8] font-extrabold text-metallic' : 'text-[#A8888D]'}>{tab}</span>
            {activeTab === tab && (
              <div className="absolute bottom-0 h-[2.5px] w-12 sm:w-16 bg-gradient-to-r from-[#E8B4B8] via-[#D4A574] to-[#C97B8A] rounded-full shadow-[0_0_10px_rgba(212,165,116,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* User Timeline Feed */}
      <div>
        {isLoadingPosts ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-[#A8888D]">
            <p className="font-serif text-base font-bold text-[#F5EDE8]">No {activeTab} yet</p>
            <p className="text-xs mt-1">When @{username} shares something, it will appear here.</p>
          </div>
        ) : (
          posts.map((post) => (
            <VoxCard key={post.id} post={post} onDelete={handlePostDelete} />
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updated) => setProfileUser((prev) => ({ ...prev, ...updated }))}
      />

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={followModalConfig.isOpen}
        onClose={() => setFollowModalConfig({ ...followModalConfig, isOpen: false })}
        username={profileUser.username}
        type={followModalConfig.type}
      />
    </div>
  );
}
