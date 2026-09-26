import { NextResponse } from 'next/server';
import { currentStaff } from '@/lib/server/auth';
import { handler } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => NextResponse.json({ staff: await currentStaff() }));
