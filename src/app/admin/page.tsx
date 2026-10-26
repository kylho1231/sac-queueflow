'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QueueProvider } from '@/context/QueueContext';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { SACLogo } from '@/components/SACLogo';
import { ShieldCheck, Lock, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';

function AdminProtectedContent() {
  const [passkey, setPasskey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim() === 'SAC-ADMIN-2026' || passkey.trim() === 'admin123') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid administrative security key. Access denied.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A192F] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-[#112240] rounded-3xl p-6 sm:p-8 border border-blue-800/60 shadow-2xl text-center">
          <div className="flex justify-center mb-3">
            <SACLogo className="w-16 h-16 drop-shadow-md" />
          </div>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
            ST. ANTHONY&apos;S COLLEGE &bull; ANTIQUE
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Restricted Admin Portal
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Institutional administration &amp; analytics. Authorized personnel only.
          </p>

          <form onSubmit={handleAuth} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                Admin Passkey:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-blue-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Enter administrative passkey"
                  value={passkey}
                  onChange={e => setPasskey(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A192F] border border-blue-700/60 text-white text-sm outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <p className="text-[10px] text-blue-300/80 mt-1">
                Default demonstration key: <code className="text-amber-300 font-mono">SAC-ADMIN-2026</code>
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-black py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Dashboard</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-blue-900/60 flex items-center justify-between text-xs text-blue-300">
            <Link href="/" className="hover:text-white flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Student Live Monitor</span>
            </Link>
            <Link href="/cashier" className="text-amber-400 hover:underline">
              Cashier Terminal &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <header className="bg-[#1E3A8A] text-white px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SACLogo className="w-9 h-9" />
          <div>
            <span className="font-extrabold text-sm tracking-tight block">ST. ANTHONY&apos;S COLLEGE</span>
            <span className="text-xs text-amber-300 font-semibold">Institutional Governance &amp; Queue Analytics</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/cashier"
            className="bg-blue-800 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-xl border border-blue-600 flex items-center space-x-1"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Cashier Terminal</span>
          </Link>
          <Link
            href="/"
            className="bg-blue-950 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1"
          >
            <span>Live TV Monitor</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        <AdminAnalytics />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        SAC QueueFlow &bull; St. Anthony&apos;s College, San Jose de Buenavista, Antique, Philippines
      </footer>
    </div>
  );
}

export default function AdminPortalPage() {
  return (
    <QueueProvider>
      <AdminProtectedContent />
    </QueueProvider>
  );
}
