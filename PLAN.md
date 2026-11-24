# BookVisualizer — Engineering Implementation Plan

## 1. Executive Summary & Architecture Overview
**BookVisualizer** is an interactive, visual-first personal reading tracker featuring a front-facing 2.5D wooden bookshelf with realistic 3D book interaction, infinite horizontal scrolling, drag-and-drop rearrangement, and an automated metadata ingestion engine.

### Tech Stack & Package Choices
* **Core Framework:** Next.js 14+ (App Router, React 18/19, TypeScript)
* **Styling:** Tailwind CSS (utility-first, zero bulky custom CSS files)
* **Database & Persistence:** SQLite via `better-sqlite3` (or Prisma with SQLite provider)
* **3D Visualization:** `@react-three/fiber`, `@react-three/drei`, `three` (industry standard for interactive 3D WebGL books)
* **Animation & Transitions:** `framer-motion` (for fluid 2.5D pull-out shelf transitions and details split screen)
* **Drag-and-Drop:** `@dnd-kit/core`, `@dnd-kit/sortable` (modular, accessible shelf rearrangement)
* **State Management:** `zustand` (clean, lightweight global state for active book, shelf layout, and modals)
* **Data Fetching & Parsing:** `cheerio`, `axios` (Amazon/web scraping), OpenLibrary API & Google Books API fallback
* **Image Processing & Storage:** `sharp` / Node `fs` (downloads and converts remote cover images into local optimized webp/png assets to guarantee offline persistence if external links fail)
* **Fallback Image Engine:** Unsplash API / Source integration with semantic fallback query system
* **UI Components & Icons:** `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`

---

## 2. Architectural Design Patterns & Separation of Concerns

```
+-----------------------------------------------------------------------------------+
|                               Presentation Layer                                  |
|  - BookshelfViewport (Horizontal Scroll container)                                |
|  - ShelfRow & BookSpine components                                                |
|  - Three.js 3D Book Canvas (Cover, Spine, Page Block textures)                     |
|  - BookDetailsSheet & AddBookModal                                                |
+-----------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------------+
|                         State & Orchestration Layer                               |
|  - Zustand Store (activeBook, shelfOrder, dragEvents, filter/category)            |
+-----------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------------+
|                              Service Layer                                        |
|  - BookService: Business rules, shelf placement algorithm                         |
|  - AssetStorageService: Downloads external images & persists locally to filesystem|
+-----------------------------------------------------------------------------------+
                  |                                                   |
                  v                                                   v
+-----------------------------------+             +---------------------------------+
|      Metadata Ingestion Engine    |             |       Data Access Layer         |
|         (Strategy Pattern)        |             |      (Repository Pattern)       |
|  - IMetadataProvider interface     |             |  - BookRepository               |
|    * AmazonScraperStrategy        |             |  - ShelfRepository              |
|    * OpenLibraryStrategy          |             |  - SQLite Database Client       |
|    * GoogleBooksStrategy          |             +---------------------------------+
|    * UnsplashFallbackStrategy     |
+-----------------------------------+
```

### Key Design Patterns:
1. **Repository Pattern:**
   * Isolates SQLite SQL queries from API routes and controllers.
   * `BookRepository`, `ShelfRepository`, `ReadingRecordRepository`.
2. **Strategy / Adapter Pattern:**
   * `IMetadataProvider` abstract contract with concrete strategies:
     - `AmazonScraperAdapter`: extracts title, author, description, ASIN, cover.
     - `OpenLibraryAdapter`: fallback book metadata matching ISBN/titles.
     - `UnsplashAdapter`: fetches thematic high-res book/concept cover when book covers are absent.
3. **Local Asset Resiliency Pattern (Self-Healing Storage):**
   * When any book is saved, the remote cover URL is asynchronously ingested, processed, and stored in the local SQLite/filesystem (`/public/covers/[id].[ext]`). The database records both local asset URI and original source URL. If the external URL dies or becomes blocked, the app seamlessly serves the persistent local asset.
4. **Factory Pattern:**
   * `Book3DModelFactory`: generates 3D dimensional parameters (page count -> thickness, height, width, spine text textures, page edge shader/materials) based on book metadata.

---

## 3. Database Schema Design (SQLite)

