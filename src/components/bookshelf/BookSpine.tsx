'use client';

import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookWithDetails } from '@/types';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { Star } from 'lucide-react';
import { generateSpineCanvas, getSpineAspect } from '@/lib/utils/spine-generator';

interface BookSpineProps {
  book: BookWithDetails;
  index?: number;
  totalBooks?: number;
  isLeaning?: boolean;
}

export function BookSpine({ book, index, totalBooks, isLeaning }: BookSpineProps) {
  const { selectBook } = useBookshelfStore();

  // Smart tooltip alignment: prevents cutting off on left or right borders
  const tooltipAlignClass =
    index === 0
      ? 'left-0'
      : index !== undefined && totalBooks !== undefined && index >= totalBooks - 1 && totalBooks > 1
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.id,
    data: {
      type: 'Book',
      book,
      shelfId: book.shelfId,
    },
  });

  // Calculate stable hash for subtle variation in height
  let hash = 0;
  for (let i = 0; i < book.title.length; i++) {
    hash = (hash << 5) - hash + book.title.charCodeAt(i);
  }
  const absHash = Math.abs(hash);

  // Height: 35.5vh to 39.0vh (substantially fills shelf height while preserving elegant snug headroom)
  const heightVh = 35.5 + (absHash % 3.5);

  // True physical aspect ratio: prevents any horizontal/vertical text stretching
  const spineAspect = getSpineAspect(book.pageCount);

  // Subtle natural tilt if leaning
  const tiltDeg = isLeaning ? (absHash % 2 === 0 ? 4.5 : -4.5) : 0;

  // Generate 100% identical spine data URL with matching aspect ratio
  const { spineImageSrc } = useMemo(() => {
    if (typeof window === 'undefined') return { spineImageSrc: '' };
    const { dataUrl } = generateSpineCanvas({
      id: book.id,
      title: book.title,
      author: book.author,
      pageCount: book.pageCount,
      spineColor: book.spineColor,
      spineTextColor: book.spineTextColor,
    });
    return { spineImageSrc: dataUrl };
  }, [book.id, book.title, book.author, book.pageCount, book.spineColor, book.spineTextColor]);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1, // original spine stays clearly visible and consistent during drag
    zIndex: isDragging ? 100 : undefined, // do not lock inline zIndex when not dragging so hover:z-50 works
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    selectBook(book, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex items-end select-none cursor-pointer flex-shrink-0 hover:z-50 ${
        isDragging ? 'z-50' : ''
      }`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {/* 2.5D Spine Element: Exactly matching the unstretched aspect ratio of the 3D model */}
      <div
        className="relative rounded-t-[2px] transition-transform duration-200 ease-out flex flex-col justify-end items-center shadow-[2px_3px_12px_rgba(0,0,0,0.65)] group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.85)] group-hover:-translate-y-2.5 group-hover:brightness-105"
        style={{
          height: `${heightVh}vh`,
          aspectRatio: `${spineAspect}`, // Lock 1:1 aspect ratio with texture to prevent stretching
          transform: tiltDeg !== 0 ? `rotate(${tiltDeg}deg) translateY(-1px)` : undefined,
          transformOrigin: 'bottom center',
        }}
      >
        {/* Render the identical unstretched spine texture */}
        {spineImageSrc ? (
          <img
            src={spineImageSrc}
            alt={book.title}
            className="w-full h-full object-fill rounded-t-[2px] pointer-events-none"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full rounded-t-[2px]"
            style={{ backgroundColor: book.spineColor || '#8b5a2b' }}
          />
        )}

        {/* Hover Tooltip Card: Snug above book top, floats above beams and headers */}
        <div
          className={`absolute -top-6 ${tooltipAlignClass} opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 whitespace-nowrap bg-stone-950/95 text-stone-100 text-[11px] px-3 py-1 rounded-md shadow-[0_8px_25px_rgba(0,0,0,0.85)] border border-amber-400/70 backdrop-blur-md flex items-center gap-1.5`}
        >
          <span className="font-semibold text-amber-200">{book.title}</span>
          <span className="text-[10px] text-stone-300">• {book.author}</span>
          {book.rating && (
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              <span className="text-[10px] ml-0.5">{book.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
