const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bookvisualizer.db');
const db = new Database(dbPath);

console.log('🌱 Initializing SQLite Schema with 2 Shelves Per Section...');

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
`);

// Clear old positions and populate 2-shelf cubbies
db.prepare('DELETE FROM shelf_positions').run();
db.prepare('DELETE FROM reading_records').run();
db.prepare('DELETE FROM books').run();
db.prepare('DELETE FROM shelves').run();

const insertShelf = db.prepare('INSERT INTO shelves (id, name, shelf_order, category) VALUES (?, ?, ?, ?)');

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

const seedBooks = [
  {
    id: 'book-atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.',
    genre: 'Self-Improvement',
    isbn: '9781847941831',
    asin: '1847941834',
    pageCount: 320,
    sourceUrl: 'https://www.amazon.in/Atomic-Habits-James-Clear/dp/1847941834',
    localCoverPath: '/storage/covers/book-atomic-habits.jpg',
    shelfId: 'bay-1-tier-1',
    slotIndex: 0,
    spineColor: '#c2410c',
    spineTextColor: '#fff7ed',
    status: 'completed',
    rating: 5,
    notes: 'Remarkable book on habit loops: cue, craving, response, reward. 1% better every day.'
  },
  {
    id: 'book-deep-work',
    title: 'Deep Work',
    author: 'Cal Newport',
    description: 'Rules for Focused Success in a Distracted World.',
    genre: 'Productivity',
    isbn: '9781455586691',
    asin: '1455586692',
    pageCount: 304,
    sourceUrl: 'https://www.amazon.com/dp/1455586692',
    localCoverPath: '/storage/covers/book-deep-work.jpg',
    shelfId: 'bay-1-tier-1',
    slotIndex: 1,
    spineColor: '#1e3a8a',
    spineTextColor: '#eff6ff',
    status: 'completed',
    rating: 5,
    notes: 'Eliminate shallow work and prioritize uninterrupted creative output.'
  },
  {
    id: 'book-psychology-of-money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness.',
    genre: 'Psychology',
    isbn: '9789390166268',
    asin: '9390166268',
    pageCount: 256,
    sourceUrl: 'https://www.amazon.in/Psychology-Money-Morgan-Housel/dp/9390166268',
    localCoverPath: '/storage/covers/book-psychology-of-money.jpg',
    shelfId: 'bay-1-tier-2',
    slotIndex: 0,
    spineColor: '#14532d',
    spineTextColor: '#f0fdf4',
    status: 'completed',
    rating: 5,
    notes: 'Financial success is a soft skill, where how you behave is more important than what you know.'
  },
  {
    id: 'book-thinking-fast-slow',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    description: 'System 1 and System 2 cognitive biases.',
    genre: 'Psychology',
    isbn: '9780374533557',
    pageCount: 499,
    sourceUrl: 'https://openlibrary.org/isbn/9780374533557',
    localCoverPath: '/storage/covers/book-thinking-fast-slow.jpg',
    shelfId: 'bay-2-tier-1',
    slotIndex: 0,
    spineColor: '#78350f',
    spineTextColor: '#fef3c7',
    status: 'currently_reading',
    rating: 4,
    notes: 'Heuristics and biases explained by Nobel laureate.'
  },
  {
    id: 'book-navalmanack',
    title: 'The Almanack of Naval Ravikant',
    author: 'Eric Jorgenson',
    description: 'A Guide to Wealth and Happiness.',
    genre: 'Philosophy',
    pageCount: 244,
    sourceUrl: 'https://www.navalmanack.com',
    localCoverPath: '/storage/covers/book-navalmanack.svg',
    shelfId: 'bay-2-tier-2',
    slotIndex: 0,
    spineColor: '#0f766e',
    spineTextColor: '#f0fdfa',
    status: 'completed',
    rating: 5,
    notes: 'Specific knowledge, accountability, and leverage.'
  },
  {
    id: 'book-meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    description: 'Private reflections of the Roman Emperor Marcus Aurelius.',
    genre: 'Philosophy',
    pageCount: 254,
    sourceUrl: 'https://openlibrary.org/works/OL1879797W',
    localCoverPath: '/storage/covers/book-meditations.jpg',
    shelfId: 'bay-2-tier-2',
    slotIndex: 1,
    spineColor: '#831843',
    spineTextColor: '#fdf2f8',
    status: 'completed',
    rating: 5,
    notes: 'You have power over your mind - not outside events.'
  },
  {
    id: 'book-clean-code',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    description: 'A Handbook of Agile Software Craftsmanship.',
    genre: 'Software',
    isbn: '9780132350884',
    asin: '0132350882',
    pageCount: 464,
    sourceUrl: 'https://www.amazon.com/dp/0132350882',
    localCoverPath: '/storage/covers/book-clean-code.jpg',
    shelfId: 'bay-3-tier-1',
    slotIndex: 0,
    spineColor: '#312e81',
    spineTextColor: '#e0e7ff',
    status: 'completed',
    rating: 5,
    notes: 'Meaningful names, small functions, SRP and boy scout rule.'
  },
  {
    id: 'book-pragmatic-programmer',
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    description: 'Your Journey To Mastery.',
    genre: 'Software',
    pageCount: 352,
    sourceUrl: 'https://openlibrary.org/works/OL257943W',
    localCoverPath: '/storage/covers/book-pragmatic-programmer.jpg',
    shelfId: 'bay-3-tier-2',
    slotIndex: 0,
    spineColor: '#1e293b',
    spineTextColor: '#f8fafc',
    status: 'completed',
    rating: 5,
    notes: 'Care about your craft. Think about your work.'
  }
];

for (const book of seedBooks) {
  db.prepare(`
    INSERT INTO books (
      id, title, author, description, genre, isbn, asin,
      page_count, source_url, local_cover_path,
      spine_color, spine_text_color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    book.id,
    book.title,
    book.author,
    book.description,
    book.genre,
    book.isbn || null,
    book.asin || null,
    book.pageCount,
    book.sourceUrl,
    book.localCoverPath,
    book.spineColor,
    book.spineTextColor
  );

  db.prepare(`
    INSERT INTO shelf_positions (id, shelf_id, book_id, slot_index)
    VALUES (?, ?, ?, ?)
  `).run(
    `pos-${book.id}`,
    book.shelfId,
    book.id,
    book.slotIndex
  );

  db.prepare(`
    INSERT INTO reading_records (id, book_id, status, rating, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    `rec-${book.id}`,
    book.id,
    book.status,
    book.rating,
    book.notes
  );

  console.log(`✓ Seeded "${book.title}" in ${book.shelfId} slot ${book.slotIndex}`);
}

console.log('✨ Database 2-shelf layout successfully initialized!');
