import { NextResponse } from 'next/server';
import { ShelfRepository } from '@/lib/db/repositories/shelf.repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shelves = ShelfRepository.getAllWithBooks();
    return NextResponse.json({ success: true, data: shelves });
  } catch (error: any) {
    console.error('Error fetching shelves:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
