'use client';

import React, { useState } from 'react';
import { KeyRound, Loader2, LogIn } from 'lucide-react';

interface StaffLoginProps {
  onLogin: (password: string) => Promise<void>;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onLogin(password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div className="space-y-2 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-indigo-400" />
        </div>
        <h1 className="text-xl font-extrabold text-white">Housekeeping staff login</h1>
        <p className="text-xs text-slate-400">
          The turnover queue shows guest names and arrival times, so it is staff-only.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-300 mb-1">
            Staff password
          </label>
          <input
            id="staff-password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          <span>Sign in</span>
        </button>
      </form>

      <p className="text-[11px] text-slate-500 text-center">
        Reviewing the demo? The staff password is in the project README.
      </p>
    </div>
  );
};
