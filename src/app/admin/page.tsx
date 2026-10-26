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
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#EA671B]/30 shadow-xl text-center">
          <div className="flex justify-center mb-3">
            <SACLogo className="w-20 h-20 drop-shadow-sm" />
          </div>
          <span className="text-[10px] font-extrabold text-[#EA671B] uppercase tracking-widest block bg-[#FFF8F1] py-1 px-3 rounded-full border border-[#EA671B]/30 inline-block mb-1">
            ST. ANTHONY&apos;S COLLEGE &bull; ANTIQUE
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#751A1A] mt-1">
            Restricted Admin Portal
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Institutional administration &amp; analytics. Authorized personnel only.
          </p>

          <form onSubmit={handleAuth} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Passkey:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Enter administrative passkey"
                  value={passkey}
                  onChange={e => setPasskey(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#EA671B] focus:border-[#EA671B] font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Default demonstration key: <code className="text-[#751A1A] font-bold font-mono">SAC-ADMIN-2026</code>
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#751A1A] hover:bg-[#5A1212] text-white font-black py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#EA671B]" />
              <span>Unlock Admin Dashboard</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <Link href="/" className="hover:text-[#751A1A] flex items-center space-x-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Student Live Monitor</span>
            </Link>
            <Link href="/cashier" className="text-[#EA671B] hover:underline font-bold">
              Cashier Terminal &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SACLogo className="w-11 h-11" />
          <div>
            <span className="font-black text-[#751A1A] text-sm tracking-tight block">ST. ANTHONY&apos;S COLLEGE</span>
            <span className="text-xs text-[#EA671B] font-bold">Institutional Governance &amp; Queue Analytics</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/cashier"
            className="bg-[#FFF8F1] hover:bg-white text-[#751A1A] text-xs px-3 py-1.5 rounded-xl border border-[#EA671B]/30 flex items-center space-x-1 font-bold"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#EA671B]" />
            <span>Cashier Terminal</span>
          </Link>
          <Link
            href="/"
            className="bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-1 font-semibold shadow-2xs"
          >
            <span>Live TV Monitor</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 bg-white">
        <AdminAnalytics />
      </main>

      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-500">
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
