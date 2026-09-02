import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ComposeBox } from '../posts/ComposeBox';

export function ComposeModal({ isOpen, onClose, onPostCreated }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#0D0709]/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl bg-[#14080C] border border-[#D4A574]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D4A574]/15 bg-[#160B0F]/90">
            <button
              onClick={onClose}
              className="p-1.5 text-[#A8888D] hover:text-[#F5EDE8] hover:bg-white/10 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-serif font-bold text-sm tracking-wider uppercase text-[#D4A574]">
              Compose Vox
            </span>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5">
            <ComposeBox
              isModal
              autoFocus
              placeholder="Share what matters..."
              onPostCreated={(post) => {
                if (onPostCreated) onPostCreated(post);
                onClose();
              }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
