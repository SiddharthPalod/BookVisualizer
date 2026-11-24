import { getDatabase } from '../database';
import { Shelf, ShelfWithBooks } from '@/types';
import { BookRepository } from './book.repository';

export class ShelfRepository {
  public static getAll(): Shelf[] {
    const db = getDatabase();
    return db.prepare('SELECT id, name, shelf_order as shelfOrder, category FROM shelves ORDER BY shelf_order ASC').all() as Shelf[];
  }

  public static getAllWithBooks(): ShelfWithBooks[] {
    const shelves = this.getAll();
    const allBooks = BookRepository.getAllWithDetails();

    return shelves.map((shelf) => ({
      ...shelf,
      books: allBooks
        .filter((b) => b.shelfId === shelf.id)
        .sort((a, b) => a.slotIndex - b.slotIndex),
    }));
  }

  public static getNextAvailableSlot(shelfId: string): number {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT COALESCE(MAX(slot_index) + 1, 0) as nextSlot
      FROM shelf_positions
      WHERE shelf_id = ?
    `).get(shelfId) as { nextSlot: number };

    return result.nextSlot;
  }

  public static updatePositions(
    positions: { bookId: string; shelfId: string; slotIndex: number }[]
  ): void {
    const db = getDatabase();

    const ensureShelfStmt = db.prepare(`
      INSERT OR IGNORE INTO shelves (id, name, shelf_order, category)
      VALUES (?, ?, 0, 'General')
    `);

    const updateStmt = db.prepare(`
      UPDATE shelf_positions 
      SET shelf_id = ?, slot_index = ?
      WHERE book_id = ?
    `);

    const transaction = db.transaction(() => {
      for (const pos of positions) {
        ensureShelfStmt.run(pos.shelfId, pos.shelfId);
        updateStmt.run(pos.shelfId, pos.slotIndex, pos.bookId);
      }
    });

    transaction();
  }
}
