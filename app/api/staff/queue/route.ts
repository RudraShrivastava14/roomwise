import { NextResponse } from 'next/server';
import { staffSnapshot } from '@/lib/server/housekeeping';
import { handler } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/** GET /api/staff/queue — rooms, prioritized turnover queue, and dispatch log. */
export const GET = handler(async () => NextResponse.json(await staffSnapshot()), { staffOnly: true });
