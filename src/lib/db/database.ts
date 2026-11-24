import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'bookvisualizer.db');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      isbn TEXT,
      asin TEXT,
      page_count INTEGER DEFAULT 250,
      source_url TEXT,
      remote_cover_url TEXT,
      local_cover_path TEXT NOT NULL,
      spine_color TEXT DEFAULT '#8b5a2b',
      spine_text_color TEXT DEFAULT '#f5eedc',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shelves (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      shelf_order INTEGER NOT NULL,
      category TEXT DEFAULT 'General'
    );

    CREATE TABLE IF NOT EXISTS shelf_positions (
      id TEXT PRIMARY KEY,
      shelf_id TEXT NOT NULL,
      book_id TEXT NOT NULL UNIQUE,
      slot_index INTEGER NOT NULL,
      FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_records (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL UNIQUE,
      status TEXT CHECK(status IN ('want_to_read', 'currently_reading', 'completed')) DEFAULT 'completed',
      date_started DATETIME,
      date_completed DATETIME,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      notes TEXT,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_shelf_positions_shelf ON shelf_positions(shelf_id);
    CREATE INDEX IF NOT EXISTS idx_shelf_positions_book ON shelf_positions(book_id);
  `);

  // Ensure all 2 cubby shelves exist across the sections
  const insertShelf = db.prepare('INSERT OR IGNORE INTO shelves (id, name, shelf_order, category) VALUES (?, ?, ?, ?)');
  
  const sections = [
    { bay: 1, name: 'Section I', categories: ['Habits & Growth', 'Focus & Mastery'] },
    { bay: 2, name: 'Section II', categories: ['Wisdom & Mindset', 'Strategy & Philosophy'] },
    { bay: 3, name: 'Section III', categories: ['Software Architecture', 'Craft & Engineering'] },
    { bay: 4, name: 'Section IV', categories: ['Archive & Future', 'Science & Essays'] },
  ];

  let order = 0;
  for (const sec of sections) {
    for (let tier = 1; tier <= 2; tier++) {
      const shelfId = `bay-${sec.bay}-tier-${tier}`;
      const cat = sec.categories[tier - 1] || 'General';
      insertShelf.run(shelfId, `${sec.name} • Shelf ${tier}`, order++, cat);
    }
  }

  dbInstance = db;
  return db;
}
