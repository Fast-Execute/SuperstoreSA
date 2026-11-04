/**
 * POST /api/alibaba/sync
 *
 * Requires `Authorization: Bearer <SYNC_API_KEY>`. If SYNC_API_KEY is not configured the
 * endpoint refuses every request (fails closed).
 *
 * Actions:
 *   sync   - run one product sync pass (called hourly by .github/workflows/scheduled-sync.yml)
 *   import - import products from Alibaba by keyword
 *   start / stop - in-process timer; does NOT work on serverless hosting, prefer `sync`
 */

import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { syncEngine } from '@/lib/alibaba';

// A sync pass calls the supplier once per product, so give it more than the default time.
export const maxDuration = 60;

function isAuthorized(request: NextRequest, expected: string): boolean {
  const match = /^Bearer (.+)$/.exec(request.headers.get('authorization') || '');
  if (!match) {
    return false;
  }

  const provided = Buffer.from(match[1]);
  const wanted = Buffer.from(expected);
  return provided.length === wanted.length && timingSafeEqual(provided, wanted);
}

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.SYNC_API_KEY || '';

    if (!expected) {
      return NextResponse.json({ error: 'SYNC_API_KEY is not configured' }, { status: 503 });
    }

    if (!isAuthorized(request, expected)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body.action === 'sync') {
      const job = await syncEngine.runOnce();
      const ok = job.status === 'completed';
      return NextResponse.json({ success: ok, job }, { status: ok ? 200 : 500 });
    }

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
      { error: 'Invalid action', available: ['sync', 'import', 'start', 'stop'] },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
