import React from 'react';

export function PostSkeleton() {
  return (
    <div className="border-b border-[#D4A574]/15 p-5 flex gap-3.5 animate-pulse bg-[#160B0F]/30">
      <div className="w-10 h-10 rounded-full bg-[#5C1A2B]/25 shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-[#5C1A2B]/30 rounded" />
          <div className="h-3 w-20 bg-[#D4A574]/15 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-[#5C1A2B]/20 rounded" />
          <div className="h-4 w-4/5 bg-[#5C1A2B]/20 rounded" />
        </div>
        <div className="h-48 w-full bg-[#1A0E12]/80 rounded-2xl border border-[#D4A574]/10" />
        <div className="flex justify-between max-w-md pt-2">
          <div className="h-4 w-8 bg-[#D4A574]/15 rounded" />
          <div className="h-4 w-8 bg-[#D4A574]/15 rounded" />
          <div className="h-4 w-8 bg-[#D4A574]/15 rounded" />
          <div className="h-4 w-8 bg-[#D4A574]/15 rounded" />
        </div>
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="border-b border-[#D4A574]/15 p-5 flex gap-3.5 animate-pulse bg-[#160B0F]/30">
      <div className="w-6 h-6 rounded-full bg-[#D4A574]/20 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-10 h-10 rounded-full bg-[#5C1A2B]/30" />
        <div className="h-4 w-48 bg-[#5C1A2B]/30 rounded" />
        <div className="h-3 w-3/4 bg-[#D4A574]/15 rounded" />
      </div>
    </div>
  );
}

export function UserRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 animate-pulse bg-[#160B0F]/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#5C1A2B]/30" />
        <div className="space-y-1.5">
          <div className="h-4 w-24 bg-[#5C1A2B]/30 rounded" />
          <div className="h-3 w-16 bg-[#D4A574]/15 rounded" />
        </div>
      </div>
      <div className="h-7 w-20 bg-[#D4A574]/20 rounded-full" />
    </div>
  );
}
