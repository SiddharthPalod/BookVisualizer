import { NextRequest, NextResponse } from 'next/server';
import { BookRepository } from '@/lib/db/repositories/book.repository';
import { ShelfRepository } from '@/lib/db/repositories/shelf.repository';
import { AssetStorageService } from '@/lib/storage/asset-storage';
import { MetadataService } from '@/lib/metadata/metadata-service';
import { CreateBookInput, Book, ShelfPosition, ReadingRecord } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const books = BookRepository.getAllWithDetails();
    return NextResponse.json({ success: true, data: books });
  } catch (error: any) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateBookInput = await req.json();

    if (!body.title || !body.author || !body.shelfId) {
      return NextResponse.json(
        { error: 'Title, author, and shelfId are required' },
        { status: 400 }
      );
    }

    const bookId = `book-${crypto.randomUUID()}`;
    let localCoverPath = '';

    // Handle cover storage: remote download, base64, or fallback
    if (body.coverBase64) {
      localCoverPath = await AssetStorageService.saveCoverFromBase64(body.coverBase64, bookId);
    } else if (body.coverUrl) {
      localCoverPath = await AssetStorageService.saveCoverFromUrl(body.coverUrl, bookId);
    } else {
      localCoverPath = AssetStorageService.generateFallbackCover(body.title, body.author, bookId);
    }

    // Determine spine colors (use user provided color if present, else smart palette)
    const { spineColor: fallbackSpineColor, spineTextColor: fallbackTextColor } = MetadataService.generateSpinePalette(body.title);
    const spineColor = body.spineColor || fallbackSpineColor;
    const spineTextColor = body.spineTextColor || fallbackTextColor;

    // Ensure slot index is valid and appends properly even if shelf already has books
    const nextSlot = ShelfRepository.getNextAvailableSlot(body.shelfId);
    const slotIndex = (body.slotIndex !== undefined && body.slotIndex >= nextSlot) 
      ? body.slotIndex 
      : nextSlot;

    const book: Book = {
      id: bookId,
      title: body.title.trim(),
      author: body.author.trim(),
      description: body.description?.trim(),
      genre: body.genre?.trim() || 'General',
      isbn: body.isbn?.trim(),
      asin: body.asin?.trim(),
      pageCount: body.pageCount && body.pageCount > 0 ? body.pageCount : 250,
      sourceUrl: body.sourceUrl?.trim(),
      remoteCoverUrl: body.coverUrl,
      localCoverPath,
      spineColor,
      spineTextColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const position: ShelfPosition = {
      id: `pos-${crypto.randomUUID()}`,
      shelfId: body.shelfId,
      bookId,
      slotIndex,
    };

    const record: ReadingRecord = {
      id: `rec-${crypto.randomUUID()}`,
      bookId,
      status: body.status || 'completed',
      dateCompleted: body.status === 'completed' ? new Date().toISOString() : undefined,
      rating: body.rating,
      notes: body.notes?.trim(),
    };

    const createdBook = BookRepository.create(book, position, record);

    return NextResponse.json({ success: true, data: createdBook }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
