'use client';

import React, { useState } from 'react';
import { Room, Booking, StayDates } from '../lib/types';
import { BookingRequest } from '../lib/store';
import { EARLY_CHECKIN_FEE, quote } from '../lib/booking-rules';
import { formatPropertyTime } from '../lib/time';
import { X, CheckCircle2, ShieldCheck, Calendar, User, Mail, CreditCard, Sparkles, Building, Zap, Loader2, AlertTriangle } from 'lucide-react';

interface BookingModalProps {
  room: Room | null;
  stay: StayDates;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (req: BookingRequest) => Promise<Booking>;
}

const formatDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const BookingModal: React.FC<BookingModalProps> = ({
  room,
  stay,
  isOpen,
  onClose,
  onConfirmBooking,
}) => {
  // Prefilled so reviewers can click straight through the demo.
  const [guestName, setGuestName] = useState('Ananya Sharma');
  const [guestEmail, setGuestEmail] = useState('ananya.sharma@example.com');
  const [isEarlyCheckIn, setIsEarlyCheckIn] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !room) return null;

  const { nights, totalPrice: grandTotal } = quote(room.pricePerNight, stay.checkIn, stay.checkOut, isEarlyCheckIn);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      setConfirmedBooking(await onConfirmBooking({ roomId: room.id, guestName, guestEmail, isEarlyCheckIn }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setConfirmedBooking(null);
    setIsEarlyCheckIn(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {confirmedBooking ? 'Booking Confirmed!' : `Reserve Physical Room ${room.roomNumber}`}
              </h3>
              <p className="text-xs text-slate-400">
                {confirmedBooking
                  ? 'Your exact room reservation is locked in.'
                  : `Floor ${room.floor} • ${room.viewType} View • ${room.category}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleDone}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {confirmedBooking ? (
            <div className="p-6 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-white">Reservation Confirmed!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Booking Reference: <span className="font-mono text-sky-400">{confirmedBooking.id}</span>
                </p>
              </div>

              {/* Receipt Box */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Target Physical Unit:</span>
                  <span className="font-bold text-sky-400 text-sm">Room {room.roomNumber} (Floor {room.floor})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guest Name:</span>
                  <span className="font-semibold text-slate-200">{confirmedBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stay:</span>
                  <span className="font-semibold text-slate-200">
                    {formatDate(confirmedBooking.checkInDate)} → {formatDate(confirmedBooking.checkOutDate)} ({confirmedBooking.nights} night{confirmedBooking.nights === 1 ? '' : 's'})
                  </span>
                </div>
                {confirmedBooking.isEarlyCheckIn && (
                  <div className="flex justify-between text-amber-300 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Early Check-In Add-On:</span>
                    </span>
                    <span>+₹{confirmedBooking.earlyCheckInFee.toLocaleString('en-IN')} (room ready by 12:00 PM)</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Total (pay at hotel):</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ₹{confirmedBooking.totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-sky-950/40 border border-sky-500/30 p-3 rounded-xl text-left text-xs text-sky-300 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <span>
                  <strong>What happens next:</strong> housekeeping now sees Room {room.roomNumber} with your expected arrival ({formatPropertyTime(confirmedBooking.arrivalAt)} on {formatDate(confirmedBooking.checkInDate)}), and it is prioritized by how little time is left to prepare it.
                </span>
              </div>

              <button
                onClick={handleDone}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all"
              >
                Done & Return to Room Explorer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Summary Banner */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Selected Physical Unit</div>
                  <div className="text-lg font-bold text-white">Room {room.roomNumber} ({room.viewType} View)</div>
                  <div className="text-xs text-slate-400">
                    {room.areaSqM} m² • {room.balcony ? 'Balcony' : 'No Balcony'} • {room.bathtub ? 'Bathtub' : 'Shower'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Per night</div>
                  <div className="text-lg font-extrabold text-emerald-400">
                    ₹{room.pricePerNight.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Early Check-In Monetization Switch */}
              <div className="bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/40 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Add VIP Early Check-In (12:00 PM)</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    +₹{EARLY_CHECKIN_FEE.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Room ready at 12:00 PM instead of the standard 2:00 PM. Housekeeping sees the earlier arrival, which moves this room up their queue.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="earlyCheckIn"
                    checked={isEarlyCheckIn}
                    onChange={e => setIsEarlyCheckIn(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-500 bg-slate-950 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="earlyCheckIn" className="text-xs font-bold text-amber-300 cursor-pointer">
                    Add early check-in
                  </label>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {formatDate(stay.checkIn)} → {formatDate(stay.checkOut)} · {nights} night{nights === 1 ? '' : 's'}
                  </span>
                  <span className="text-slate-500">(change dates above the floor plan)</span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">
                  ₹{room.pricePerNight.toLocaleString('en-IN')} × {nights} night{nights === 1 ? '' : 's'}
                  {isEarlyCheckIn ? ` + ₹${EARLY_CHECKIN_FEE.toLocaleString('en-IN')} early check-in` : ''}
                </span>
                <span className="text-lg font-black text-emerald-400">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Lock-in Guarantee Notice */}
              <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>You get Room {room.roomNumber} specifically — not &quot;a {room.category}&quot;. Ready from {isEarlyCheckIn ? '12:00 PM' : '2:00 PM'}.</span>
              </div>

              {room.isBooked && (
                <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Room {room.roomNumber} is already booked for at least one of these nights. Try other dates or compare similar rooms.</span>
                </p>
              )}

              {error && (
                <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || room.isBooked}
                className="w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                <span>Reserve Room {room.roomNumber} (₹{grandTotal.toLocaleString('en-IN')})</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
