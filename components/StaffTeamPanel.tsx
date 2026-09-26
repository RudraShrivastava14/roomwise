'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react';
import { StaffMember } from '../lib/types';

interface StaffTeamPanelProps {
  team: StaffMember[];
  onLoad: () => Promise<void>;
  onAdd: (member: { username: string; displayName: string; password: string }) => Promise<void>;
  onRemove: (username: string) => Promise<void>;
}

const inputClass =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500';

/** Admin-only: create logins for housekeepers and hand them over in person. No email involved. */
export const StaffTeamPanel: React.FC<StaffTeamPanelProps> = ({ team, onLoad, onAdd, onRemove }) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    onLoad().catch(err => setError((err as Error).message));
  }, [onLoad]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const login = username.trim().toLowerCase();
    run(async () => {
      await onAdd({ username: login, displayName, password });
      setUsername('');
      setDisplayName('');
      setPassword('');
    }, `Created "${login}". Give them this username and password.`);
  };

  const handleRemove = (member: StaffMember) => {
    if (!window.confirm(`Remove ${member.displayName} (${member.username})? They will be signed out immediately.`)) return;
    run(() => onRemove(member.username), `Removed ${member.displayName}.`);
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in">
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Team accounts</h3>
        <span className="text-xs text-slate-400">— only you (admin) can see this</span>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label htmlFor="new-name" className="block text-[11px] text-slate-400 mb-1">Name</label>
          <input id="new-name" required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Sunita P." className={inputClass} />
        </div>
        <div>
          <label htmlFor="new-username" className="block text-[11px] text-slate-400 mb-1">Username</label>
          <input id="new-username" required autoCapitalize="none" value={username} onChange={e => setUsername(e.target.value)} placeholder="sunita" className={inputClass} />
        </div>
        <div>
          <label htmlFor="new-password" className="block text-[11px] text-slate-400 mb-1">Password (min 8)</label>
          <input id="new-password" required type="text" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center space-x-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>Add staff member</span>
        </button>
      </form>

      {error && <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}
      {notice && <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">{notice}</p>}

      <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 text-xs">
          <span className="text-slate-200 font-semibold">Admin <span className="text-slate-500 font-normal">· admin</span></span>
          <span className="text-[10px] uppercase tracking-wider text-indigo-300">Owner</span>
        </div>
        {team.map(member => (
          <div key={member.username} className="flex items-center justify-between px-4 py-2.5 text-xs">
            <span className="text-slate-200 font-semibold">
              {member.displayName} <span className="text-slate-500 font-normal">· {member.username}</span>
            </span>
            <button
              onClick={() => handleRemove(member)}
              disabled={busy}
              title={`Remove ${member.displayName}`}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {team.length === 0 && <p className="px-4 py-3 text-xs text-slate-500">No staff accounts yet.</p>}
      </div>
    </div>
  );
};
