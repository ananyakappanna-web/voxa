import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileNav } from './MobileNav';
import { ComposeModal } from '../modals/ComposeModal';
import { useAuth } from '../../context/AuthContext';

export function AppLayout() {
  const { user } = useAuth();
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Global keyboard shortcut 'n' to trigger compose modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && user) {
        e.preventDefault();
        setIsComposeOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  return (
    <div className="min-h-screen bg-radial-luxury text-[#F5EDE8] flex justify-center selection:bg-[#C97B8A] selection:text-white relative overflow-x-hidden">
      {/* Subtle Background Radial Glow Element */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#5C1A2B]/20 via-[#2B0A12]/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="flex w-full max-w-7xl justify-between relative z-10">
        {/* Left Sidebar Navigation */}
        <Sidebar onOpenCompose={() => setIsComposeOpen(true)} />

        {/* Center Column / Main Content */}
        <main className="flex-1 min-w-0 max-w-2xl border-r border-[#D4A574]/15 min-h-screen pb-16 sm:pb-0 bg-[#0D0709]/40 backdrop-blur-sm">
          <MobileHeader />
          <Outlet context={{ openCompose: () => setIsComposeOpen(true) }} />
        </main>

        {/* Right Sidebar (Trends & Who to Follow) */}
        <RightSidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav onOpenCompose={() => setIsComposeOpen(true)} />

      {/* Global Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onPostCreated={() => {
          window.dispatchEvent(new CustomEvent('vox_created'));
        }}
      />
    </div>
  );
}
