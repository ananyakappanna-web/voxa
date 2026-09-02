import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function ImageLightbox({ imageUrl, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0D0709]/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-3 rounded-full bg-[#160B0F]/90 text-[#F5EDE8] hover:text-[#D4A574] border border-[#D4A574]/30 hover:border-[#D4A574] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-5xl max-h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt="Expanded view"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-[0_15px_60px_rgba(0,0,0,0.9)] border border-[#D4A574]/30"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
