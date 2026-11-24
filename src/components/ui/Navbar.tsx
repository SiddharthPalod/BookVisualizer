'use client';

import React from 'react';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { Library, Plus, BookCheck, Sparkles } from 'lucide-react';

export function Navbar() {
  const { shelves, openAddModal } = useBookshelfStore();

  const totalBooks = shelves.reduce((acc, s) => acc + s.books.length, 0);
  const completedBooks = shelves.reduce(
    (acc, s) => acc + s.books.filter((b) => b.status === 'completed').length,
    0
  );

  return (
    <header className="h-16 w-full px-8 bg-[#1f150e] border-b border-amber-950/80 flex items-center justify-between z-30 select-none shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 shadow-lg shadow-amber-950/50">
          <Library className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-lg text-amber-100 tracking-wide flex items-center gap-2">
            BookVisualizer
            <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              2.5D Library
            </span>
          </h1>
          <p className="text-[11px] text-amber-200/60 font-medium">
            Interactive visual reading tracker
          </p>
        </div>
      </div>

      {/* Center Stats */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-amber-200/80">
          <BookCheck className="w-4 h-4 text-emerald-400" />
          <span>
            <strong className="text-white">{completedBooks}</strong> of{' '}
            <strong className="text-white">{totalBooks}</strong> read
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs shadow-lg shadow-amber-950/60 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Book</span>
        </button>
      </div>
    </header>
  );
}
