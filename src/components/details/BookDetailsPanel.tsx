'use client';

import React, { useState, useEffect } from 'react';
import { BookWithDetails, ReadingStatus } from '@/types';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';
import { clearSpineCache } from '@/lib/utils/spine-generator';
import {
  X,
  Star,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  Bookmark,
  Save,
  Check,
  Pencil,
  RotateCcw,
  Palette,
  Pipette,
} from 'lucide-react';

const SPINE_COLOR_PRESETS = [
  { name: 'Manson Orange', color: '#ea580c' },
  { name: 'Vibrant Amber', color: '#d97706' },
  { name: 'Terracotta', color: '#c2410c' },
  { name: 'Classic Leather', color: '#78350f' },
  { name: 'Crimson Wine', color: '#831843' },
  { name: 'Forest Emerald', color: '#14532d' },
  { name: 'Sapphire Navy', color: '#1e3a8a' },
  { name: 'Royal Purple', color: '#581c87' },
  { name: 'Slate Gray', color: '#334155' },
  { name: 'Midnight Charcoal', color: '#18181b' },
];

interface BookDetailsPanelProps {
  book: BookWithDetails;
}

export function BookDetailsPanel({ book }: BookDetailsPanelProps) {
  const { closeDetails, updateBookInState, deleteBookInState, fetchShelves } = useBookshelfStore();

  const [status, setStatus] = useState<ReadingStatus>(book.status || 'completed');
  const [rating, setRating] = useState<number>(book.rating || 5);
  const [notes, setNotes] = useState<string>(book.notes || '');

  // Edit mode fields
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title || '');
  const [editAuthor, setEditAuthor] = useState(book.author || '');
  const [editGenre, setEditGenre] = useState(book.genre || '');
  const [editPageCount, setEditPageCount] = useState<number | string>(book.pageCount || 300);
  const [editDescription, setEditDescription] = useState(book.description || '');
  const [editSpineColor, setEditSpineColor] = useState(book.spineColor || '#ea580c');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setStatus(book.status || 'completed');
    setRating(book.rating || 5);
    setNotes(book.notes || '');
    setEditTitle(book.title || '');
    setEditAuthor(book.author || '');
    setEditGenre(book.genre || '');
    setEditPageCount(book.pageCount || 300);
    setEditDescription(book.description || '');
    setEditSpineColor(book.spineColor || '#ea580c');
  }, [book]);

  const handleCancelEdit = () => {
    setEditTitle(book.title || '');
    setEditAuthor(book.author || '');
    setEditGenre(book.genre || '');
    setEditPageCount(book.pageCount || 300);
    setEditDescription(book.description || '');
    setEditSpineColor(book.spineColor || '#ea580c');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        status,
        rating,
        notes,
        dateCompleted: status === 'completed' ? new Date().toISOString() : undefined,
      };

      if (isEditing) {
        payload.title = editTitle.trim() || book.title;
        payload.author = editAuthor.trim() || book.author;
        payload.genre = editGenre.trim() || book.genre;
        payload.pageCount = editPageCount ? Number(editPageCount) : book.pageCount;
        payload.description = editDescription.trim();
        payload.spineColor = editSpineColor;
      }

      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        // Clear cached canvas texture so both shelf spine & 3D model re-render with updated text
        clearSpineCache(book.id);
        updateBookInState(data.data);
        await fetchShelves();
        setSavedSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to update book details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove "${book.title}" from your bookshelf?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
      if (res.ok) {
        deleteBookInState(book.id);
      }
    } catch (err) {
      console.error('Failed to delete book:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#0c161f]/94 border border-slate-600/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col p-6 sm:p-8 backdrop-blur-2xl text-slate-100 max-h-[86vh]">
      {/* Ornate Inner Double Frame & Corner Accents */}
      <div className="absolute inset-2 pointer-events-none border border-slate-500/25 rounded-xl z-0" />
      
      {/* Corner Bracket Flourishes */}
      <div className="absolute top-3.5 left-3.5 w-3 h-3 border-t-2 border-l-2 border-slate-400/80 pointer-events-none z-10" />
      <div className="absolute top-3.5 right-3.5 w-3 h-3 border-t-2 border-r-2 border-slate-400/80 pointer-events-none z-10" />
      <div className="absolute bottom-3.5 left-3.5 w-3 h-3 border-b-2 border-l-2 border-slate-400/80 pointer-events-none z-10" />
      <div className="absolute bottom-3.5 right-3.5 w-3 h-3 border-b-2 border-r-2 border-slate-400/80 pointer-events-none z-10" />

      {/* Top Header Buttons: Edit Mode Toggle & Close Button */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
          className={`p-1.5 rounded-full border transition-all ${
            isEditing
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
              : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-amber-300'
          }`}
          title={isEditing ? 'Cancel editing' : 'Edit book details'}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={closeDetails}
          className="p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
          title="Return to Bookshelf"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Content with Clean Custom Scrollbar */}
      <div className="relative z-10 overflow-y-auto pr-1 flex-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.3)_transparent]">
        {isEditing ? (
          /* ================= EDIT MODE ================= */
          <div className="space-y-4 pt-1 pb-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-3">
              <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                Edit Book Details
              </span>
              <span className="text-[10px] text-slate-400">Updates database immediately (WAL)</span>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Book Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Author */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Author
              </label>
              <input
                type="text"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                placeholder="Author name"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Genre & Page Count */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Genre
                </label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  placeholder="e.g. Finance, Habits"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs text-amber-200 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Pages
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={editPageCount}
                  onChange={(e) => setEditPageCount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 320"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Synopsis / Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Description / Synopsis
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Brief synopsis..."
                className="w-full p-2.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
            </div>

            {/* Spine / Column Color Picker */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-amber-400" />
                  Spine / Column Color
                </label>
                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-xs"
                    style={{ backgroundColor: editSpineColor }}
                  />
                  <span className="text-[10px] font-mono text-amber-200 uppercase">{editSpineColor}</span>
                </div>
              </div>

              {/* Preset Swatches */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {SPINE_COLOR_PRESETS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setEditSpineColor(p.color)}
                    className={`w-6 h-6 rounded-full border transition-all hover:scale-115 ${
                      editSpineColor.toLowerCase() === p.color.toLowerCase()
                        ? 'ring-2 ring-amber-400 scale-110 border-white'
                        : 'border-slate-600/80 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                  />
                ))}

                {/* Custom Native Color Picker */}
                <label
                  className="relative flex items-center justify-center w-6 h-6 rounded-full border border-slate-600 hover:border-amber-400 cursor-pointer overflow-hidden bg-slate-800 transition-transform hover:scale-115"
                  title="Pick any custom color"
                >
                  <input
                    type="color"
                    value={editSpineColor}
                    onChange={(e) => setEditSpineColor(e.target.value)}
                    className="absolute -inset-2 opacity-0 cursor-pointer w-10 h-10"
                  />
                  <Pipette className="w-3 h-3 text-amber-300" />
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* ================= VIEW MODE ================= */
          <>
            {/* Title Header with Ornate Dividers */}
            <div className="text-center pt-2 pb-4">
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-slate-400/60 to-slate-400" />
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-slate-100 uppercase">
                  {book.title}
                </h1>
                <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-l from-transparent via-slate-400/60 to-slate-400" />
              </div>
            </div>

            {/* Metadata in Clean Spaced Uppercase */}
            <div className="space-y-1.5 text-xs sm:text-sm text-center border-b border-slate-700/60 pb-4 mb-4">
              <div className="tracking-widest text-slate-300 font-medium">
                <span className="text-slate-400/80 mr-1.5">AUTHOR:</span>
                <span className="text-white font-semibold">{book.author.toUpperCase()}</span>
              </div>
              <div className="tracking-widest text-slate-300 font-medium">
                <span className="text-slate-400/80 mr-1.5">GENRE:</span>
                <span className="text-amber-200/90 font-semibold">
                  {(book.genre || 'GENERAL PHILOSOPHY & MASTERY').toUpperCase()}
                </span>
              </div>
              {book.pageCount && (
                <div className="tracking-widest text-slate-400 text-xs">
                  <span>{book.pageCount} PAGES</span>
                </div>
              )}
            </div>

            {/* Synopsis / Description */}
            {book.description && (
              <div className="mb-5">
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300/90 font-serif italic text-center px-2">
                  &ldquo;{book.description}&rdquo;
                </p>
              </div>
            )}
          </>
        )}

        {/* Reading Status Selector */}
        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">
            Reading Status
          </label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setStatus('completed')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                status === 'completed'
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </button>
            <button
              type="button"
              onClick={() => setStatus('currently_reading')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                status === 'currently_reading'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Reading
            </button>
            <button
              type="button"
              onClick={() => setStatus('want_to_read')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                status === 'want_to_read'
                  ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-sm'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Plan to Read
            </button>
          </div>
        </div>

        {/* Star Rating */}
        <div className="mt-4 flex flex-col items-center">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Personal Rating
          </label>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 text-slate-600 hover:text-amber-400 transition-colors focus:outline-none"
              >
                <Star
                  className={`w-5 h-5 transition-transform hover:scale-115 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Personal Notes */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
            Personal Takeaways & Reflections
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Write memorable quotes, lessons, or notes..."
            className="w-full p-2.5 rounded-lg bg-slate-950/70 border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {book.sourceUrl && (
            <a
              href={book.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-amber-300/80 hover:text-amber-200 underline underline-offset-4"
            >
              <span>Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 text-[11px] text-red-400/80 hover:text-red-300 transition-colors ml-2"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-md transition-all hover:scale-105"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-950" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
