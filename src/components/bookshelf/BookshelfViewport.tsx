'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { ShelfCompartment } from './ShelfCompartment';
import { StickyNoteTracker } from '../ui/StickyNoteTracker';
import { BookWithDetails } from '@/types';
import { generateSpineCanvas, getSpineAspect } from '@/lib/utils/spine-generator';

export function BookshelfViewport() {
  const { shelves, reorderInState } = useBookshelfStore();
  const [activeDragBook, setActiveDragBook] = useState<BookWithDetails | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allBooks = shelves.flatMap((s) => s.books);
    const book = allBooks.find((b) => b.id === active.id);
    if (book) {
      setActiveDragBook(book);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragBook(null);

    if (!over) return;

    const allBooks = shelves.flatMap((s) => s.books);
    const draggedBook = allBooks.find((b) => b.id === active.id);
    if (!draggedBook) return;

    let targetShelfId: string | null = null;

    if (over.data?.current?.shelfId) {
      targetShelfId = over.data.current.shelfId;
    } else if (String(over.id).startsWith('bay-')) {
      targetShelfId = String(over.id);
    } else {
      const overBook = allBooks.find((b) => b.id === over.id);
      if (overBook) {
        targetShelfId = overBook.shelfId;
      }
    }

    if (!targetShelfId) return;

    const sourceShelf = shelves.find((s) => s.id === draggedBook.shelfId);
    let targetShelf = shelves.find((s) => s.id === targetShelfId);

    if (!targetShelf) {
      targetShelf = {
        id: targetShelfId,
        name: targetShelfId,
        shelfOrder: 0,
        category: 'General',
        books: [],
      };
    }

    if (!sourceShelf) return;

    if (sourceShelf.id === targetShelf.id) {
      const shelfBooks = [...sourceShelf.books];
      const oldIndex = shelfBooks.findIndex((b) => b.id === active.id);
      const newIndex = shelfBooks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        shelfBooks.splice(oldIndex, 1);
        shelfBooks.splice(newIndex, 0, draggedBook);

        const positions = shelfBooks.map((b, idx) => ({
          bookId: b.id,
          shelfId: sourceShelf.id,
          slotIndex: idx,
        }));
        reorderInState(positions);
      }
    } else {
      const sourceRemaining = sourceShelf.books.filter((b) => b.id !== draggedBook.id);
      const targetBooks = [...targetShelf.books];

      const overIndex = targetBooks.findIndex((b) => b.id === over.id);
      if (overIndex !== -1) {
        targetBooks.splice(overIndex, 0, { ...draggedBook, shelfId: targetShelf.id });
      } else {
        targetBooks.push({ ...draggedBook, shelfId: targetShelf.id });
      }

      const positions = [
        ...sourceRemaining.map((b, idx) => ({
          bookId: b.id,
          shelfId: sourceShelf.id,
          slotIndex: idx,
        })),
        ...targetBooks.map((b, idx) => ({
          bookId: b.id,
          shelfId: targetShelf.id,
          slotIndex: idx,
        })),
      ];

      reorderInState(positions);
    }
  };

  // Check if any additional bays exist beyond bay 3
  const maxBayReferenced = Math.max(
    3,
    ...shelves
      .filter((s) => s.books.length > 0)
      .map((s) => {
        const match = s.id.match(/^bay-(\d+)/);
        return match ? parseInt(match[1], 10) : 3;
      })
  );

  // Upper Row (Tier 1): [1,1] wide (~8 books), [2,1] compact (~5 books), [3,1] standard (~6-7 books)
  const tier1Config = [
    { bayNum: 1, flexBasis: '1.35 1 0%', capacity: 8 },
    { bayNum: 2, flexBasis: '0.85 1 0%', capacity: 5 },
    { bayNum: 3, flexBasis: '1.1 1 0%', capacity: 6 },
  ];

  // Lower Row (Tier 2): [1,2] compact (~5 books), [2,2] wide (~8-9 books), [3,2] standard (~6 books)
  // Notice: Divider 1 on Lower Row is positioned at 25.8% across, while Upper Divider 1 is at 40.9% across!
  // This achieves the architectural staggered column layout requested by the user.
  const tier2Config = [
    { bayNum: 1, flexBasis: '0.85 1 0%', capacity: 5 },
    { bayNum: 2, flexBasis: '1.4 1 0%', capacity: 8 },
    { bayNum: 3, flexBasis: '1.05 1 0%', capacity: 6 },
  ];

  for (let b = 4; b <= maxBayReferenced; b++) {
    tier1Config.push({ bayNum: b, flexBasis: '1.0 1 0%', capacity: 6 });
    tier2Config.push({ bayNum: b, flexBasis: '1.0 1 0%', capacity: 6 });
  }

  const tier1Compartments = tier1Config.map((cfg) => {
    const shelfId = `bay-${cfg.bayNum}-tier-1`;
    const shelf = shelves.find((s) => s.id === shelfId);
    return {
      shelfId,
      books: shelf ? shelf.books : [],
      flexBasis: cfg.flexBasis,
      capacity: cfg.capacity,
    };
  });

  const tier2Compartments = tier2Config.map((cfg) => {
    const shelfId = `bay-${cfg.bayNum}-tier-2`;
    const shelf = shelves.find((s) => s.id === shelfId);
    return {
      shelfId,
      books: shelf ? shelf.books : [],
      flexBasis: cfg.flexBasis,
      capacity: cfg.capacity,
    };
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between bg-[#2a170b] select-none">
      {/* Background Library Wall: Authentic Rustic Wood Plank Texture */}
      <div className="absolute inset-0 pointer-events-none wall-texture opacity-95" />
      
      {/* Subtle warm directional ambient glow & corner vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_30%_20%,_rgba(255,220,160,0.18)_0%,_transparent_65%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_transparent_50%,_rgba(0,0,0,0.35)_100%)]" />

      {/* Draggable & Foldable Sticky Note Reading Tracker */}
      <StickyNoteTracker />

      {/* Main Bookshelf Viewport - Screen locked, zero scrollbars */}
      <div className="relative w-full h-full overflow-hidden select-none flex items-stretch z-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Authentic Warm Wooden Bookcase Framework */}
          <div className="relative flex flex-col h-full w-full overflow-hidden px-3 sm:px-6 py-2.5">
            
            {/* Top Outer Bookcase Cornice Beam */}
            <div 
              className="h-3.5 sm:h-4 w-full border-b border-[#241207] shadow-md flex-shrink-0 z-30 wood-texture"
              style={{ backgroundColor: '#4a2b15' }}
            >
              <div className="w-full h-full bg-gradient-to-r from-black/30 via-white/10 to-black/30 pointer-events-none" />
            </div>

            {/* Bookcase Interior Framework with Outer Left & Right Vertical Beams */}
            <div className="relative flex-1 flex flex-col h-full w-full overflow-hidden min-h-0">
              
              {/* Outer Left Vertical Oak Beam */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-3.5 sm:w-4.5 z-25 pointer-events-none shadow-[4px_0_14px_rgba(0,0,0,0.5)] border-r border-[#241207] wood-texture"
                style={{ backgroundColor: '#3e220e' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-white/10 to-black/30 pointer-events-none" />
              </div>

              {/* Row 1: Upper Tier (Staggered Compartments) */}
              <div className="relative flex-1 flex flex-row items-stretch overflow-visible w-full min-h-0 pl-3.5 sm:pl-4.5 pr-3.5 sm:pr-4.5">
                {tier1Compartments.map((comp, idx) => (
                  <React.Fragment key={comp.shelfId}>
                    <ShelfCompartment
                      shelfId={comp.shelfId}
                      books={comp.books}
                      flexBasis={comp.flexBasis}
                      capacity={comp.capacity}
                    />
                    {idx < tier1Compartments.length - 1 && (
                      <div 
                        className="relative w-3.5 sm:w-4 flex-shrink-0 z-20 pointer-events-none shadow-[2px_0_10px_rgba(0,0,0,0.4)] border-l border-white/10 border-r border-[#1a0a03] wood-texture"
                        style={{ backgroundColor: '#422510' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-white/10 to-black/25 pointer-events-none" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Middle Continuous Shelf Beam (Solid Oak with Highlight Rail - FLUSH JOINERY) */}
              <div className="relative w-full z-20 flex-shrink-0">
                {/* Sunlit Polished Wood Surface Highlight where Upper Books Stand */}
                <div className="h-[2px] w-full bg-[#d49755] border-t border-white/35 shadow-xs" />
                
                {/* Front Wood Plank Face */}
                <div 
                  className="h-3.5 sm:h-4 w-full border-b border-[#241207] shadow-md wood-texture"
                  style={{ backgroundColor: '#4a2b15' }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-black/25 via-white/10 to-black/25 pointer-events-none" />
                </div>
              </div>

              {/* Row 2: Lower Tier (Staggered Offset Compartments - FLUSH UNDER MIDDLE BEAM) */}
              <div className="relative flex-1 flex flex-row items-stretch overflow-visible w-full min-h-0 pl-3.5 sm:pl-4.5 pr-3.5 sm:pr-4.5">
                {tier2Compartments.map((comp, idx) => (
                  <React.Fragment key={comp.shelfId}>
                    <ShelfCompartment
                      shelfId={comp.shelfId}
                      books={comp.books}
                      flexBasis={comp.flexBasis}
                      capacity={comp.capacity}
                    />
                    {idx < tier2Compartments.length - 1 && (
                      <div 
                        className="relative w-3.5 sm:w-4 flex-shrink-0 z-20 pointer-events-none shadow-[2px_0_10px_rgba(0,0,0,0.4)] border-l border-white/10 border-r border-[#1a0a03] wood-texture"
                        style={{ backgroundColor: '#422510' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-white/10 to-black/25 pointer-events-none" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Outer Right Vertical Oak Beam */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-3.5 sm:w-4.5 z-25 pointer-events-none shadow-[-4px_0_14px_rgba(0,0,0,0.5)] border-l border-[#241207] wood-texture"
                style={{ backgroundColor: '#3e220e' }}
              >
                <div className="absolute inset-0 bg-gradient-to-l from-black/35 via-white/10 to-black/30 pointer-events-none" />
              </div>
            </div>

            {/* Bottom Bookcase Solid Base Plinth */}
            <div 
              className="h-4 sm:h-5 w-full border-t border-[#d49755]/50 shadow-2xl flex-shrink-0 z-30 wood-texture"
              style={{ backgroundColor: '#3a1f0c' }}
            >
              <div className="h-[1.5px] w-full bg-[#d49755] border-t border-white/20" />
              <div className="w-full h-full bg-gradient-to-r from-black/35 via-white/10 to-black/35 pointer-events-none" />
            </div>
          </div>

          {/* DND Drag Overlay: Displays identical original book spine during drag */}
          <DragOverlay dropAnimation={null}>
            {activeDragBook ? (
              <div
                className="relative rounded-t-[2px] shadow-[0_22px_55px_rgba(0,0,0,0.75)] ring-2 ring-amber-400 brightness-110 cursor-grabbing opacity-95 scale-105 pointer-events-none select-none"
                style={{
                  height: '37vh',
                  aspectRatio: `${getSpineAspect(activeDragBook.pageCount)}`,
                }}
              >
                <img
                  src={
                    generateSpineCanvas({
                      id: activeDragBook.id,
                      title: activeDragBook.title,
                      author: activeDragBook.author,
                      pageCount: activeDragBook.pageCount,
                      spineColor: activeDragBook.spineColor,
                      spineTextColor: activeDragBook.spineTextColor,
                    }).dataUrl
                  }
                  alt={activeDragBook.title}
                  className="w-full h-full object-fill rounded-t-[2px] pointer-events-none"
                  draggable={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
