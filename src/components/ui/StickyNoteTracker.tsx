'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { Plus, ChevronUp, ChevronDown, Move } from 'lucide-react';

export function StickyNoteTracker() {
  const { shelves, openAddModal, selectBook } = useBookshelfStore();
  const [isFolded, setIsFolded] = useState(false);

  const allBooks = shelves.flatMap((s) => s.books);
  const totalBooks = allBooks.length;
  const completedBooks = allBooks.filter((b) => b.status === 'completed');
  const inProgressBooks = allBooks.filter((b) => b.status === 'currently_reading');
  const wantToReadBooks = allBooks.filter((b) => b.status === 'want_to_read');

  // Priority order: Books currently in progress first, then plan-to-read, then completed
  const prioritizedBooks = [...inProgressBooks, ...wantToReadBooks, ...completedBooks];

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: 0, y: 0 }}
      className="absolute top-4 right-8 z-40 select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      {/* Translucent Frosted Tape with drag handle */}
      <div 
        onClick={() => setIsFolded(!isFolded)}
        className="relative mx-auto w-24 h-5 -mb-2 bg-white/40 hover:bg-white/60 backdrop-blur-xs border-t border-b border-white/60 shadow-sm transform -rotate-1 z-50 cursor-pointer flex items-center justify-center gap-1 group"
        title={isFolded ? "Click to unfold reading log" : "Click to fold reading log"}
      >
        <Move className="w-2.5 h-2.5 text-amber-900/40 group-hover:text-amber-900/80" />
        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-amber-950/60">
          {isFolded ? 'Unfold' : 'Fold'}
        </span>
      </div>

      {/* Sticky Note Body with real paper texture and 3D folding/curling */}
      <motion.div
        animate={{
          rotateX: isFolded ? 65 : 1.5,
          scaleY: isFolded ? 0.35 : 1,
          y: isFolded ? -8 : 0,
          opacity: 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 220 }}
        style={{ transformOrigin: 'top center', perspective: 800 }}
        className="relative w-52 sm:w-60 p-3.5 bg-[#fef9c3] text-[#713f12] rounded-xs shadow-[0_12px_28px_rgba(0,0,0,0.45)] border-b-2 border-r-2 border-amber-300/60 font-serif paper-texture"
      >
        {/* Curled fold shadow when folded */}
        {isFolded ? (
          <div 
            onClick={() => setIsFolded(false)}
            className="flex items-center justify-between py-1 px-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">📖</span>
              <span className="font-bold text-xs text-amber-950">
                Log: {completedBooks.length}/{totalBooks} read
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-amber-900/60 animate-bounce" />
          </div>
        ) : (
          <div>
            {/* Scribbled Note Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-900/20">
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-900 font-sans">
                  Reading Log ✏️
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                  {completedBooks.length}/{totalBooks}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFolded(true);
                  }}
                  className="p-0.5 hover:bg-amber-900/10 rounded text-amber-900/60"
                  title="Fold up note"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note Body */}
            <div className="mt-2 text-xs leading-relaxed">
              <div className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <span>{completedBooks.length} of {totalBooks} books read</span>
                <span className="text-emerald-700 font-bold">✓</span>
              </div>
              <p className="text-[10px] text-amber-800/80 italic mt-0.5">
                {inProgressBooks.length > 0
                  ? `${inProgressBooks.length} currently in progress`
                  : completedBooks.length === totalBooks && totalBooks > 0
                  ? 'All books finished! 🌟'
                  : 'Ready to start a new book!'}
              </p>
            </div>

            {/* Scribbled checklist: Prioritizes active in-progress books at the top */}
            <div className="mt-2 pt-1.5 border-t border-dashed border-amber-900/25 space-y-1.5 text-[11px]">
              {prioritizedBooks.slice(0, 5).map((b) => {
                const isReading = b.status === 'currently_reading';
                const isCompleted = b.status === 'completed';

                return (
                  <div
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectBook(b);
                    }}
                    className="flex items-center gap-1.5 truncate text-amber-900/90 cursor-pointer hover:text-amber-950 transition-colors group"
                    title={`Click to inspect "${b.title}" (${isReading ? 'In Progress' : isCompleted ? 'Completed' : 'Plan to Read'})`}
                  >
                    {isReading ? (
                      <span className="text-[11px] text-amber-700 font-bold flex-shrink-0 animate-pulse">📖</span>
                    ) : isCompleted ? (
                      <span className="text-emerald-700 font-bold flex-shrink-0 text-[11px]">✓</span>
                    ) : (
                      <span className="text-amber-600 flex-shrink-0 text-[11px]">○</span>
                    )}
                    <span
                      className={`truncate ${
                        isCompleted
                          ? 'line-through opacity-65 text-amber-900/70'
                          : isReading
                          ? 'font-bold text-amber-950 underline decoration-amber-600/50 decoration-wavy underline-offset-2'
                          : 'font-medium'
                      }`}
                    >
                      {b.title}
                    </span>
                  </div>
                );
              })}
              {prioritizedBooks.length > 5 && (
                <div className="text-[9px] text-amber-800/70 pl-3">
                  +{prioritizedBooks.length - 5} more on shelves...
                </div>
              )}
            </div>

            {/* Action button on sticky note */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAddModal();
              }}
              className="mt-2.5 w-full py-1.5 px-2 bg-amber-900/10 hover:bg-amber-900/20 border border-amber-900/30 rounded text-[11px] font-sans font-bold text-amber-950 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Book</span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
