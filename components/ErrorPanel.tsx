'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="bg-red-950/30 border border-red-500/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-start space-x-3">
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-red-200">Couldn&apos;t load the latest data</p>
        <p className="text-xs text-red-300/80">{message}</p>
      </div>
    </div>
    <button
      onClick={onRetry}
      className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      <span>Try again</span>
    </button>
  </div>
);
