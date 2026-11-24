'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';

interface EmptySlotProps {
  shelfId: string;
  slotIndex: number;
}

export function EmptySlot({ shelfId, slotIndex }: EmptySlotProps) {
  const { openAddModal } = useBookshelfStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAddModal({ shelfId, slotIndex });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative h-[36.5vh] w-12 sm:w-16 rounded-t-[2px] border-2 border-dashed border-transparent hover:border-amber-400/60 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer bg-transparent hover:bg-amber-500/10 focus:outline-none flex-shrink-0"
      title="Add a book to this shelf"
    >
      <div className="w-9 h-9 rounded-full bg-amber-700/80 group-hover:bg-amber-500 text-amber-100 group-hover:text-stone-950 flex items-center justify-center transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
        <Plus className="w-4 h-4" />
      </div>
    </button>
  );
}
