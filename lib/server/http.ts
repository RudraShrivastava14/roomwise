import 'server-only';
import { NextResponse } from 'next/server';
import { MongoServerSelectionError } from 'mongodb';
import { DatabaseNotConfiguredError } from './db';
import { isStaffRequest } from './auth';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wraps a route handler so every failure becomes a JSON error the UI can show,
 * instead of an HTML 500 page.
 */
export function handler<A extends unknown[]>(
  fn: (...args: A) => Promise<Response>,
  opts: { staffOnly?: boolean } = {}
) {
  return async (...args: A): Promise<Response> => {
    try {
      if (opts.staffOnly && !isStaffRequest()) {
        return jsonError(401, 'Staff login required');
      }
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.status, err.message);
      if (err instanceof DatabaseNotConfiguredError || err instanceof MongoServerSelectionError) {
        console.error('[db]', err);
        return jsonError(503, 'Database is unavailable. Please try again in a moment.');
      }
      console.error('[api]', err);
      return jsonError(500, 'Something went wrong on our side.');
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, 'Request body must be JSON');
  }
}
