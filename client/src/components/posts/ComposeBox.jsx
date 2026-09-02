import React, { useState, useRef } from 'react';
import { Image, Smile, X, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

const EMOJI_LIST = ['✨', '🍷', '🥂', '🖤', '👑', '💎', '🚀', '🔥', '⚡', '🏛️', '💼', '💡'];

export function ComposeBox({
  placeholder = "Share what matters...",
  replyToId = null,
  onPostCreated,
  isModal = false,
  autoFocus = false
}) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const MAX_CHARS = 280;
  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const progressPercent = Math.min((content.length / MAX_CHARS) * 100, 100);

  const handleTextChange = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setError('');
    try {
      const data = await api.upload.uploadImageFile(file);
      setImageUrl(data.url);
    } catch (err) {
      console.error('File upload failed, using base64 preview:', err);
      setImageUrl(imagePreview || '');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCustomUrl = () => {
    if (customUrl.trim()) {
      setImageUrl(customUrl.trim());
      setImagePreview(customUrl.trim());
      setCustomUrl('');
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if ((!content.trim() && !imageUrl) || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.posts.create(content.trim(), imageUrl || null, replyToId);
      setContent('');
      setImageUrl('');
      setImagePreview('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (onPostCreated) {
        onPostCreated(res.post);
      }
    } catch (err) {
      setError(err.message || 'Failed to publish Vox.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div
      className={`${
        isModal ? '' : 'border-b border-[#D4A574]/15 p-4 bg-[#14080C]/40 backdrop-blur-md'
      } flex gap-3.5 transition-colors duration-200`}
    >
      <div className="shrink-0 pt-0.5">
        <Avatar src={user?.avatar_url} alt={user?.display_name || user?.username} size="md" />
      </div>

      <div className="flex-1 min-w-0">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            autoFocus={autoFocus}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={isModal ? 3 : 2}
            className="w-full bg-transparent text-[#F5EDE8] placeholder-[#A8888D] text-base sm:text-lg border-0 focus:ring-0 focus:outline-none resize-none overflow-hidden font-normal leading-relaxed"
          />

          {/* Image Preview in Luxury Frame */}
          {imagePreview && (
            <div className="relative my-3 rounded-2xl overflow-hidden border border-[#D4A574]/30 max-h-80 w-fit shadow-[0_8px_25px_rgba(0,0,0,0.7)]">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="max-h-80 w-auto object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-[#0D0709]/85 hover:bg-[#8B2635] text-[#F5EDE8] border border-[#D4A574]/30 backdrop-blur-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-[#0D0709]/75 flex items-center justify-center gap-2 text-[#F5EDE8] text-sm font-medium">
                  <Loader2 className="w-5 h-5 animate-spin text-[#D4A574]" />
                  <span>Uploading media...</span>
                </div>
              )}
            </div>
          )}

          {/* URL Input Bar */}
          {showUrlInput && (
            <div className="my-2.5 flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste high-res image URL (https://...)"
                className="flex-1 bg-[#160B0F] text-xs text-[#F5EDE8] px-3.5 py-2 rounded-xl border border-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]"
              />
              <Button size="sm" onClick={handleAddCustomUrl}>
                Attach
              </Button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="p-1.5 text-[#A8888D] hover:text-[#F5EDE8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Emoji Tray */}
          {showEmojiPicker && (
            <div className="my-2.5 p-2 bg-[#160B0F] border border-[#D4A574]/20 rounded-2xl flex flex-wrap gap-2 shadow-xl animate-fadeIn">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="text-xl p-1.5 hover:bg-[#D4A574]/15 rounded-xl transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-[#E8B4B8] mb-2">{error}</p>}

          <div className="pt-3 flex items-center justify-between border-t border-[#D4A574]/15 mt-2">
            <div className="flex items-center gap-1.5 text-[#D4A574]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add Image"
                className="p-2 rounded-full hover:bg-[#D4A574]/10 transition text-[#D4A574] hover:text-[#E8B4B8]"
              >
                <Image className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Add Emoji"
                className="p-2 rounded-full hover:bg-[#D4A574]/10 transition text-[#D4A574] hover:text-[#E8B4B8]"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                title="Add Image URL"
                className="p-2 rounded-full hover:bg-[#D4A574]/10 transition text-[#D4A574] hover:text-[#E8B4B8] text-xs font-serif font-bold"
              >
                URL
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Circular Character Counter with Metallic Rose-Gold Gradient */}
              {content.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#5C1A2B]/40"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`transition-all duration-150 ${
                          isOverLimit
                            ? 'text-red-500'
                            : charsLeft <= 20
                            ? 'text-[#E8B4B8]'
                            : 'text-[#D4A574]'
                        }`}
                        strokeDasharray={`${progressPercent}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    {charsLeft <= 20 && (
                      <span
                        className={`absolute text-[9px] font-mono font-bold ${
                          isOverLimit ? 'text-red-500' : 'text-[#A8888D]'
                        }`}
                      >
                        {charsLeft}
                      </span>
                    )}
                  </div>
                  <div className="h-4 w-[1px] bg-[#D4A574]/20" />
                </div>
              )}

              <Button
                type="submit"
                disabled={(!content.trim() && !imageUrl) || isOverLimit || isSubmitting}
                isLoading={isSubmitting}
                size="sm"
                className="px-5 py-1.5 uppercase tracking-wider font-extrabold text-xs"
              >
                {replyToId ? 'Reply' : 'Vox'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
