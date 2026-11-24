import { NextRequest, NextResponse } from 'next/server';
import { ShelfRepository } from '@/lib/db/repositories/shelf.repository';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { positions } = body;

    if (!Array.isArray(positions)) {
      return NextResponse.json({ error: 'Positions array is required' }, { status: 400 });
    }

    ShelfRepository.updatePositions(positions);

    const updatedShelves = ShelfRepository.getAllWithBooks();
    return NextResponse.json({ success: true, data: updatedShelves });
  } catch (error: any) {
    console.error('Error reordering shelves:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
