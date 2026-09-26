import { NextResponse } from 'next/server';
import { isStaffRequest } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ staff: isStaffRequest() });
}
