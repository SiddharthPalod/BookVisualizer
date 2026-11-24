import { NextRequest, NextResponse } from 'next/server';
import { BookRepository } from '@/lib/db/repositories/book.repository';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = BookRepository.getById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: book });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updatedBook = BookRepository.update(params.id, body, {
      status: body.status,
      rating: body.rating,
      notes: body.notes,
      dateCompleted: body.dateCompleted,
    });

    if (!updatedBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedBook });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = BookRepository.delete(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
