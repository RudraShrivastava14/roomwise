'use client';

import React from 'react';
import { Sparkles, ClipboardList, User, Hotel } from 'lucide-react';

interface NavbarProps {
  activeMode: 'GUEST' | 'STAFF';
  onModeChange: (mode: 'GUEST' | 'STAFF') => void;
  comparedCount: number;
  onOpenCompare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  onModeChange,
  comparedCount,
  onOpenCompare,
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
