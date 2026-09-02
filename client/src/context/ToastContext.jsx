import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Repeat, MessageCircle, UserPlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const addToast = useCallback(({ title, message, type = 'info', avatar, link, duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, message, type, avatar, link };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'LIKE':
      case 'like':
        return <Heart className="w-4 h-4 text-[#E8B4B8] fill-[#C97B8A]" />;
      case 'REPOST':
      case 'repost':
        return <Repeat className="w-4 h-4 text-[#D4A574]" />;
      case 'REPLY':
      case 'reply':
      case 'message':
        return <MessageCircle className="w-4 h-4 text-[#E8B4B8]" />;
      case 'FOLLOW':
      case 'follow':
        return <UserPlus className="w-4 h-4 text-[#D4A574]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#D4A574]" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => {
                if (toast.link) {
                  navigate(toast.link);
                  removeToast(toast.id);
                }
              }}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-[0_10px_35px_rgba(13,7,9,0.9)] border border-[#D4A574]/25 transition-all cursor-pointer backdrop-blur-2xl bg-[#160B0F]/90 text-[#F5EDE8] ${
                toast.link ? 'hover:scale-[1.02] hover:border-[#D4A574]/50' : ''
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.avatar ? (
                  <img
                    src={toast.avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-[#D4A574]/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#5C1A2B]/40 border border-[#D4A574]/30 flex items-center justify-center">
                    {getIcon(toast.type)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="text-sm font-serif font-bold text-[#F5EDE8] truncate flex items-center gap-1.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-[#A8888D] line-clamp-2 mt-0.5">{toast.message}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="shrink-0 text-[#A8888D] hover:text-[#F5EDE8] p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
