import { NextResponse } from 'next/server';
import { currentGuest } from '@/lib/server/guest-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ guest: currentGuest() });
}
