'use client';

import React from 'react';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { BookWithDetails } from '@/types';
import { BookSpine } from './BookSpine';
import { EmptySlot } from './EmptySlot';

interface ShelfCompartmentProps {
  shelfId: string;
  books: BookWithDetails[];
  flexBasis: string;
  capacity?: number;
}

export function ShelfCompartment({
  shelfId,
  books,
  flexBasis,
  capacity = 6,
}: ShelfCompartmentProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: shelfId,
    data: { shelfId },
  });

  const bookIds = books.map((b) => b.id);
  const isFull = books.length >= capacity;

  return (
    <div
      ref={setNodeRef}
      style={{ flex: flexBasis }}
      className={`relative flex flex-col justify-end px-3 sm:px-5 pb-0 flex-shrink-0 transition-colors duration-200 overflow-visible select-none h-full ${
        isOver ? 'bg-amber-500/20 ring-2 ring-amber-500/70 shadow-inner' : ''
      }`}
    >
      {/* Soft depth shadow beneath the shelf beam directly above */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none z-10" />

      {/* Compartment ambient depth shadow against rustic wood wall */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          boxShadow: isOver
            ? 'inset 0 0 24px rgba(245, 158, 11, 0.35)'
            : 'inset 0 4px 14px rgba(0, 0, 0, 0.35), inset 2px 0 8px rgba(0, 0, 0, 0.25)',
        }}
      />

      {/* Books and Empty Slots sitting on the shelf floor */}
      <div className="relative flex items-end gap-1.5 sm:gap-2.5 pb-0 z-30 w-full flex-1 overflow-visible">
        <SortableContext items={bookIds} strategy={horizontalListSortingStrategy}>
          {books.map((book, bIdx) => (
            <BookSpine
              key={book.id}
              book={book}
              index={bIdx}
              totalBooks={books.length}
              isLeaning={bIdx === books.length - 1 && books.length > 2}
            />
          ))}
        </SortableContext>

        {/* Empty Slot (+ icon): only displayed when the section has remaining capacity */}
        {!isFull && (
          <EmptySlot shelfId={shelfId} slotIndex={books.length} />
        )}
      </div>
    </div>
  );
}
