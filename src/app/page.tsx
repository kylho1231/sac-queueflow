'use client';

import React from 'react';
import Link from 'next/link';
import { QueueProvider } from '@/context/QueueContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { StudentDashboard } from '@/components/StudentDashboard';
import { ToastContainer } from '@/components/ToastContainer';
import { Tv, ShieldCheck, UserCheck } from 'lucide-react';

export default function StudentPortalPage() {
  return (
    <QueueProvider>
      <div className="min-h-screen bg-[#F0FDFA] text-[#134E4A] flex flex-col font-sans selection:bg-teal-200">
        <NavigationHeader />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Student Dedicated Top Info Banner */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-teal-100/90 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-teal-950 font-bold">St. Anthony&apos;s College Queue System:</span>
              <span className="text-slate-500 hidden sm:inline">&bull; Student Remote Queue Terminal</span>
            </div>

            {/* Quick Link to Campus TV Lobby Screen */}
            <Link
              href="/display"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Campus TV Display</span>
            </Link>
          </div>

          {/* Student-Only Pure View */}
          <StudentDashboard />

          {/* Toast Notification Container */}
          <ToastContainer />
        </main>

        {/* Discreet institutional footer with portal links */}
        <footer className="border-t border-teal-100/80 bg-white/90 py-8 px-4 text-xs text-slate-500 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-bold text-slate-700">
                SAC QueueFlow &bull; St. Anthony&apos;s College, San Jose de Buenavista, Antique, Philippines
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Philippine Data Privacy Act Compliant &bull; Safe Queuing for Antonians Anywhere
              </p>
            </div>

            {/* Separate Portals Footer Navigation for Authorized College Staff */}
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="text-slate-400 text-[11px]">Staff Access:</span>
              <Link
                href="/staff"
                className="text-teal-700 hover:text-teal-900 hover:underline flex items-center space-x-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Staff Desk</span>
              </Link>
              <Link
                href="/admin"
                className="text-teal-700 hover:text-teal-900 hover:underline flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </QueueProvider>
  );
}
