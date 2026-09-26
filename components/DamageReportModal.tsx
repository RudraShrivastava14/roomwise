'use client';

import React, { useState } from 'react';
import { HousekeepingTask } from '../lib/types';
import { X, AlertTriangle, ShieldAlert, Send } from 'lucide-react';

interface DamageReportModalProps {
  task: HousekeepingTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (taskId: string, item: string, description: string, severity: 'MINOR' | 'MAJOR') => Promise<void>;
}

export const DamageReportModal: React.FC<DamageReportModalProps> = ({
  task,
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  const [item, setItem] = useState('Bathtub Faucet / Towels');
  const [description, setDescription] = useState('Deep stain on bath towels and leaking faucet handle.');
  const [severity, setSeverity] = useState<'MINOR' | 'MAJOR'>('MINOR');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitReport(task.id, item, description, severity);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Report Room Issue / Damage</h3>
              <p className="text-xs text-slate-400">Room {task.roomNumber} (Floor {task.floor})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Damaged Item / Equipment</label>
            <input
              type="text"
              required
              value={item}
              onChange={e => setItem(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Description & Notes</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSeverity('MINOR')}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  severity === 'MINOR'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Minor (Fixable quickly)
              </button>
              <button
                type="button"
                onClick={() => setSeverity('MAJOR')}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  severity === 'MAJOR'
                    ? 'bg-red-500/20 text-red-300 border-red-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Major (Block Room)
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 disabled:opacity-60 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Maintenance Flag</span>
          </button>
        </form>
      </div>
    </div>
  );
};
