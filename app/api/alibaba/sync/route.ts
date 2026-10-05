/**
 * POST /api/alibaba/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncEngine } from '@/lib/alibaba';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') || '';
    const expected = process.env.SYNC_API_KEY || '';

    if (expected && !auth.includes(expected)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body.action === 'import') {
      const count = await syncEngine.importProducts({
        keyword: body.keyword || 'electronics',
        pageSize: body.pageSize || 50,
        markup: body.markup || 30,
      });

      return NextResponse.json({ success: true, productsImported: count });
    }

    if (body.action === 'start') {
      syncEngine.startSync();
      return NextResponse.json({ success: true, message: 'Sync engine started' });
    }

    if (body.action === 'stop') {
      syncEngine.stopSync();
      return NextResponse.json({ success: true, message: 'Sync engine stopped' });
    }

    return NextResponse.json(
      { error: 'Invalid action', available: ['import', 'start', 'stop'] },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
