'use client';

import React, { useState } from 'react';
import { QueueProvider, useQueue } from '@/context/QueueContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { StudentDashboard } from '@/components/StudentDashboard';
import { StaffDashboard } from '@/components/StaffDashboard';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { TVQueueDisplay } from '@/components/TVQueueDisplay';
import { ToastContainer } from '@/components/ToastContainer';
import { Tv } from 'lucide-react';

function MainAppShell() {
  const { currentRole } = useQueue();
  const [isTVMode, setIsTVMode] = useState(false);

  if (isTVMode) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsTVMode(false)}
          className="fixed top-4 right-4 z-50 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all"
        >
          ✕ Exit TV Display Mode
        </button>
        <TVQueueDisplay />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#134E4A] flex flex-col font-sans selection:bg-teal-200">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top utility sub-bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-teal-100 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
            <span className="text-teal-900 font-bold">SAC QueueFlow System:</span>
            <span>Active Campus Mode &bull; St. Anthony&apos;s College, Antique</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTVMode(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Launch Live TV Screen</span>
            </button>
          </div>
        </div>

        {/* Dynamic Role Views */}
        {currentRole === 'student' && <StudentDashboard />}
        {currentRole === 'staff' && <StaffDashboard />}
        {currentRole === 'admin' && <AdminAnalytics />}

        {/* Global Toast Alerts */}
        <ToastContainer />
      </main>

      <footer className="border-t border-teal-100/80 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">
          SAC QueueFlow &bull; St. Anthony&apos;s College, San Jose de Buenavista, Antique, Philippines
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Philippine Data Privacy Act Compliant &bull; Safe Queuing for Antonians Anywhere
        </p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <QueueProvider>
      <MainAppShell />
    </QueueProvider>
  );
}
