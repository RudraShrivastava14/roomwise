'use client';

import React, { useState } from 'react';
import { Room, Booking } from '../lib/types';
import { X, CheckCircle2, ShieldCheck, Calendar, User, Mail, CreditCard, Sparkles, Building, Zap } from 'lucide-react';

interface BookingModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (
    roomId: string,
    guestName: string,
    guestEmail: string,
    checkInDate: string,
    checkOutDate: string,
    isEarlyCheckIn: boolean
  ) => Booking | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  room,
  isOpen,
  onClose,
  onConfirmBooking,
}) => {
  const [guestName, setGuestName] = useState('Ananya Sharma');
  const [guestEmail, setGuestEmail] = useState('ananya.sharma@example.com');
  const [checkInDate, setCheckInDate] = useState('2026-09-27');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-29');
  const [isEarlyCheckIn, setIsEarlyCheckIn] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  if (!isOpen || !room) return null;

  const earlyCheckInFee = 1000;
  const grandTotal = room.pricePerNight + (isEarlyCheckIn ? earlyCheckInFee : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onConfirmBooking(room.id, guestName, guestEmail, checkInDate, checkOutDate, isEarlyCheckIn);
    if (result) {
      setConfirmedBooking(result);
    }
  };

  const handleDone = () => {
    setConfirmedBooking(null);
    setIsEarlyCheckIn(false);
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
                  <span className="text-slate-400">Scheduled Check-In:</span>
                  <span className="font-semibold text-slate-200">
                    {confirmedBooking.checkInDate} at <strong>{confirmedBooking.scheduledCheckInTime}</strong>
                  </span>
                </div>
                {confirmedBooking.isEarlyCheckIn && (
                  <div className="flex justify-between text-amber-300 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Early Check-In Add-On:</span>
                    </span>
                    <span>+₹{confirmedBooking.earlyCheckInFee.toLocaleString('en-IN')} (12:00 PM)</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Total Price Paid:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ₹{confirmedBooking.totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-sky-950/40 border border-sky-500/30 p-3 rounded-xl text-left text-xs text-sky-300 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Operational Dispatch:</strong> Room {room.roomNumber} has been pushed to the housekeeping queue with {confirmedBooking.isEarlyCheckIn ? 'URGENT priority' : 'high priority'} and automated SMS sent to staff.
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
                  <div className="text-xs text-slate-400">Base Nightly Rate</div>
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
                    +₹1,000
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Guarantees room readiness at 12:00 PM instead of standard 2:00 PM. Automatically dispatches URGENT housekeeping priority.
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
                    Enable Early Check-In for ₹1,000 extra
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Check-In Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={checkInDate}
                      onChange={e => setCheckInDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Check-Out Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={checkOutDate}
                      onChange={e => setCheckOutDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">Total Checkout Amount:</span>
                <span className="text-lg font-black text-emerald-400">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Lock-in Guarantee Notice */}
              <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Guarantee: You will receive Room {room.roomNumber} upon check-in ({isEarlyCheckIn ? '12:00 PM' : '2:00 PM'}).</span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Confirm & Reserve Room {room.roomNumber} (₹{grandTotal.toLocaleString('en-IN')})</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