```sql
-- Core book metadata
CREATE TABLE books (
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
  local_cover_path TEXT NOT NULL, -- guarantees permanence
  spine_color TEXT,
  spine_text_color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shelves and layout
CREATE TABLE shelves (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  shelf_order INTEGER NOT NULL,
  category TEXT DEFAULT 'General'
);

-- Bookshelf position layout (supports drag-and-drop ordering)
CREATE TABLE shelf_positions (
  id TEXT PRIMARY KEY,
  shelf_id TEXT NOT NULL,
  book_id TEXT NOT NULL UNIQUE,
  slot_index INTEGER NOT NULL,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- User reading status and notes
CREATE TABLE reading_records (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL UNIQUE,
  status TEXT CHECK(status IN ('want_to_read', 'currently_reading', 'completed')) DEFAULT 'completed',
  date_started DATETIME,
  date_completed DATETIME,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  notes TEXT,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
```

---

## 4. Phase-Wise Execution Plan

### **Phase 1: Project Initialization & Data Layer Setup**
- [ ] Initialize Next.js project with TypeScript, Tailwind CSS, and essential dependencies (`better-sqlite3`, `lucide-react`, `zustand`, `zod`).
- [ ] Set up SQLite database connection and run schema migrations.
- [ ] Build the `BookRepository` and `ShelfRepository` with clean TypeScript types.
- [ ] Set up local file storage utility in `public/storage/covers` to download and persist images locally.
- [ ] Implement database seeder with *Atomic Habits* by James Clear and sample books with local covers.

### **Phase 2: Metadata Extraction & Cover Ingestion Pipeline**
- [ ] Implement `IMetadataProvider` interface.
- [ ] Build `AmazonScraperStrategy` with Cheerio/regex to extract book title, author, description, and high-resolution cover from Amazon links/ASINs.
- [ ] Build `OpenLibraryStrategy` / `GoogleBooksStrategy` as reliable secondary data providers.
- [ ] Build `UnsplashStrategy` using Unsplash public photo queries as a fallback when no official book cover is found.
- [ ] Create Next.js API route `/api/books/lookup` that cascades through providers and returns normalized metadata.
- [ ] Create `/api/books` (GET, POST, PUT, DELETE) with automatic local image downloading and persistence.

### **Phase 3: 2.5D Straight-On Bookshelf & Horizontal Infinite Navigation**
- [ ] Build the straight-on orthographic bookshelf viewport (wooden shelf rails, ambient drop shadows, warm ambient backdrop).
- [ ] Implement pure horizontal navigation (mouse drag pan, horizontal scroll wheel support, arrow buttons, zero vertical scroll).
- [ ] Render dynamic book spines on shelves:
  - Procedural spine heights, widths, and thickness based on page count.
  - Realistic leather/cloth/matte spine textures and contrasting embossed typography.
  - Hover states: spine subtly tilts/lifts forward to indicate interactivity.
- [ ] Add empty slot placeholders displaying a subtle `+` button on hover to add books in that exact slot.

### **Phase 4: 3D Book Visualizer & Details Split View**
- [ ] Build Three.js 3D Book canvas using `@react-three/fiber` and `@react-three/drei`:
  - 3D book mesh with front cover texture, spine texture, back cover, and realistic paper page edges.
  - Orbit / mouse interaction to freely rotate and inspect the book in 3D.
- [ ] Implement Framer Motion transition sequence:
  - On spine click: Book pulls out from shelf and transitions into the 3D viewer on the left side of the screen.
  - Right side slides in with full book details (Title, Author, Genre, Reading Status, Dates, Notes).
  - Background blurs slightly to emphasize the selected book.
  - Back button or outside click smoothly returns the book back into its bookshelf slot.

### **Phase 5: Book Ingestion UI & Drag-and-Drop Shelf Rearrangement**
- [ ] Implement `AddBookModal`:
  - Tab 1: **Import via Link / ASIN** (Amazon link input, automatic lookup, live preview of parsed data & cover, one-click save).
  - Tab 2: **Manual Upload** (Custom title, author, genre, page count, file upload or Unsplash keyword search for cover).
- [ ] Integrate `@dnd-kit` for shelf reordering:
  - Drag book spines along a shelf or across shelves.
  - Real-time visual feedback and slot re-indexing.
  - Auto-sync updated layout positions back to SQLite via `/api/shelves/reorder`.

### **Phase 6: Hardening, Testing & Polish**
- [ ] Verify complete workflow with *Atomic Habits* (https://www.amazon.in/Atomic-Habits-James-Clear/dp/1847941834).
- [ ] Simulate broken external URLs to verify local SQLite and filesystem cover persistence.
- [ ] Performance audit: Three.js asset disposal, texture caching, smooth 60fps horizontal scrolling.
- [ ] Responsive design check (fits across wide desktops and tablet screens).
