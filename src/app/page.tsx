'use client';

import React, { useEffect } from 'react';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { BookshelfViewport } from '@/components/bookshelf/BookshelfViewport';
import { BookOverlayModal } from '@/components/viewer3d/BookOverlayModal';
import { AddBookModal } from '@/components/modals/AddBookModal';
import { BookOpen, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { shelves, isLoading, error, fetchShelves } = useBookshelfStore();

  useEffect(() => {
    fetchShelves();
  }, [fetchShelves]);

  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col bg-[#2a170b]">
      {isLoading && shelves.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
            <BookOpen className="w-10 h-10" />
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-200/80 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Opening your library bookcase...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-400 text-sm mb-3">Failed to load bookshelf: {error}</p>
          <button
            onClick={() => fetchShelves()}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <BookshelfViewport />
      )}

      {/* 3D Animated Pull-Out & Details Split Overlay */}
      <BookOverlayModal />

      {/* Add Book Modal */}
      <AddBookModal />
    </main>
  );
}
