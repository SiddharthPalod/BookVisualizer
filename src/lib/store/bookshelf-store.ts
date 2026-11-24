import { create } from 'zustand';
import { BookWithDetails, ShelfWithBooks } from '@/types';

export interface BookOriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BookshelfState {
  shelves: ShelfWithBooks[];
  isLoading: boolean;
  error: string | null;
  selectedBook: BookWithDetails | null;
  clickOrigin: BookOriginRect | null;
  isDetailsOpen: boolean;
  isAddModalOpen: boolean;
  targetSlot: { shelfId: string; slotIndex: number } | null;

  // Actions
  fetchShelves: () => Promise<void>;
  selectBook: (book: BookWithDetails, origin?: BookOriginRect) => void;
  closeDetails: () => void;
  openAddModal: (targetSlot?: { shelfId: string; slotIndex: number }) => void;
  closeAddModal: () => void;
  updateBookInState: (book: BookWithDetails) => void;
  deleteBookInState: (bookId: string) => void;
  reorderInState: (positions: { bookId: string; shelfId: string; slotIndex: number }[]) => Promise<void>;
}

export const useBookshelfStore = create<BookshelfState>((set, get) => ({
  shelves: [],
  isLoading: false,
  error: null,
  selectedBook: null,
  clickOrigin: null,
  isDetailsOpen: false,
  isAddModalOpen: false,
  targetSlot: null,

  fetchShelves: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/shelves');
      const data = await res.json();
      if (data.success) {
        set({ shelves: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch shelves', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Network error', isLoading: false });
    }
  },

  selectBook: (book: BookWithDetails, origin?: BookOriginRect) => {
    set({ selectedBook: book, clickOrigin: origin || null, isDetailsOpen: true });
  },

  closeDetails: () => {
    set({ isDetailsOpen: false, selectedBook: null, clickOrigin: null });
  },

  openAddModal: (targetSlot) => {
    set({ isAddModalOpen: true, targetSlot: targetSlot || null });
  },

  closeAddModal: () => {
    set({ isAddModalOpen: false, targetSlot: null });
  },

  updateBookInState: (updatedBook: BookWithDetails) => {
    const { shelves, selectedBook } = get();
    const newShelves = shelves.map((shelf) => ({
      ...shelf,
      books: shelf.books.map((b) => (b.id === updatedBook.id ? updatedBook : b)),
    }));

    set({
      shelves: newShelves,
      selectedBook: selectedBook?.id === updatedBook.id ? updatedBook : selectedBook,
    });
  },

  deleteBookInState: (bookId: string) => {
    const { shelves } = get();
    const newShelves = shelves.map((shelf) => ({
      ...shelf,
      books: shelf.books.filter((b) => b.id !== bookId),
    }));

    set({
      shelves: newShelves,
      selectedBook: null,
      clickOrigin: null,
      isDetailsOpen: false,
    });
  },

  reorderInState: async (positions) => {
    try {
      const res = await fetch('/api/shelves/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      });
      const data = await res.json();
      if (data.success) {
        set({ shelves: data.data });
      }
    } catch (err) {
      console.error('Failed to persist reorder to server:', err);
    }
  },
}));
