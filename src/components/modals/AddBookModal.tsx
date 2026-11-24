'use client';

import React, { useState, useMemo } from 'react';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { MetadataLookupResult } from '@/types';
import {
  X,
  Search,
  Upload,
  Globe,
  Loader2,
  Check,
  BookPlus,
  Sparkles,
} from 'lucide-react';

const STANDARD_SHELVES = [
  { id: 'bay-1-tier-1', name: 'Upper Shelf 1 (Wide)', capacity: 8 },
  { id: 'bay-2-tier-1', name: 'Upper Shelf 2 (Compact)', capacity: 5 },
  { id: 'bay-3-tier-1', name: 'Upper Shelf 3 (Standard)', capacity: 6 },
  { id: 'bay-1-tier-2', name: 'Lower Shelf 1 (Compact)', capacity: 5 },
  { id: 'bay-2-tier-2', name: 'Lower Shelf 2 (Wide)', capacity: 8 },
  { id: 'bay-3-tier-2', name: 'Lower Shelf 3 (Standard)', capacity: 6 },
];

export function AddBookModal() {
  const { isAddModalOpen, closeAddModal, closeDetails, targetSlot, shelves, fetchShelves } =
    useBookshelfStore();

  const [activeTab, setActiveTab] = useState<'online' | 'manual'>('online');

  // Online Import State
  const [lookupInput, setLookupInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<MetadataLookupResult | null>(null);
  const [lookupError, setLookupError] = useState('');

  // Clean shelves matching the staggered bookshelf structure
  const availableShelves = useMemo(() => {
    return STANDARD_SHELVES.map((std) => {
      const match = shelves.find((s) => s.id === std.id);
      const count = match?.books ? match.books.length : 0;
      return {
        id: std.id,
        name: std.name,
        capacity: std.capacity,
        booksCount: count,
        isFull: count >= std.capacity,
      };
    });
  }, [shelves]);

  // Target shelf: syncs immediately with targetSlot or defaults to first available shelf
  const [selectedShelfId, setSelectedShelfId] = useState<string>(
    targetSlot?.shelfId || 'bay-1-tier-1'
  );

  // Synchronously update selectedShelfId whenever targetSlot changes or modal opens
  const [prevTargetShelfId, setPrevTargetShelfId] = useState<string | null>(null);
  const currentTargetShelfId = targetSlot?.shelfId || null;

  if (currentTargetShelfId !== prevTargetShelfId) {
    setPrevTargetShelfId(currentTargetShelfId);
    if (currentTargetShelfId) {
      setSelectedShelfId(currentTargetShelfId);
    }
  }

  // Manual Creation State
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualGenre, setManualGenre] = useState('Self-Improvement');
  const [manualPages, setManualPages] = useState(300);
  const [manualCoverBase64, setManualCoverBase64] = useState('');
  const [selectedUnsplashTheme, setSelectedUnsplashTheme] = useState<string>('habits');

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddModalOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;

    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await fetch('/api/books/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: lookupInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setLookupResult(data.data);
      } else {
        setLookupError(data.error || 'Could not find book metadata.');
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      setLookupError('Network error while looking up book metadata.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualCoverBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOnlineBook = async () => {
    if (!lookupResult) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lookupResult.title,
          author: lookupResult.author,
          description: lookupResult.description,
          genre: lookupResult.genre || 'General',
          isbn: lookupResult.isbn,
          asin: lookupResult.asin,
          pageCount: lookupResult.pageCount || 300,
          coverUrl: lookupResult.coverUrl,
          shelfId: selectedShelfId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchShelves();
        closeAddModal();
        closeDetails();
        setLookupResult(null);
        setLookupInput('');
      } else {
        setLookupError(data.error || 'Failed to save book to shelf');
      }
    } catch (err) {
      console.error('Error saving book:', err);
      setLookupError('Server error while saving book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualAuthor.trim()) return;

    setIsSubmitting(true);
    try {
      const unsplashMap: Record<string, string> = {
        habits: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        productivity: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
        business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        philosophy: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
        psychology: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
        technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      };

      const coverUrl = !manualCoverBase64 ? unsplashMap[selectedUnsplashTheme] : undefined;

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          author: manualAuthor.trim(),
          genre: manualGenre,
          pageCount: manualPages,
          coverBase64: manualCoverBase64 || undefined,
          coverUrl,
          shelfId: selectedShelfId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchShelves();
        closeAddModal();
        closeDetails();
        setManualTitle('');
        setManualAuthor('');
        setManualCoverBase64('');
      }
    } catch (err) {
      console.error('Error adding manual book:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      {/* Modal Container with Ornate Beauty Matching Book Details Panel */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[#121921]/96 border border-amber-600/35 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl text-stone-100">
        
        {/* Ornate Inner Double Frame & Corner Bracket Flourishes */}
        <div className="absolute inset-2 pointer-events-none border border-amber-500/20 rounded-xl z-0" />
        <div className="absolute top-3.5 left-3.5 w-3 h-3 border-t-2 border-l-2 border-amber-400/80 pointer-events-none z-10" />
        <div className="absolute top-3.5 right-3.5 w-3 h-3 border-t-2 border-r-2 border-amber-400/80 pointer-events-none z-10" />
        <div className="absolute bottom-3.5 left-3.5 w-3 h-3 border-b-2 border-l-2 border-amber-400/80 pointer-events-none z-10" />
        <div className="absolute bottom-3.5 right-3.5 w-3 h-3 border-b-2 border-r-2 border-amber-400/80 pointer-events-none z-10" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-amber-900/30 bg-black/25">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
                Add Book to Bookshelf
              </h2>
              <p className="text-xs text-amber-200/60 font-sans">
                Staggered architectural shelving • Offline persistent 3D spine
              </p>
            </div>
          </div>
          <button
            onClick={closeAddModal}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-amber-500/15 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 flex border-b border-amber-900/25 px-6 bg-black/40">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-all ${
              activeTab === 'online'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Import via Amazon / Link / ASIN
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-all ${
              activeTab === 'manual'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Manual Entry & Unsplash
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6 overflow-y-auto flex-1">
          {/* Target Shelf Selector */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-black/35 border border-amber-900/30">
            <div>
              <span className="text-xs font-medium text-amber-200/90 block">Target Shelf:</span>
              <span className="text-[10px] text-stone-400">Select shelf destination for this book</span>
            </div>
            <select
              value={selectedShelfId}
              onChange={(e) => setSelectedShelfId(e.target.value)}
              className="bg-stone-900 border border-stone-700/80 text-xs text-amber-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400 font-medium"
            >
              {availableShelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.booksCount}/{s.capacity} books{s.isFull ? ' • Full' : ''})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'online' ? (
            <div className="space-y-4">
              <form onSubmit={handleLookup} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Amazon link (e.g. Atomic Habits), ASIN, or Title..."
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/45 border border-stone-700/60 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLookingUp || !lookupInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  {isLookingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Lookup
                </button>
              </form>

              {lookupError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {lookupError}
                </div>
              )}

              {/* Preview Card */}
              {lookupResult && (
                <div className="mt-4 p-4 rounded-xl bg-black/40 border border-amber-500/30 flex gap-4 animate-fade-in">
                  {lookupResult.coverUrl && (
                    <img
                      src={lookupResult.coverUrl}
                      alt={lookupResult.title}
                      className="w-20 h-28 object-cover rounded-lg shadow-md border border-stone-700 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Found via {lookupResult.source}
                        </span>
                        {lookupResult.pageCount && (
                          <span className="text-[11px] text-stone-400">
                            {lookupResult.pageCount} pages
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-base text-amber-100 mt-1.5 leading-snug">
                        {lookupResult.title}
                      </h3>
                      <p className="text-xs text-amber-300/90 font-medium">by {lookupResult.author}</p>
                      {lookupResult.description && (
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-1">
                          {lookupResult.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddOnlineBook}
                      disabled={isSubmitting}
                      className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Add to Shelf & Persist Locally
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Tab */
            <form onSubmit={handleAddManualBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. Zero to One"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black/45 border border-stone-700/60 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300">Author *</label>
                  <input
                    type="text"
                    required
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                    placeholder="e.g. Peter Thiel"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black/45 border border-stone-700/60 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300">Genre</label>
                  <select
                    value={manualGenre}
                    onChange={(e) => setManualGenre(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black/45 border border-stone-700/60 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Self-Improvement">Self-Improvement</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Business">Business</option>
                    <option value="Psychology">Psychology</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Software">Software & Tech</option>
                    <option value="Fiction">Fiction</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300">Page Count</label>
                  <input
                    type="number"
                    min="20"
                    max="2000"
                    value={manualPages}
                    onChange={(e) => setManualPages(parseInt(e.target.value, 10) || 250)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black/45 border border-stone-700/60 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Cover Selection */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                  Book Cover Image
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-200 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {manualCoverBase64 && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> File selected
                    </span>
                  )}
                </div>

                {/* Unsplash Theme Options */}
                {!manualCoverBase64 && (
                  <div className="mt-3">
                    <span className="text-[11px] text-stone-400 block mb-1">
                      Or select an Unsplash aesthetic theme:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'habits', label: 'Habits' },
                        { id: 'productivity', label: 'Productivity' },
                        { id: 'business', label: 'Business' },
                        { id: 'psychology', label: 'Psychology' },
                        { id: 'philosophy', label: 'Philosophy' },
                        { id: 'technology', label: 'Tech' },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedUnsplashTheme(theme.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                            selectedUnsplashTheme === theme.id
                              ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                              : 'bg-black/40 border-stone-800 text-stone-400 hover:text-stone-300'
                          }`}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !manualTitle.trim()}
                className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Create & Add to Bookshelf
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
