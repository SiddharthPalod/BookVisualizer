'use client';

import React from 'react';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { ShelfWithBooks } from '@/types';
import { BookSpine } from './BookSpine';
import { EmptySlot } from './EmptySlot';

interface ShelfRowProps {
  shelf: ShelfWithBooks;
  tierIndex: number;
  totalTiers: number;
}

export function ShelfRow({ shelf, tierIndex, totalTiers }: ShelfRowProps) {
  const bookIds = shelf.books.map((b) => b.id);
  const isOpenTop = tierIndex === 0;
  const isBottomTier = tierIndex === totalTiers - 1;

  return (
    <div className="relative flex-1 flex flex-col justify-end min-h-[170px] max-h-[25vh]">
      {/* Category / Tier Subtle Wooden Label */}
      <div className="absolute top-2 left-6 z-20 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <div className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-[10px] font-serif font-bold uppercase tracking-wider text-amber-200/90 shadow-sm backdrop-blur-xs">
          {shelf.name} <span className="font-sans text-amber-400/70 font-normal">({shelf.category})</span>
        </div>
      </div>

      {/* Books and Empty Slots Sitting on the Shelf */}
      <div className="relative flex items-end gap-1.5 px-8 pb-0 z-10 min-w-max">
        <SortableContext items={bookIds} strategy={horizontalListSortingStrategy}>
          {shelf.books.map((book, idx) => {
            // Give every 3rd or 4th end book a subtle organic lean like Image 2
            const isLeaning = idx === shelf.books.length - 1 && shelf.books.length > 2;
            return <BookSpine key={book.id} book={book} isLeaning={isLeaning} />;
          })}
        </SortableContext>

        {/* Empty Slots */}
        <EmptySlot shelfId={shelf.id} slotIndex={shelf.books.length} />
        <EmptySlot shelfId={shelf.id} slotIndex={shelf.books.length + 1} />
      </div>

      {/* Realistic Wooden Shelf Rail (Image 2 Oak Styling) */}
      <div className="relative w-full z-20 flex-shrink-0">
        {/* Top Edge Highlight / Reflection */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#e5b882] via-[#deb382] to-[#e5b882] border-t border-white/20" />
        
        {/* Front Wood Plank Face with warm oak grain gradient */}
        <div className="h-4 sm:h-5 w-full bg-gradient-to-b from-[#c59156] via-[#ad793e] to-[#885724] border-b border-[#543310] flex items-center px-4 shadow-sm">
          <div className="w-full h-[1px] bg-white/10" />
        </div>

        {/* Ambient Drop Shadow Under Shelf onto lower books & wall */}
        {!isBottomTier && (
          <div className="h-4 w-full bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none" />
        )}

        {/* Solid Base Plinth if bottom tier */}
        {isBottomTier && (
          <div className="h-3 w-full bg-gradient-to-b from-[#7a4c1f] to-[#513112] border-t border-black/30" />
        )}
      </div>
    </div>
  );
}
