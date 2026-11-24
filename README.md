# 📚 BookVisualizer — 2.5D Interactive Reading Tracker

An interactive virtual reading tracker featuring a front-facing **2.5D architectural wooden bookshelf**, **3D book inspection** (Three.js / WebGL), **drag-and-drop shelf organization**, a tactile **sticky-note reading log**, and **permanent SQLite offline persistence**.

---

## 🌟 Key Features

1. **Architectural Staggered Bookshelf:**
   * **Staggered Cubby Design**: Multi-tier asymmetric layout with variable capacity per shelf (wide and compact tiers) for an authentic mid-century library aesthetic.
   * **Rustic Wood Wall Backing**: Warm timber plank texture with realistic lighting, shadows, and solid oak joinery.
   * **Zero Scroll Clutter**: Clean, locked orthographic view that fits the screen without awkward scrollbars.

2. **Dynamic Spines with WCAG AAA Contrast:**
   * **Physical Thickness**: Spine thickness dynamically scales based on book page counts (slim spines for ~80-page novellas, chunky spines for ~800-page volumes).
   * **Intelligent Typography**: Automatic contrast calculation ensures spine titles switch to deep dark ink on light covers and crisp white on dark covers, adhering to WCAG AAA standards.
   * **Edge-Aware Hover Cards**: Hover tooltips snug against the book rim with smart left/right border detection so titles are never clipped by shelf dividers.

3. **Interactive 3D Book Inspection:**
   * Clicking any book smoothly pulls it from the shelf into a split-screen 3D inspection view.
   * **Left**: 3D interactive book model with front cover texture, spine text, back cover, and realistic paper page blocks. Drag to rotate 360°, scroll to zoom.
   * **Right**: Elegant ornate reading details drawer (reading status, 5-star rating, synopsis, personal takeaways, original purchase link, color picker, and delete action).

4. **Tactile Sticky Note Reading Tracker:**
   * Origami-style yellow paper note stuck with translucent frosted tape to the bookcase.
   * Shows completed, in-progress, and planned books with priority ordering.
   * Supports **free dragging** across the screen and click-to-fold/unfold physics.

5. **Drag-and-Drop Shelf Reordering:**
   * Seamless drag-and-drop within a shelf or across different tiers via `@dnd-kit`.
   * Displays 1:1 authentic spine texture in the drag preview while keeping the original column visible for visual consistency.
   * Position updates persist immediately to SQLite.

6. **Self-Healing Offline Storage (SQLite + Local Assets):**
   * Uses embedded SQLite (`better-sqlite3`) in WAL mode for lightning-fast reads and writes.
   * Whenever a book is added, remote covers are automatically downloaded and stored permanently in `public/storage/covers/`. Even if an external image link breaks or goes offline, your books remain completely intact.

7. **Multi-Source Metadata Ingestion:**
   * **Amazon URL / ASIN Scraper**: Ingests title, author, description, and high-res cover from links.
   * **OpenLibrary Fallback**: Automatic ISBN / title metadata lookup.
   * **Unsplash Cover Engine**: Curated aesthetic photography fallbacks matching book themes.
   * **Manual Entry**: Upload custom covers or select thematic presets.

---

## 🚀 Getting Started

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18.17.0 or higher recommended)
* `npm` or `pnpm`

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed the Database
Pre-populates SQLite with curated starter books and downloads their permanent offline covers:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
BookVisualizer/
├── data/                    # SQLite database storage (WAL mode)
├── public/
│   ├── storage/covers/      # Permanent offline book cover images
│   └── textures/            # Rustic wood & wall textures
├── scripts/
│   └── seed.js              # Database seed script
├── src/
│   ├── app/                 # Next.js App Router (layout, page, API routes)
│   ├── components/
│   │   ├── bookshelf/       # Bookshelf, ShelfCompartment, BookSpine, EmptySlot
│   │   ├── details/         # BookDetailsPanel (3D split view drawer)
│   │   ├── modals/          # AddBookModal (Amazon/OpenLibrary/Manual)
│   │   ├── ui/              # StickyNoteTracker
│   │   └── viewer3d/        # Three.js 3D Book canvas model
│   ├── lib/
│   │   ├── db/              # SQLite connection & repositories
│   │   ├── store/           # Zustand bookshelf state
│   │   └── utils/           # Procedural spine canvas & contrast generator
│   └── types/               # TypeScript interfaces
├── .env.example             # Optional environment variable template
├── .gitignore               # Strict gitignore rules (secrets & caches protected)
└── package.json
```

---

## 🔒 Security & Environment

BookVisualizer is built to run entirely locally without requiring any secret external API keys. No private credentials or API keys are stored in the codebase.
