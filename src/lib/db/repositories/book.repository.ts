import { getDatabase } from '../database';
import { Book, BookWithDetails, ReadingRecord, ShelfPosition } from '@/types';

export class BookRepository {
  public static getAllWithDetails(): BookWithDetails[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.description,
        b.genre,
        b.isbn,
        b.asin,
        b.page_count as pageCount,
        b.source_url as sourceUrl,
        b.remote_cover_url as remoteCoverUrl,
        b.local_cover_path as localCoverPath,
        b.spine_color as spineColor,
        b.spine_text_color as spineTextColor,
        b.created_at as createdAt,
        b.updated_at as updatedAt,
        sp.shelf_id as shelfId,
        sp.slot_index as slotIndex,
        s.name as shelfName,
        COALESCE(rr.status, 'completed') as status,
        rr.date_started as dateStarted,
        rr.date_completed as dateCompleted,
        rr.rating,
        rr.notes
      FROM books b
      LEFT JOIN shelf_positions sp ON b.id = sp.book_id
      LEFT JOIN shelves s ON sp.shelf_id = s.id
      LEFT JOIN reading_records rr ON b.id = rr.book_id
      ORDER BY sp.shelf_id ASC, sp.slot_index ASC
    `).all() as BookWithDetails[];

    return rows;
  }

  public static getById(id: string): BookWithDetails | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.description,
        b.genre,
        b.isbn,
        b.asin,
        b.page_count as pageCount,
        b.source_url as sourceUrl,
        b.remote_cover_url as remoteCoverUrl,
        b.local_cover_path as localCoverPath,
        b.spine_color as spineColor,
        b.spine_text_color as spineTextColor,
        b.created_at as createdAt,
        b.updated_at as updatedAt,
        sp.shelf_id as shelfId,
        sp.slot_index as slotIndex,
        s.name as shelfName,
        COALESCE(rr.status, 'completed') as status,
        rr.date_started as dateStarted,
        rr.date_completed as dateCompleted,
        rr.rating,
        rr.notes
      FROM books b
      LEFT JOIN shelf_positions sp ON b.id = sp.book_id
      LEFT JOIN shelves s ON sp.shelf_id = s.id
      LEFT JOIN reading_records rr ON b.id = rr.book_id
      WHERE b.id = ?
    `).get(id) as BookWithDetails | undefined;

    return row || null;
  }

  public static create(
    book: Book,
    position: ShelfPosition,
    record: ReadingRecord
  ): BookWithDetails {
    const db = getDatabase();

    const insertBook = db.prepare(`
      INSERT INTO books (
        id, title, author, description, genre, isbn, asin,
        page_count, source_url, remote_cover_url, local_cover_path,
        spine_color, spine_text_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPosition = db.prepare(`
      INSERT INTO shelf_positions (id, shelf_id, book_id, slot_index)
      VALUES (?, ?, ?, ?)
    `);

    const insertRecord = db.prepare(`
      INSERT INTO reading_records (id, book_id, status, date_started, date_completed, rating, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      // Ensure shelf exists before inserting foreign key
      db.prepare(`
        INSERT OR IGNORE INTO shelves (id, name, shelf_order, category)
        VALUES (?, ?, 0, 'General')
      `).run(position.shelfId, position.shelfId);

      insertBook.run(
        book.id,
        book.title,
        book.author,
        book.description || null,
        book.genre || null,
        book.isbn || null,
        book.asin || null,
        book.pageCount,
        book.sourceUrl || null,
        book.remoteCoverUrl || null,
        book.localCoverPath,
        book.spineColor,
        book.spineTextColor
      );

      insertPosition.run(
        position.id,
        position.shelfId,
        position.bookId,
        position.slotIndex
      );

      insertRecord.run(
        record.id,
        record.bookId,
        record.status,
        record.dateStarted || null,
        record.dateCompleted || null,
        record.rating || null,
        record.notes || null
      );
    });

    transaction();

    return this.getById(book.id)!;
  }

  public static update(
    id: string,
    bookData: Partial<Book> & { page_count?: number; spine_color?: string; spine_text_color?: string },
    recordData?: Partial<ReadingRecord>
  ): BookWithDetails | null {
    const db = getDatabase();

    const transaction = db.transaction(() => {
      const pageCountVal = bookData.pageCount !== undefined ? Number(bookData.pageCount) : (bookData.page_count !== undefined ? Number(bookData.page_count) : undefined);
      const spineColorVal = bookData.spineColor !== undefined ? bookData.spineColor : bookData.spine_color;
      const spineTextColorVal = bookData.spineTextColor !== undefined ? bookData.spineTextColor : bookData.spine_text_color;

      if (
        bookData.title !== undefined ||
        bookData.author !== undefined ||
        bookData.genre !== undefined ||
        bookData.description !== undefined ||
        pageCountVal !== undefined ||
        spineColorVal !== undefined ||
        spineTextColorVal !== undefined
      ) {
        db.prepare(`
          UPDATE books SET
            title = COALESCE(?, title),
            author = COALESCE(?, author),
            genre = COALESCE(?, genre),
            description = COALESCE(?, description),
            page_count = COALESCE(?, page_count),
            spine_color = COALESCE(?, spine_color),
            spine_text_color = COALESCE(?, spine_text_color),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          bookData.title !== undefined ? bookData.title.trim() : null,
          bookData.author !== undefined ? bookData.author.trim() : null,
          bookData.genre !== undefined ? bookData.genre.trim() : null,
          bookData.description !== undefined ? bookData.description.trim() : null,
          pageCountVal !== undefined && !isNaN(pageCountVal) ? pageCountVal : null,
          spineColorVal !== undefined ? spineColorVal.trim() : null,
          spineTextColorVal !== undefined ? spineTextColorVal.trim() : null,
          id
        );
      }

      if (recordData) {
        db.prepare(`
          UPDATE reading_records SET
            status = COALESCE(?, status),
            rating = COALESCE(?, rating),
            notes = COALESCE(?, notes),
            date_completed = COALESCE(?, date_completed)
          WHERE book_id = ?
        `).run(
          recordData.status || null,
          recordData.rating !== undefined ? recordData.rating : null,
          recordData.notes !== undefined ? recordData.notes : null,
          recordData.dateCompleted || null,
          id
        );
      }
    });

    transaction();
    return this.getById(id);
  }

  public static delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
