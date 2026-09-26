'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2, X, Zap } from 'lucide-react';
import { Booking, GuestSession } from '../lib/types';
import { formatPropertyTime } from '../lib/time';

interface MyBookingsProps {
  isOpen: boolean;
  guest: GuestSession;
  bookings: Booking[];
  onLoad: () => Promise<void>;
  onClose: () => void;
}

const formatDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const MyBookings: React.FC<MyBookingsProps> = ({ isOpen, guest, bookings, onLoad, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    onLoad()
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [isOpen, onLoad]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-white">My bookings</h3>
          <p className="text-xs text-slate-400">{guest.name} · {guest.email}</p>
        </div>

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading…</span>
          </div>
        )}
        {error && <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}
        {!loading && !error && bookings.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">No bookings yet. Pick a room on the floor plan to book one.</p>
        )}

        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white">Room {b.roomNumber}</span>
                <span className="font-bold text-emerald-400">₹{b.totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} · {b.nights} night{b.nights === 1 ? '' : 's'}
                </span>
              </div>
              <div className="text-slate-400">
                Room ready from {formatPropertyTime(b.arrivalAt)}
                {b.isEarlyCheckIn && (
                  <span className="ml-2 inline-flex items-center text-amber-300">
                    <Zap className="w-3 h-3 mr-0.5" /> early check-in
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Ref {b.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
