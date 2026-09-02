import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';

export function EditProfileModal({ isOpen, onClose, onUpdated }) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [error, setError] = useState('');
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageUpload = async (event, imageType) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingImage(imageType);
    setError('');
    try {
      const res = await api.upload.uploadImageFile(file);
      const uploadedUrl = res.url;
      if (imageType === 'avatar') setAvatarUrl(uploadedUrl);
      if (imageType === 'cover') setCoverUrl(uploadedUrl);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const res = await api.users.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatarUrl: avatarUrl.trim(),
        coverUrl: coverUrl.trim()
      });

      updateUser(res.user);
      if (onUpdated) onUpdated(res.user);
      showToast({ title: 'Profile Updated', message: 'Your changes have been saved', type: 'info' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0709]/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-[#14080C] border border-[#D4A574]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D4A574]/15 sticky top-0 bg-[#160B0F]/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-1.5 text-[#A8888D] hover:text-[#F5EDE8] hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif font-bold text-base text-[#F5EDE8] tracking-wide">
                Edit Profile
              </h3>
            </div>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              size="sm"
              className="px-5 text-xs font-bold"
            >
              Save Changes
            </Button>
          </div>

          {/* Form Content */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {error && <p className="text-xs text-[#E8B4B8]">{error}</p>}

            {/* Cover photo preview */}
            <div className="relative h-32 sm:h-40 w-full bg-[#1A0E12] rounded-2xl overflow-hidden border border-[#D4A574]/20 shadow-inner">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#3B0D19] via-[#5C1A2B] to-[#1A0E12]" />
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingImage !== null}
                className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-[#0D0709]/85 px-3 py-2 text-xs font-bold text-[#F5EDE8] border border-[#D4A574]/40 hover:bg-[#2B0A12] disabled:opacity-60 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                {uploadingImage === 'cover' ? 'Uploading...' : 'Upload cover'}
              </button>
            </div>

            {/* Avatar preview */}
            <div className="relative -mt-14 ml-4 w-24 h-24 rounded-full border-4 border-[#14080C] overflow-hidden bg-[#160B0F] shrink-0 shadow-lg ring-1 ring-[#D4A574]/40">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#8B2635] to-[#D4A574] flex items-center justify-center text-2xl font-serif font-bold text-white">
                  {displayName.charAt(0) || 'V'}
                </div>
              )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'avatar')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingImage !== null}
                  aria-label="Upload avatar image"
                  className="absolute inset-0 flex items-center justify-center bg-[#0D0709]/65 text-[#F5EDE8] opacity-0 hover:opacity-100 transition"
                >
                  <Camera className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#160B0F] text-[#F5EDE8] px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#160B0F] text-[#F5EDE8] px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm resize-none"
                  placeholder="Share your bio..."
                />
                <span className="block text-right text-[10px] text-[#A8888D] font-mono mt-0.5">
                  {bio.length} / 160
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-[#160B0F] text-[#F5EDE8] px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full bg-[#160B0F] text-[#F5EDE8] px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#160B0F] text-[#F5EDE8] px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-[#D4A574]/80 mb-1.5">
                    Website
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-[#160B0F] text-[#F5EDE8] px-4 py-2.5 rounded-xl border border-[#D4A574]/20 focus:outline-none focus:border-[#D4A574] text-sm"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
