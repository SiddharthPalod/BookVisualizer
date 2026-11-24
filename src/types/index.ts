export type ReadingStatus = 'want_to_read' | 'currently_reading' | 'completed';

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  genre?: string;
  isbn?: string;
  asin?: string;
  pageCount: number;
  sourceUrl?: string;
  remoteCoverUrl?: string;
  localCoverPath: string; // Persistent local asset path
  spineColor: string;
  spineTextColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shelf {
  id: string;
  name: string;
  shelfOrder: number;
  category: string;
}

export interface ShelfPosition {
  id: string;
  shelfId: string;
  bookId: string;
  slotIndex: number;
}

export interface ReadingRecord {
  id: string;
  bookId: string;
  status: ReadingStatus;
  dateStarted?: string;
  dateCompleted?: string;
  rating?: number;
  notes?: string;
}

export interface BookWithDetails extends Book {
  shelfId: string;
  slotIndex: number;
  shelfName?: string;
  status: ReadingStatus;
  dateStarted?: string;
  dateCompleted?: string;
  rating?: number;
  notes?: string;
}

export interface ShelfWithBooks extends Shelf {
  books: BookWithDetails[];
}

export interface MetadataLookupResult {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  isbn?: string;
  asin?: string;
  pageCount?: number;
  publisher?: string;
  publishDate?: string;
  genre?: string;
  source: 'amazon' | 'openlibrary' | 'googlebooks' | 'unsplash' | 'manual';
}

export interface CreateBookInput {
  title: string;
  author: string;
  description?: string;
  genre?: string;
  isbn?: string;
  asin?: string;
  pageCount?: number;
  sourceUrl?: string;
  coverUrl?: string;
  coverBase64?: string;
  shelfId: string;
  slotIndex?: number;
  status?: ReadingStatus;
  notes?: string;
  rating?: number;
  spineColor?: string;
  spineTextColor?: string;
}
