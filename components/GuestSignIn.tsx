'use client';

import React, { useState } from 'react';
import { Loader2, Mail, ShieldCheck, X } from 'lucide-react';
import { GuestSession } from '../lib/types';

interface GuestSignInProps {
  isOpen: boolean;
  reason?: string;
  onClose: () => void;
  onRequestCode: (email: string, name?: string) => Promise<{ demoCode?: string }>;
  onVerify: (email: string, code: string) => Promise<GuestSession>;
  onSignedIn: (guest: GuestSession) => void;
}

const DEMO_EMAIL = 'guest@demo.roomwise';
const inputClass =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500';

/** Passwordless: the guest proves they own the email by typing the 6-digit code sent to it. */
export const GuestSignIn: React.FC<GuestSignInProps> = ({ isOpen, reason, onClose, onRequestCode, onVerify, onSignedIn }) => {
  const [step, setStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const close = () => {
    setStep('EMAIL');
    setCode('');
    setDemoCode(null);
    setError(null);
    onClose();
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await onRequestCode(email, name.trim() || undefined);
      setDemoCode(res.demoCode ?? null);
      setStep('CODE');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const guest = await onVerify(email, code);
      setStep('EMAIL');
      setCode('');
      setDemoCode(null);
      onSignedIn(guest);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-5">
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            {step === 'EMAIL' ? <Mail className="w-5 h-5 text-sky-400" /> : <ShieldCheck className="w-5 h-5 text-sky-400" />}
          </div>
          <h3 className="text-lg font-bold text-white pt-2">{step === 'EMAIL' ? 'Sign in or create your account' : 'Check your email'}</h3>
          <p className="text-xs text-slate-400">
            {step === 'EMAIL'
              ? reason ?? 'No password needed — we email you a 6-digit code.'
              : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
          </p>
        </div>

        {step === 'EMAIL' ? (
          <form onSubmit={sendCode} className="space-y-3">
            <div>
              <label htmlFor="guest-name" className="block text-xs font-semibold text-slate-300 mb-1">
                Full name <span className="text-slate-500 font-normal">(needed the first time)</span>
              </label>
              <input id="guest-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={inputClass} />
            </div>
            <div>
              <label htmlFor="guest-email" className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input id="guest-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
            </div>
            {error && <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Email me a code</span>
            </button>
            <p className="text-[11px] text-slate-500">
              Reviewing the demo without an inbox? Use <button type="button" onClick={() => { setEmail(DEMO_EMAIL); if (!name) setName('Demo Guest'); }} className="text-sky-400 hover:underline">{DEMO_EMAIL}</button> — its code is shown on screen.
            </p>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            {demoCode && (
              <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                Demo address — your code is <strong className="font-mono tracking-widest">{demoCode}</strong>
              </p>
            )}
            <input
              aria-label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              required
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${inputClass} text-center text-2xl font-mono tracking-[0.5em]`}
            />
            {error && <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" disabled={busy || code.length !== 6} className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify and sign in</span>
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => { setStep('EMAIL'); setError(null); setCode(''); }} className="text-slate-400 hover:text-white">
                Use a different email
              </button>
              <button type="button" onClick={() => sendCode()} disabled={busy} className="text-sky-400 hover:underline disabled:opacity-50">
                Send a new code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
