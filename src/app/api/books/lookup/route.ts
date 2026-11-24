import { NextRequest, NextResponse } from 'next/server';
import { MetadataService } from '@/lib/metadata/metadata-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const result = await MetadataService.lookup(input);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Metadata lookup failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lookup book metadata' },
      { status: 500 }
    );
  }
}
