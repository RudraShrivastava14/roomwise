'use client';

import React from 'react';
import { Sparkles, ClipboardList, User, Hotel, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { GuestSession } from '../lib/types';

interface NavbarProps {
  activeMode: 'GUEST' | 'STAFF';
  onModeChange: (mode: 'GUEST' | 'STAFF') => void;
  comparedCount: number;
  onOpenCompare: () => void;
  guest: GuestSession | null | undefined;
  onGuestSignIn: () => void;
  onGuestSignOut: () => void;
  onOpenMyBookings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  onModeChange,
  comparedCount,
  onOpenCompare,
  guest,
  onGuestSignIn,
  onGuestSignOut,
  onOpenMyBookings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onModeChange('GUEST')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  RoomWise
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Micro-SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400">Grand Azure Resort & Spa</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => onModeChange('GUEST')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMode === 'GUEST'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Guest Room Selector</span>
            </button>

            <button
              onClick={() => onModeChange('STAFF')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMode === 'STAFF'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Housekeeping Ops</span>
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-3">
            {activeMode === 'GUEST' && guest && (
              <>
                <button
                  onClick={onOpenMyBookings}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-medium"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">My bookings</span>
                </button>
                <span className="hidden md:inline text-xs text-slate-400">Hi, {guest.name.split(' ')[0]}</span>
                <button onClick={onGuestSignOut} title="Sign out" className="text-slate-400 hover:text-white p-2 rounded-lg">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {activeMode === 'GUEST' && guest === null && (
              <button
                onClick={onGuestSignIn}
                className="flex items-center space-x-1.5 bg-sky-500 hover:bg-sky-400 text-white px-3 py-2 rounded-lg text-xs font-bold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Guest sign in</span>
              </button>
            )}
            {activeMode === 'GUEST' && comparedCount > 0 && (
              <button
                onClick={onOpenCompare}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all animate-pulse"
              >
                <Sparkles className="w-4 h-4" />
                <span>Compare Rooms ({comparedCount})</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
