'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { Book3DViewer } from './Book3DViewer';
import { BookDetailsPanel } from '../details/BookDetailsPanel';

export function BookOverlayModal() {
  const { selectedBook, isDetailsOpen, closeDetails } = useBookshelfStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetails();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetails]);

  if (!isDetailsOpen || !selectedBook) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden">
        {/* Cinematic Backdrop: Ultra-gradual blur ramp-up matching the relaxed book lift pacing */}
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{
            opacity: [0, 0.04, 0.2, 0.6, 1],
            backdropFilter: [
              'blur(0px)',
              'blur(0.5px)',
              'blur(3px)',
              'blur(8px)',
              'blur(16px)',
            ],
          }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{
            duration: 2.4,
            times: [0, 0.25, 0.5, 0.75, 1.0],
            ease: 'easeInOut',
          }}
          onClick={closeDetails}
          className="absolute inset-0 bg-[#091116]/82 cursor-pointer z-0"
        />

        {/* Full-screen 3D Stage: Hosts the book lifting from clicked slot to center, turning, and gliding left */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <Book3DViewer book={selectedBook} isInteractive={true} />
        </div>

        {/* Right Info Dialog Box: Slides in from the right edge as the book glides to the left at t = 2.8s */}
        <div className="relative z-20 w-full h-full flex items-center justify-end p-4 sm:p-8 md:p-14 pointer-events-none">
          <motion.div
            initial={{ x: '130%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '130%', opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
              delay: 2.8, // Synchronized with the book gliding left after its 90-degree turn
            }}
            className="w-full sm:w-[440px] md:w-[480px] max-h-[88vh] pointer-events-auto mr-2 sm:mr-6 md:mr-10"
          >
            <BookDetailsPanel book={selectedBook} />
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
